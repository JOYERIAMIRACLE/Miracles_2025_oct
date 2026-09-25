'use strict';

const { crearDisparadorRebuild, MODELOS_REBUILD } = require('./rebuild-tienda');

// ─── Protección anti-fuerza-bruta / spam en rutas sensibles ──────────────────
// Mapa en memoria por ruta: clave = IP, valor = { intentos, bloqueadoHasta }.
// Se reinicia al reiniciar el proceso — suficiente para bloqueos temporales.
// No usar para seguridad crítica de estado permanente (p.e. cuentas bloqueadas
// en DB), pero sí para frenar bots y ataques automáticos.
const RATE_LIMIT_VENTANA_MS = 15 * 60 * 1000; // ventana de 15 minutos
const RATE_LIMIT_BLOQUEO_MS = 15 * 60 * 1000; // tiempo de bloqueo

// Mismo allowlist que 'strapi::cors' en config/middlewares.js — se duplica
// aquí porque estos middlewares se registran vía strapi.server.use() y
// responden ANTES de llegar a strapi::cors cuando cortan la petición con
// 429, así que ese 429 nunca lleva el header de CORS a menos que lo
// pongamos nosotros mismos. Mantener sincronizado con middlewares.js.
const CORS_ORIGINS = [
  'https://richard-avrod.pages.dev',
  'https://miracles-frontend.pages.dev',
  'https://joyeriamiraclesweb.com',
  'https://medalladeoro.com',
  'https://medalladeoro.com.mx',
  'https://www.medalladeoro.com.mx',
  'http://localhost:3000',
  'http://localhost:1337',
];

function getIP(ctx) {
  return (
    ctx.request.headers['x-forwarded-for']?.split(',')[0].trim() ||
    ctx.request.ip ||
    'unknown'
  );
}

// Corta el caso de que alguien mande texto/código gigante en un campo de
// formulario público (nombre, mensaje, etc.) — nunca afecta a un usuario
// real (nadie escribe miles de caracteres a mano en un campo de nombre),
// solo frena abuso automatizado o intentos de saturar la base de datos.
function excedeLimite(valor, max) {
  return typeof valor === 'string' && valor.length > max;
}

function setCorsHeaders(ctx) {
  const origin = ctx.request.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Credentials', 'true');
  }
}

// Factory: crea un middleware de rate-limit para una ruta+método específicos.
// `contarComoFallo(ctx)` decide qué status cuenta como "intento fallido" a
// sumar (login: 400: credenciales malas; registro/forgot-password: cualquier
// request completado cuenta, porque no hay "fallo" que distinguir — el abuso
// es el volumen de intentos, no si tuvieron éxito).
function rateLimitMiddleware(path, method, { max, contarComoFallo }) {
  const fails = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of fails.entries()) {
      const caducado = !rec.bloqueadoHasta
        ? now - (rec.ultimaFalla || 0) > RATE_LIMIT_VENTANA_MS
        : now > rec.bloqueadoHasta;
      if (caducado) fails.delete(ip);
    }
  }, 60 * 60 * 1000);

  return async (ctx, next) => {
    if (ctx.path !== path || ctx.method !== method) {
      return next();
    }
    const ip  = getIP(ctx);
    const now = Date.now();
    const rec = fails.get(ip);

    if (rec?.bloqueadoHasta && now < rec.bloqueadoHasta) {
      const restanMin = Math.ceil((rec.bloqueadoHasta - now) / 60000);
      setCorsHeaders(ctx);
      ctx.status = 429;
      ctx.body   = {
        error: {
          status:  429,
          name:    'TooManyRequests',
          message: `Demasiados intentos. Intenta de nuevo en ${restanMin} minuto${restanMin > 1 ? 's' : ''}.`,
        },
      };
      return;
    }

    await next();

    if (contarComoFallo(ctx)) {
      const prev = fails.get(ip) || { intentos: 0, bloqueadoHasta: null };
      const intentos = (prev.ultimaFalla && now - prev.ultimaFalla > RATE_LIMIT_VENTANA_MS)
        ? 1
        : prev.intentos + 1;
      const bloqueadoHasta = intentos >= max ? now + RATE_LIMIT_BLOQUEO_MS : null;
      fails.set(ip, { intentos, ultimaFalla: now, bloqueadoHasta });

      if (bloqueadoHasta) {
        strapi?.log?.warn(`[ratelimit ${path}] IP ${ip} bloqueada por ${RATE_LIMIT_BLOQUEO_MS / 60000} min tras ${intentos} intentos`);
      }
    } else if (ctx.status === 200 && ctx.path === '/api/auth/local') {
      // Solo el login limpia el registro en éxito — registro/forgot-password
      // no tienen un "éxito" que deba resetear el contador de otra persona.
      fails.delete(ip);
    }
  };
}

const loginRateLimit = rateLimitMiddleware('/api/auth/local', 'POST', {
  max: 5,
  contarComoFallo: (ctx) => ctx.status === 400,
});
const registroRateLimit = rateLimitMiddleware('/api/tienda/registro', 'POST', {
  max: 5,
  contarComoFallo: () => true,
});
const forgotPasswordRateLimit = rateLimitMiddleware('/api/auth/forgot-password', 'POST', {
  max: 5,
  contarComoFallo: () => true,
});
// Umbrales más generosos que login/registro — una persona real puede mandar
// el formulario de contacto o intentar el checkout varias veces seguidas
// ajustando su carrito; el límite frena abuso masivo, no uso normal.
const contactoRateLimit = rateLimitMiddleware('/api/tienda/contacto', 'POST', {
  max: 10,
  contarComoFallo: () => true,
});
const checkoutRateLimit = rateLimitMiddleware('/api/tienda/checkout-intento', 'POST', {
  max: 20,
  contarComoFallo: () => true,
});
const resetPasswordRateLimit = rateLimitMiddleware('/api/auth/reset-password', 'POST', {
  max: 10,
  contarComoFallo: () => true,
});

// Verifica que la petición traiga un JWT válido de un usuario con rol
// "authenticated" (staff del Portal) — a diferencia de las rutas /api/tienda/*
// (que solo validan "existe el usuario"), esto además exige el rol correcto,
// para endpoints que deben quedar fuera del alcance de cuentas cliente_tienda.
async function requireStaffRole(ctx) {
  const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id },
      populate: { role: true },
    });
    if (!user || user.role?.type !== 'authenticated') return null;
    return user;
  } catch {
    return null;
  }
}

const CHAT_SYSTEM_PROMPT = `Eres el asistente personal de Ricardo para la app de gestión interna Miracles.

Contexto de la app:
- App de gestión personal y empresarial para Joyería Miracles (joyería de oro y plata en México)
- Stack técnico: Next.js 15 + React 19, Strapi 5, Tailwind CSS v4, PostgreSQL, Cloudflare Pages, Render

Módulos implementados:
1. Gestión Personal: calendario, cuentas, presupuesto, tareas, vivienda, salud, ejercicio, alimentación (planeador/recetario/despensa), material digital personal
2. Gestión Empresa: gastos, ventas (pedidos/pipeline/cotizaciones), almacén, finanzas, catálogos, indicadores, marketing
3. Trabajo: tareas, reuniones, proyectos, calendario, equipos, inventario, sitio web, tickets, campañas, pagos, tutoriales
4. Tienda: e-commerce público de joyería

Tu rol:
- Ayudar a Ricardo a dar seguimiento al desarrollo de esta app
- Responder preguntas sobre módulos, estado y planes futuros
- Dar orientación técnica sobre el stack
- Ser conciso, práctico y directo
- Siempre responder en español`;

// Acciones del API Categoria que queremos abrir al rol Public
const PUBLIC_ACTIONS_PRODUCT = [
  'api::product.product.find',
  'api::product.product.findOne',
  'api::product-category.product-category.find',
  'api::product-category.product-category.findOne',
];

const PUBLIC_ACTIONS_CATEGORIA = [
  'api::categoria.categoria.find',
  'api::categoria.categoria.findOne',
  'api::categoria.categoria.create',
  'api::categoria.categoria.update',
  'api::categoria.categoria.delete',
];

