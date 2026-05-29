'use strict';

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
];

const CATEGORIAS_PAGO_SEED = [
  'Comisión', 'Anticipo', 'Liquidación', 'Honorario', 'Servicio', 'Otro',
];


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

async function aplicarPermisosPublic(strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!publicRole) return;

  const todas = [...PUBLIC_ACTIONS_PRODUCT, ...PUBLIC_ACTIONS_CATEGORIA, ...PUBLIC_ACTIONS_TAREA, ...PUBLIC_ACTIONS_SNAPSHOT, ...PUBLIC_ACTIONS_TRABAJO];
  for (const action of todas) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });
    if (!existing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } });
    }
  }
  strapi.log.info('[bootstrap] Permisos Public aplicados (Categoria + Tarea + Snapshots + Trabajo)');
}

async function sembrarCategoriasSiVacio(strapi) {
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
    try {
      await aplicarPermisosPublic(strapi);
      await sembrarCategoriasSiVacio(strapi);
      await backfillColoresCategorias(strapi);
      await normalizarCategorias(strapi);
      await sembrarCategoriasPagoSiVacio(strapi);
    } catch (err) {
      strapi.log.error('[bootstrap] Error: ' + err.message);
    }
  },
};
