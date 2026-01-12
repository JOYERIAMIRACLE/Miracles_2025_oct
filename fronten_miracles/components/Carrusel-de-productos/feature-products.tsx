"use client"

import { useGetFeaturedProducts } from "@/api/useGetFeaturedProducts"
import { ResponseType } from "@/types/response"
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel"
import SkeletonSchema from "./skeleton-schema"
import { ProductType } from "@/types/product"
import { Card, CardContent } from "../ui/card"
import { Expand, ShoppingCart } from "lucide-react"
import IconButton from "./icon-buttons"
import { useRouter } from "next/navigation"


const FeatureProducts = () => {
    const {loading,result,error}: ResponseType = useGetFeaturedProducts()
    const router = useRouter()
    console.log(result); 
    return (
        <div className="max-w-6xl py-4 mx-auto sm:py-16 sm:px-24 ">
            <h3 className="px-6 text-3xl sm:pb-8">Productos destacados</h3>
            <Carousel>
                <CarouselContent className="  ">
                    {loading && (
                        
                        <SkeletonSchema grid={3} />   
                    )}
                    {result !== null && (
                        result.map((product: ProductType) => {
                            const { id, imagenes, nombreProducto, tipoProducto, costo, slug } = product; 

                            return(
                                
                                <CarouselItem key={id} className="md:basis-1/2 lg:basis-1/3 group  ">
                                    <div className="p-1">
                                        <Card className="py-4 border border-gray-200 shadow-none">
                                            <CardContent className="relative flex items-center justify-center px-6 py-2">
                                                
                                                <img 
                                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${imagenes[0].url}`} 
                                                    alt="image feature" />
                                                <div className="absolute w-full px-6 transition duration-200 opacity-0 group-hover:opacity-100 bottom-5 ">
                                                    <div className="flex justify-center gap-x-6"> 
                                                        <IconButton 
                                                        onClick={() => router.push(`product/${slug}`)}
                                                        icon={<Expand size={20}/>}
                                                        className="text-gray-600"
                                                        />
                                                        <IconButton 
                                                        onClick={() => console.log("add item")}
                                                        icon={<ShoppingCart size={20}/>}
                                                        className="text-gray-600"
                                                        />
                                                        
                                                         
                                                    </div>
                                                </div> 
                                            </CardContent>
                                            <div className="flex justify-between gap-4 px-8 ">
                                                <h3>{nombreProducto}</h3>

                                            </div>
                                        </Card>
                                    </div>

                                </CarouselItem>
                            )

                        })

                    )}
                </CarouselContent>
            </Carousel>
        </div>
    )
}

export default FeatureProducts