const PUBLIC_ACTIONS_TAREA = [
  'api::tarea.tarea.find',
  'api::tarea.tarea.findOne',
  'api::tarea.tarea.create',
  'api::tarea.tarea.update',
  'api::tarea.tarea.delete',
  'api::proceso-tarea.proceso-tarea.find',
  'api::proceso-tarea.proceso-tarea.findOne',
  'api::proceso-tarea.proceso-tarea.create',
  'api::proceso-tarea.proceso-tarea.update',
  'api::proceso-tarea.proceso-tarea.delete',
  // lead, cliente, venta, cotizacion y suscriptor fueron movidos a
  // AUTHENTICATED_ACTIONS_CRM — ya no son accesibles sin JWT.
];

// Crear un lead desde un formulario público (visitante sin JWT) — solo create.
// find/findOne/update/delete siguen siendo exclusivos del rol authenticated.
const PUBLIC_ACTIONS_LEAD_CREATE = [
  'api::lead.lead.create',
];

// Colecciones CRM sensibles — solo usuarios con JWT válido (rol authenticated).
// El frontend usa authFetch() para adjuntar el token en cada petición.
const AUTHENTICATED_ACTIONS_CRM = [
  'api::lead.lead.find',
  'api::lead.lead.findOne',
  'api::lead.lead.create',
  'api::lead.lead.update',
  'api::lead.lead.delete',
  'api::cliente.cliente.find',
  'api::cliente.cliente.findOne',
  'api::cliente.cliente.create',
  'api::cliente.cliente.update',
  'api::cliente.cliente.delete',
  'api::venta.venta.find',
  'api::venta.venta.findOne',
  'api::venta.venta.create',
  'api::venta.venta.update',
  'api::venta.venta.delete',
  'api::cotizacion.cotizacion.find',
  'api::cotizacion.cotizacion.findOne',
  'api::cotizacion.cotizacion.create',
  'api::cotizacion.cotizacion.update',
  'api::cotizacion.cotizacion.delete',
  'api::suscriptor.suscriptor.find',
  'api::suscriptor.suscriptor.findOne',
  'api::suscriptor.suscriptor.create',
  'api::suscriptor.suscriptor.update',
  'api::suscriptor.suscriptor.delete',
];

const PUBLIC_ACTIONS_SNAPSHOT = [
  'api::snapshot-cuenta.snapshot-cuenta.find',
  'api::snapshot-cuenta.snapshot-cuenta.findOne',
  'api::snapshot-cuenta.snapshot-cuenta.create',
  'api::snapshot-cuenta.snapshot-cuenta.update',
  'api::snapshot-cuenta.snapshot-cuenta.delete',
  'api::snapshot-mes.snapshot-mes.find',
  'api::snapshot-mes.snapshot-mes.findOne',
  'api::snapshot-mes.snapshot-mes.create',
  'api::snapshot-mes.snapshot-mes.update',
  'api::snapshot-mes.snapshot-mes.delete',
];

const PUBLIC_ACTIONS_SOCIAL = [
  'api::persona-social.persona-social.find',
  'api::persona-social.persona-social.findOne',
  'api::persona-social.persona-social.create',
  'api::persona-social.persona-social.update',
  'api::persona-social.persona-social.delete',
  'api::evento-social.evento-social.find',
  'api::evento-social.evento-social.findOne',
  'api::evento-social.evento-social.create',
  'api::evento-social.evento-social.update',
  'api::evento-social.evento-social.delete',
  'api::vehiculo.vehiculo.find',
  'api::vehiculo.vehiculo.findOne',
  'api::vehiculo.vehiculo.create',
  'api::vehiculo.vehiculo.update',
  'api::vehiculo.vehiculo.delete',
  'api::servicio-vehiculo.servicio-vehiculo.find',
  'api::servicio-vehiculo.servicio-vehiculo.findOne',
  'api::servicio-vehiculo.servicio-vehiculo.create',
  'api::servicio-vehiculo.servicio-vehiculo.update',
  'api::servicio-vehiculo.servicio-vehiculo.delete',
];

const PUBLIC_ACTIONS_TRABAJO = [
  'api::cliente-trabajo.cliente-trabajo.find',
  'api::cliente-trabajo.cliente-trabajo.findOne',
  'api::cliente-trabajo.cliente-trabajo.create',
  'api::cliente-trabajo.cliente-trabajo.update',
  'api::cliente-trabajo.cliente-trabajo.delete',
  'api::proyecto.proyecto.find',
  'api::proyecto.proyecto.findOne',
  'api::proyecto.proyecto.create',
  'api::proyecto.proyecto.update',
  'api::proyecto.proyecto.delete',
  'api::reunion.reunion.find',
  'api::reunion.reunion.findOne',
  'api::reunion.reunion.create',
  'api::reunion.reunion.update',
  'api::reunion.reunion.delete',
  'api::pago-trabajo.pago-trabajo.find',
  'api::pago-trabajo.pago-trabajo.findOne',
  'api::pago-trabajo.pago-trabajo.create',
  'api::pago-trabajo.pago-trabajo.update',
  'api::pago-trabajo.pago-trabajo.delete',
  'api::material-trabajo.material-trabajo.find',
  'api::material-trabajo.material-trabajo.findOne',
  'api::material-trabajo.material-trabajo.create',
  'api::material-trabajo.material-trabajo.update',
  'api::material-trabajo.material-trabajo.delete',
  'api::categoria-pago.categoria-pago.find',
  'api::categoria-pago.categoria-pago.findOne',
  'api::categoria-pago.categoria-pago.create',
  'api::categoria-pago.categoria-pago.update',
  'api::categoria-pago.categoria-pago.delete',
  'api::cdl-metrica.cdl-metrica.find',
  'api::cdl-metrica.cdl-metrica.findOne',
  'api::cdl-metrica.cdl-metrica.create',
  'api::cdl-metrica.cdl-metrica.update',
  'api::cdl-metrica.cdl-metrica.delete',
  'api::boxscore-semana.boxscore-semana.find',
  'api::boxscore-semana.boxscore-semana.findOne',
  'api::boxscore-semana.boxscore-semana.create',
  'api::boxscore-semana.boxscore-semana.update',
  'api::boxscore-semana.boxscore-semana.delete',
  'api::material-digital.material-digital.find',
  'api::material-digital.material-digital.findOne',
  'api::material-digital.material-digital.create',
  'api::material-digital.material-digital.update',
  'api::material-digital.material-digital.delete',
  'api::campana.campana.find',
  'api::campana.campana.findOne',
  'api::campana.campana.create',
  'api::campana.campana.update',
  'api::campana.campana.delete',
  'api::ecosistema-mkt.ecosistema-mkt.find',
  'api::ecosistema-mkt.ecosistema-mkt.findOne',
  'api::ecosistema-mkt.ecosistema-mkt.create',
  'api::ecosistema-mkt.ecosistema-mkt.update',
  'api::ecosistema-mkt.ecosistema-mkt.delete',
];

