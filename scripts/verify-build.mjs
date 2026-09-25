// Guardia del deploy de la Tienda (export estático).
//   node scripts/verify-build.mjs esperar    -> antes del build: espera a que el backend responda
//   node scripts/verify-build.mjs verificar  -> después del build: cada producto, categoría y post
//                                               del backend debe tener su página con datos reales
// Si falla, el workflow se detiene antes de subir a Cloudflare y el sitio conserva
// su último despliegue bueno. Las consultas replican las que hace el build.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL
const OUT = process.env.OUT_DIR ?? 'apps/personal/out'
const modo = process.argv[2]

if (!BACKEND) { console.error('Falta NEXT_PUBLIC_BACKEND_URL'); process.exit(2) }

const CONSULTAS = {
  productos:  '/api/products?fields[0]=slug&filters[activo][$eq]=true&pagination[pageSize]=100',
  categorias: '/api/product-categories?fields[0]=slug&pagination[pageSize]=100',
  blog:       '/api/blog-posts?fields[0]=slug&pagination[pageSize]=200',
}

async function slugs(ruta) {
  const res = await fetch(`${BACKEND}${ruta}`, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`${ruta} -> HTTP ${res.status}`)
  const json = await res.json()
  return (json.data ?? []).map((d) => d.slug).filter(Boolean)
}

async function todos() {
  const [productos, categorias, blog] = await Promise.all(Object.values(CONSULTAS).map(slugs))
  return { productos, categorias, blog }
}

async function esperar() {
  const INTENTOS = 30
  for (let i = 1; i <= INTENTOS; i++) {
    try {
      const d = await todos()
      console.log(`Backend listo (intento ${i}): ${d.productos.length} productos, ${d.categorias.length} categorías, ${d.blog.length} posts`)
      return
    } catch (err) {
      console.log(`Intento ${i}/${INTENTOS}: backend no listo (${err.message})`)
      await new Promise((r) => setTimeout(r, 10_000))
    }
  }
  console.error('El backend no respondió a tiempo: no se construye para no publicar un sitio degradado.')
  process.exit(1)
}

function leer(ruta) {
  return existsSync(ruta) ? readFileSync(ruta, 'utf8') : null
}

async function verificar() {
  const d = await todos()
  const problemas = []
  const sitemap = leer(join(OUT, 'sitemap.xml'))
  if (!sitemap) problemas.push('Falta sitemap.xml en el build')

  const revisar = (tipo, carpeta, lista, marca) => {
    for (const slug of lista) {
      const html = leer(join(OUT, carpeta, `${slug}.html`))
      if (!html) problemas.push(`Falta la página /${carpeta}/${slug}`)
      else if (!html.includes(marca)) problemas.push(`/${carpeta}/${slug} se construyó sin datos (falta ${marca})`)
      if (sitemap && !sitemap.includes(`/${carpeta}/${slug}`)) problemas.push(`El sitemap no incluye /${carpeta}/${slug}`)
    }
    console.log(`${tipo}: ${lista.length} revisados`)
  }
  revisar('Productos', 'producto', d.productos, '"@type":"Product"')
  revisar('Categorías', 'category', d.categorias, '"@type":"CollectionPage"')
  revisar('Posts del blog', 'blog', d.blog, '"@type":"BlogPosting"')
  if (!existsSync(join(OUT, '404.html'))) console.warn('Aviso: no hay 404.html; las URLs inexistentes no tendrán página de error propia')

  if (problemas.length) {
    console.error(`\nBuild degradado, NO se despliega (${problemas.length} problemas):`)
    for (const p of problemas) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log('Build completo: todas las páginas tienen datos reales.')
}

if (modo === 'esperar') await esperar()
else if (modo === 'verificar') await verificar()
else { console.error('Uso: node scripts/verify-build.mjs esperar|verificar'); process.exit(2) }
