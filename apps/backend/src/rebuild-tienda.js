'use strict';

// La Tienda es un export estático: el HTML de productos, categorías y blog se
// hornea en el build. Este módulo avisa a GitHub Actions (repository_dispatch)
// cuando cambia algo de eso, para que el sitio se reconstruya solo. Strapi no
// puede mandar el cuerpo que exige GitHub desde un webhook, por eso vive aquí.

const MODELOS = {
  'api::product.product':                   { publicable: false },
  'api::product-category.product-category': { publicable: true },
  'api::blog-post.blog-post':               { publicable: true },
};
const MODELOS_REBUILD = Object.keys(MODELOS);

// Un update que solo toca estos campos no cambia lo que la Tienda pinta (o el
// cambio de stock es tan frecuente que reconstruir en cada venta no vale la pena).
const CAMPOS_SIN_EFECTO = new Set([
  'stock', 'costoProduccion', 'costoManoObra', 'pesoGramos', 'materialInsumo', 'puntoVenta', 'updatedAt',
]);

function crearDisparadorRebuild({
  token,
  repo = 'JOYERIAMIRACLE/Miracles_2025_oct',
  debounceMs = 60_000,
  fetchFn = globalThis.fetch,
  log = console,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  let timer = null;
  let avisoSinToken = false;
  const motivos = new Set();

  async function enviar() {
    timer = null;
    const lista = [...motivos];
    motivos.clear();
    try {
      const res = await fetchFn(`https://api.github.com/repos/${repo}/dispatches`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'medalladeoro-backend',
        },
        body: JSON.stringify({ event_type: 'strapi-publish', client_payload: { motivos: lista } }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 204) log.info(`[rebuild] Reconstrucción de la Tienda solicitada (${lista.join(', ')})`);
      else log.warn(`[rebuild] GitHub respondió HTTP ${res.status}; la Tienda NO se reconstruirá sola`);
    } catch (err) {
      log.warn(`[rebuild] No se pudo avisar a GitHub: ${err.message}`);
    }
  }

  return function alCambiar(event) {
    try {
      const cfg = MODELOS[event?.model?.uid];
      if (!cfg) return;
      if (!token) {
        if (!avisoSinToken) {
          avisoSinToken = true;
          log.warn('[rebuild] GITHUB_DISPATCH_TOKEN no está definido: la Tienda no se reconstruye sola al publicar');
        }
        return;
      }
      // Los borradores no se ven en la Tienda; publicar y despublicar sí.
      if (cfg.publicable && !event.result?.publishedAt) return;
      if (event.action === 'afterUpdate') {
        const claves = Object.keys(event.params?.data ?? {});
        if (claves.length > 0 && claves.every((k) => CAMPOS_SIN_EFECTO.has(k))) return;
      }
      motivos.add(event.model.uid.replace(/^api::[^.]+\./, ''));
      if (timer) clearTimer(timer);
      timer = setTimer(enviar, debounceMs);
    } catch (err) {
      log.warn(`[rebuild] ${err.message}`);
    }
  };
}

module.exports = { crearDisparadorRebuild, MODELOS_REBUILD };