// Portal Medallitadeoro — identidad-empresa, avisos (comunicados),
// recursos descargables y rh-item (prestaciones/politicas/emergencias).
const PUBLIC_ACTIONS_PORTAL_MDO = [
  'api::identidad-empresa.identidad-empresa.find',
  'api::identidad-empresa.identidad-empresa.findOne',
  'api::identidad-empresa.identidad-empresa.create',
  'api::identidad-empresa.identidad-empresa.update',
  'api::aviso.aviso.find',
  'api::aviso.aviso.findOne',
  'api::aviso.aviso.create',
  'api::aviso.aviso.update',
  'api::aviso.aviso.delete',
  'api::recurso.recurso.find',
  'api::recurso.recurso.findOne',
  'api::recurso.recurso.create',
  'api::recurso.recurso.update',
  'api::recurso.recurso.delete',
  'api::rh-item.rh-item.find',
  'api::rh-item.rh-item.findOne',
  'api::rh-item.rh-item.create',
  'api::rh-item.rh-item.update',
  'api::rh-item.rh-item.delete',
  'api::recurso-categoria.recurso-categoria.find',
  'api::recurso-categoria.recurso-categoria.findOne',
  'api::recurso-categoria.recurso-categoria.create',
  'api::recurso-categoria.recurso-categoria.update',
  'api::recurso-categoria.recurso-categoria.delete',
  'api::documento-legal.documento-legal.find',
  'api::documento-legal.documento-legal.findOne',
  'api::documento-legal.documento-legal.create',
  'api::documento-legal.documento-legal.update',
  'api::documento-legal.documento-legal.delete',
  'api::transaccion.transaccion.find',
  'api::transaccion.transaccion.findOne',
  'api::transaccion.transaccion.create',
  'api::transaccion.transaccion.update',
  'api::transaccion.transaccion.delete',
  'api::categoria.categoria.find',
  'api::categoria.categoria.findOne',
  'api::categoria.categoria.create',
  'api::categoria.categoria.update',
  'api::categoria.categoria.delete',
  'api::material.material.find',
  'api::material.material.findOne',
  'api::material.material.create',
  'api::material.material.update',
  'api::material.material.delete',
  'api::movimiento-material.movimiento-material.find',
  'api::movimiento-material.movimiento-material.findOne',
  'api::movimiento-material.movimiento-material.create',
  'api::movimiento-material.movimiento-material.update',
  'api::movimiento-material.movimiento-material.delete',
  'api::compra-material.compra-material.find',
  'api::compra-material.compra-material.findOne',
  'api::compra-material.compra-material.create',
  'api::compra-material.compra-material.update',
  'api::compra-material.compra-material.delete',
  'api::compra-material-linea.compra-material-linea.find',
  'api::compra-material-linea.compra-material-linea.findOne',
  'api::compra-material-linea.compra-material-linea.create',
  'api::compra-material-linea.compra-material-linea.update',
  'api::compra-material-linea.compra-material-linea.delete',
  'api::venta-linea.venta-linea.find',
  'api::venta-linea.venta-linea.findOne',
  'api::venta-linea.venta-linea.create',
  'api::venta-linea.venta-linea.update',
  'api::venta-linea.venta-linea.delete',
  'api::colaborador.colaborador.find',
  'api::colaborador.colaborador.findOne',
  'api::colaborador.colaborador.create',
  'api::colaborador.colaborador.update',
  'api::colaborador.colaborador.delete',
  'api::evento-empresa.evento-empresa.find',
  'api::evento-empresa.evento-empresa.findOne',
  'api::evento-empresa.evento-empresa.create',
  'api::evento-empresa.evento-empresa.update',
  'api::evento-empresa.evento-empresa.delete',
];

// Notas de mejora (Portal Medallita de Oro) — a diferencia del resto de
// PUBLIC_ACTIONS_PORTAL_MDO, esto NO se otorga a "public": el contenido de
// las notas es feedback interno, no información pública de la empresa.
// Cualquier usuario autenticado puede ver/crear/editar/borrar cualquier
// nota (sin distinción de admin) — así se decidió a propósito, ya que este
// portal no tiene el sistema de roles granular de sdi-portal.
const AUTHENTICATED_ACTIONS_NOTA_MEJORA = [
  'api::nota-mejora.nota-mejora.find',
  'api::nota-mejora.nota-mejora.findOne',
  'api::nota-mejora.nota-mejora.create',
  'api::nota-mejora.nota-mejora.update',
  'api::nota-mejora.nota-mejora.delete',
];

// Mapa "Segundo Cerebro" (juego de exploración en /segundo-cerebro) — sin
// login propio, así que solo necesita permisos de Public.
const PUBLIC_ACTIONS_MAPA_IDENTIDAD = [
  'api::mapa-identidad.mapa-identidad.find',
  'api::mapa-identidad.mapa-identidad.findOne',
  'api::mapa-identidad.mapa-identidad.create',
  'api::mapa-identidad.mapa-identidad.update',
  'api::mapa-identidad.mapa-identidad.delete',
];

const CATEGORIAS_PAGO_SEED = [
  'Comisión', 'Anticipo', 'Liquidación', 'Honorario', 'Servicio', 'Otro',
];


// Categorías del libro contable (transaccion) para el ámbito empresa —
// reemplazan los enums desconectados que antes vivían embebidos en los
// content-types gasto/ingreso (ya retirados, fusionados en transaccion).
const CATEGORIAS_EMPRESA_SEED = [
  { nombre: 'Venta de joyería',   tipo: 'ingreso', ambito: 'empresa', orden: 1, activa: true },
  { nombre: 'Anticipo de cliente', tipo: 'ingreso', ambito: 'empresa', orden: 2, activa: true },
  { nombre: 'Saldo de cliente',   tipo: 'ingreso', ambito: 'empresa', orden: 3, activa: true },
  { nombre: 'Otro ingreso',       tipo: 'ingreso', ambito: 'empresa', orden: 4, activa: true },
  { nombre: 'Marketing - Adquisición',   tipo: 'gasto', ambito: 'empresa', orden: 10, activa: true },
  { nombre: 'Marketing - Operación',     tipo: 'gasto', ambito: 'empresa', orden: 11, activa: true },
  { nombre: 'Marketing - Digital',       tipo: 'gasto', ambito: 'empresa', orden: 12, activa: true },
  { nombre: 'Marketing - Imprenta',      tipo: 'gasto', ambito: 'empresa', orden: 13, activa: true },
  { nombre: 'Marketing - Promocionales', tipo: 'gasto', ambito: 'empresa', orden: 14, activa: true },
  { nombre: 'Marketing - Publicidad',    tipo: 'gasto', ambito: 'empresa', orden: 15, activa: true },
  { nombre: 'Marketing - Nutrimiento',   tipo: 'gasto', ambito: 'empresa', orden: 16, activa: true },
  { nombre: 'IT - Soporte hardware',     tipo: 'gasto', ambito: 'empresa', orden: 20, activa: true },
  { nombre: 'IT - Licencias',            tipo: 'gasto', ambito: 'empresa', orden: 21, activa: true },
  { nombre: 'IT - Desarrollo',           tipo: 'gasto', ambito: 'empresa', orden: 22, activa: true },
  { nombre: 'Suministro - Compra mercancía', tipo: 'gasto', ambito: 'empresa', orden: 30, activa: true },
  { nombre: 'Suministro - Materia prima',    tipo: 'gasto', ambito: 'empresa', orden: 31, activa: true },
  { nombre: 'Suministro - Herramientas',     tipo: 'gasto', ambito: 'empresa', orden: 32, activa: true },
];

async function sembrarCategoriasEmpresaSiVacio(strapi) {
  const count = await strapi.db.query('api::categoria.categoria').count({ where: { ambito: 'empresa' } });
  if (count > 0) {
    strapi.log.info('[bootstrap] Categorías empresa ya existen — skip seed');
    return;
  }
  for (const c of CATEGORIAS_EMPRESA_SEED) {
    await strapi.db.query('api::categoria.categoria').create({ data: c });
  }
  strapi.log.info(`[bootstrap] ${CATEGORIAS_EMPRESA_SEED.length} categorías empresa sembradas`);
}

async function sembrarCategoriasPagoSiVacio(strapi) {
  const count = await strapi.db.query('api::categoria-pago.categoria-pago').count({});
  if (count > 0) {
    strapi.log.info('[bootstrap] Categorías de pago ya existen — skip seed');
    return;
  }
  for (const nombre of CATEGORIAS_PAGO_SEED) {
    await strapi.db.query('api::categoria-pago.categoria-pago').create({ data: { nombre } });
  }
  strapi.log.info(`[bootstrap] ${CATEGORIAS_PAGO_SEED.length} categorías de pago sembradas`);
}

async function sembrarMapaIdentidadesSiVacio(strapi) {
  const count = await strapi.db.query('api::mapa-identidad.mapa-identidad').count({});
  if (count > 0) {
    strapi.log.info('[bootstrap] Identidades del mapa ya existen — skip seed');
    return;
  }
  for (const id of MAPA_IDENTIDAD_SEED) {
    await strapi.db.query('api::mapa-identidad.mapa-identidad').create({ data: id });
  }
  strapi.log.info(`[bootstrap] ${MAPA_IDENTIDAD_SEED.length} identidades del mapa sembradas`);
}

// Mapeo: enum viejo (lowercase, con/sin acentos, underscore) → nombre canónico de Categoria
const CATEGORIA_NORMALIZE_MAP = {
  'alimentación':      'Alimentación',
  'alimentacion':      'Alimentación',
  'transporte':        'Transporte',
  'vivienda':          'Vivienda',
  'servicios':         'Servicios',
  'gastos_personales': 'Gastos personales',
  'gastos personales': 'Gastos personales',
  'entretenimiento':   'Entretenimiento',
  'salud':             'Salud',
  'ropa':              'Ropa',
  'educación':         'Educación',
  'educacion':         'Educación',
  'ahorro':            'Ahorro',
  'inversión':         'Inversión',
  'inversion':         'Inversión',
  'sueldo':            'Sueldo',
  'freelance':         'Freelance',
  'venta':             'Venta',
  'otro':              'Otro',
  'ingreso':           'Sueldo', // partidas/eventos con "ingreso" → default Sueldo
  'transferencia':     'Otro',
};

