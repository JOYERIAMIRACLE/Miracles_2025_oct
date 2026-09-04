import type { Metadata } from "next"
import { ProductType } from "@/types/product"
import CategoryClient from "./CategoryClient"

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const SITE_URL = "https://miracles-frontend.pages.dev"

type CategoryData = { NombreCategoria: string; slug: string; MainImage?: { url: string } | null }

async function fetchCategory(slug: string): Promise<CategoryData | null> {
  try {
    const res = await fetch(
      `${BACKEND}/api/product-categories?filters[slug][$eq]=${slug}&populate=MainImage&pagination[pageSize]=1`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const json = await res.json()
    return (json.data?.[0] as CategoryData) ?? null
  } catch { return null }
}

async function fetchCategoryProducts(slug: string): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?populate=*&filters[categoria][slug][$eq]=${slug}&filters[activo][$eq]=true&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ProductType[]) ?? []
  } catch { return [] }
}

// Slugs que el menú de navegación siempre enlaza (menu-list.tsx) — se
// incluyen siempre, aunque el fetch al backend falle o esté incompleto en
// el momento del build, para que un hipo de Strapi nunca deje sin generar
// una página que el navbar sí va a enlazar (esto es justo lo que pasó:
// "esclavas" faltaba por un slug mal escrito en Strapi, no por el fetch).
const CATEGORIAS_NAV = ["anillos", "cadenas", "esclavas", "aretes", "broqueles", "dijes", "pulsos", "rosarios", "argollas"]

export async function generateStaticParams() {
  // "loading" siempre se genera — mismo patrón que ya usa /producto: es el
  // shell al que el _redirects de Cloudflare manda cualquier categoría no
  // pre-generada (slug nuevo o fetch fallido en build); CategoryClient lee
  // el slug real desde la URL y hace el fetch de verdad del lado cliente.
  const base = [{ categorySlug: "loading" }, ...CATEGORIAS_NAV.map((categorySlug) => ({ categorySlug }))]
  try {
    const res = await fetch(
      `${BACKEND}/api/product-categories?fields[0]=slug&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return base
    const json = await res.json()
    const fromBackend = (json.data || [])
      .map((c: { slug?: string; attributes?: { slug?: string } }) => c.slug ?? c.attributes?.slug ?? "")
      .filter(Boolean)
    const slugs = new Set(["loading", ...CATEGORIAS_NAV, ...fromBackend])
    return [...slugs].map((categorySlug) => ({ categorySlug }))
  } catch {
    return base
  }
}

// dynamicParams se deja en su default (true): con output:"export" no hay
// servidor que renderice bajo demanda un param faltante en producción (esa
// página simplemente no existe como archivo estático), así que ponerlo en
// false no aporta nada ahí — y en dev SÍ causaba que cualquier categoría
// tronara o cayera al not-found genérico por un desfase entre el slug real
// y lo que generateStaticParams alcanzó a traer en ese momento.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}): Promise<Metadata> {
  const { categorySlug } = await params
  const [category, products] = await Promise.all([
    fetchCategory(categorySlug),
    fetchCategoryProducts(categorySlug),
  ])

  const categoryName =
    category?.NombreCategoria ??
    products[0]?.categoria?.NombreCategoria ??
    categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const descripcion = `Colección de ${categoryName} en Joyería Miracles · Oro 10k y Plata 925 · ${products.length > 0 ? `${products.length} piezas disponibles · ` : ""}Envíos a todo México.`

  const mainImg = category?.MainImage?.url
  const firstProductImg = products[0]?.imagenes?.[0]?.url
  const rawImgUrl = mainImg ?? firstProductImg
  const imageUrl = rawImgUrl
    ? rawImgUrl.startsWith("http") ? rawImgUrl : `${BACKEND}${rawImgUrl}`
    : undefined

  return {
    title: `${categoryName} | Joyería Miracles`,
    description: descripcion,
    alternates: { canonical: `${SITE_URL}/category/${categorySlug}` },
    openGraph: {
      title: `${categoryName} | Joyería Miracles`,
      description: descripcion,
      url: `${SITE_URL}/category/${categorySlug}`,
      siteName: "Joyería Miracles",
      type: "website",
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: categoryName }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | Joyería Miracles`,
      description: descripcion,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params
  const [category, products] = await Promise.all([
    fetchCategory(categorySlug),
    fetchCategoryProducts(categorySlug),
  ])

  const categoryName =
    category?.NombreCategoria ??
    products[0]?.categoria?.NombreCategoria ??
    categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} | Joyería Miracles`,
    description: `Colección de ${categoryName} en Joyería Miracles`,
    url: `${SITE_URL}/category/${categorySlug}`,
    numberOfItems: products.length,
    hasPart: products.slice(0, 10).map(p => ({
      "@type": "Product",
      name: p.nombreProducto,
      url: `${SITE_URL}/producto/${p.slug}`,
      ...(p.imagenes?.[0]?.url && {
        image: p.imagenes[0].url.startsWith("http")
          ? p.imagenes[0].url
          : `${BACKEND}${p.imagenes[0].url}`,
      }),
      offers: {
        "@type": "Offer",
        priceCurrency: "MXN",
        price: p.costo ?? 0,
        availability: "https://schema.org/InStock",
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryClient categorySlug={categorySlug} categoryName={categoryName} initialProducts={products} />
    </>
  )
}
