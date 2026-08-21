'use strict';

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

async function aplicarPermisosPublic(strapi) {
  const todas = [...PUBLIC_ACTIONS_PRODUCT, ...PUBLIC_ACTIONS_CATEGORIA, ...PUBLIC_ACTIONS_TAREA, ...PUBLIC_ACTIONS_SNAPSHOT, ...PUBLIC_ACTIONS_TRABAJO, ...PUBLIC_ACTIONS_SOCIAL, ...PUBLIC_ACTIONS_PORTAL_MDO];
  await otorgarPermisos(strapi, 'public', todas);
  // El front de Portal Medallitadeoro manda el JWT del usuario logueado en
  // los guardados (crear/editar/eliminar) — esas peticiones las evalúa
  // Strapi bajo el rol "authenticated", no "public", así que ese rol
  // también necesita estos permisos o el guardado falla con 403 aunque el
  // GET (sin token) sí funcione.
  await otorgarPermisos(strapi, 'authenticated', PUBLIC_ACTIONS_PORTAL_MDO);
  strapi.log.info('[bootstrap] Permisos Public aplicados (Categoria + Tarea + Snapshots + Trabajo + Portal MDO) + Authenticated (Portal MDO)');
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
    strapi.server.routes([
      {
        method: 'POST',
        path: '/api/miracles-chat',
        handler: async (ctx) => {
          try {
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
    ])
  },

  async bootstrap({ strapi }) {
    const run = async (label, fn) => {
      try { await fn(); }
      catch (err) { strapi.log.error(`[bootstrap] ${label}: ${err.message}`); }
    };
    await run('aplicarPermisosPublic',      () => aplicarPermisosPublic(strapi));
    await run('sembrarCategorias',           () => sembrarCategoriasSiVacio(strapi));
    await run('backfillColoresCategorias',  () => backfillColoresCategorias(strapi));
    await run('normalizarCategorias',       () => normalizarCategorias(strapi));
    await run('sembrarCategoriasPago',      () => sembrarCategoriasPagoSiVacio(strapi));
    await run('sembrarCategoriasEmpresa',   () => sembrarCategoriasEmpresaSiVacio(strapi));
  },
};
