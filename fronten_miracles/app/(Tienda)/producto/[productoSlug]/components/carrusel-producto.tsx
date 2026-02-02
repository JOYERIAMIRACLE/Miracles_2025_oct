interface CarouselProductoProps {
    imagenes: {
        id: number;
        url: string;
        alternativeText: string | null;
    }[]
}


const CarouselProducto = (props: CarouselProductoProps) => {
    const { imagenes } = props;
    console.log(imagenes)
        return (
            <div className="w-full">
                {/* Aquí mapearías tus imágenes */}
                {imagenes?.map((img) => (
                    <img 
                        key={img.id} 
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`} 
                        alt={img.alternativeText || "Imagen de producto"}
                        className="rounded-lg"
                    />
                ))}
                {imagenes?.length === 0 && <p>No hay imágenes disponibles</p>}
            </div>    
            )
        }
export default CarouselProducto