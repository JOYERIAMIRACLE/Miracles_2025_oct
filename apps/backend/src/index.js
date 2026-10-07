'use strict';

const { crearDisparadorRebuild, MODELOS_REBUILD } = require('./rebuild-tienda');
const { registrarActividad, atribucionParaLead, resumenTrafico, crearLimitadorPorMinuto } = require('./medicion');

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
// Medición de la Tienda: un visitante real manda pocos eventos por minuto; el
// tope frena ráfagas sin bloquear a una IP compartida (ver medicion.js).
const actividadRateLimit = crearLimitadorPorMinuto({
  path: '/api/tienda/actividad',
  method: 'POST',
  max: 300,
  getIP,
  alExceder: (ctx) => {
    setCorsHeaders(ctx);
    ctx.status = 429;
    ctx.body = { error: { status: 429, name: 'TooManyRequests' } };
  },
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

// Arquitectura del sitio editable (Portal → Operación) — páginas y reglas
// que antes vivían hardcodeadas en SeccionArquitecturaSitio.tsx, ahora
// editables desde el Portal, igual de internas que las notas de mejora.
const AUTHENTICATED_ACTIONS_ARQUITECTURA_SITIO = [
  'api::pagina-arquitectura.pagina-arquitectura.find',
  'api::pagina-arquitectura.pagina-arquitectura.findOne',
  'api::pagina-arquitectura.pagina-arquitectura.create',
  'api::pagina-arquitectura.pagina-arquitectura.update',
  'api::pagina-arquitectura.pagina-arquitectura.delete',
  'api::regla-arquitectura.regla-arquitectura.find',
  'api::regla-arquitectura.regla-arquitectura.findOne',
  'api::regla-arquitectura.regla-arquitectura.create',
  'api::regla-arquitectura.regla-arquitectura.update',
  'api::regla-arquitectura.regla-arquitectura.delete',
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
  await otorgarPermisos(strapi, 'authenticated', AUTHENTICATED_ACTIONS_ARQUITECTURA_SITIO);
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
const CAMPOS_PUBLICOS_IDENTIDAD = ['id', 'documentId', 'nombre', 'slogan', 'logo', 'proposito', 'valores'];

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

// Semilla inicial de Arquitectura del sitio (Portal → Operación). Antes vivía
// hardcodeada en SeccionArquitecturaSitio.tsx — a partir de este seed único,
// el contenido se edita desde el Portal, no desde código (mismo criterio que
// sembrarBlogPostsSiFaltan: crea solo si la colección está vacía).
const PAGINAS_ARQUITECTURA_SEED = [
  { grupo: 'landing', orden: 0, ruta: '/', nota: 'Portada — antes tenía un hero separado, ahora ES la tienda' },
  { grupo: 'landing', orden: 1, ruta: '/nosotros', nota: '' },
  { grupo: 'landing', orden: 2, ruta: '/contacto', nota: '' },
  { grupo: 'landing', orden: 3, ruta: '/distribuidor', nota: 'Mayoreo/B2B' },
  { grupo: 'landing', orden: 4, ruta: '/blog', nota: 'Motor de contenido — hub del blog' },
  { grupo: 'landing', orden: 5, ruta: '/blog/[slug]', nota: '6 posts reales ya publicados' },
  { grupo: 'landing', orden: 6, ruta: '/producto/[slug]', nota: 'Doble función: Landing si llega frío de Google, App si viene navegando el catálogo' },
  { grupo: 'landing', orden: 7, ruta: '/regalos/[ocasion]', nota: 'Doble función: se construyeron para atrapar búsqueda fría ("regalo día de la madre" 2,900/mes), aunque también se llega desde las tarjetas del home' },
  { grupo: 'landing', orden: 8, ruta: '/terminos, /privacidad, /envios, /devoluciones', nota: 'Confianza/legal — bajo esfuerzo de autoridad' },
  { grupo: 'app', orden: 0, ruta: '/category, /category/[slug]', nota: '9 categorías + anillos-de-compromiso + churumbela' },
  { grupo: 'app', orden: 1, ruta: '/material/oro-10k, /material/plata-925', nota: 'Hub por material' },
  { grupo: 'app', orden: 2, ruta: '/carrito, /productos-favoritos', nota: 'Ya bloqueadas en robots.txt — correcto, sin cambios' },
  { grupo: 'cuenta', orden: 0, ruta: '/cuenta/login, /registro, /olvide-password', nota: '' },
  { grupo: 'cuenta', orden: 1, ruta: '/cuenta, /pedidos, /cotizaciones, /favoritos, /direcciones, /pagos, /perfil', nota: 'Requieren sesión de cliente' },
];

const REGLAS_ARQUITECTURA_SEED = [
  { orden: 0, texto: 'Landing manda la autoridad hacia abajo — el blog y "Nosotros" enlazan hacia categoría/material con texto descriptivo, nunca "ver más".' },
  { orden: 1, texto: 'App hereda autoridad, no la genera — breadcrumb consistente y canonical limpio por página (los filtros son del navegador, no generan URLs duplicadas).' },
  { orden: 2, texto: 'Cuenta nunca se indexa — noindex + robots.txt en las 9 rutas (corregido 26-sep-2026, antes eran 100% indexables sin ningún valor de búsqueda).' },
];

async function sembrarPaginasArquitecturaSiVacio(strapi) {
  const count = await strapi.db.query('api::pagina-arquitectura.pagina-arquitectura').count({});
  if (count > 0) { strapi.log.info('[bootstrap] Páginas de arquitectura ya existen — skip seed'); return; }
  for (const p of PAGINAS_ARQUITECTURA_SEED) {
    await strapi.db.query('api::pagina-arquitectura.pagina-arquitectura').create({ data: p });
  }
  strapi.log.info(`[bootstrap] ${PAGINAS_ARQUITECTURA_SEED.length} página(s) de arquitectura sembrada(s)`);
}

async function sembrarReglasArquitecturaSiVacio(strapi) {
  const count = await strapi.db.query('api::regla-arquitectura.regla-arquitectura').count({});
  if (count > 0) { strapi.log.info('[bootstrap] Reglas de arquitectura ya existen — skip seed'); return; }
  for (const r of REGLAS_ARQUITECTURA_SEED) {
    await strapi.db.query('api::regla-arquitectura.regla-arquitectura').create({ data: r });
  }
  strapi.log.info(`[bootstrap] ${REGLAS_ARQUITECTURA_SEED.length} regla(s) de arquitectura sembrada(s)`);
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

// Categorías nuevas de la Tienda, decididas con datos reales de búsqueda
// (Google Suggest + Google Ads Keyword Planner, México): "anillos de
// compromiso" es el término de más volumen de todo el catálogo (165k/mes) y
// no existía como categoría propia; "churumbela" es un estilo de anillo con
// volumen propio (6,600/mes) comparable al de una categoría completa. Ambas
// se arman filtrando por el atributo `atributos.tipoAnillo` (ver
// components/joyeria/atributos-joya.json), no por la relación `categoria` —
// así un anillo sigue apareciendo en "Anillos" y ADEMÁS en su categoría de
// estilo, en vez de tener que elegir una sola.
const PRODUCT_CATEGORY_SEED = [
  {
    NombreCategoria: 'Anillos de Compromiso',
    slug: 'anillos-de-compromiso',
    descripcionSeo: 'Anillos de compromiso en oro 10k y plata 925: solitarios, churumbelas y diseños con o sin piedra (diamante, esmeralda, zafiro, rubí). Envíos a todo México.',
  },
  {
    NombreCategoria: 'Churumbela',
    slug: 'churumbela',
    descripcionSeo: 'Churumbelas en oro 10k y plata 925 — el anillo liso tradicional mexicano, ideal como argolla de matrimonio o compromiso. Envíos a todo México.',
  },
];

async function sembrarCategoriasProductoSiFaltan(strapi) {
  let creadas = 0;
  for (const cat of PRODUCT_CATEGORY_SEED) {
    const existente = await strapi.db.query('api::product-category.product-category').findOne({ where: { slug: cat.slug } });
    if (existente) continue;
    await strapi.db.query('api::product-category.product-category').create({
      data: { ...cat, publishedAt: new Date().toISOString() },
    });
    creadas++;
  }
  if (creadas) strapi.log.info(`[bootstrap] ${creadas} categoría(s) de producto sembrada(s) (anillos-de-compromiso/churumbela)`);
}

// "Pulsos" no lo busca nadie en México para esto (0 volumen medible) — la
// gente busca "pulseras" (590/mes). Solo renombra si el nombre sigue siendo
// exactamente el original, para no pisar un cambio manual ya hecho en Admin.
// draftAndPublish:true guarda el borrador y la versión publicada como DOS
// filas con el mismo slug (una con published_at null) — hay que actualizar
// las dos, o el sitio público seguiría mostrando la fila vieja.
async function renombrarPulsosAPulseras(strapi) {
  const filas = await strapi.db.query('api::product-category.product-category').findMany({ where: { slug: 'pulsos' } });
  let cambios = 0;
  for (const cat of filas) {
    if (cat.NombreCategoria !== 'Pulsos') continue;
    await strapi.db.query('api::product-category.product-category').update({
      where: { id: cat.id },
      data: { NombreCategoria: 'Pulseras', descripcionSeo: cat.descripcionSeo || 'Pulseras en oro 10k y plata 925 para mujer y hombre, en distintos estilos y medidas. Envíos a todo México.' },
    });
    cambios++;
  }
  if (cambios) strapi.log.info(`[bootstrap] Categoría "Pulsos" renombrada a "Pulseras" (${cambios} fila(s), así la busca la gente)`);
}

// Bloques de contenido del editor Blocks de Strapi — helpers cortos para
// no repetir la forma { type, children } en cada post.
const p = (texto) => ({ type: 'paragraph', children: [{ type: 'text', text: texto }] });
const link = (texto, url) => ({ type: 'link', url, children: [{ type: 'text', text: texto }] });
const h2 = (texto) => ({ type: 'heading', level: 2, children: [{ type: 'text', text: texto }] });
// Debe generar el MISMO id que slugifyHeading() en BlocksRenderer.tsx (frontend),
// para que los links de la tabla de contenido salten a la sección correcta.
const slugHeading = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// Tabla de contenido: cada título de la lista es un link ancla (#slug) al H2
// correspondiente — reglas de contenido del blog (28-sep-2026): cada post
// arranca de una keyword con volumen real, título con esa keyword, 800+
// palabras, y tabla de contenido con subtítulos ligados a la keyword.
const toc = (titulos) => ({
  type: 'list', format: 'unordered',
  children: titulos.map((t) => ({ type: 'list-item', children: [link(t, `#${slugHeading(t)}`)] })),
});
const ul = (items) => ({ type: 'list', format: 'unordered', children: items.map((t) => ({ type: 'list-item', children: [{ type: 'text', text: t }] })) });

// Reglas de contenido del blog (28-sep-2026, fijas de aquí en adelante):
// 1) cada post arranca de una keyword real con volumen medible (Google
//    Suggest + Ads Keyword Planner, México — no se inventa la keyword ni el
//    volumen); 2) el título usa la keyword más adecuada de ese grupo, no
//    necesariamente la de más volumen si otra encaja mejor con el contenido
//    ya escrito; 3) mínimo 800 palabras que desarrollen esa keyword a fondo;
//    4) tabla de contenido al inicio, con subtítulos ligados a la keyword,
//    cuyos links saltan al H2 real (ver toc()/slugHeading() arriba).
const BLOG_POSTS_SEED = [
  {
    // Keyword: "cómo limpiar plata 925" — 1,000/mes.
    titulo: 'Cómo limpiar tu plata 925 en casa',
    slug: 'como-limpiar-plata-925',
    categoria_blog: 'cuidado-de-joyas',
    resumen: 'La plata 925 se opaca con el tiempo por contacto con aire, perfumes y sudor — no significa que sea de mala calidad. Así se limpia en casa sin dañarla.',
    seo_titulo: 'Cómo limpiar plata 925 en casa',
    seo_descripcion: 'Guía completa para limpiar plata 925 en casa sin dañarla: limpieza rápida, limpieza profunda, qué NO usar y cada cuánto hacerlo.',
    seo_keywords: 'como limpiar plata 925, limpiar plata en casa, plata 925 opaca',
    contenido: [
      p('Si tu plata 925 se ve opaca o amarillenta, no compraste plata de mala calidad — es una reacción química normal del metal, y se revierte en minutos con lo que ya tienes en casa. Esto es todo lo que necesitas para limpiar plata 925 correctamente, sin dañarla.'),
      toc(['Por qué se opaca la plata 925', 'Limpieza rápida del día a día', 'Limpieza profunda cuando ya se ve opaca', 'Qué productos nunca usar', 'Cómo limpiar piezas con piedra', 'Cada cuánto limpiar tu plata 925', 'Cómo guardarla para que dure más', 'Cuándo mejor llevarla con un profesional']),
      h2('Por qué se opaca la plata 925'),
      p('La plata 925 (92.5% plata pura, 7.5% de otro metal, casi siempre cobre) reacciona con el azufre que hay en el aire, el sudor, los perfumes y algunas cremas — esa reacción es lo que crea la capa oscura o amarillenta que ves con el tiempo. No es óxido ni corrosión real, y no significa que la pieza sea de baja calidad: hasta la plata más fina del mundo se opaca si nunca se limpia. De hecho, entre más la uses, menos se opaca — el roce constante con la piel retrasa la reacción.'),
      h2('Limpieza rápida del día a día'),
      p('Para el mantenimiento normal no necesitas ningún producto: un paño suave de microfibra (el mismo tipo que usas para lentes) es suficiente para quitar la opacidad ligera y la grasa acumulada. Frota con movimientos cortos, en la misma dirección, sin presionar fuerte. Esto toma menos de un minuto, y si lo haces cada semana tu plata casi nunca va a llegar a verse realmente opaca.'),
      h2('Limpieza profunda cuando ya se ve opaca'),
      ul([
        'Mezcla agua tibia con unas gotas de jabón neutro (nunca detergente de trastes, es demasiado agresivo).',
        'Sumerge la pieza entre 2 y 3 minutos.',
        'Talla suavemente las hendiduras con un cepillo de cerdas muy suaves — uno de dientes que ya no uses funciona bien.',
        'Enjuaga con agua tibia y seca de inmediato con un paño; nunca dejes que se seque al aire, porque el agua deja marcas más difíciles de quitar que la opacidad original.',
      ]),
      h2('Qué productos nunca usar'),
      p('Evita la pasta de dientes (mucha gente la recomienda, pero es abrasiva y raya el metal con el uso repetido), el bicarbonato en piezas con piedra (puede opacar la piedra o aflojar el engaste), y cualquier líquido con cloro — incluida el agua de la alberca o del mar. El cloro reacciona con la plata de forma mucho más agresiva que el aire normal y puede dañar el acabado de forma permanente, no solo opacarlo.'),
      h2('Cómo limpiar piezas con piedra'),
      p('Si tu pieza tiene piedra — cualquiera, no solo las delicadas — la regla más segura es limpiar solo el metal con el paño húmedo, sin sumergir la pieza completa. Algunas piedras como la perla, la esmeralda o el ópalo son porosas y absorben agua y jabón, lo que las opaca o decolora con el tiempo. Si no estás segura de qué piedra tiene tu pieza, trata siempre con el método más cuidadoso.'),
      h2('Cada cuánto limpiar tu plata 925'),
      p('No hay una regla única — depende de qué tanto la uses. Una pieza que usas todos los días (un anillo, una cadena que nunca te quitas) se beneficia de la limpieza rápida cada semana y la profunda cada 3 o 4 semanas. Una pieza que usas ocasionalmente puede quedarse guardada meses sin opacarse mucho, y basta con limpiarla antes de la próxima vez que te la pongas.'),
      h2('Cómo guardarla para que dure más'),
      p('El aire y la humedad son los principales causantes de la opacidad, así que guardar bien tu plata retrasa el problema antes de que empiece. Guárdala en una bolsa cerrada o un joyero forrado de tela, lejos de la humedad del baño, y separada de otras piezas para que no se rayen entre sí. Si vives en una zona muy húmeda, una bolsita de gel de sílice — la misma que viene en cajas de zapatos — dentro del joyero ayuda bastante a mantenerla brillante por más tiempo. Quitártela antes de dormir, bañarte o hacer ejercicio también reduce el contacto con sudor y productos que aceleran la opacidad.'),
      h2('Cuándo mejor llevarla con un profesional'),
      p('La limpieza en casa resuelve la gran mayoría de los casos, pero hay excepciones donde vale la pena llevar la pieza con un joyero de confianza en vez de arriesgarla tú misma: piezas con grabados muy finos o filigrana (donde un cepillo puede dañar el detalle), piezas antiguas o de mucho valor sentimental, y cualquier pieza donde la piedra se sienta floja al tacto — eso necesita reparación antes de cualquier limpieza, no después. Si tu pieza pasó por un accidente (se cayó, se dobló) en vez de opacarse por uso normal, también es mejor que la revise alguien antes de limpiarla, para no esconder un daño que ya existía.'),
    ],
  },
  {
    // Keyword: "cómo limpiar cadenas de oro" — 260/mes (la mejor del grupo
    // "limpiar oro"; "cómo limpiar anillos de oro" queda como sub-tema).
    titulo: 'Cómo limpiar cadenas de oro en casa sin dañarlas',
    slug: 'como-limpiar-cadenas-de-oro',
    categoria_blog: 'cuidado-de-joyas',
    resumen: 'El oro no se opaca como la plata, pero acumula grasa y residuos de crema o perfume que le quitan brillo. Así se limpian cadenas y anillos de oro en casa.',
    seo_titulo: 'Cómo limpiar cadenas de oro en casa',
    seo_descripcion: 'Guía completa para limpiar cadenas y anillos de oro en casa: paso a paso, cuidado con piedra engastada, qué evitar y cada cuánto hacerlo.',
    seo_keywords: 'como limpiar cadenas de oro, como limpiar anillos de oro, limpiar oro en casa',
    contenido: [
      p('A diferencia de la plata, el oro no se oxida ni se opaca por el aire — pero pierde brillo igual, por una razón distinta. Esto es todo lo que necesitas para limpiar cadenas de oro (y anillos, esclavas o cualquier pieza de oro) en casa, sin dañarlas.'),
      toc(['Por qué el oro pierde brillo', 'Limpieza paso a paso en casa', 'Cuidado especial en cadenas: broches y eslabones', 'Anillos y esclavas: las zonas que más se ensucian', 'Oro laminado o de baño: cuidado distinto', 'Piezas con piedra engastada', 'Qué NO hacer nunca', 'Cada cuánto limpiarlo']),
      h2('Por qué el oro pierde brillo'),
      p('El oro es un metal muy estable — no reacciona con el aire ni con el sudor como lo hace la plata. Lo que le quita brillo es mucho más simple: la acumulación de grasa natural de la piel, residuos de crema, perfume, protector solar y jabón que no se enjuaga del todo. Esa capa fina opaca el brillo del oro aunque el metal en sí esté perfecto — por eso una limpieza sencilla suele devolverle el brillo original de inmediato, sin necesidad de productos especiales ni de llevar la pieza a ningún lado.'),
      h2('Limpieza paso a paso en casa'),
      ul([
        'Prepara agua tibia con unas gotas de jabón neutro y remoja la pieza entre 5 y 10 minutos.',
        'Usa un cepillo de cerdas suaves para llegar a eslabones y hendiduras — en cadenas, presta atención especial a cierres y broches, donde se acumula más grasa.',
        'Enjuaga muy bien: el jabón que queda opaca el brillo casi tanto como la grasa que estabas quitando.',
        'Seca con un paño de microfibra, sin frotar fuerte, y deja que termine de secar al aire antes de guardarla.',
      ]),
      h2('Cuidado especial en cadenas: broches y eslabones'),
      p('Las cadenas acumulan grasa y residuos en dos puntos que se limpian con más trabajo: el broche (donde el roce constante con la piel del cuello concentra grasa) y los eslabones muy cerrados, donde el cepillo no siempre entra bien. Para esos puntos, después del remojo, pasa un hilo dental sin sabor entre los eslabones más apretados — arrastra la grasa que el cepillo no alcanza sin rayar el metal. Revisa también el broche en sí: si se siente duro o cuesta trabajo cerrarlo, un poco de esta misma limpieza suele destrabarlo sin necesidad de forzarlo.'),
      h2('Anillos y esclavas: las zonas que más se ensucian'),
      p('En anillos, la parte interna (la que toca la piel todo el día) acumula más grasa que la parte visible — no te saltes esa zona aunque parezca limpia por fuera. En esclavas y pulseras, revisa el cierre y las zonas donde la pieza se dobla, porque ahí se atrapa más suciedad que en el resto de la superficie lisa.'),
      h2('Oro laminado o de baño: cuidado distinto'),
      p('Todo lo anterior aplica a oro real (10k, 14k, etc.), pero si tu pieza es de oro laminado o chapado (una capa delgada de oro sobre otro metal base, no oro de principio a fin), el cuidado cambia: evita remojarla por tiempos largos y nunca uses cepillo, porque la capa de oro es muy fina y se desgasta con el roce repetido, dejando ver el metal de abajo. Un paño seco y limpieza ocasional es más seguro para ese tipo de piezas que el proceso completo de remojo que sí es seguro para oro real.'),
      h2('Piezas con piedra engastada'),
      p('Evita remojar piezas con piedras pegadas con resina o relleno (no engastadas a presión con garras de metal) — el agua puede aflojar el pegamento con el tiempo. En esos casos, limpia solo el metal con el paño húmedo y evita productos abrasivos cerca de la piedra, incluso si la piedra en sí parece resistente.'),
      h2('Qué NO hacer nunca'),
      p('No uses cloro ni productos de limpieza del hogar (multiusos, limpiavidrios) — muchos contienen amoniaco, que puede debilitar aleaciones de oro con el tiempo. Tampoco uses cepillos de cerdas duras ni estropajos: el oro es más suave de lo que parece y se raya con facilidad, sobre todo el oro 10k con más aleación en su composición. Guardar varias piezas de oro sueltas en el mismo cajón, sin separarlas, también causa rayones acumulados que a la larga opacan el brillo tanto como la grasa.'),
      h2('Cada cuánto limpiarlo'),
      p('Una pieza de uso diario — la cadena o el anillo que nunca te quitas — se beneficia de esta limpieza cada 2 a 4 semanas. Una pieza que usas ocasionalmente aguanta perfectamente bien limpiarse solo antes de cada uso especial, sin perder brillo entre una vez y otra si la guardas bien guardada mientras tanto. Guardarla en una bolsa cerrada, separada de otras piezas, también reduce cuánto se ensucia entre limpiezas — el oro que respira aire libre y roza otras piezas acumula polvo y se raya más rápido que el que está bien resguardado.'),
    ],
  },
  {
    // Keyword retargeteada 28-sep-2026: "plata 925 que significa" (2,400/mes)
    // supera por mucho a "qué es plata 925" (1,000/mes) que se usaba antes —
    // se suma también "es buena" (390) y "precio gramo" (880) como subtemas
    // reales de la misma búsqueda.
    titulo: 'Plata 925: qué significa el sello y si es de buena calidad',
    slug: 'plata-925-que-significa',
    categoria_blog: 'tips-de-joyeria',
    resumen: 'El "925" en una pieza de plata no es un capricho de marketing — es el estándar internacional de calidad. Esto es lo que significa, y por qué sí es una buena elección.',
    seo_titulo: 'Plata 925: qué significa y si es buena calidad',
    seo_descripcion: 'Qué significa el sello 925 en la plata, si es de buena calidad, cómo identificarla, qué determina su precio y cuánto dura con cuidado básico.',
    seo_keywords: 'plata 925 que significa, plata 925 es buena, plata 925 precio, que es plata 925',
    contenido: [
      p('"925" es el número que distingue la plata real de joyería fina de cualquier otra aleación plateada — y también el que más dudas genera: qué significa exactamente, y si es buena calidad. Esto es lo que de verdad hay detrás del sello.'),
      toc(['Qué significa el número 925', 'Por qué se le agrega cobre', '¿Es la plata 925 de buena calidad?', 'Cómo identificarla (el sello real)', 'Qué determina el precio de la plata 925', 'Plata 925 vs. plata de fantasía o alpaca', 'Plata 925 y piel sensible', 'Cuánto dura con cuidado básico']),
      h2('Qué significa el número 925'),
      p('"925" significa que la pieza contiene 92.5% plata pura y 7.5% de otro metal — casi siempre cobre. La plata pura al 100% (también llamada plata fina) es demasiado blanda para joyería de uso diario: se doblaría y rayaría con facilidad. Esta aleación es el estándar mundial de calidad en joyería de plata, no un relleno barato ni una forma de "estirar" el metal — es, literalmente, la forma en que se hace bien la plata para que dure.'),
      h2('Por qué se le agrega cobre'),
      p('El cobre le da dureza y resistencia a la plata sin cambiar su color ni su brillo característico — a simple vista, plata 925 y plata pura se ven prácticamente igual. Es la misma proporción que usan las principales casas de joyería del mundo desde hace siglos; no es una fórmula exclusiva de ningún fabricante, es un estándar internacional documentado y reconocido en cualquier país, no solo en México.'),
      h2('¿Es la plata 925 de buena calidad?'),
      p('Sí, sin reservas — es el estándar de calidad real en joyería de plata, el mismo que usan joyerías de lujo en cualquier país. La confusión viene de que existe joyería de "plata" muy barata que en realidad es plata bañada sobre otro metal (o directamente alpaca, que no tiene plata) — esas piezas pierden el baño con el uso y muestran el metal de abajo. La plata 925 real es plata de principio a fin, solo que reforzada; por eso se opaca y se limpia, pero nunca "se le quita lo plateado", sin importar cuántos años la uses.'),
      h2('Cómo identificarla (el sello real)'),
      p('Busca el sello "925" o ".925" grabado directamente en la pieza — generalmente cerca del cierre en cadenas y pulseras, o en la parte interna del aro en anillos. Es un grabado permanente, no una etiqueta que se despega o que desaparece con el tiempo. Si una pieza se vende como "plata" sin ese sello ni especificar la ley en ningún lado, vale la pena preguntar directamente qué material es antes de comprar — un vendedor confiable siempre puede confirmarte esto sin problema.'),
      h2('Qué determina el precio de la plata 925'),
      p('El precio de una pieza no depende solo del gramaje de plata — también pesa el diseño (piezas más elaboradas cuestan más mano de obra), si lleva piedra, y el acabado. Por eso dos piezas del mismo peso en plata pueden tener precios distintos sin que ninguna esté "mal cobrada". El gramaje sí es la base del cálculo, pero nunca es el único factor — dos anillos del mismo peso, uno liso y otro con filigrana detallada, van a costar distinto aunque lleven exactamente la misma cantidad de plata 925.'),
      h2('Plata 925 vs. plata de fantasía o alpaca'),
      p('La "plata de fantasía" o alpaca no contiene plata real — es una aleación de otros metales (generalmente cobre, níquel y zinc) que imita el color plateado. Es más barata, pero no tiene el brillo característico de la plata real a largo plazo, puede oxidarse de forma distinta, y en algunas personas causa reacciones en la piel por el níquel. La plata 925, al ser plata real, no tiene ese problema — es una diferencia real de material, no solo de precio o de marketing.'),
      h2('Plata 925 y piel sensible'),
      p('A diferencia de la alpaca o los metales base que suelen causar reacciones alérgicas (por el níquel que contienen), la plata 925 real es una de las opciones más seguras para piel sensible — el cobre de la aleación rara vez causa reacciones, y la plata en sí tiene además propiedades naturalmente antibacterianas. Si alguna vez te ha salido un anillo verdoso o te ha irritado la piel con joyería "de plata" barata, es una señal casi segura de que esa pieza no era plata 925 real, sino una aleación distinta con níquel.'),
      h2('Cuánto dura con cuidado básico'),
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Con el cuidado correcto (revisa nuestra ' },
          link('guía completa de cómo limpiar plata 925', 'https://medalladeoro.com.mx/blog/como-limpiar-plata-925'),
          { type: 'text', text: '), una pieza de plata 925 dura años sin perder su acabado real. Lo que se opaca con el tiempo es completamente normal y se revierte limpiando — no significa que la pieza se esté "gastando" ni que esté perdiendo material. Es plata real del principio al fin de su vida útil, con cuidado mínimo.' },
        ],
      },
    ],
  },
  {
    // Keyword retargeteada 28-sep-2026: "oro 10k precio" (9,900/mes) tiene
    // muchísimo más volumen real que la comparación exacta "oro 10k vs 14k"
    // (~30/mes) — se conserva la comparación como sección, no como eje.
    titulo: 'Precio del oro 10k en México: qué lo determina',
    slug: 'precio-oro-10k',
    categoria_blog: 'tips-de-joyeria',
    resumen: 'El precio del oro 10k no tiene un promedio único — depende del peso, el diseño y el precio del oro del día. Esto es lo que de verdad influye, y por qué el 10k suele costar menos que el 14k.',
    seo_titulo: 'Precio del oro 10k en México: qué lo determina',
    seo_descripcion: 'Qué determina el precio del oro 10k: peso, diseño, mano de obra y precio del oro del día. Incluye la diferencia real entre oro 10k y 14k.',
    seo_keywords: 'oro 10k precio, precio oro 10k, oro 10k vs 14k, que es oro 10k',
    contenido: [
      p('El precio del oro 10k no tiene una cifra fija ni un promedio confiable — depende de varias cosas concretas, y la respuesta honesta empieza por entenderlas. Esto es exactamente lo que determina cuánto cuesta una pieza de oro 10k.'),
      toc(['Qué es el oro 10k (el número explicado)', 'Qué determina el precio real', 'Oro 10k vs 14k: la diferencia real', 'Por qué el 10k suele costar menos', 'Por qué el 10k es más resistente', 'Oro laminado: por qué no es lo mismo', 'Cómo saber que es oro real', 'Dónde ver precios reales, no promedios']),
      h2('Qué es el oro 10k (el número explicado)'),
      p('El número indica cuántas partes de 24 son oro puro: el oro 10k tiene 10 de 24 partes de oro puro, es decir 41.7% de oro real. El resto (58.3%) es aleación de otros metales — casi siempre cobre, plata o zinc — que le dan cuerpo, color y, sobre todo, dureza a la pieza. Sigue siendo oro real y se vende con su sello de kilataje correspondiente; no es una imitación ni un baño.'),
      h2('Qué determina el precio real'),
      p('Cuatro cosas concretas, no una: el peso en gramos de la pieza (a más gramos, más oro real, más precio), el precio internacional del oro ese día (fluctúa constantemente, como cualquier metal precioso), el diseño y la mano de obra (una pieza más elaborada cuesta más trabajo que una lisa), y si lleva piedra o no. Cualquier cifra de "precio del oro 10k" que no considere estas cuatro variables es, en el mejor de los casos, un punto de partida — nunca el precio real de una pieza específica.'),
      h2('Oro 10k vs 14k: la diferencia real'),
      p('El oro 14k tiene 14 de 24 partes de oro puro (58.5%), casi 17 puntos porcentuales más que el 10k. Eso significa más oro real por gramo — y por eso, a igual peso, una pieza de 14k casi siempre cuesta más que una de 10k. La diferencia no es de "calidad" en el sentido de que uno sea falso y el otro no: ambos son oro real, solo con distinta proporción de aleación.'),
      h2('Por qué el 10k suele costar menos'),
      p('Al tener menos oro puro y más aleación, el oro 10k es intrínsecamente más económico de producir que el 14k al mismo peso — es matemática simple de cuánto oro real lleva cada pieza. Eso lo hace la opción más accesible para tener oro real (no chapado, no laminado) sin pagar el precio del 14k o el 18k, ideal para quien empieza su colección de joyería fina o busca piezas de uso diario sin comprometer tanto presupuesto.'),
      h2('Por qué el 10k es más resistente'),
      p('Al tener más aleación, el oro 10k es también más duro y resistente a rayones y golpes que el 14k o el 18k — la misma razón que lo hace más accesible lo hace más práctico. Es la elección más común para anillos que no te quitas nunca, cadenas de uso diario, y cualquier pieza que va a estar en contacto constante con actividades del día a día.'),
      h2('Oro laminado: por qué no es lo mismo'),
      p('El oro laminado (o chapado) es un metal base — casi siempre bronce o cobre — con una capa delgada de oro real encima, no oro de principio a fin. Es más barato precisamente porque lleva muchísimo menos oro real por pieza, y esa capa se desgasta con el uso: después de meses o años, empieza a verse el metal de abajo, sobre todo en zonas de roce constante. El oro 10k, en cambio, es sólido — la misma aleación de principio a fin de la pieza, por eso no "se le quita el oro" con el tiempo, solo pierde brillo temporal que se recupera limpiando.'),
      h2('Cómo saber que es oro real'),
      p('Busca el sello de kilataje grabado en la pieza — "10k" o "10kt" — generalmente en la parte interna en anillos, o cerca del broche en cadenas y pulseras. Ese sello es un grabado permanente y es tu garantía de que estás comprando oro real con una ley específica, no una pieza chapada o laminada que perderá el color con el uso. Si tienes dudas sobre una pieza que ya tienes, revisa primero ese sello antes que cualquier otra prueba casera — es la fuente más confiable que existe.'),
      h2('Dónde ver precios reales, no promedios'),
      p('Con las cuatro variables claras (peso, precio del oro del día, diseño y si lleva piedra), lo más honesto es ver precio por pieza específica en vez de buscar un número único para "el oro 10k" en general. Cada pieza del catálogo tiene su propio precio, calculado con esas mismas variables — así comparas manzanas con manzanas, no un promedio contra una pieza real.'),
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Puedes ver piezas reales en oro 10k, con precio exacto por pieza (no un promedio), en el catálogo de ' },
          link('Oro 10k', 'https://medalladeoro.com.mx/material/oro-10k'),
          { type: 'text', text: '.' },
        ],
      },
    ],
  },
  {
    // Keyword retargeteada 28-sep-2026: "anillos de compromiso de oro"
    // (14,800/mes) es la sub-keyword real más grande del post — "cómo elegir
    // anillo de compromiso" no tiene volumen propio medible.
    titulo: 'Anillos de compromiso de oro: cómo elegir el tuyo',
    slug: 'anillos-de-compromiso-de-oro',
    categoria_blog: 'guias-de-regalo',
    resumen: 'El oro sigue siendo la elección más tradicional para un anillo de compromiso. Estas son las decisiones reales que importan — material, estilo, piedra y talla.',
    seo_titulo: 'Anillos de compromiso de oro: cómo elegir',
    seo_descripcion: 'Guía completa para elegir un anillo de compromiso de oro: oro 10k o plata 925, solitario vs churumbela, con piedra o sin piedra, y cómo acertar la talla.',
    seo_keywords: 'anillos de compromiso de oro, anillos de compromiso de oro para mujer, como elegir anillo de compromiso',
    contenido: [
      p('No existe un anillo de compromiso de oro "correcto" — existe el correcto para la persona que lo va a usar todos los días por el resto de su vida. Estas son las decisiones reales que importan, no las de catálogo.'),
      toc(['Por qué el oro sigue siendo la tradición', 'Oro 10k o plata 925 para tu anillo', 'Solitario, churumbela u otro estilo', '¿Con piedra o sin piedra?', 'Qué piedra elegir si quieres una', 'La talla, sin arruinar la sorpresa', 'Cómo cuidarlo una vez que lo tienes', 'Presupuesto real']),
      h2('Por qué el oro sigue siendo la tradición'),
      p('El oro es el material tradicionalmente asociado al compromiso en la mayoría de las culturas, y no es casualidad: envejece bien con el uso diario, no pierde color con los años como otros metales, y su tono cálido combina con casi cualquier tono de piel. Eso no significa que sea la única opción correcta — solo que, si no tienes preferencia previa, el oro sigue siendo la apuesta más segura hoy en día. Si buscas el oro más resistente para uso diario, el oro 10k lleva más aleación que el 14k o el 18k, lo que lo hace menos propenso a rayarse — justo lo que conviene en una pieza que no te vas a quitar.'),
      h2('Oro 10k o plata 925 para tu anillo'),
      p('El oro 10k es la opción más resistente y accesible dentro del oro real — ideal si buscas un anillo que se use todos los días sin cuidados especiales. La plata 925 es una alternativa igual de real y válida, más económica, con un brillo distinto (más frío, más claro) que también tiene muchísimos seguidores. Ninguna es "menos" anillo de compromiso que la otra; la decisión es de gusto y presupuesto, no de jerarquía.'),
      h2('Solitario, churumbela u otro estilo'),
      p('El solitario — una sola piedra central, casi siempre diamante — es el estilo más asociado a "anillo de compromiso" en el imaginario general. La churumbela, el anillo liso tradicional mexicano, es una alternativa igual de válida: más discreta, más resistente al no tener piedra que enganchar, y que suele combinarse con la argolla de matrimonio después de la boda, dejando un solo anillo continuo entre compromiso y matrimonio.'),
      h2('¿Con piedra o sin piedra?'),
      p('Un anillo sin piedra no es "menos" anillo de compromiso — muchas parejas lo prefieren precisamente porque no estorba en el día a día, no se engancha en la ropa o el cabello, y es más resistente a golpes. Es una preferencia de estilo de vida real, no una limitación de presupuesto, aunque también suele costar menos que un anillo con piedra del mismo material y el mismo peso.'),
      h2('Qué piedra elegir si quieres una'),
      p('Si sí quieres piedra, el diamante es la opción clásica, por su dureza y su brillo característico. La esmeralda y el zafiro dan un resultado igual de serio con mucho más color — ninguna es "la alternativa" de la otra, ambas tienen personalidad distinta. El rubí es una tercera opción real para quien quiere algo distinto y con más color todavía.'),
      h2('La talla, sin arruinar la sorpresa'),
      p('Pide prestado, con discreción, un anillo que la persona ya use en el dedo correspondiente y llévalo como referencia — o pregunta a alguien de su confianza que pueda ayudarte sin arruinar la sorpresa. Casi todos los anillos se pueden ajustar una talla arriba o abajo después de la compra, así que no tiene que ser perfecto al primer intento; es más importante acertar el estilo que la talla exacta. Otra opción menos riesgosa: elegir el anillo juntos después de la propuesta, y usar algo simbólico (un anillo temporal, un dije) para el momento mismo. Y si la talla no queda perfecta al final, la mayoría de las joyerías —nosotros incluidos— pueden ajustarla después sin necesidad de comprar una pieza nueva.'),
      h2('Cómo cuidarlo una vez que lo tienes'),
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Un anillo de compromiso se usa todos los días, así que va a necesitar limpieza básica de vez en cuando — la buena noticia es que es sencillo. Si es de oro, sigue nuestra ' },
          link('guía de cómo limpiar cadenas y anillos de oro', 'https://medalladeoro.com.mx/blog/como-limpiar-cadenas-de-oro'),
          { type: 'text', text: '; si es de plata 925, la ' },
          link('guía de cómo limpiar plata 925', 'https://medalladeoro.com.mx/blog/como-limpiar-plata-925'),
          { type: 'text', text: ' te cubre igual de bien. Quitártelo antes de hacer ejercicio, nadar o usar productos de limpieza del hogar alarga muchísimo su vida — sobre todo si lleva piedra, que suele ser la parte más delicada de la pieza.' },
        ],
      },
      h2('Presupuesto real'),
      p('El precio de un anillo de compromiso varía muchísimo según el material y si lleva piedra o no — define primero cuánto quieres invertir, y a partir de ahí elige entre oro 10k o plata 925, y con o sin piedra. Ninguna combinación es "la correcta"; la correcta es la que puedas dar de corazón, sin que el presupuesto sea motivo de estrés en un momento que debería ser solo felicidad.'),
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Ve el catálogo completo, con precio real de cada pieza, en ' },
          link('Anillos de Compromiso', 'https://medalladeoro.com.mx/category/anillos-de-compromiso'),
          { type: 'text', text: ' y en ' },
          link('Churumbela', 'https://medalladeoro.com.mx/category/churumbela'),
          { type: 'text', text: '.' },
        ],
      },
    ],
  },
  {
    // Pieza "shareable" (dato propio), no solo "searchable" — analiza el
    // comportamiento real de búsqueda en México (autocompletado de Google +
    // Google Ads Keyword Planner, 26-sep-2026) en vez de inventar precios de
    // mercado que nadie puede verificar. El precio real de cada pieza vive
    // en el catálogo, no en este post.
    // Keyword: "precio anillo de compromiso" — 3,600/mes (vía "anillos de
    // compromiso precios"), ajustado 28-sep-2026 (slug/título originales no
    // contenían la keyword real).
    titulo: 'Precio de un anillo de compromiso en México: qué lo determina',
    slug: 'precio-anillo-de-compromiso',
    categoria_blog: 'tips-de-joyeria',
    resumen: 'Qué determina el precio real de un anillo de compromiso en México: material, piedra y estilo — sin promedios inventados.',
    seo_titulo: 'Precio de un anillo de compromiso en México',
    seo_descripcion: 'Qué determina el precio real de un anillo de compromiso en México: el material, la piedra y el estilo, explicados sin promedios inventados.',
    seo_keywords: 'precio anillo de compromiso, cuanto cuesta un anillo de compromiso, anillos de compromiso mexico',
    contenido: [
      p('Un anillo de compromiso no tiene un precio único — cualquier cifra que te den sin preguntarte material, piedra y estilo es, en el mejor de los casos, una aproximación. Esto es exactamente lo que determina cuánto vas a pagar, y por qué no existe un "precio promedio" honesto.'),
      toc(['El material: oro 10k o plata 925', 'El estilo: solitario, churumbela u otro', 'Con piedra, sin piedra, y qué piedra', 'Preguntas frecuentes antes de comprar', 'Qué determina el precio real', 'Por qué no existe un "precio promedio" honesto', 'Cómo comparar precios sin comprar a ciegas']),
      h2('El material: oro 10k o plata 925'),
      p('El material es la base del precio: el oro 10k cuesta más que la plata 925 a igual peso, simplemente porque lleva más metal precioso. Ninguno es "mejor" que el otro — el oro es la elección más tradicional para compromiso, mientras que la plata da un resultado igual de serio a un precio más accesible. Esta decisión, antes que cualquier otra, ya define buena parte de tu presupuesto.'),
      h2('El estilo: solitario, churumbela u otro'),
      p('El solitario — una sola piedra, casi siempre diamante — es el estilo más clásico de anillo de compromiso, y también el que más sube el precio, porque casi siempre incluye piedra. La churumbela, el anillo liso tradicional mexicano, es una alternativa real y muy elegida en México: más discreta, sin piedra que cuidar, y normalmente más económica que un solitario del mismo material. Ninguno es "menos" anillo de compromiso que el otro — son dos tradiciones distintas con presupuestos distintos.'),
      h2('Con piedra, sin piedra, y qué piedra'),
      p('Un anillo sin piedra cuesta menos y es más resistente al uso diario — una opción cada vez más elegida, no solo por presupuesto sino por practicidad. Si sí quieres piedra, el diamante es la opción clásica por su dureza y brillo; la esmeralda y el zafiro dan un resultado igual de elegante con mucho más color; el rubí es una tercera opción con personalidad propia. Cada piedra tiene su propio costo según tamaño y calidad, así que esta decisión pesa tanto como el material en el precio final.'),
      h2('Preguntas frecuentes antes de comprar'),
      ul([
        '¿Cuánto debo presupuestar? Define primero un rango máximo; el material y el estilo se acomodan después, no al revés.',
        '¿Dónde comprar con confianza? Busca un catálogo con precio real por pieza, no un estimado genérico, y confirma el sello de material (10k, 925) en la pieza física.',
        '¿El material o la piedra pesan más en el precio? El material define la base; la piedra, si la hay, puede sumar tanto o más que el metal, dependiendo del tamaño.',
      ]),
      h2('Qué determina el precio real'),
      p('En resumen, son tres decisiones concretas las que fijan el precio: el material, si lleva piedra y de qué tipo, y el estilo. Ninguna cifra que no desglose esas tres variables tiene mucho valor real para decidir tu compra. A eso se suman dos factores adicionales que también pesan: el peso de la pieza (más gramos, más metal real, más precio) y el nivel de detalle del diseño — una pieza más elaborada cuesta más mano de obra que una lisa, igual que en cualquier otra pieza de joyería fina. Vale la pena pedir ese desglose antes de decidir, en vez de comparar solo el precio final entre piezas que en realidad no son equivalentes.'),
      h2('Por qué no existe un "precio promedio" honesto'),
      p('Un promedio nacional mezclaría anillos de plata sin piedra con solitarios de oro y diamante grande — números tan distintos entre sí que el promedio no describe a ninguno de los dos con precisión. Es como preguntar "cuánto cuesta un coche": la respuesta honesta siempre es "depende de cuál", no una sola cifra. Cualquier sitio que te dé un solo número sin preguntarte material, piedra y estilo te está dando una aproximación, no un precio real.'),
      h2('Cómo comparar precios sin comprar a ciegas'),
      p('La forma correcta de comparar es fijar primero las tres variables (material, piedra, estilo) y después comparar precios de piezas equivalentes entre sí — no comparar el precio de una churumbela de plata contra un solitario de oro con diamante, porque no son la misma decisión de compra. Una vez que sabes qué combinación buscas, el precio real de esa combinación específica es mucho más fácil de evaluar, y mucho más justa que cualquier promedio genérico que hayas visto en otro lado antes de empezar a comparar en serio.'),
      p('Si todavía no tienes claro qué combinación buscas, empieza por lo más fácil de decidir: el presupuesto máximo que quieres invertir. A partir de ahí, el material (oro 10k suele rendir más presupuesto que plata con piedra grande, por ejemplo) y el estilo se acomodan solos — es más fácil elegir entre pocas opciones ya filtradas por precio que comparar el catálogo completo sin ningún filtro de partida.'),
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Puedes ver precios reales, no promedios, en el catálogo de ' },
          link('Anillos de Compromiso', 'https://medalladeoro.com.mx/category/anillos-de-compromiso'),
          { type: 'text', text: ' y de ' },
          link('Churumbela', 'https://medalladeoro.com.mx/category/churumbela'),
          { type: 'text', text: '.' },
        ],
      },
    ],
  },
];

