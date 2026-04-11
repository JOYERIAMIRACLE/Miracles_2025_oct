import ProductoClient from "./ProductoClient"

export const dynamicParams = false

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?fields[0]=slug&pagination[pageSize]=100`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return [{ productoSlug: "loading" }]
    const json = await res.json()
    const params = (json.data || []).map((p: { slug?: string; attributes?: { slug?: string } }) => ({
      productoSlug: p.slug ?? p.attributes?.slug ?? "",
    }))
    return params.length > 0 ? params : [{ productoSlug: "loading" }]
  } catch {
    return [{ productoSlug: "loading" }]
  }
}

export default function Page() {
  return <ProductoClient />
}
