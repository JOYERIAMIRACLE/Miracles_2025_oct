import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// interface CarouselProductoProps {
//     imagenes: {
//         id: number;
//         url: string;
//         alternativeText: string | null;
//     }[]
// }

import { ImageType } from "@/types/product"

interface CarouselProductoProps {
  imagenes: ImageType[]
}

const CarouselProducto = (props: CarouselProductoProps) => {
    
    const { imagenes } = props;
    console.log(imagenes)


        return (
            <div className="w-full sm:px-16">

                <Carousel>
                    <CarouselContent>
                        {imagenes.map((imagen)=>(
                            <CarouselItem key={imagen.id}>
                                <img
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${imagen.url}`}
                                    alt="imagen producto"
                                    className="rounded-lg"
                                />

                            </CarouselItem>  
                        ))}

                    </CarouselContent>
                <CarouselPrevious/>
                <CarouselNext/>
                </Carousel>
                









                {/* Aquí mapearías tus imágenes */}
                {/* {imagenes?.map((img) => (
                    <img 
                        key={img.id} 
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`} 
                        alt={img.alternativeText || "Imagen de producto"}
                        className="rounded-lg"
                    />
                ))}
                {imagenes?.length === 0 && <p>No hay imágenes disponibles</p>} */}





            </div>    
            )
        }
export default CarouselProducto