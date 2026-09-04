"use client"

import Link from "next/link"
import { Heart, X } from "lucide-react"
import { useFavorites } from "@/hooks/useFavirites"
import { formatPrice } from "@/lib/formatprice"

export default function Page() {
    const { items, removeFavorite } = useFavorites()

    return (
        <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
            <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Mis favoritos</h1>

            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <Heart size={32} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-zinc-500 dark:text-zinc-400">Todavía no tienes productos en favoritos.</p>
                    <Link href="/tienda" className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                        Ver catálogo
                    </Link>
                </div>
            ) : (
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => (
                        <li key={item.id} className="group relative rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-950 overflow-hidden hover:shadow-md transition-shadow">
                            <button
                                onClick={() => removeFavorite(item.id)}
                                aria-label="Quitar de favoritos"
                                className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 shadow-sm transition-colors"
                            >
                                <X size={15} />
                            </button>
                            <Link href={`/producto/${item.slug}`} className="block">
                                <div className="aspect-square bg-gray-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                    {item.imagenes?.length > 0 ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${item.imagenes[0].url}`}
                                            alt={item.nombreProducto}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-4xl opacity-30">💍</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{item.nombreProducto}</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{formatPrice(item.costo)}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
