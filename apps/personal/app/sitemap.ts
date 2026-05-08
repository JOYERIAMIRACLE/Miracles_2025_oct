import type { MetadataRoute } from "next"

export const dynamic = "force-static"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joyeriamiraclesweb.com"
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function fetchSlugs(endpoint: string, field: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/${endpoint}?fields[0]=${field}&pagination[pageSize]=200`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? [])
      .map((item: Record<string, string>) => item[field] ?? "")
      .filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs, blogSlugs] = await Promise.all([
    fetchSlugs("products", "slug"),
    fetchSlugs("product-categories", "slug"),
    fetchSlugs("blog-posts", "slug"),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map(slug => ({
    url: `${SITE}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map(slug => ({
    url: `${SITE}/producto/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  }))

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
    url: `${SITE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]
}
