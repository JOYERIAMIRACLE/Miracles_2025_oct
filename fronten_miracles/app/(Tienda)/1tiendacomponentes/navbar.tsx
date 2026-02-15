"use client"

// IMPORTACIONES
import { BaggageClaim, Heart, ShoppingCart, ShoppingCartIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import MenuList from "./menu-list";
import ItemsMenuMobile from "./items-mobile";
import ModeToggle from "./toggle";
import { useCart } from "@/hooks/use-cart";

// COMPONENTE BARRA DE NAVEGACION
const Navbar = () =>{

    // LOGICA DE AYUDA
    const router = useRouter()
    const cart = useCart()
    console.log(cart.items.length)

    // VISUALIZACION 
    return (

        // BARRA BASE DE COMPONENTE/FLEX/SEPARACION/MARGEN/PADING/CURSOR/RESPONSIVE-EXTENSIVO/
        <div className="flex  justify-between p-4 mx-10  sm:max-w-4xl md:max-w-screen ">

            {/* LOGO */}
            <h1 className="text-3xl cursor-pointer " onClick={()=>router.push("/")}>
                <span className="font-bold ">Miracles</span>
            </h1>

            {/* BOTONES DE NAVEGACION/APARECE EN PANTALLAS GRANDES */}
            <div className="items-center justify-between hidden md:flex">
                <MenuList />
            </div>

            {/* BOTON DE NAVEGACION EN MOBIL APARECE EN PANTALLAS PEQUEÑAS */}
            <div className="flex items-center md:hidden">
                <ItemsMenuMobile/>
            </div>

            {/* ICONOS DE NAVEGACION */}
            <div className="flex items-center justify-between gap-2 sm:gap-7">
                {cart.items.length === 0 ? 
                    <ShoppingCart strokeWidth={1} 
                        className="cursor-pointer"
                        onClick={()=>router.push("/carrito")}
                    />
                    : (
                        <div className="flex gap-1" onClick={()=> router.push("/carrito")}>
                            <BaggageClaim strokeWidth={1} className="cursor-pointer"/>
                            <span>{cart.items.length}</span>
                        </div>
                    
                )}
                

                <Heart strokeWidth={1} className="cursor-pointer" onClick={()=>router.push("/like-products")}/>
                <User strokeWidth={1} className="cursor-pointer" onClick={()=>router.push("/Sesion")}/>

                {/* BOTON DE TEMA DARK/LIGTH */}
                <ModeToggle/>
            </div>
            
        </div>
    );
}

export default Navbar;  


