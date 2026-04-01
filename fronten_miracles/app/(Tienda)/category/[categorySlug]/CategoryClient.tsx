"use client"
import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { useParams } from "next/navigation"
import { ResponseType } from "@/types/response"
import { Separator } from "@/components/ui/separator"
import FiltersControlsCategory from "./components/filters-controls-category"
import SkeletonSchema from "@/app/(Tienda)/1tiendacomponentes/skeleton-schema"
import ProductCard1 from "./components/product-card1"
import { ProductType } from "@/types/product"
import { useState } from "react"

export default function CategoryClient() {
  const params = useParams()
  const { categorySlug } = params
  const { result, loading }: ResponseType = useGetCategoryProduct(categorySlug || "")

  const [filterMaterial, setFilterMaterial] = useState("")
  const [filterEstilo, setFilterEstilo] = useState("")

  const filteredProducts = result !== null && !loading ? result.filter((product: ProductType) => {
    const matchesMaterial = filterMaterial === '' || product.materialProducto === filterMaterial
    const matchesEstilo = filterEstilo === '' || product.estiloProducto === filterEstilo
    return matchesMaterial && matchesEstilo
  }) : null

  return (
    <main>
      <div className="relative w-full min-h-[400px] md:h-[600px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-[url('/cmv1.jpg')] bg-cover bg-center" />
        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-24">
          <div className="flex flex-col gap-6">
            <h1 className="max-w-2xl text-white text-4xl md:text-6xl font-extrabold leading-tight">
              {result !== null && !loading ? result[0].categoria.NombreCategoria : "Cargando..."}
            </h1>
            <p className="max-w-lg text-white/90 text-lg md:text-xl">
              Explora nuestra selección exclusiva de piezas diseñadas con precisión industrial y elegancia artesanal.
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
              {loading && <SkeletonSchema grid={3} />}
              {filteredProducts !== null && !loading && (
                filteredProducts.map((product: ProductType) => (
                  <ProductCard1 key={product.id} product={product} />
                ))
              )}
              {!loading && filteredProducts?.length === 0 && (
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
