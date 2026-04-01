import CategoryClient from "./CategoryClient"

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/product-categories?fields[0]=slug&pagination[pageSize]=100`
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data || []).map((c: { slug?: string; attributes?: { slug?: string } }) => ({
      categorySlug: c.slug ?? c.attributes?.slug ?? "",
    }))
  } catch {
    return []
  }
}

export default function Page() {
  return <CategoryClient />
}
