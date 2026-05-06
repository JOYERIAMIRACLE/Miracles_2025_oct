import type { Metadata } from "next"
import { ProductType } from "@/types/product"
import CategoryClient from "./CategoryClient"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function fetchCategoryProducts(slug: string): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?populate=*&filters[categoria][slug][$eq]=${slug}&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ProductType[]) ?? []
  } catch {
    return []
  }
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
  const products = await fetchCategoryProducts(categorySlug)
  const categoryName =
    products[0]?.categoria?.NombreCategoria ??
    categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const descripcion = `Explora nuestra colección exclusiva de ${categoryName} en Joyería Miracles. Oro 14k y Plata 925. Envíos a todo México.`

  return {
    title: categoryName,
    description: descripcion,
    openGraph: {
      title: `${categoryName} | Joyería Miracles`,
      description: descripcion,
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params
  const products = await fetchCategoryProducts(categorySlug)
  const categoryName =
    products[0]?.categoria?.NombreCategoria ??
    categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} | Joyería Miracles`,
    description: `Colección de ${categoryName} en Joyería Miracles`,
    numberOfItems: products.length,
    hasPart: products.slice(0, 10).map(p => ({
      "@type": "Product",
      name: p.nombreProducto,
      url: `/producto/${p.slug}`,
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
