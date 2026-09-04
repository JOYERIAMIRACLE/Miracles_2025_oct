import type { MetadataRoute } from "next"

export const dynamic = "force-static"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miracles-frontend.pages.dev"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/gestion-personal/", "/gestion-empresa/", "/carrito", "/productos-favoritos"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
