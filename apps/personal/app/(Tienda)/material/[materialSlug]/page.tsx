import type { Metadata } from "next"
import Link from "next/link"
import { ProductType } from "@/types/product"
import ProductCard1 from "../../category/[categorySlug]/components/product-card1"
import Container from "../../1tiendacomponentes/container"

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"

// Decidido con datos reales de búsqueda (Google Suggest + Google Ads Keyword
// Planner, México, 26-sep-2026): "plata 925" tiene 14,800 búsquedas/mes
// directas y "oro 10k precio" 9,900 — ninguna de las dos existía como
// página propia, solo como filtro dentro de cada categoría de joya.
const MATERIALES: Record<string, { nombre: string; enumValue: "Oro 10k" | "Plata 925"; titulo: string; intro: string[] }> = {
  "oro-10k": {
    nombre: "Oro 10k",
    enumValue: "Oro 10k",
    titulo: "Joyería en Oro 10k",
    intro: [
      "El oro 10k tiene 10 de 24 partes de oro puro (41.7%) — el resto es aleación que le da dureza y resistencia. Es la opción más práctica para piezas de uso diario: anillos que no te quitas, cadenas de trabajo, joyería que va contigo todos los días.",
      "A diferencia del oro 14k o 18k, el 10k resiste mejor los golpes y rayones del uso constante, y su precio es más accesible sin dejar de ser oro real, con su sello de kilataje correspondiente.",
    ],
  },
  "plata-925": {
    nombre: "Plata 925",
    enumValue: "Plata 925",
    titulo: "Joyería en Plata 925",
    intro: [
      "\"925\" significa que la pieza contiene 92.5% plata pura y 7.5% de otro metal (casi siempre cobre) — es el estándar internacional de calidad en joyería de plata, no un relleno. Busca el sello \"925\" grabado cerca del cierre o en la parte interna del aro.",
      "Con el tiempo se opaca un poco por contacto con aire, perfume y sudor — es normal y se revierte limpiando (ver nuestra guía de cuidado), no significa que la pieza se esté gastando.",
    ],
  },
}

async function fetchProductosPorMaterial(enumValue: string): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?populate=*&filters[materialProducto][$eq]=${encodeURIComponent(enumValue)}&filters[activo][$eq]=true&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ProductType[]) ?? []
  } catch { return [] }
}

export async function generateStaticParams() {
  return Object.keys(MATERIALES).map((materialSlug) => ({ materialSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ materialSlug: string }>
}): Promise<Metadata> {
  const { materialSlug } = await params
  const info = MATERIALES[materialSlug]
  if (!info) return { title: "Medalla de Oro", robots: { index: false, follow: false } }
  const descripcion = `${info.titulo}: ${info.intro[0].slice(0, 140)}… Envíos a todo México.`
  return {
    title: { absolute: `${info.titulo} | Medalla de Oro` },
    description: descripcion,
    alternates: { canonical: `${SITE_URL}/material/${materialSlug}` },
    openGraph: {
      title: `${info.titulo} | Medalla de Oro`,
      description: descripcion,
      url: `${SITE_URL}/material/${materialSlug}`,
      siteName: "Medalla de Oro",
      type: "website",
    },
  }
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ materialSlug: string }>
}) {
  const { materialSlug } = await params
  const info = MATERIALES[materialSlug]
  if (!info) return null

  const productos = await fetchProductosPorMaterial(info.enumValue)

  return (
    <main>
      <div className="relative w-full min-h-[220px] md:h-[300px] flex items-center overflow-hidden bg-slate-900">
        <img src="/portada%20home.jpg.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <Container className="relative z-10 w-full">
          <p className="text-violet-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3">Medalla de Oro</p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg max-w-xl">{info.titulo}</h1>
        </Container>
      </div>

      <Container className="py-8 sm:py-12">
        <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-violet-600 transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">{info.nombre}</span>
        </nav>

        <div className="max-w-2xl mb-10 space-y-3">
          {info.intro.map((parrafo, i) => (
            <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{parrafo}</p>
          ))}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          <span className="font-semibold text-slate-800 dark:text-white">{productos.length}</span> pieza{productos.length !== 1 ? "s" : ""} en {info.nombre}
        </p>

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
