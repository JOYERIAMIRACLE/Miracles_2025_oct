import CategoryClient from "./CategoryClient"

export const dynamicParams = false

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/product-categories?fields[0]=slug&pagination[pageSize]=100`,
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

export default function Page() {
  return <CategoryClient />
}
