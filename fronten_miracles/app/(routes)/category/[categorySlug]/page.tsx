"use client"

import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { useParams, useRouter } from "next/navigation"
import { ResponseType } from "@/types/response"
import { Separator } from "@/components/ui/separator"
import FiltersControlCategory from "./components/filters-controls-category"
import SkeletonSchema from "@/components/Carrusel-de-productos/skeleton-schema"
import ProductCard1 from "./components/product-card1"
import { ProductType } from "@/types/product"

export default function Page() {
    const params = useParams()
    const {categorySlug} = params
    console.log(categorySlug);
    const {result,loading, error}: ResponseType = useGetCategoryProduct(categorySlug || "" )
    const router = useRouter()

    console.log(result)

    return (
        <div className="max-w-6xl py-4 mx-auto sm:py-16 sm:px-24">
            {result !== null && !loading && (
                <h1 className="text-3xl font-medium">Categoria: {result[0].categoria.NombreCategoria}</h1>
                
            )}
            <Separator/>
            <div className="sm:flex sm:justify-between">
                <FiltersControlCategory/>
                <div className="grid gap-5 mt-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10 ">
                    {loading && (
                        <SkeletonSchema grid={3}/>
                    )}
                    {result !== null && !loading &&(
                        result.map((product:ProductType)=>(
                            <ProductCard1 key={product.id} product={product}/>
                        ))
                        
                    )}

                </div>
                
            </div>
        </div>
    )
}