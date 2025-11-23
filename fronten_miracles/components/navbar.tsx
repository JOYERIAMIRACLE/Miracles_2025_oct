"use client"
import { Heart, ShoppingCart, ShoppingCartIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import MenuList from "./menu-list";


const Navbar = () =>{
    const router = useRouter()
    return (
        <div className="flex  justify-between p-4 mx-10 cursor-pointer sm:max-w-4xl md:max-w-screen ">
            <h1 className="text-3xl " onClick={()=>router.push("/")}>
                <span className="font-bold ">Miracles</span>
            </h1>
            <div className="items-center justify-between hidden lg:flex">
                <p>Menu desk</p>
            </div>
            <div className="flex items-center lg:hidden">
                <MenuList/>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-7">
                <ShoppingCart strokeWidth={2} className="cursor-pointer" onClick={()=>router.push("/cart")}/>
                <Heart strokeWidth={2} className="cursor-pointer" onClick={()=>router.push("/like-products")}/>
                <User strokeWidth={2} className="cursor-pointer" onClick={()=>router.push("/Sesion")}/>
            </div>
            
        </div>
    );
}

export default Navbar;  


