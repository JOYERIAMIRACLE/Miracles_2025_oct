"use client"

import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { useParams, useRouter } from "next/navigation"
import { ResponseType } from "@/types/response"
import { Separator } from "@/components/ui/separator"
import FiltersControlsCategory from "./components/filters-controls-category"
import SkeletonSchema from "@/components/Carrusel-de-productos/skeleton-schema"
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
        <div className="max-w-6xl py-4 mx-auto sm:py-16 sm:px-24">
            {result !== null && !loading && (
                <h1 className="text-3xl font-medium">Categoria: {result[0].categoria.NombreCategoria}</h1>
                
            )}
            <Separator/>
            <div className="sm:flex sm:justify-between">
                <FiltersControlsCategory setFilterMaterial={setFilterMaterial} setFilterEstilo={setFilterEstilo}/>
                
                <div className="grid gap-5 mt-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10 ">
                    {loading && (
                        <SkeletonSchema grid={3}/>
                    )}
                    {filteredProducts !== null && !loading &&(
                        filteredProducts.map((product:ProductType)=>(
                            <ProductCard1 key={product.id} product={product}/>
                        ))
                        
                    )}
                    {filteredProducts !== null && !loading && filteredProducts.length === 0 && (
                        <p>no hay productos </p>
                    )}

                </div>
                
            </div>
        </div>
    )
}