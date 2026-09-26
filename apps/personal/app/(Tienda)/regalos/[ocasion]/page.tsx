import type { Metadata } from "next"
import Link from "next/link"
import { ProductType } from "@/types/product"
import ProductCard1 from "../../category/[categorySlug]/components/product-card1"
import Container from "../../1tiendacomponentes/container"

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"

// Decidido con datos reales de búsqueda (Google Suggest + Google Ads Keyword
// Planner, México, 26-sep-2026) — coincide con las 6 tarjetas de "Compra por
// ocasión" del home, que hasta ahora no tenían página propia a la que enlazar.
// Cada ocasión filtra por categorías existentes (no hay un campo "ocasión" en
// el producto, así que se resuelve con las categorías que de verdad se
// regalan en cada caso) — "compromiso" usa el atributo tipoAnillo como en
// /category/anillos-de-compromiso.
type FiltroOcasion = { categorias: string[]; tipoAnillo?: string[] }

const OCASIONES: Record<string, { titulo: string; emoji: string; intro: string; filtro: FiltroOcasion; volumen: string }> = {
  "dia-de-la-madre": {
    titulo: "Regalos para el Día de la Madre",
    emoji: "🌸",
    intro: "Aretes, dijes y pulseras en oro 10k y plata 925 — piezas para regalar que se usan todos los días, no solo una vez.",
    filtro: { categorias: ["aretes", "dijes", "pulsos"] },
    volumen: "Búsqueda real: \"regalo día de la madre\" — 2,900/mes en México.",
  },
  "quinceanera": {
    titulo: "Regalos para Quinceañera",
    emoji: "🎀",
    intro: "Aretes, dijes, pulseras y anillos — el regalo de joyería para el día especial de una quinceañera.",
    filtro: { categorias: ["aretes", "dijes", "pulsos", "anillos"] },
    volumen: "Búsqueda real: \"regalo para quinceañera\" — 2,900/mes en México.",
  },
  "boda": {
    titulo: "Joyería para Boda",
    emoji: "💒",
    intro: "Argollas de matrimonio y anillos de compromiso en oro 10k y plata 925, incluida la churumbela tradicional.",
    filtro: { categorias: ["argollas"], tipoAnillo: ["Compromiso", "Solitario", "Churumbela"] },
    volumen: "Búsqueda real: \"argollas de matrimonio\" — 22,200/mes en México.",
  },
  "graduacion": {
    titulo: "Regalos de Graduación",
    emoji: "🎓",
    intro: "Aretes, dijes y esclavas para celebrar un logro con una joya que dura.",
    filtro: { categorias: ["aretes", "dijes", "esclavas"] },
    volumen: "Búsqueda real: \"anillos de oro de graduación\" — 590/mes en México.",
  },
  "compromiso": {
    titulo: "Anillos de Compromiso",
    emoji: "💍",
    intro: "Solitarios, churumbelas y diseños con o sin piedra — ve el catálogo completo en Anillos de Compromiso.",
    filtro: { categorias: [], tipoAnillo: ["Compromiso", "Solitario", "Churumbela"] },
    volumen: "Búsqueda real: \"anillos de compromiso\" — 165,000/mes en México, el término de más volumen de todo el catálogo.",
  },
}

function construirFiltro(f: FiltroOcasion): string {
  const partes: string[] = []
  let i = 0
  if (f.categorias.length) {
    for (const c of f.categorias) partes.push(`filters[$or][${i++}][categoria][slug][$eq]=${c}`)
  }
  if (f.tipoAnillo?.length) {
    for (const t of f.tipoAnillo) partes.push(`filters[$or][${i++}][atributos][tipoAnillo][$eq]=${encodeURIComponent(t)}`)
  }
  return partes.join("&")
}

async function fetchProductosOcasion(f: FiltroOcasion): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?populate=*&${construirFiltro(f)}&filters[activo][$eq]=true&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ProductType[]) ?? []
  } catch { return [] }
}

export async function generateStaticParams() {
  return Object.keys(OCASIONES).map((ocasion) => ({ ocasion }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ocasion: string }>
}): Promise<Metadata> {
  const { ocasion } = await params
  const info = OCASIONES[ocasion]
  if (!info) return { title: "Medalla de Oro", robots: { index: false, follow: false } }
  return {
    title: { absolute: `${info.titulo} | Medalla de Oro` },
    description: `${info.intro} Oro 10k y Plata 925 · Envíos a todo México.`,
    alternates: { canonical: `${SITE_URL}/regalos/${ocasion}` },
    openGraph: {
      title: `${info.titulo} | Medalla de Oro`,
      description: `${info.intro} Oro 10k y Plata 925 · Envíos a todo México.`,
      url: `${SITE_URL}/regalos/${ocasion}`,
      siteName: "Medalla de Oro",
      type: "website",
    },
  }
}

export default async function OcasionPage({
  params,
}: {
  params: Promise<{ ocasion: string }>
}) {
  const { ocasion } = await params
  const info = OCASIONES[ocasion]
  if (!info) return null

  const productos = await fetchProductosOcasion(info.filtro)

  return (
    <main>
      <div className="relative w-full min-h-[220px] md:h-[300px] flex items-center overflow-hidden bg-slate-900">
        <img src="/portada%20home.jpg.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <Container className="relative z-10 w-full">
          <p className="text-violet-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3">{info.emoji} Para cada momento</p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg max-w-xl">{info.titulo}</h1>
        </Container>
      </div>

      <Container className="py-8 sm:py-12">
        <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-violet-600 transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">{info.titulo}</span>
        </nav>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mb-2">{info.intro}</p>
        <p className="text-xs text-slate-400 mb-8">{info.volumen}</p>

        {ocasion === "compromiso" && (
          <Link href="/category/anillos-de-compromiso" className="inline-block mb-6 text-sm font-semibold text-violet-500 hover:text-violet-400">
            Ver catálogo completo de Anillos de Compromiso →
          </Link>
        )}

        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          {productos.map((product) => <ProductCard1 key={product.id} product={product} />)}
        </div>

        {productos.length === 0 && (
          <p className="text-sm text-slate-400 py-10 text-center">Pronto tendremos piezas disponibles aquí — explora <Link href="/category" className="text-violet-500 hover:text-violet-400">todo el catálogo</Link>.</p>
        )}
      </Container>
    </main>
  )
}
