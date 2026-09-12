"use client"

import { BaggageClaim, Heart, ShoppingCart, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import ItemsMenuMobile from "./items-mobile"
import ModeToggle from "./toggle"
import { useCart } from "@/hooks/useCart"
import { useFavorites } from "@/hooks/useFavirites"
import { useClienteAuth } from "@/hooks/useClienteAuth"

const CATEGORIAS_NAV = [
  { nombre: "Ver todo",  href: "/category" },
  { nombre: "Anillos",   href: "/category/anillos" },
  { nombre: "Cadenas",   href: "/category/cadenas" },
  { nombre: "Esclavas",  href: "/category/esclavas" },
  { nombre: "Aretes",    href: "/category/aretes" },
  { nombre: "Broqueles", href: "/category/broqueles" },
  { nombre: "Dijes",     href: "/category/dijes" },
  { nombre: "Pulsos",    href: "/category/pulsos" },
  { nombre: "Rosarios",  href: "/category/rosarios" },
  { nombre: "Argollas",  href: "/category/argollas" },
]

const Navbar = () => {
    const router      = useRouter()
    const pathname    = usePathname()
    const cart        = useCart()
    const favorites   = useFavorites()
    const { cliente } = useClienteAuth()

    const isHero = pathname === "/"

    return (
        <div className={`z-50 transition-all ${
            isHero
                ? "absolute inset-x-0 top-0 text-white"
                : "sticky top-0 bg-background/95 backdrop-blur-sm"
        }`}>

            {/* ── Fila principal ── */}
            <div className={`flex justify-between items-center px-6 md:px-10 py-3 ${
                !isHero ? "border-b border-border/40" : ""
            }`}>

                {/* Logo */}
                <div className="cursor-pointer shrink-0 select-none" onClick={() => router.push("/")}>
                    {isHero ? (
                        <Image src="/logo oficial oficial.png" alt="Medallita de Oro" width={150} height={48} className="object-contain" priority />
                    ) : (
                        <>
                            <Image src="/logo medallita de oro fondo blanco.png" alt="Medallita de Oro" width={150} height={48} className="object-contain block dark:hidden" />
                            <Image src="/logo oficial oficial.png" alt="Medallita de Oro" width={150} height={48} className="object-contain hidden dark:block" />
                        </>
                    )}
                </div>

                {/* Iconos + Blog/Nosotros + mobile hamburger */}
                <div className={`flex items-center gap-4 ${isHero ? "text-white" : ""}`}>

                    {/* Hamburger solo mobile */}
                    <div className="md:hidden">
                        <ItemsMenuMobile />
                    </div>

                    {/* Blog + Empresa — desktop, misma alineación que los iconos */}
                    <Link
                        href="/blog"
                        className={`hidden md:block text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                            isHero
                                ? "text-white/70 hover:text-white"
                                : "text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
                        }`}
                    >
                        Blog
                    </Link>
                    <Link
                        href="/nosotros"
                        className={`hidden md:block text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                            isHero
                                ? "text-white/70 hover:text-white"
                                : "text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
                        }`}
                    >
                        Empresa
                    </Link>

                    {/* Carrito */}
                    {cart.items.length === 0
                        ? <ShoppingCart size={20} strokeWidth={1.5} className="cursor-pointer" onClick={() => router.push("/carrito")} />
                        : (
                            <div className="flex gap-1 items-center cursor-pointer" onClick={() => router.push("/carrito")}>
                                <BaggageClaim size={20} strokeWidth={1.5} />
                                <span className="text-xs font-semibold">{cart.items.length}</span>
                            </div>
                        )
                    }

                    {/* Favoritos */}
                    {favorites.items.length === 0
                        ? <Heart size={20} strokeWidth={1.5} className="cursor-pointer" onClick={() => router.push("/productos-favoritos")} />
                        : (
                            <div className="flex gap-1 items-center cursor-pointer" onClick={() => router.push("/productos-favoritos")}>
                                <Heart size={20} strokeWidth={1.5} />
                                <span className="text-xs font-semibold">{favorites.items.length}</span>
                            </div>
                        )
                    }

                    {/* Usuario */}
                    <User size={20} strokeWidth={1.5} className="cursor-pointer"
                        onClick={() => router.push(cliente ? "/cuenta" : "/cuenta/login")}
                        aria-label={cliente ? "Mi cuenta" : "Iniciar sesión"} />

                    <ModeToggle />
                </div>
            </div>

            {/* ── Strip de categorías (Kuroda style) ── */}
            <div className={`border-b ${isHero ? "border-white/10" : "border-border/30"}`}>
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex items-center px-4 md:px-10 min-w-max">
                        {CATEGORIAS_NAV.map((cat) => {
                            const isActive = pathname === cat.href

                            return (
                                <Link
                                    key={cat.href}
                                    href={cat.href}
                                    className={`relative px-3.5 py-2.5 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
                                        isActive
                                            ? isHero
                                                ? "text-amber-300"
                                                : "text-amber-600 dark:text-amber-400"
                                            : isHero
                                                ? "text-white/55 hover:text-white"
                                                : "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                                    }`}
                                >
                                    {cat.nombre}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-amber-500 rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
