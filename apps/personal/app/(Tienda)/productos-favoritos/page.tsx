"use client"

import { FavoritosGrid } from "../1tiendacomponentes/favoritos-grid"

export default function Page() {
    return (
        <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
            <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Mis favoritos</h1>
            <FavoritosGrid />
        </div>
    )
}
