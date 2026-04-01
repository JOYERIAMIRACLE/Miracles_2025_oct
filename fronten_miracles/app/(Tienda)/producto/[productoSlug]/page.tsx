"use client"
export const dynamic = 'force-static'
import { useGetProductBySlug } from "@/api/getProductBySlug"
import { useParams } from "next/navigation"
import { ResponseType } from "@/types/response"
import SkeletonProduct from "./components/skeleton-product"
import CarouselProducto from "./components/carrusel-producto"
import Infoproduct from "./components/info-product"

export default function Page() {
  const params = useParams()
  const { productoSlug } = params
  const { result, loading, error }: ResponseType = useGetProductBySlug(productoSlug || "")

  // LOGS SOLO EN DESARROLLO — siempre antes de los returns
  if (process.env.NODE_ENV === "development") {
    console.log("params:", params)
    console.log("productoSlug:", productoSlug)
    console.log("result:", result)
  }

  // MANEJO DE ESTADOS — en orden: loading → error → sin datos
  if (loading) return <SkeletonProduct />
  if (error) return <p>Error al cargar el producto</p>
  if (!result) return <SkeletonProduct />

  return (
    <div className="max-w-6xl py-4 mx-auto sm:py-32 sm:px-24">
      <div className="grid sm:grid-cols-2">
        <div>
          <CarouselProducto imagenes={result[0]?.imagenes || []} />
        </div>
        <div className="sm:px-12">
          <Infoproduct product={result[0]} />
        </div>
      </div>
    </div>
  )
}