"use client"

import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { useParams, useRouter } from "next/navigation"
import { ResponseType } from "@/types/response"
import { Separator } from "@/components/ui/separator"
import FiltersControlsCategory from "./components/filters-controls-category"
import SkeletonSchema from "@/app/components/Home/Carrusel-de-productos/skeleton-schema"
import ProductCard1 from "./components/product-card1"
import { ProductType } from "@/types/product"
import { useState } from "react"

export default function Page() {
    const params = useParams()
    const {categorySlug} = params

    // TRAJO EL SLUG CON PARAMS | TRAJO EL SLUG DEL URL 
    console.log(categorySlug);
   
    const {result,loading, error}: ResponseType = useGetCategoryProduct(categorySlug || "" )
    // TRAJO EL LOS PRODUCTOS DEL SLUG | PRODUCTOS SON DE LA CATEGORIA 
    console.log(result)

    //ESTADO PARA FILTRAR POR MATERIAL | TRAJO LOS PRODUCTOS DEL SLUG CON FILTRO DE MATERIAL | PRODUCTOS SON DE LA CATEGORIA Y ES DEL MATERIAL:
    const [filterMaterial, setFilterMaterial] = useState("")
    const [filterEstilo, setFilterEstilo] = useState("")
    // const [filterAll, setFilterAll] = useState("")
    const router = useRouter()
    console.log(filterMaterial);
    console.log(filterEstilo)




    // TRAE EL ESTADO DEL FILTRO Y LO APLICA A EL RESULTADO FINAL 
    //  const filteredProducts = result !== null &&!loading && (
    //     filterMaterial === '' ? result : result.filter((product: ProductType)=> product.materialProducto === filterMaterial)
    // )
    // console.log(filteredProducts)
    
    // 2. Aplicamos la lógica multi-filtro
    const filteredProducts = result !== null && !loading ? result.filter((product: ProductType) => {
        // Condición para Material
        const matchesMaterial = filterMaterial === '' || product.materialProducto === filterMaterial;
        
        // Condición para Origen (Asegúrate que 'origen' exista en tu ProductType)
        const matchesEstilo = filterEstilo === '' || product.estiloProducto === filterEstilo;

        // Condición para Marca
        // const matchesMarca = filterMarca === '' || product.marca === filterMarca;

        // El producto solo pasa si cumple TODAS las condiciones
        return matchesMaterial && matchesEstilo;
    }) : null;
    
    
    
return (
        <main>
            {/* 1. BANNER RESPONSIVO (Fuera del contenedor limitado para que sea ancho total) */}
            <div className="relative w-full min-h-[400px] md:h-[600px] flex items-center overflow-hidden bg-slate-900 ">
                {/* Capa de fondo / Overlay */}
                <div className="absolute inset-0 bg-black/50 z-10" />
                
                {/* Imagen de fondo (Aquí pondrías la URL de tu imagen de joyería) */}
                <div className="absolute inset-0 bg-[url('/cmv1.jpg')] bg-cover bg-center " />

                {/* Contenido del Banner */}
                <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-24">
                    <div className="flex flex-col gap-6">
                        <h1 className="max-w-2xl text-white text-4xl md:text-6xl font-extrabold leading-tight">
                            {result !== null && !loading ? result[0].categoria.NombreCategoria : "Cargando..."}
                        </h1>
                        <p className="max-w-lg text-white/90 text-lg md:text-xl">
                            Explora nuestra selección exclusiva de piezas diseñadas con precisión industrial y elegancia artesanal.
                        </p>
                        <div className="w-full sm:w-72 h-14 bg-zinc-100 hover:bg-blue-600 transition-colors rounded-full flex items-center justify-center text-black font-bold cursor-pointer ">
                            Ver Novedades
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CUERPO DE LA PÁGINA (Contenedor limitado) */}
            <div className="max-w-6xl py-8 mx-auto sm:py-16 px-6 sm:px-24">
                <div className="flex flex-col gap-4">
                    <h2 className="text-2xl font-semibold italic text-gray-500">
                        Catálogo de Productos
                    </h2>
                    <Separator />
                </div>

                <div className="sm:flex sm:justify-between mt-8 gap-10">
                    {/* Panel de Control (Filtros) */}
                    <aside className="sm:w-[250px] shrink-0">
                        <FiltersControlsCategory 
                            setFilterMaterial={setFilterMaterial} 
                            setFilterEstilo={setFilterEstilo} 
                            // setFilterAll={setFilterAll}
                        />
                    </aside>

                    {/* HMI / Display de Productos */}
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