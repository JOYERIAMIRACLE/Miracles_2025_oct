import type { Metadata } from "next"
import { ProductType } from "@/types/product"
import ProductoClient from "./ProductoClient"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function fetchProduct(slug: string): Promise<ProductType | null> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?filters[slug][$eq]=${slug}&populate=*`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const json = await res.json()
    return (json.data?.[0] as ProductType) ?? null
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?fields[0]=slug&filters[activo][$eq]=true&pagination[pageSize]=100`,
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

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productoSlug: string }>
}): Promise<Metadata> {
  const { productoSlug } = await params
  const product = await fetchProduct(productoSlug)

  if (!product) return { title: "Producto no encontrado" }

  const nombre = `${product.nombreProducto} ${product.categoria?.NombreCategoria ?? ""}`.trim()

  const detalles = [
    product.materialProducto,
    product.talla ? `Talla ${product.talla}` : null,
    product.figura,
  ].filter(Boolean).join(", ")

  const descripcion = product.descripcion
    ? product.descripcion.slice(0, 160)
    : `${nombre}${detalles ? ` · ${detalles}` : ""} · Joyería Miracles. Envíos a todo México.`

  const imagen = product.imagenes?.[0]
  const imageUrl = imagen?.url
    ? imagen.url.startsWith("http") ? imagen.url : `${BACKEND}${imagen.url}`
    : undefined

  const siteUrl = "https://miracles-frontend.pages.dev"

  return {
    title: `${nombre} | Joyería Miracles`,
    description: descripcion,
    alternates: { canonical: `${siteUrl}/producto/${product.slug}` },
    openGraph: {
      title: `${nombre} | Joyería Miracles`,
      description: descripcion,
      url: `${siteUrl}/producto/${product.slug}`,
      siteName: "Joyería Miracles",
      type: "website",
      ...(imageUrl && { images: [{ url: imageUrl, width: 800, height: 800, alt: nombre }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${nombre} | Joyería Miracles`,
      description: descripcion,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ productoSlug: string }>
}) {
  const { productoSlug } = await params
  const product = await fetchProduct(productoSlug)

  // Si el fetch del build falló (timeout de Strapi), ProductoClient lo carga client-side
  if (!product) return <ProductoClient productoSlug={productoSlug} />

  const nombre = `${product.nombreProducto} ${product.categoria?.NombreCategoria ?? ""}`.trim()
  const imagen = product.imagenes?.[0]
  const imageUrl = imagen?.url
    ? imagen.url.startsWith("http") ? imagen.url : `${BACKEND}${imagen.url}`
    : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nombre,
    description: product.descripcion ?? "",
    sku: product.sku ?? product.documentId,
    ...(imageUrl && { image: [imageUrl] }),
    brand: { "@type": "Brand", name: "Joyería Miracles" },
    material: product.materialProducto ?? undefined,
    offers: {
      "@type": "Offer",
      url: `https://miracles-frontend.pages.dev/producto/${product.slug}`,
      priceCurrency: "MXN",
      price: product.costo ?? 0,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Joyería Miracles" },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductoClient product={product} productoSlug={productoSlug} />
    </>
  )
}
