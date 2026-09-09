"use client"
import { FavoritosGrid } from "../../../1tiendacomponentes/favoritos-grid"

export default function FavoritosCuentaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis favoritos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Las piezas que has guardado para después.</p>
      </div>
      <FavoritosGrid />
    </div>
  )
}
