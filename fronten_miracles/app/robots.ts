import type { MetadataRoute } from "next"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joyeriamiraclesweb.com"

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
