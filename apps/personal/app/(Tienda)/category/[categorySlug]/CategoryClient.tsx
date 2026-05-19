"use client"
import { Separator } from "@/components/ui/separator"
import FiltersControlsCategory from "./components/filters-controls-category"
import ProductCard1 from "./components/product-card1"
import { ProductType } from "@/types/product"
import { useState } from "react"

interface Props {
  products: ProductType[]
  categoryName: string
}

export default function CategoryClient({ products, categoryName }: Props) {
  const [filterMaterial, setFilterMaterial] = useState("")
  const [filterEstilo, setFilterEstilo] = useState("")

  const filteredProducts = products.filter((product) => {
    const matchesMaterial = filterMaterial === "" || product.materialProducto === filterMaterial
    const matchesEstilo = filterEstilo === "" || product.figura === filterEstilo
    return matchesMaterial && matchesEstilo
  })

  return (
    <main>
      <div className="relative w-full min-h-[300px] md:h-[420px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('/cmv1.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-24">
          <div className="flex flex-col gap-4">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest">Joyería Miracles</p>
            <h1 className="max-w-2xl text-white text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
              {categoryName}
            </h1>
            <p className="max-w-lg text-white/80 text-base md:text-lg">
              Piezas en Oro 10k y Plata 925 para cada ocasión.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl py-8 mx-auto sm:py-16 px-6 sm:px-24">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold italic text-gray-500">Catálogo de Productos</h2>
          <Separator />
        </div>
        <div className="sm:flex sm:justify-between mt-8 gap-10">
          <aside className="sm:w-[250px] shrink-0">
            <FiltersControlsCategory setFilterMaterial={setFilterMaterial} setFilterEstilo={setFilterEstilo} />
          </aside>
          <div className="flex-1">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard1 key={product.id} product={product} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-xl text-gray-400">No se encontraron productos en esta categoría.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
