"use client"

import { useFavorites } from "@/hooks/useFavirites"

export default function Page() {

    const {items, removeFavorite} = useFavorites() 
      return (
              <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 dark:bg-zinc-900">
                  <h1 className="mb-4 text-3xl font-bold">carrito de compra</h1>
                  <div className=" grid sm:grid-cols-1 sm:gap-5">
                      <div className="p-6 rounded-lg bg-slate-100 dark:text-black">
                          {items.length === 0 && (
                              <p>No hay productos en favoritos</p>
                          )}
                          <ul>
                              {items.map((item) => (
                                  <li key={item.id} className="flex items-center justify-between p-4 mb-4 bg-white rounded-lg shadow">
                                      <span>{item.nombreProducto}</span>
                                      <button onClick={() => removeFavorite(item.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
      )
}