const MODELS_TO_NORMALIZE = [
  'api::transaccion.transaccion',
  'api::partida-presupuesto.partida-presupuesto',
  'api::evento-calendario.evento-calendario',
];

// Categorías default — solo se siembran si la tabla está vacía
const CATEGORIAS_SEED = [
  // Ingresos
  { nombre: 'Sueldo',            tipo: 'ingreso', grupo: 'ingreso',     color: '#10b981', orden: 1,  activa: true },
  { nombre: 'Freelance',         tipo: 'ingreso', grupo: 'ingreso',     color: '#14b8a6', orden: 2,  activa: true },
  { nombre: 'Venta',             tipo: 'ingreso', grupo: 'ingreso',     color: '#f59e0b', orden: 3,  activa: true },
  // Gastos · necesidades
  { nombre: 'Vivienda',          tipo: 'gasto',   grupo: 'necesidad',   color: '#6366f1', orden: 10, activa: true },
  { nombre: 'Alimentación',      tipo: 'gasto',   grupo: 'necesidad',   color: '#ef4444', orden: 11, activa: true },
  { nombre: 'Transporte',        tipo: 'gasto',   grupo: 'necesidad',   color: '#3b82f6', orden: 12, activa: true },
  { nombre: 'Servicios',         tipo: 'gasto',   grupo: 'necesidad',   color: '#8b5cf6', orden: 13, activa: true },
  { nombre: 'Salud',             tipo: 'gasto',   grupo: 'necesidad',   color: '#ec4899', orden: 14, activa: true },
  { nombre: 'Educación',         tipo: 'gasto',   grupo: 'necesidad',   color: '#14b8a6', orden: 15, activa: true },
  // Gastos · prescindibles
  { nombre: 'Entretenimiento',   tipo: 'gasto',   grupo: 'prescindible', color: '#f97316', orden: 20, activa: true },
  { nombre: 'Ropa',              tipo: 'gasto',   grupo: 'prescindible', color: '#a855f7', orden: 21, activa: true },
  { nombre: 'Gastos personales', tipo: 'gasto',   grupo: 'prescindible', color: '#f59e0b', orden: 22, activa: true },
  // Ahorro / inversión
  { nombre: 'Ahorro',            tipo: 'gasto',   grupo: 'ahorro',      color: '#10b981', orden: 30, activa: true },
  { nombre: 'Inversión',         tipo: 'gasto',   grupo: 'ahorro',      color: '#14b8a6', orden: 31, activa: true },
  // Otros
  { nombre: 'Otro',              tipo: 'gasto',   grupo: 'prescindible', color: '#6b7280', orden: 99, activa: true },
];

// Identidades del mapa "Segundo Cerebro" — solo se siembran si la tabla está
// vacía (primer deploy con esta colección). Después de eso, todo se edita
// arrastrando en el mapa o directo en el Admin de Strapi.
const MAPA_IDENTIDAD_SEED = [
  { nombre: 'OFICINA RICHI',     icono: '🏢', color: '#a78bfa', sector: 'richiavrod',     x: 220,  y: 220, moduleId: 'oficina-richiavrod' },
  { nombre: 'ALMACÉN RICHI',     icono: '🏬', color: '#7c3ac6', sector: 'richiavrod',     x: 220,  y: 370, moduleId: 'almacen-richiavrod' },
  { nombre: 'TALLER RICHI',      icono: '🧩', color: '#d946ef', sector: 'richiavrod',     x: 220,  y: 520, moduleId: 'taller-richiavrod' },
  { nombre: 'OFICINA MEDALLA',   icono: '🏢', color: '#c084fc', sector: 'medallitadeoro', x: 640,  y: 220, moduleId: 'oficina-medallitadeoro' },
  { nombre: 'ALMACÉN MEDALLA',   icono: '🏬', color: '#9333ea', sector: 'medallitadeoro', x: 960,  y: 220, moduleId: 'almacen-medallitadeoro' },
  { nombre: 'APARADOR',          icono: '🪟', color: '#d8b4fe', sector: 'medallitadeoro', x: 640,  y: 370, moduleId: 'aparador-medallitadeoro' },
  { nombre: 'TALLER MEDALLA',    icono: '🧩', color: '#d946ef', sector: 'medallitadeoro', x: 960,  y: 370, moduleId: 'taller-medallitadeoro' },
  { nombre: 'ARQUITECTURA',      icono: '🕸️', color: '#e9d5ff', sector: 'medallitadeoro', x: 640,  y: 520, moduleId: 'arquitectura-medallitadeoro' },
  { nombre: 'PRÓXIMAMENTE',      icono: '✨', color: '#5a5078', sector: 'medallitadeoro', x: 960,  y: 520, moduleId: '', placeholder: true },
  { nombre: 'OFICINA SDI',       icono: '🏢', color: '#818cf8', sector: 'sdi-portal',     x: 1380, y: 220, moduleId: 'oficina-sdi' },
  { nombre: 'ALMACÉN SDI',       icono: '🏬', color: '#6366f1', sector: 'sdi-portal',     x: 1380, y: 370, moduleId: 'almacen-sdi' },
  { nombre: 'TALLER SDI',        icono: '🧩', color: '#d946ef', sector: 'sdi-portal',     x: 1380, y: 520, moduleId: 'taller-sdi' },
];

async function revocarPermisos(strapi, roleType, actions) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });
  if (!role) return;
  for (const action of actions) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .deleteMany({ where: { action, role: role.id } });
  }
}

async function otorgarPermisos(strapi, roleType, actions) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });
  if (!role) return;
  for (const action of actions) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });
    if (!existing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id } });
    }
  }
}

// Lo ÚNICO que un visitante sin sesión puede pedirle a la API. Todo lo demás
// del Portal viaja con el JWT del staff (authFetch) y vive en "authenticated".
// El build de la Tienda y sus páginas de categoría/producto leen estos tres
// endpoints; blog-post se lee en el build (páginas estáticas del blog);
// identidad-empresa solo sirve el logo del login (ver sanearRespuestaPublica).
const PUBLIC_API_ALLOWLIST = [
  'api::product.product.find',
  'api::product-category.product-category.find',
  'api::blog-post.blog-post.find',
  'api::identidad-empresa.identidad-empresa.find',
];

// Interruptor del cierre. Activo por defecto: el rol public se recorta a la
// lista blanca en cada arranque. Rollback de emergencia: CERRAR_API_PUBLICA=false
// en Railway restaura el comportamiento anterior (re-otorgar las listas legacy).
function cerrarApiPublicaActivo() {
  return process.env.CERRAR_API_PUBLICA !== 'false';
}

// Todas las acciones del content API de las colecciones propias (api::*).
// Se prefiere la lista que ve el plugin users-permissions (incluye acciones
// custom de controladores); si no está disponible se deducen del tipo.
function accionesApiDelProyecto(strapi) {
  const acciones = new Set();
  try {
    const todas = strapi.plugin('users-permissions').service('users-permissions').getActions();
    for (const [ns, def] of Object.entries(todas)) {
      if (!ns.startsWith('api::')) continue;
      for (const [controlador, ctrl] of Object.entries(def.controllers || {})) {
        for (const accion of Object.keys(ctrl)) acciones.add(`${ns}.${controlador}.${accion}`);
      }
    }
  } catch (e) {
    strapi.log.warn('[bootstrap] getActions no disponible, se deducen acciones por tipo: ' + e.message);
  }
  for (const [uid, ct] of Object.entries(strapi.contentTypes)) {
    if (!uid.startsWith('api::')) continue;
    const base = ct.kind === 'singleType' ? ['find', 'update', 'delete'] : ['find', 'findOne', 'create', 'update', 'delete'];
    for (const a of base) acciones.add(`${uid}.${a}`);
  }
  return [...acciones];
}

