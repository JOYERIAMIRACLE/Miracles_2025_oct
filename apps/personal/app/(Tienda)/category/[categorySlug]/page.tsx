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

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BACKEND}/api/product-categories?fields[0]=slug&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return [{ categorySlug: "loading" }]
    const json = await res.json()
    const params = (json.data || []).map((c: { slug?: string; attributes?: { slug?: string } }) => ({
      categorySlug: c.slug ?? c.attributes?.slug ?? "",
    }))
    return params.length > 0 ? params : [{ categorySlug: "loading" }]
  } catch {
    return [{ categorySlug: "loading" }]
  }
}

export const dynamicParams = false

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
      <CategoryClient products={products} categoryName={categoryName} />
    </>
  )
}
