"use client"
import { useGetProductBySlug } from "@/api/getProductBySlug"
import { useParams } from "next/navigation"
import { ResponseType } from "@/types/response"
import SkeletonProduct from "./components/skeleton-product"

export default function page(){
    const params = useParams()
    console.log(params)
    const {productoSlug} = params
    console.log(productoSlug)

    const {result, loading, error}: ResponseType = useGetProductBySlug(productoSlug || "")   
    console.log(result) 
    
    if (result === null){
        return <SkeletonProduct />
    }
    
    return (
     
        <div className="max-w-6xl py-4 mx-auto sm:py-32 sm:px-24">
            <div className="grid sm:grid-col-2 ">
                <div>
                    <p>carousel</p>
                </div>

            </div>

        </div>
          
    )
}