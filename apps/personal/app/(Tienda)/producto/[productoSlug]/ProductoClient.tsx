"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ProductType } from "@/types/product"
import CarouselProducto from "./components/carrusel-producto"
import Infoproduct from "./components/info-product"
import Container from "../../1tiendacomponentes/container"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

interface Props {
  product?: ProductType | null
  productoSlug?: string
}

export default function ProductoClient({ product: initialProduct, productoSlug }: Props) {
  const pathname = usePathname()
  const [product, setProduct] = useState<ProductType | null>(initialProduct ?? null)
  const [loading, setLoading] = useState(!initialProduct)

  useEffect(() => {
    if (initialProduct) return
    const slugFromPath = pathname.split("/").filter(Boolean).pop() ?? ""
    const slug = (productoSlug && productoSlug !== "loading") ? productoSlug : slugFromPath
    if (!slug || slug === "loading") return
    ;(async () => {
      try {
        const res = await fetch(`${BASE}/api/products?filters[slug][$eq]=${slug}&populate=*`)
        const json = await res.json()
        setProduct((json.data?.[0] as ProductType) ?? null)
      } finally { setLoading(false) }
    })()
  }, [initialProduct, productoSlug, pathname])

  if (loading) return (
    <Container className="py-4 sm:py-32">
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl bg-slate-800 animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-8 bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-6 bg-slate-800 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </Container>
  )

  if (!product) return (
    <Container className="py-32 text-center text-slate-400">
      <p className="text-2xl">Producto no encontrado</p>
    </Container>
  )

  return (
    <Container className="py-4 sm:py-32">
      <div className="grid sm:grid-cols-2">
        <div>
          <CarouselProducto imagenes={product.imagenes || []} productName={product.nombreProducto} />
        </div>
        <div className="sm:px-12">
          <Infoproduct product={product} />
        </div>
      </div>
    </Container>
  )
}
