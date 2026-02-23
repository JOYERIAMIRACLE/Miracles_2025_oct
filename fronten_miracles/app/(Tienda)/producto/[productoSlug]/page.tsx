"use client"
import { useGetProductBySlug } from "@/api/getProductBySlug"
import { useParams } from "next/navigation"
import { ResponseType } from "@/types/response"
import SkeletonProduct from "./components/skeleton-product"
import CarouselProducto from "./components/carrusel-producto"
import Infoproduct from "./components/info-product"

export default function page() {
    const params = useParams()
    console.log(params)
    const { productoSlug } = params
    console.log(productoSlug)

    const { result, loading, error }: ResponseType = useGetProductBySlug(productoSlug || "")
    console.log(result)

    if (result === null) {
        return <SkeletonProduct />
    }

    return (

        <div className="max-w-6xl py-4 mx-auto sm:py-32 sm:px-24 ">
            <div className="grid sm:grid-cols-2 ">
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