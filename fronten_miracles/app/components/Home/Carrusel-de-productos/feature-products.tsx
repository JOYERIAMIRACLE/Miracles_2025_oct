"use client"

import { useGetFeaturedProducts } from "@/api/useGetFeaturedProducts"
import { ResponseType } from "@/types/response"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../../../components/ui/carousel"
import SkeletonSchema from "./skeleton-schema"
import { ProductType } from "@/types/product"
import { Card, CardContent } from "../../../../components/ui/card"
import { Expand, ShoppingCart } from "lucide-react"
import IconButton from "./icon-buttons"
import { useRouter } from "next/navigation"


// COMPONENTE PRESENTADOR DE PRODUCTOS 
const FeatureProducts = () => {


    const {loading,result,error}: ResponseType = useGetFeaturedProducts()
    const router = useRouter()
    // TRAJO LOS PORIDUCTOS Y SU INFO 
    console.log(result); 
    
    
    
    
    return (
        <div className="max-w-6xl py-4 mx-auto sm:py-16 sm:px-24 ">
            <h3 className="px-6 text-3xl sm:pb-8">Productos destacados</h3>
            <Carousel>

                {/* LOADING DE ESTADI */}
                <CarouselContent className="  ">
                    {loading && (
                        
                        // ENVIA EL PROP DEL GRID
                        <SkeletonSchema grid={3} />   
                    )}

                    {/* TRAJO LA INFO DE PRODUCTOS */}
                    {result !== null && (
                        result.map((producto: ProductType) => {

                            // APODA LA INFORMACION * NO NECESARIO SI QIERES LIMPIAR DATOS
                            const { id, imagenes, nombreProducto, materialProducto, costo, slug } = producto; 

                            return(
                                // responsive grid 1/3
                                <CarouselItem key={id} className="md:basis-1/2 lg:basis-1/3 group  ">
                                    <div className="p-1">
                                        <Card className="py-4 border border-gray-200 shadow-none">
                                            <CardContent className="relative flex items-center justify-center px-6 py-2">
                                                
                                                <img 
                                                    // TRAJO LA URL DE IMAGEN PROTEGIDA POR ENV 
                                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${imagenes[0].url}`} 
                                                    alt="image feature" />
                                                <div className="absolute w-full px-6 transition duration-200 opacity-0 group-hover:opacity-100 bottom-5 ">
                                                    <div className="flex justify-center gap-x-6"> 
                                                        <IconButton 
                                                        onClick={() => router.push(`producto/${slug}`)}
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
                                                <h3 className="text-lg font-bold ">{nombreProducto}</h3>
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="px-2 py-1 text-white bg-black rounded-full dark:bg-white dark:text-black w-fit">{materialProducto}</p>
                                                    <p className="px-2 py-1 text-white bg-yellow-900 rounded-full  w-fit">{costo}</p>
                                                </div>

                                            </div>
                                        </Card>
                                    </div>

                                </CarouselItem>
                            )

                        })

                    )}
                </CarouselContent>
                <CarouselPrevious/>
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    )
}

export default FeatureProducts
