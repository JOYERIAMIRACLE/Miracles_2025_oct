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

        <li className="flex py-6 border-b">


            <div onClick={()=> router.push(`/producto/${producto.slug}`)}>
                <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${producto.imagenes[0].url}`}
                 alt={producto.nombreProducto} 
                 className="w-24 h-24 rounded-md object-cover" />


            </div>


            <div className="ml-4 flex-1 flex flex-col"> 

                <div>
                    <h2 className="text-lg font-semibold">{producto.nombreProducto}</h2>
                    <p className="text-sm text-gray-500">{producto.materialProducto}</p>
                    <p className="text-sm font-bold mt-1">{formatPrice(producto.costo)}</p>

                </div>
                
            </div>  
            <div>
                    <Button className={cn("rounded-full flex items-center justify-center dark:bg-white  border shadow-md p-2 hover:scale-110 transition duration-150")} onClick={() => removeItem(producto.id)}>
                        <X size={16} onClick={()=> console.log("vdwa")}/>
                    </Button>
                </div>            
                

        </li>



    );
}

export default CartItem