"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ProductType } from "@/types/product"
import CarouselProducto from "./components/carrusel-producto"
import Infoproduct from "./components/info-product"

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
    const slug = productoSlug ?? pathname.split("/").filter(Boolean).pop() ?? ""
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
    <div className="max-w-6xl py-4 mx-auto sm:py-32 sm:px-24">
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl bg-slate-800 animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-8 bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-6 bg-slate-800 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="max-w-6xl py-32 mx-auto text-center text-slate-400">
      <p className="text-2xl">Producto no encontrado</p>
    </div>
  )

  return (
    <div className="max-w-6xl py-4 mx-auto sm:py-32 sm:px-24">
      <div className="grid sm:grid-cols-2">
        <div>
          <CarouselProducto imagenes={product.imagenes || []} />
        </div>
        <div className="sm:px-12">
          <Infoproduct product={product} />
        </div>
      </div>
    </div>
  )
}
