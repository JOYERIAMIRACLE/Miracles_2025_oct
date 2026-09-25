'use strict';

// Medición propia (first-party) de la Tienda: registro de actividad anónima,
// atribución de origen para los leads y resumen de tráfico para el Portal.
// Sin cookies de terceros ni datos personales: solo ids aleatorios de sesión
// y visitante generados en el navegador.

const EVENTOS = new Set([
  'page_viewed', 'cart_item_added', 'cart_checkout_started', 'contact_clicked', 'search_performed',
]);
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|preview|facebookexternalhit|whatsapp|telegram|curl\/|wget|python-requests|axios|node-fetch|go-http-client|okhttp|monitor|uptime|pingdom/i;
const HOSTS_PROPIOS = /(^|\.)(medalladeoro\.com(\.mx)?|richard-avrod\.pages\.dev|miracles-frontend\.pages\.dev|joyeriamiraclesweb\.com)$|^localhost$/;

const SOCIAL = new Set(['instagram', 'facebook', 'fb', 'ig', 'tiktok', 'twitter', 'x', 'pinterest', 'youtube', 'linkedin', 'threads']);
const MENSAJERIA = new Set(['whatsapp', 'wa', 'telegram', 'messenger']);
const BUSCADORES_UTM = new Set(['google', 'bing', 'duckduckgo', 'yahoo']);
const REFERRER_BUSCADORES = [
  ['google', /(^|\.)google\./], ['bing', /(^|\.)bing\.com$/], ['duckduckgo', /(^|\.)duckduckgo\.com$/],
  ['yahoo', /(^|\.)yahoo\./], ['ecosia', /(^|\.)ecosia\.org$/],
];
const REFERRER_SOCIAL = [
  ['instagram', /(^|\.)instagram\.com$/], ['facebook', /(^|\.)(facebook\.com|fb\.com|fb\.me)$/],
  ['tiktok', /(^|\.)tiktok\.com$/], ['pinterest', /(^|\.)pinterest\./],
  ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/], ['twitter', /(^|\.)(twitter\.com|t\.co|x\.com)$/],
];
const REFERRER_MENSAJERIA = [
  ['whatsapp', /(^|\.)(whatsapp\.com|wa\.me)$/], ['telegram', /(^|\.)(t\.me|telegram\.org)$/],
];
const REFERRER_EMAIL = /(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/;

// ─── Sanitización ────────────────────────────────────────────────────────────
function txt(v, max) {
  if (typeof v !== 'string') return '';
  // Sin caracteres de control ni < > (defensa en profundidad: estos textos se
  // muestran en el Portal aunque React ya los escape).
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max);
}
function slug(v, max) {
  return txt(v, max).toLowerCase().replace(/[^a-z0-9._-]/g, '');
}
function host(v) {
  const t = txt(v, 300).toLowerCase();
  if (!t) return '';
  let h = t;
  try { h = new URL(/^[a-z]+:\/\//.test(t) ? t : `https://${t}`).hostname; } catch { /* usa el texto tal cual */ }
  return h.replace(/[^a-z0-9.-]/g, '').slice(0, 100);
}
function pathOnly(v) {
  const t = txt(v, 400);
  if (!t.startsWith('/')) return '';
  return t.split(/[?#]/)[0].slice(0, 200);
}

function normalizarToque(t) {
  if (!t || typeof t !== 'object') return null;
  return {
    utmSource:   slug(t.utm_source   ?? t.utmSource,   40),
    utmMedium:   slug(t.utm_medium   ?? t.utmMedium,   40),
    utmCampaign: slug(t.utm_campaign ?? t.utmCampaign, 60),
    utmContent:  slug(t.utm_content  ?? t.utmContent,  60),
    referrer:    host(t.referrer),
    via:         slug(t.via, 20),
    landing:     pathOnly(t.landing),
  };
}

// ─── Fuente: clase gruesa (fuente) y nombre concreto (canal) ─────────────────
function derivarFuente(toque) {
  if (!toque) return { fuente: 'directo', canal: 'directo' };
  const { utmSource, utmMedium, referrer, via } = toque;

  if (utmSource) {
    if (SOCIAL.has(utmSource) || utmMedium === 'social') return { fuente: 'social', canal: utmSource };
    if (MENSAJERIA.has(utmSource)) return { fuente: 'mensajeria', canal: utmSource };
    if (utmSource === 'email' || utmSource === 'newsletter' || utmMedium === 'email') return { fuente: 'email', canal: utmSource };
    if (BUSCADORES_UTM.has(utmSource) || utmMedium === 'cpc' || utmMedium === 'ppc') return { fuente: 'busqueda', canal: utmSource };
    return { fuente: 'otro', canal: utmSource };
  }
  if (referrer && !HOSTS_PROPIOS.test(referrer)) {
    for (const [canal, re] of REFERRER_BUSCADORES) if (re.test(referrer)) return { fuente: 'busqueda', canal };
    for (const [canal, re] of REFERRER_SOCIAL) if (re.test(referrer)) return { fuente: 'social', canal };
    for (const [canal, re] of REFERRER_MENSAJERIA) if (re.test(referrer)) return { fuente: 'mensajeria', canal };
    if (REFERRER_EMAIL.test(referrer)) return { fuente: 'email', canal: 'email' };
    return { fuente: 'referido', canal: referrer };
  }
  if (via) {
    if (SOCIAL.has(via)) return { fuente: 'social', canal: via };
    if (MENSAJERIA.has(via)) return { fuente: 'mensajeria', canal: via };
  }
  return { fuente: 'directo', canal: 'directo' };
}

function hoyMexico(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora);
}

function limpiarBusqueda(q) {
  return txt(q, 120).replace(/\S+@\S+/g, '').replace(/\d{6,}/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// ─── Escritura ───────────────────────────────────────────────────────────────
async function registrarActividad(strapi, body, { userAgent } = {}) {
  if (!body || typeof body !== 'object') return { ok: false, motivo: 'cuerpo' };
  if (userAgent && BOT_RE.test(userAgent)) return { ok: false, motivo: 'bot' };
  const tipo = String(body.evento ?? '');
  if (!EVENTOS.has(tipo)) return { ok: false, motivo: 'evento' };
  const sesion = String(body.sid ?? '');
  const visitante = String(body.vid ?? '');
  if (!ID_RE.test(sesion) || !ID_RE.test(visitante)) return { ok: false, motivo: 'ids' };
  const pagina = pathOnly(body.pagina);
  if (!pagina) return { ok: false, motivo: 'pagina' };

  const toque = normalizarToque(body.toque);
  const { fuente, canal } = derivarFuente(toque);
  let detalle = null;
  if (tipo === 'search_performed') detalle = limpiarBusqueda(body.detalle) || null;
  else if (tipo === 'contact_clicked' || tipo === 'cart_checkout_started') detalle = slug(body.detalle, 20) || null;

  await strapi.db.query('api::visita.visita').create({
    data: {
      fecha: hoyMexico(),
      pagina, sesion, visitante, tipo, fuente, canal,
      producto:    slug(body.producto, 120) || null,
      detalle,
      utmSource:   toque?.utmSource   || null,
      utmMedium:   toque?.utmMedium   || null,
      utmCampaign: toque?.utmCampaign || null,
      utmContent:  toque?.utmContent  || null,
      referrer:    toque?.referrer    || null,
    },
  });
  return { ok: true };
}

// Campos de atribución que se copian al lead cuando alguien deja sus datos.
function atribucionParaLead(body) {
  const salida = {};
  const como = txt(body?.comoNosConocio, 80);
  if (como) salida.comoNosConocio = como;
  const a = body?.atribucion;
  if (!a || typeof a !== 'object') return salida;
  if (ID_RE.test(String(a.sid ?? ''))) salida.sesion = String(a.sid);
  if (ID_RE.test(String(a.vid ?? ''))) salida.visitante = String(a.vid);
  const ft = normalizarToque(a.ft);
  const lt = normalizarToque(a.lt);
  const dft = derivarFuente(ft);
  const dlt = derivarFuente(lt);
  if (ft) { salida.ftFuente = dft.canal; salida.ftCampana = ft.utmCampaign || null; }
  if (lt) { salida.ltFuente = dlt.canal; salida.ltCampana = lt.utmCampaign || null; }
  if (ft || lt) salida.atribucion = { ft, lt, ftDerivada: dft, ltDerivada: dlt };
  return salida;
}

// ─── Lectura para el Portal ──────────────────────────────────────────────────
const LIMITE_FILAS = 20000;

function top(mapa, n, forma) {
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => forma(k, v));
}
const sumar = (mapa, k, n = 1) => mapa.set(k, (mapa.get(k) ?? 0) + n);

async function resumenTrafico(strapi, { desde, hasta }) {
  if (!FECHA_RE.test(desde ?? '') || !FECHA_RE.test(hasta ?? '') || desde > hasta) {
    return { error: 'Rango de fechas inválido (usa AAAA-MM-DD)' };
  }
  const filas = await strapi.db.query('api::visita.visita').findMany({
    where: { fecha: { $gte: desde, $lte: hasta } },
    select: ['fecha', 'pagina', 'sesion', 'visitante', 'tipo', 'fuente', 'canal', 'producto', 'detalle', 'utmCampaign'],
    orderBy: { createdAt: 'asc' },
    limit: LIMITE_FILAS + 1,
  });
  const truncado = filas.length > LIMITE_FILAS;
  const filasUsadas = truncado ? filas.slice(0, LIMITE_FILAS) : filas;

  const visitantes = new Set();
  const sesiones = new Map();       // sesion -> { fecha, fuente, canal, campana, vioProducto, carrito, checkout, contacto }
  const paginas = new Map();
  const sesionesPagina = new Map();
  const productosVistas = new Map();
  const productosCarrito = new Map();
  const busquedas = new Map();
  const contactos = new Map();
  let paginasVistas = 0;

  for (const f of filasUsadas) {
    visitantes.add(f.visitante);
    let s = sesiones.get(f.sesion);
    if (!s) {
      s = { fecha: f.fecha, fuente: f.fuente || 'directo', canal: f.canal || 'directo', campana: f.utmCampaign || '',
        vioProducto: false, carrito: false, checkout: false, contacto: false, paginas: new Set() };
      sesiones.set(f.sesion, s);
    }
    if (f.tipo === 'page_viewed') {
      paginasVistas += 1;
      sumar(paginas, f.pagina);
      if (!s.paginas.has(f.pagina)) { s.paginas.add(f.pagina); sumar(sesionesPagina, f.pagina); }
      if (f.pagina.startsWith('/producto/') && f.pagina !== '/producto/loading') {
        s.vioProducto = true;
        if (f.producto) sumar(productosVistas, f.producto);
      }
    } else if (f.tipo === 'cart_item_added') {
      s.carrito = true;
      if (f.producto) sumar(productosCarrito, f.producto);
    } else if (f.tipo === 'cart_checkout_started') s.checkout = true;
    else if (f.tipo === 'contact_clicked') { s.contacto = true; sumar(contactos, f.detalle || 'otro'); }
    else if (f.tipo === 'search_performed' && f.detalle) sumar(busquedas, f.detalle);
  }

  const porCanal = new Map();
  const porFuente = new Map();
  const campanas = new Map();
  const porDia = new Map();
  const embudo = { sesiones: sesiones.size, vieronProducto: 0, agregaronCarrito: 0, iniciaronCheckout: 0, contactaron: 0 };
  for (const s of sesiones.values()) {
    sumar(porCanal, `${s.fuente}|${s.canal}`);
    sumar(porFuente, s.fuente);
    if (s.campana) sumar(campanas, s.campana);
    sumar(porDia, s.fecha);
    if (s.vioProducto) embudo.vieronProducto += 1;
    if (s.carrito) embudo.agregaronCarrito += 1;
    if (s.checkout) embudo.iniciaronCheckout += 1;
    if (s.contacto) embudo.contactaron += 1;
  }
  const productos = new Set([...productosVistas.keys(), ...productosCarrito.keys()]);

  return {
    desde, hasta, truncado,
    visitantes: visitantes.size,
    sesiones: sesiones.size,
    paginasVistas,
    embudo,
    porFuente: top(porFuente, 10, (fuente, n) => ({ fuente, sesiones: n })),
    porCanal: top(porCanal, 15, (k, n) => { const [fuente, canal] = k.split('|'); return { fuente, canal, sesiones: n }; }),
    paginas: top(paginas, 15, (pagina, vistas) => ({ pagina, vistas, sesiones: sesionesPagina.get(pagina) ?? 0 })),
    productos: [...productos]
      .map((p) => ({ producto: p, vistas: productosVistas.get(p) ?? 0, carritos: productosCarrito.get(p) ?? 0 }))
      .sort((a, b) => (b.vistas + b.carritos) - (a.vistas + a.carritos)).slice(0, 15),
    campanas: top(campanas, 10, (campana, n) => ({ campana, sesiones: n })),
    busquedas: top(busquedas, 10, (q, veces) => ({ q, veces })),
    contactos: top(contactos, 5, (canal, clics) => ({ canal, clics })),
    porDia: [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([fecha, n]) => ({ fecha, sesiones: n })),
  };
}

// ─── Límite de frecuencia para la ruta pública ───────────────────────────────
// A diferencia del limitador de login, este se libera solo cada minuto: el
// tráfico legítimo (o una IP compartida de operador móvil) nunca queda bloqueado
// por acumulación, solo se frena a quien manda ráfagas.
function crearLimitadorPorMinuto({ path, method, max, getIP, alExceder }) {
  const ventanas = new Map();
  const limpieza = setInterval(() => {
    const minuto = Math.floor(Date.now() / 60000);
    for (const [ip, v] of ventanas) if (v.minuto < minuto - 1) ventanas.delete(ip);
  }, 5 * 60 * 1000);
  if (limpieza.unref) limpieza.unref();

  return async (ctx, next) => {
    if (ctx.path !== path || ctx.method !== method) return next();
    const minuto = Math.floor(Date.now() / 60000);
    const ip = getIP(ctx);
    const v = ventanas.get(ip);
    if (!v || v.minuto !== minuto) ventanas.set(ip, { minuto, n: 1 });
    else if (++v.n > max) return alExceder(ctx);
    return next();
  };
}

module.exports = {
  EVENTOS, normalizarToque, derivarFuente, hoyMexico, limpiarBusqueda,
  registrarActividad, atribucionParaLead, resumenTrafico, crearLimitadorPorMinuto,
};
