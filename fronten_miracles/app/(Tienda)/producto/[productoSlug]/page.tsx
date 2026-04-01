import ProductoClient from "./ProductoClient"

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?fields[0]=slug&pagination[pageSize]=100`
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data || []).map((p: { slug?: string; attributes?: { slug?: string } }) => ({
      productoSlug: p.slug ?? p.attributes?.slug ?? "",
    }))
  } catch {
    return []
  }
}

export default function Page() {
  return <ProductoClient />
}