// Staff = confianza total: authenticated recibe el CRUD completo de todas las
// colecciones propias, así el Portal no depende de permisos marcados a mano.
async function concederAStaffTodaLaApi(strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
  if (!role) return 0;
  const q = strapi.db.query('plugin::users-permissions.permission');
  const existentes = new Set((await q.findMany({ where: { role: role.id }, select: ['action'] })).map((p) => p.action));
  const faltan = accionesApiDelProyecto(strapi).filter((a) => !existentes.has(a));
  for (const action of faltan) await q.create({ data: { action, role: role.id } });
  return faltan.length;
}

async function cerrarApiPublica(strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return 0;
  const q = strapi.db.query('plugin::users-permissions.permission');
  const permitidas = new Set(PUBLIC_API_ALLOWLIST);
  const filas = await q.findMany({ where: { role: role.id, action: { $startsWith: 'api::' } }, select: ['id', 'action'] });
  const sobran = filas.filter((f) => !permitidas.has(f.action)).map((f) => f.id);
  if (sobran.length) await q.deleteMany({ where: { id: { $in: sobran } } });
  await otorgarPermisos(strapi, 'public', PUBLIC_API_ALLOWLIST);
  return sobran.length;
}

async function aplicarPermisosPublic(strapi) {
  const cerrar = cerrarApiPublicaActivo();
  if (!cerrar) {
    const todas = [...PUBLIC_ACTIONS_PRODUCT, ...PUBLIC_ACTIONS_CATEGORIA, ...PUBLIC_ACTIONS_TAREA, ...PUBLIC_ACTIONS_SNAPSHOT, ...PUBLIC_ACTIONS_TRABAJO, ...PUBLIC_ACTIONS_SOCIAL, ...PUBLIC_ACTIONS_PORTAL_MDO, ...PUBLIC_ACTIONS_MAPA_IDENTIDAD, ...PUBLIC_ACTIONS_LEAD_CREATE];
    await otorgarPermisos(strapi, 'public', todas);
    // lead.create NO se revoca — está en PUBLIC_ACTIONS_LEAD_CREATE para formularios públicos.
    const crmSinCreate = AUTHENTICATED_ACTIONS_CRM.filter(a => a !== 'api::lead.lead.create');
    await revocarPermisos(strapi, 'public', crmSinCreate);
  }
  await otorgarPermisos(strapi, 'authenticated', AUTHENTICATED_ACTIONS_CRM);
  await otorgarPermisos(strapi, 'authenticated', PUBLIC_ACTIONS_PORTAL_MDO);
  await otorgarPermisos(strapi, 'authenticated', AUTHENTICATED_ACTIONS_NOTA_MEJORA);
  const nuevos = await concederAStaffTodaLaApi(strapi);
  if (cerrar) {
    const quitados = await cerrarApiPublica(strapi);
    strapi.log.info(`[bootstrap] API pública CERRADA — public solo conserva ${PUBLIC_API_ALLOWLIST.length} acciones (quitadas ${quitados}); authenticated +${nuevos}`);
  } else {
    strapi.log.warn(`[bootstrap] API pública ABIERTA (CERRAR_API_PUBLICA=false) — authenticated +${nuevos}`);
  }
}

// Registro nativo de Strapi: con allow_register y default_role=authenticated
// cualquiera podía crearse una cuenta con rol de staff desde POST
// /api/auth/local/register. Las cuentas se crean solo por /api/tienda/registro
// (cliente_tienda) y por la invitación del Portal — ambas usan db.query directo.
const PLUGIN_ACTIONS_REGISTRO_NATIVO = [
  'plugin::users-permissions.auth.register',
  'plugin::users-permissions.auth.connect',
  'plugin::users-permissions.auth.sendEmailConfirmation',
  'plugin::users-permissions.auth.emailConfirmation',
];
async function cerrarRegistroNativo(strapi) {
  await revocarPermisos(strapi, 'public', PLUGIN_ACTIONS_REGISTRO_NATIVO);
  await revocarPermisos(strapi, 'authenticated', PLUGIN_ACTIONS_REGISTRO_NATIVO);
  const store = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
  const adv = await store.get();
  if (adv && adv.allow_register !== false) {
    await store.set({ value: { ...adv, allow_register: false } });
  }
  strapi.log.info('[bootstrap] Registro nativo de Strapi cerrado (allow_register=false, sin permiso register/connect)');
}

// Campos que la Tienda nunca necesita y que no deben salir a un anónimo.
const CAMPOS_PRIVADOS_PRODUCTO = ['costoProduccion', 'costoManoObra', 'pesoGramos', 'materialInsumo', 'puntoVenta'];
const CAMPOS_PUBLICOS_IDENTIDAD = ['id', 'documentId', 'nombre', 'slogan', 'logo'];

function limpiarProductosPublicos(nodo) {
  if (Array.isArray(nodo)) {
    return nodo
      .filter((n) => !(n && typeof n === 'object' && 'nombreProducto' in n && n.activo === false))
      .map(limpiarProductosPublicos);
  }
  if (nodo && typeof nodo === 'object') {
    for (const k of CAMPOS_PRIVADOS_PRODUCTO) delete nodo[k];
    for (const k of Object.keys(nodo)) nodo[k] = limpiarProductosPublicos(nodo[k]);
  }
  return nodo;
}

function soloCamposPublicosIdentidad(item) {
  if (!item || typeof item !== 'object') return item;
  const salida = {};
  for (const k of CAMPOS_PUBLICOS_IDENTIDAD) if (k in item) salida[k] = item[k];
  return salida;
}

// Solo actúa sobre GET sin Authorization (visitante anónimo) en los endpoints
// públicos que quedan abiertos: recorta campos internos y oculta productos
// inactivos aunque el cliente quite el filtro activo=true de la URL.
// Solo con el cierre activo: el Portal anterior leía identidad e inventario
// sin token y dependía de recibir todos los campos.
async function sanearRespuestaPublica(ctx, next) {
  if (!cerrarApiPublicaActivo()) return next();
  const esProducto  = /^\/api\/(products|product-categories)(\/|$)/.test(ctx.path);
  const esIdentidad = /^\/api\/identidad-empresas(\/|$)/.test(ctx.path);
  if (ctx.method !== 'GET' || ctx.request.header.authorization || !(esProducto || esIdentidad)) {
    return next();
  }
  if (esProducto && ctx.path.startsWith('/api/products')) {
    const params = new URLSearchParams(ctx.querystring);
    for (const k of [...params.keys()]) {
      if (k === 'filters[activo]' || k.startsWith('filters[activo][')) params.delete(k);
    }
    params.append('filters[activo][$eq]', 'true');
    ctx.querystring = params.toString();
  }
  await next();
  if (ctx.status !== 200 || !ctx.body || typeof ctx.body !== 'object') return;
  const cuerpo = ctx.body;
  if (esProducto) {
    if ('data' in cuerpo) cuerpo.data = limpiarProductosPublicos(cuerpo.data);
  } else if (esIdentidad && 'data' in cuerpo) {
    cuerpo.data = Array.isArray(cuerpo.data) ? cuerpo.data.map(soloCamposPublicosIdentidad) : soloCamposPublicosIdentidad(cuerpo.data);
  }
}

// Estos permisos no salen de ninguna lista del código: se marcaron a mano en el
// Admin y dejaban a cualquiera sin sesión mandar correo desde el dominio, subir/
// borrar/listar archivos y leer el esquema de la API. Ningún frontend los usa.
const PUBLIC_ACTIONS_SIN_USO = [
  'plugin::email.email.send',
  'plugin::upload.content-api.upload',
  'plugin::upload.content-api.destroy',
  'plugin::upload.content-api.find',
  'plugin::upload.content-api.findOne',
  'plugin::content-type-builder.components.getComponent',
  'plugin::content-type-builder.components.getComponents',
  'plugin::content-type-builder.content-types.getContentType',
  'plugin::content-type-builder.content-types.getContentTypes',
];
const AUTHENTICATED_ACTIONS_SIN_USO = [
  'plugin::email.email.send',
  'plugin::content-type-builder.components.getComponent',
  'plugin::content-type-builder.components.getComponents',
  'plugin::content-type-builder.content-types.getContentType',
  'plugin::content-type-builder.content-types.getContentTypes',
];
// El staff sube imágenes y comprobantes con su JWT: se le asegura el permiso
// ANTES de quitárselo a public.
const AUTHENTICATED_ACTIONS_UPLOAD = [
  'plugin::upload.content-api.upload',
  'plugin::upload.content-api.destroy',
  'plugin::upload.content-api.find',
  'plugin::upload.content-api.findOne',
];

