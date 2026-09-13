import type { Metadata } from "next"
import { Suspense } from "react"
import { ProductType } from "@/types/product"
import { CategoryType } from "@/types/category"
import AllCategoriesClient from "./AllCategoriesClient"

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const SITE_URL = "https://miracles-frontend.pages.dev"

async function fetchAllProducts(): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?populate=*&filters[activo][$eq]=true&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ProductType[]) ?? []
  } catch { return [] }
}

async function fetchCategorias(): Promise<CategoryType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/product-categories?populate=*&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as CategoryType[]) ?? []
  } catch { return [] }
}

export const metadata: Metadata = {
  title: "Catálogo completo | Medalla de Oro",
  description: "Todas las joyas de Medalla de Oro en un solo lugar — Oro 10k y Plata 925. Filtra por categoría, material, estilo o precio.",
  alternates: { canonical: `${SITE_URL}/category` },
  openGraph: {
    title: "Catálogo completo | Medalla de Oro",
    description: "Todas las joyas de Medalla de Oro en un solo lugar — Oro 10k y Plata 925.",
    url: `${SITE_URL}/category`,
    siteName: "Medalla de Oro",
    type: "website",
  },
}

export default async function Page() {
  const [products, categorias] = await Promise.all([
    fetchAllProducts(),
    fetchCategorias(),
  ])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Catálogo completo | Medalla de Oro",
    description: "Todas las joyas de Medalla de Oro en un solo lugar",
    url: `${SITE_URL}/category`,
    numberOfItems: products.length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <AllCategoriesClient initialProducts={products} categorias={categorias} />
      </Suspense>
    </>
  )
}
