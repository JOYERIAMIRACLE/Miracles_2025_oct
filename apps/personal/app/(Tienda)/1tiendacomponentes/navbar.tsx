"use client"

import { BaggageClaim, Heart, ShoppingCart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import MenuList from "./menu-list";
import ItemsMenuMobile from "./items-mobile";
import ModeToggle from "./toggle";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavirites";
import Image from "next/image";

const Navbar = () => {
    const router   = useRouter()
    const pathname = usePathname()
    const cart     = useCart()
    const favorites = useFavorites()

    const isHero = pathname === "/"

    return (
        <div className={`flex justify-between items-center p-4 px-10 transition-all z-50 ${
            isHero
                ? "absolute inset-x-0 top-0 text-white"
                : "sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/40"
        }`}>

            {/* LOGO */}
            <div className="cursor-pointer shrink-0 select-none" onClick={() => router.push("/")}>
                {/* Hero (siempre logo oscuro sobre imagen) */}
                {isHero ? (
                    <Image
                        src="/logo oficial oficial.png"
                        alt="Medallita de Oro"
                        width={160}
                        height={52}
                        className="object-contain"
                        priority
                    />
                ) : (
                    <>
                        <Image
                            src="/logo medallita de oro fondo blanco.png"
                            alt="Medallita de Oro"
                            width={160}
                            height={52}
                            className="object-contain block dark:hidden"
                        />
                        <Image
                            src="/logo oficial oficial.png"
                            alt="Medallita de Oro"
                            width={160}
                            height={52}
                            className="object-contain hidden dark:block"
                        />
                    </>
                )}
            </div>

            {/* NAV DESKTOP */}
            <div className={`items-center justify-between hidden md:flex ${isHero ? "**:text-white **:hover:text-white/80" : ""}`}>
                <MenuList />
            </div>

            {/* NAV MOBILE */}
            <div className="flex items-center md:hidden">
                <ItemsMenuMobile />
            </div>

            {/* ICONOS */}
            <div className={`flex items-center gap-5 ${isHero ? "text-white" : ""}`}>
                {cart.items.length === 0
                    ? <ShoppingCart strokeWidth={1} className="cursor-pointer" onClick={() => router.push("/carrito")} />
                    : (
                        <div className="flex gap-1 cursor-pointer" onClick={() => router.push("/carrito")}>
                            <BaggageClaim strokeWidth={1} />
                            <span className="text-sm">{cart.items.length}</span>
                        </div>
                    )
                }

                {favorites.items.length === 0
                    ? <Heart strokeWidth={1} className="cursor-pointer" onClick={() => router.push("/productos-favoritos")} />
                    : (
                        <div className="flex gap-1 cursor-pointer" onClick={() => router.push("/productos-favoritos")}>
                            <Heart strokeWidth={1} />
                            <span className="text-sm">{favorites.items.length}</span>
                        </div>
                    )
                }

                <ModeToggle />
            </div>
        </div>
    );
}

export default Navbar;
