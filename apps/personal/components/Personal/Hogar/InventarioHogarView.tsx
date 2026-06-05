"use client"

import { Sofa } from "lucide-react"

export function InventarioHogarView() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
          <Sofa className="h-4 w-4 text-teal-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Inventario del Hogar</h1>
          <p className="text-xs text-slate-500">Muebles, electrodomésticos y bienes del hogar</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
        <Sofa size={32} className="text-slate-700" />
        <p className="text-sm text-slate-500">Módulo en construcción</p>
        <p className="text-xs text-slate-600 max-w-xs">
          Registra tus muebles, electrodomésticos y activos del hogar con su valor, estado y fecha de compra.
        </p>
      </div>
    </div>
  )
}
