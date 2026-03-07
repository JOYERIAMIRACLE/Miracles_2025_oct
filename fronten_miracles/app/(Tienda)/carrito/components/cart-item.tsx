import { useCart } from "@/hooks/use-cart";
import { ProductType } from "@/types/product"
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/formatprice";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils"; // La ruta estándar en shadcn
interface CartItemProps {
    producto: ProductType 
}

const CartItem = (props: CartItemProps) => {

    const {producto} = props;
    const router = useRouter()
    const {removeItem} = useCart()
    return (

        <li className="flex py-6 px-4 mb-4 items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push(`/producto/${producto.slug}`)}>

            {/* Imagen con contenedor para mantener aspecto */}
            <div className="overflow-hidden rounded-lg bg-gray-50 dark:bg-zinc-900 flex-shrink-0">
                <img 
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${producto.imagenes[0].url}`}
                    alt={producto.nombreProducto} 
                    className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-300" 
                />
            </div>

            {/* Información del Producto */}
            <div className="flex-1 flex flex-col justify-between self-stretch"> 
                <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                        {producto.nombreProducto}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {producto.materialProducto}
                    </p>
                </div>
                
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                    {formatPrice(producto.costo)}
                </p>
            </div> 

            {/* Botón de eliminar con stopPropagation */}
            <div className="flex items-center justify-center">
                <Button 
                    variant="outline" // Si usas shadcn
                    className={cn("rounded-full h-10 w-10 p-0 flex items-center justify-center bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors")} 
                    onClick={(e) => {
                        e.stopPropagation(); // ¡IMPORTANTE! Evita que el click active el router.push del padre
                        removeItem(producto.id);
                    }}
                >
                    <X size={18} />
                </Button>
            </div> 
        </li>


    );
}

export default CartItem