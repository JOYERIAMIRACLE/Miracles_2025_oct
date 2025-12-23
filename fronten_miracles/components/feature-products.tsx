"use client"

import { useGetFeaturedProducts } from "@/api/useGetFeaturedProducts"
import { ResponseType } from "@/types/response"
import { Carousel, CarouselContent } from "./ui/carousel"

const FeatureProducts = () => {
    const {loading,result,error}: ResponseType = useGetFeaturedProducts()

    console.log(result);
    return (
        <div className="max-w-6xl py-4 mx-auto sm:py-16 sm:px-24 ">
            <h3 className="px-6 text-3xl sm:pb-8">Productos destacados</h3>
            <Carousel>
                <CarouselContent className=" ">
                    {loading && (
                        <p>loading...</p>
                    )}
                </CarouselContent>
            </Carousel>
        </div>
    )
}

export default FeatureProducts
