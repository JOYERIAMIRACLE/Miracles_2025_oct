"use client"
import { ProductType } from "@/types/product"
import CarouselProducto from "./components/carrusel-producto"
import Infoproduct from "./components/info-product"

interface Props {
  product: ProductType
}

export default function ProductoClient({ product }: Props) {
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