async function cerrarPermisosSinUso(strapi) {
  await otorgarPermisos(strapi, 'authenticated', AUTHENTICATED_ACTIONS_UPLOAD);
  await revocarPermisos(strapi, 'public', PUBLIC_ACTIONS_SIN_USO);
  await revocarPermisos(strapi, 'authenticated', AUTHENTICATED_ACTIONS_SIN_USO);
  strapi.log.info('[bootstrap] Cerrados permisos sin uso: correo, subida de archivos y esquema ya no son públicos');
}

// Rol separado para clientes que se registran en la Tienda pública — a
// propósito NO es "authenticated", porque el login del Portal interno
// (app/login/page.tsx) da acceso a cualquier cuenta con ese rol exacto. Si
// los clientes de la Tienda usaran "authenticated" (el default de Strapi al
// auto-registrarse), cualquier cliente podría entrar al Portal de staff con
// su misma cuenta. La ruta /api/tienda/registro (abajo) asigna este rol a
// mano en vez de dejar que Strapi ponga el default.
async function crearRolClienteTienda(strapi) {
  let role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'cliente_tienda' } });
  if (!role) {
    role = await strapi.db.query('plugin::users-permissions.role').create({
      data: {
        name: 'Cliente Tienda',
        description: 'Clientes registrados desde la Tienda pública — sin acceso al Portal interno',
        type: 'cliente_tienda',
      },
    });
    strapi.log.info('[bootstrap] Rol "Cliente Tienda" creado');
  }
  // Necesita poder leer su propio perfil (/api/users/me), igual que "authenticated".
  await otorgarPermisos(strapi, 'cliente_tienda', ['plugin::users-permissions.user.me']);
}

// Las plantillas de correo de users-permissions (reset-password, confirmación
// de cuenta) traen de fábrica from: "Administration Panel <no-reply@strapi.io>"
// — un dominio que no es el nuestro, así que Resend rechaza el envío (500).
// Idempotente: solo corrige el "from" si sigue en el default de Strapi, nunca
// pisa un "from" que alguien ya haya personalizado a mano en el Admin.
async function corregirRemitenteEmailTemplates(strapi) {
  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const email = await pluginStore.get({ key: 'email' });
  if (!email) return;

  const FROM_CORRECTO = { name: 'Medalla de Oro', email: 'no-reply@mail.medalladeoro.com.mx' };
  let cambios = 0;

  for (const key of ['reset_password', 'email_confirmation']) {
    const tpl = email[key];
    if (tpl?.options?.from?.email === 'no-reply@strapi.io') {
      tpl.options.from = FROM_CORRECTO;
      cambios++;
    }
  }

  if (cambios > 0) {
    await pluginStore.set({ key: 'email', value: email });
    strapi.log.info(`[bootstrap] Remitente corregido en ${cambios} plantilla(s) de email (de no-reply@strapi.io a ${FROM_CORRECTO.email})`);
  }
}

async function sembrarCategoriasSiVacio(strapi) {
  if (!strapi.db.metadata.get('api::categoria.categoria')) {
    strapi.log.warn('[bootstrap] Modelo api::categoria.categoria no registrado — skip seed');
    return;
  }
  const count = await strapi.db.query('api::categoria.categoria').count({});
  if (count > 0) {
    strapi.log.info('[bootstrap] Categorías ya existen — skip seed');
    return;
  }
  for (const c of CATEGORIAS_SEED) {
    await strapi.db.query('api::categoria.categoria').create({ data: c });
  }
  strapi.log.info(`[bootstrap] ${CATEGORIAS_SEED.length} categorías sembradas`);
}

// Backfill: si una categoría coincide por nombre con un seed default y NO tiene color,
// le asigna el color del seed. Idempotente — solo toca categorías sin color.
async function backfillColoresCategorias(strapi) {
  if (!strapi.db.metadata.get('api::categoria.categoria')) return;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const seedByName = new Map();
  for (const c of CATEGORIAS_SEED) seedByName.set(norm(c.nombre), c);

  const existentes = await strapi.db.query('api::categoria.categoria').findMany({});
  let cambios = 0;
  for (const cat of existentes) {
    if (cat.color) continue;
    const seed = seedByName.get(norm(cat.nombre));
    if (!seed) continue;
    await strapi.db.query('api::categoria.categoria').update({
      where: { id: cat.id },
      data: { color: seed.color, grupo: cat.grupo ?? seed.grupo },
    });
    cambios++;
  }
  if (cambios > 0) {
    strapi.log.info(`[bootstrap] ${cambios} categorías rellenadas con color/grupo del seed`);
  }
}

async function normalizarCategorias(strapi) {
  let total = 0;
  for (const model of MODELS_TO_NORMALIZE) {
    const records = await strapi.db.query(model).findMany({});
    let cambios = 0;
    for (const r of records) {
      const cur = r.categoria;
      if (!cur) continue;
      const target = CATEGORIA_NORMALIZE_MAP[cur.toLowerCase()];
      if (target && target !== cur) {
        await strapi.db.query(model).update({
          where: { id: r.id },
          data: { categoria: target },
        });
        cambios++;
      }
    }
    if (cambios > 0) {
      strapi.log.info(`[bootstrap] ${model}: ${cambios} categorías normalizadas`);
      total += cambios;
    }
  }
  if (total === 0) {
    strapi.log.info('[bootstrap] Categorías ya normalizadas — skip');
  }
}