// BLOG_POSTS_SEED ya solo sirve como semilla inicial para una base de datos
// vacía (sembrarBlogPostsSiFaltan crea únicamente lo que falta). El contenido
// del blog ahora se edita desde Portal Medalla de Oro → Operación → Blog
// (CMS real sobre esta misma tabla) — por eso NO hay ninguna migración que
// fuerce el contenido del código sobre la base de datos en cada boot: existió
// una (actualizarContenidoBlogPostsSiCambio, retirada 28-sep-2026) y hubiera
// revertido en silencio cualquier edición hecha desde el CMS en el siguiente
// deploy del backend.
async function sembrarBlogPostsSiFaltan(strapi) {
  let creados = 0;
  for (const post of BLOG_POSTS_SEED) {
    const existente = await strapi.db.query('api::blog-post.blog-post').findOne({ where: { slug: post.slug } });
    if (existente) continue;
    await strapi.db.query('api::blog-post.blog-post').create({
      data: { ...post, fecha_publicacion: new Date().toISOString().slice(0, 10), publishedAt: new Date().toISOString() },
    });
    creados++;
  }
  if (creados) strapi.log.info(`[bootstrap] ${creados} post(s) de blog sembrado(s)`);
}

module.exports = {
  register({ strapi }) {
    // Middlewares anti-fuerza-bruta / spam — se registran antes de las rutas
    // para interceptar login, registro de Tienda y solicitudes de reset.
    strapi.server.use(loginRateLimit);
    strapi.server.use(registroRateLimit);
    strapi.server.use(forgotPasswordRateLimit);
    strapi.server.use(resetPasswordRateLimit);
    strapi.server.use(actividadRateLimit);
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
      // Medición anónima de la Tienda (ver medicion.js). Responde 204 siempre:
      // el navegador no debe enterarse de por qué se descartó un evento.
      {
        method: 'POST',
        path: '/api/tienda/actividad',
        handler: async (ctx) => {
          try {
            await registrarActividad(strapi, ctx.request.body, { userAgent: ctx.request.headers['user-agent'] });
          } catch (e) {
            strapi.log.warn('[tienda-actividad] ' + e.message);
          }
          ctx.status = 204;
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
                ...atribucionParaLead(ctx.request.body),
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
                  ...atribucionParaLead(ctx.request.body),
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
                ...atribucionParaLead(ctx.request.body),
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
      // Resumen de tráfico de la Tienda para el Portal (solo staff).
      {
        method: 'GET',
        path: '/api/portal/trafico',
        handler: async (ctx) => {
          const staff = await requireStaffRole(ctx);
          if (!staff) { ctx.status = 401; ctx.body = { error: 'No autenticado' }; return; }
          try {
            const resumen = await resumenTrafico(strapi, { desde: ctx.query.desde, hasta: ctx.query.hasta });
            if (resumen.error) { ctx.status = 400; ctx.body = { error: { message: resumen.error } }; return; }
            ctx.body = { data: resumen };
          } catch (e) {
            strapi.log.error('[portal-trafico] ' + e.message);
            ctx.status = 500; ctx.body = { error: { message: 'No se pudo calcular el tráfico' } };
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
    await run('sembrarPaginasArquitectura',  () => sembrarPaginasArquitecturaSiVacio(strapi));
    await run('sembrarReglasArquitectura',   () => sembrarReglasArquitecturaSiVacio(strapi));
    await run('sembrarCategoriasProducto',  () => sembrarCategoriasProductoSiFaltan(strapi));
    await run('renombrarPulsosAPulseras',   () => renombrarPulsosAPulseras(strapi));
    await run('sembrarBlogPosts',           () => sembrarBlogPostsSiFaltan(strapi));
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
