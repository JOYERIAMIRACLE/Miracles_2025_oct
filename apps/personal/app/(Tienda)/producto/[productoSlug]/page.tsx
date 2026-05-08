import { notFound } from "next/navigation"
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
      `${BACKEND}/api/products?fields[0]=slug&pagination[pageSize]=100`,
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
  const descripcion = product.descripcion
    ? product.descripcion.slice(0, 160)
    : `${product.nombreProducto} de ${product.materialProducto} en Joyería Miracles. Envíos a todo México.`

  const imagen = product.imagenes?.[0]
  const imageUrl = imagen?.url
    ? imagen.url.startsWith("http") ? imagen.url : `${BACKEND}${imagen.url}`
    : undefined

  return {
    title: nombre,
    description: descripcion,
    openGraph: {
      title: `${nombre} | Joyería Miracles`,
      description: descripcion,
      ...(imageUrl && { images: [{ url: imageUrl, alt: nombre }] }),
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

  if (!product) return notFound()

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
    sku: product.documentId,
    ...(imageUrl && { image: imageUrl }),
    brand: { "@type": "Brand", name: "Joyería Miracles" },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: product.costo,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Joyería Miracles" },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductoClient product={product} />
    </>
  )
}