module.exports = {
  register({ strapi }) {
    // Middlewares anti-fuerza-bruta / spam — se registran antes de las rutas
    // para interceptar login, registro de Tienda y solicitudes de reset.
    strapi.server.use(loginRateLimit);
    strapi.server.use(registroRateLimit);
    strapi.server.use(forgotPasswordRateLimit);
    strapi.server.use(resetPasswordRateLimit);
    strapi.server.use(contactoRateLimit);
    strapi.server.use(checkoutRateLimit);
    strapi.server.use(sanearRespuestaPublica);

    strapi.server.routes([
      {
        method: 'POST',
        path: '/api/miracles-chat',
        handler: async (ctx) => {
          try {
            const staff = await requireStaffRole(ctx)
            if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return }
            const { messages } = ctx.request.body
            if (!Array.isArray(messages) || messages.length === 0) {
              ctx.status = 400; ctx.body = { error: 'messages required' }; return
            }
            const Anthropic = require('@anthropic-ai/sdk')
            const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              system: CHAT_SYSTEM_PROMPT,
              messages,
            })
            ctx.body = { content: response.content[0]?.text ?? '' }
          } catch (e) {
            strapi.log.error('[miracles-chat] ' + e.message)
            ctx.status = 500; ctx.body = { error: e.message }
          }
        },
        config: { auth: false },
      },
      {
        method: 'POST',
        path: '/api/tienda/contacto',
        handler: async (ctx) => {
          try {
            const { nombre, telefono, email, interes, mensaje, canal, vendedor } = ctx.request.body || {};
            if (!nombre || !telefono) {
              ctx.status = 400;
              ctx.body = { error: { message: 'Nombre y teléfono son requeridos' } };
              return;
            }
            if (excedeLimite(nombre, 200) || excedeLimite(telefono, 30) || excedeLimite(email, 200) ||
                excedeLimite(interes, 200) || excedeLimite(mensaje, 2000) || excedeLimite(vendedor, 200)) {
              ctx.status = 400; ctx.body = { error: { message: 'Uno de los campos excede el largo permitido' } }; return;
            }
            // canal puede ser: 'Formulario' (default), 'Vendedor', 'Mostrador'
            const canalLead = canal || 'Formulario';
            const origenLead = (canalLead === 'Vendedor' || canalLead === 'Mostrador')
              ? 'Mostrador'
              : 'Formulario web';
            // Crear cliente (sin JWT — corre server-side)
            const cliente = await strapi.db.query('api::cliente.cliente').create({
              data: {
                nombre:         String(nombre).trim(),
                telefono:       String(telefono).trim(),
                email:          email ? String(email).trim() : null,
                origenContacto: 'Web',
                canalContacto:  canalLead,
              },
            });
            // notas: combinar mensaje + info de vendedor si aplica
            let notas = mensaje ? String(mensaje).trim() : null;
            if (vendedor) {
              const vendedorNota = `Vendedor: ${String(vendedor).trim()}`;
              notas = notas ? `${vendedorNota} — ${notas}` : vendedorNota;
            }
            // Crear lead vinculado al cliente
            await strapi.db.query('api::lead.lead').create({
              data: {
                cliente:         cliente.id,
                Funnel:          'Lead',
                origenApp:       'tienda',
                canal:           canalLead,
                origen:          origenLead,
                referidorTipo:   canalLead === 'Vendedor' ? 'vendedor_externo' : null,
                referidorNombre: canalLead === 'Vendedor' && vendedor ? String(vendedor).trim() : null,
                campanaOrigen:   interes ? `Interés: ${interes}` : null,
                notas:           notas,
                fechaLead:       new Date().toISOString(),
              },
            });
            ctx.body = { ok: true };
          } catch (e) {
            strapi.log.error('[tienda-contacto] ' + e.message);
            ctx.status = 500;
            ctx.body = { error: { message: 'No se pudo registrar el mensaje' } };
          }
        },
        config: { auth: false },
      },
      {
        method: 'POST',
        path: '/api/tienda/registro',
        handler: async (ctx) => {
          try {
            const { username, email, password } = ctx.request.body || {};
            if (!username || !email || !password) {
              ctx.status = 400; ctx.body = { error: { message: 'Nombre, email y contraseña son requeridos' } }; return;
            }
            if (String(password).length < 6 || String(password).length > 128) {
              ctx.status = 400; ctx.body = { error: { message: 'La contraseña debe tener entre 6 y 128 caracteres' } }; return;
            }
            if (excedeLimite(username, 100) || excedeLimite(email, 200)) {
              ctx.status = 400; ctx.body = { error: { message: 'Uno de los campos excede el largo permitido' } }; return;
            }
            const emailNorm = String(email).toLowerCase().trim();
            const existente = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: emailNorm } });
            if (existente) {
              ctx.status = 400; ctx.body = { error: { message: 'Ya existe una cuenta con este correo — inicia sesión en vez de registrarte.' } }; return;
            }
            const rolCliente = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'cliente_tienda' } });
            if (!rolCliente) {
              ctx.status = 500; ctx.body = { error: { message: 'Rol de cliente no configurado — contacta a soporte' } }; return;
            }
            // El servicio .add() de users-permissions hashea la contraseña
            // correctamente — una escritura directa a la tabla la guardaría
            // en texto plano, así que nunca se usa strapi.db.query aquí.
            const user = await strapi.plugins['users-permissions'].services.user.add({
              username, email: emailNorm, password, provider: 'local',
              confirmed: true, blocked: false, role: rolCliente.id,
            });
            const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

            // Crear registro CRM (cliente + lead) server-side — sin JWT necesario.
            // Si falla, la cuenta ya existe; no se bloquea el registro.
            try {
              let clienteId = null;
              const clienteExistente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: emailNorm } });
              if (clienteExistente) {
                clienteId = clienteExistente.id;
              } else {
                const nuevoCliente = await strapi.db.query('api::cliente.cliente').create({
                  data: {
                    nombre:         String(username).trim(),
                    email:          emailNorm,
                    canalContacto:  'Formulario',
                    origenContacto: 'Registro en tienda',
                    Estado:         'Activo',
                  },
                });
                clienteId = nuevoCliente.id;
              }
              await strapi.db.query('api::lead.lead').create({
                data: {
                  cliente:   clienteId,
                  Funnel:    'Lead',
                  origenApp: 'tienda',
                  canal:     'Formulario',
                  origen:    'Formulario web',
                  fechaLead: new Date().toISOString(),
                },
              });
            } catch (crmErr) {
              strapi.log.warn('[tienda-registro] CRM no actualizado: ' + crmErr.message);
            }

            ctx.body = { jwt, user: { id: user.id, username: user.username, email: user.email } };
          } catch (e) {
            strapi.log.error('[tienda-registro] ' + e.message);
            ctx.status = 500; ctx.body = { error: { message: 'No se pudo crear la cuenta' } };
          }
        },
        config: { auth: false },
      },
      // ─── Endpoints autenticados para el portal del cliente (tienda) ─────────
      // Verifican el JWT del cliente (role: cliente_tienda) y devuelven solo
      // los datos de ese cliente — sin exponer permisos de find/findOne global.
      {
        method: 'GET',
        path: '/api/tienda/mis-datos',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
            if (!token) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
            if (!user) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const cliente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: user.email } });
            ctx.body = { data: cliente ?? null };
          } catch (e) {
            ctx.status = 401; ctx.body = { error: 'Token inválido' };
          }
        },
        config: { auth: false },
      },
      // El cliente_tienda solo tiene permiso 'user.me' (bootstrap más abajo)
      // — nunca cliente.update — así que el REST genérico PUT /api/clientes/:id
      // le daría 403 aunque mande el JWT. Mismo patrón que el GET de arriba:
      // verificar el JWT a mano y tocar solo el registro de ESTE cliente.
      {
        method: 'PUT',
        path: '/api/tienda/mis-datos',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
            if (!token) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
            if (!user) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const cliente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: user.email } });
            if (!cliente) { ctx.status = 404; ctx.body = { error: { message: 'Cliente no encontrado' } }; return; }

            const { nombre, telefono, direccion } = (ctx.request.body || {}).data || {};
            const data = {};
            if (nombre    !== undefined) data.nombre    = nombre;
            if (telefono  !== undefined) data.telefono  = telefono;
            if (direccion !== undefined) data.direccion = direccion;

            const actualizado = await strapi.db.query('api::cliente.cliente').update({
              where: { id: cliente.id },
              data,
            });
            ctx.body = { data: actualizado };
          } catch (e) {
            ctx.status = 401; ctx.body = { error: 'Token inválido' };
          }
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/api/tienda/mis-pedidos',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
            if (!token) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
            if (!user) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const cliente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: user.email } });
            if (!cliente) { ctx.body = { data: [] }; return; }
            const ventas = await strapi.db.query('api::venta.venta').findMany({
              where: { cliente: cliente.id },
              populate: { lineas: { populate: { producto: true } }, envios: true, comprobantePago: true },
              orderBy: { fecha: 'desc' },
              limit: 100,
            });
            ctx.body = { data: ventas };
          } catch (e) {
            ctx.status = 401; ctx.body = { error: 'Token inválido' };
          }
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/api/tienda/mis-cotizaciones',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
            if (!token) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
            if (!user) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const cliente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: user.email } });
            if (!cliente) { ctx.body = { data: [] }; return; }
            const cotizaciones = await strapi.db.query('api::cotizacion.cotizacion').findMany({
              where: { cliente: cliente.id },
              populate: { ventaGenerada: true },
              orderBy: { createdAt: 'desc' },
              limit: 100,
            });
            ctx.body = { data: cotizaciones };
          } catch (e) {
            ctx.status = 401; ctx.body = { error: 'Token inválido' };
          }
        },
        config: { auth: false },
      },
      {
        method: 'POST',
        path: '/api/tienda/checkout-intento',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim();
            if (!token) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
            if (!user) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }

            const { items } = ctx.request.body || {};
            if (!Array.isArray(items) || items.length === 0) {
              ctx.status = 400; ctx.body = { error: { message: 'El carrito está vacío' } }; return;
            }
            if (items.length > 50 || items.some(it => excedeLimite(it?.nombre, 200) || excedeLimite(it?.sku, 100))) {
              ctx.status = 400; ctx.body = { error: { message: 'El carrito tiene artículos inválidos' } }; return;
            }

            // Buscar o crear cliente CRM
            let clienteId = null;
            const clienteExistente = await strapi.db.query('api::cliente.cliente').findOne({ where: { email: user.email } });
            if (clienteExistente) {
              clienteId = clienteExistente.id;
            } else {
              const nuevo = await strapi.db.query('api::cliente.cliente').create({
                data: {
                  nombre:         user.username || user.email,
                  email:          user.email,
                  canalContacto:  'Formulario',
                  origenContacto: 'Tienda online',
                  Estado:         'Activo',
                },
              });
              clienteId = nuevo.id;
            }

            // Calcular total
            const total = items.reduce((sum, it) => sum + (it.precio ?? 0) * (it.cantidad ?? 1), 0);

            // Crear cotización con los artículos del carrito
            const cotizacion = await strapi.db.query('api::cotizacion.cotizacion').create({
              data: {
                cliente:          clienteId,
                estado:           'Borrador',
                origenCotizacion: 'CART',
                fecha:            new Date().toISOString(),
                total,
                items: items.map(it => ({
                  productoId:    it.productoId ?? null,
                  nombre:        it.nombre,
                  sku:           it.sku ?? null,
                  precio:        it.precio ?? 0,
                  cantidad:      it.cantidad ?? 1,
                  subtotal:      (it.precio ?? 0) * (it.cantidad ?? 1),
                })),
                notas: 'Generado automáticamente desde carrito de la Tienda',
              },
            });

            // Crear lead vinculado — trazabilidad marketing
            await strapi.db.query('api::lead.lead').create({
              data: {
                cliente:       clienteId,
                Funnel:        'Lead',
                origenApp:     'tienda',
                canal:         'Formulario',
                origen:        'Carrito',
                campanaOrigen: `Carrito: ${items.map(it => it.nombre).join(', ')}`,
                fechaLead:     new Date().toISOString(),
                notas:         `Cotización automática #${cotizacion.id} — Total: $${total.toFixed(2)}`,
              },
            });

            ctx.body = { ok: true, cotizacionId: cotizacion.id };
          } catch (e) {
            strapi.log.error('[tienda-checkout-intento] ' + e.message);
            ctx.status = 500; ctx.body = { error: { message: 'No se pudo procesar el intento de compra' } };
          }
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/api/my-role',
        handler: async (ctx) => {
          try {
            const token = (ctx.request.headers.authorization || '').replace('Bearer ', '').trim()
            if (!token) { ctx.status = 401; ctx.body = { error: 'No token' }; return }
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token)
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({
              where: { id },
              populate: { role: true },
            })
            if (!user || !user.role) { ctx.status = 401; ctx.body = { error: 'No role' }; return }
            ctx.body = { type: user.role.type, name: user.role.name }
          } catch (e) {
            ctx.status = 401; ctx.body = { error: 'Invalid token' }
          }
        },
        config: { auth: false },
      },
      // ─── Gestión de staff del Portal (rol authenticated) ────────────────────
      // Todas protegidas con requireStaffRole — solo staff logueado puede
      // listar/invitar/bloquear cuentas de otro staff.
      {
        method: 'GET',
        path: '/api/portal/usuarios',
        handler: async (ctx) => {
          const staff = await requireStaffRole(ctx);
          if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
          const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
          const usuarios = await strapi.db.query('plugin::users-permissions.user').findMany({
            where: { role: role?.id },
            select: ['id', 'username', 'email', 'blocked', 'createdAt'],
            orderBy: { username: 'asc' },
          });
          ctx.body = { data: usuarios };
        },
        config: { auth: false },
      },
      {
        method: 'POST',
        path: '/api/portal/usuarios',
        handler: async (ctx) => {
          const staff = await requireStaffRole(ctx);
          if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
          try {
            const { username, email } = ctx.request.body || {};
            if (!username || !email) {
              ctx.status = 400; ctx.body = { error: { message: 'Nombre y correo son requeridos' } }; return;
            }
            if (excedeLimite(username, 100) || excedeLimite(email, 200)) {
              ctx.status = 400; ctx.body = { error: { message: 'Uno de los campos excede el largo permitido' } }; return;
            }
            const emailNorm = String(email).toLowerCase().trim();
            const existente = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: emailNorm } });
            if (existente) {
              ctx.status = 400; ctx.body = { error: { message: 'Ya existe una cuenta con este correo' } }; return;
            }
            const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
            if (!role) { ctx.status = 500; ctx.body = { error: { message: 'Rol de staff no configurado' } }; return; }

            // Contraseña aleatoria descartable — nunca se usa: el correo de
            // "olvidé mi contraseña" disparado abajo es como el nuevo
            // empleado define la suya de verdad.
            const tempPassword = require('crypto').randomBytes(24).toString('hex');
            const user = await strapi.plugins['users-permissions'].services.user.add({
              username: String(username).trim(), email: emailNorm, password: tempPassword,
              provider: 'local', confirmed: true, blocked: false, role: role.id,
            });

            // Auto-llamada al endpoint nativo de forgot-password (mismo
            // proceso, puerto local) en vez de reimplementar su lógica de
            // plantilla/envío — así se respeta cualquier configuración de
            // Strapi Admin sin duplicar código que se desactualice.
            try {
              await fetch(`http://127.0.0.1:${strapi.config.get('server.port')}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailNorm }),
              });
            } catch (mailErr) {
              strapi.log.warn('[portal-usuarios] No se pudo disparar el correo de bienvenida: ' + mailErr.message);
            }

            ctx.body = { data: { id: user.id, username: user.username, email: user.email, blocked: user.blocked } };
          } catch (e) {
            strapi.log.error('[portal-usuarios-crear] ' + e.message);
            ctx.status = 500; ctx.body = { error: { message: 'No se pudo crear la cuenta' } };
          }
        },
        config: { auth: false },
      },
      {
        method: 'PUT',
        path: '/api/portal/usuarios/:id/bloquear',
        handler: async (ctx) => {
          const staff = await requireStaffRole(ctx);
          if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
          const { id } = ctx.params;
          if (Number(id) === staff.id) {
            ctx.status = 400; ctx.body = { error: { message: 'No puedes bloquear tu propia cuenta' } }; return;
          }
          const actualizado = await strapi.db.query('plugin::users-permissions.user').update({ where: { id }, data: { blocked: true } });
          ctx.body = { data: { id: actualizado.id, blocked: actualizado.blocked } };
        },
        config: { auth: false },
      },
      {
        method: 'PUT',
        path: '/api/portal/usuarios/:id/desbloquear',
        handler: async (ctx) => {
          const staff = await requireStaffRole(ctx);
          if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
          const { id } = ctx.params;
          const actualizado = await strapi.db.query('plugin::users-permissions.user').update({ where: { id }, data: { blocked: false } });
          ctx.body = { data: { id: actualizado.id, blocked: actualizado.blocked } };
        },
        config: { auth: false },
      },
    ])
  },

  async bootstrap({ strapi }) {
    const run = async (label, fn) => {
      try { await fn(); }
      catch (err) { strapi.log.error(`[bootstrap] ${label}: ${err.message}`); }
    };
    await run('aplicarPermisosPublic',      () => aplicarPermisosPublic(strapi));
    await run('cerrarPermisosSinUso',       () => cerrarPermisosSinUso(strapi));
    await run('cerrarRegistroNativo',       () => cerrarRegistroNativo(strapi));
    await run('sembrarCategorias',           () => sembrarCategoriasSiVacio(strapi));
    await run('backfillColoresCategorias',  () => backfillColoresCategorias(strapi));
    await run('normalizarCategorias',       () => normalizarCategorias(strapi));
    await run('sembrarCategoriasPago',      () => sembrarCategoriasPagoSiVacio(strapi));
    await run('sembrarCategoriasEmpresa',   () => sembrarCategoriasEmpresaSiVacio(strapi));
    await run('sembrarMapaIdentidades',     () => sembrarMapaIdentidadesSiVacio(strapi));
    await run('crearRolClienteTienda',      () => crearRolClienteTienda(strapi));
    await run('corregirRemitenteEmailTemplates', () => corregirRemitenteEmailTemplates(strapi));

    // Al final, para que las siembras de arriba no disparen una reconstrucción
    // en cada arranque de Railway.
    const alCambiarCatalogo = crearDisparadorRebuild({
      token: process.env.GITHUB_DISPATCH_TOKEN,
      repo: process.env.GITHUB_DISPATCH_REPO || undefined,
      debounceMs: (Number(process.env.REBUILD_DEBOUNCE_SEGUNDOS) || 60) * 1000,
      log: strapi.log,
    });
    strapi.db.lifecycles.subscribe({
      models: MODELOS_REBUILD,
      afterCreate: alCambiarCatalogo,
      afterUpdate: alCambiarCatalogo,
      afterDelete: alCambiarCatalogo,
    });
  },
};
