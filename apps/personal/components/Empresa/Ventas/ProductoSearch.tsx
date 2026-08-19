"use client"

import { useState } from "react"
import { ProductType } from "@/types/product"

export function ProductoSearch({
  value, onChange, onSelect, productos,
}: {
  value:     string
  onChange:  (v: string) => void
  onSelect:  (p: ProductType) => void
  productos: ProductType[]
}) {
  const [open, setOpen] = useState(false)

  const filtered = value.length >= 1
    ? productos.filter(p =>
        p.nombreProducto.toLowerCase().includes(value.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Descripción o buscar inventario…"
        className="px-2 py-1.5 text-[11px] rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 w-full"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 w-72 mt-0.5 bg-slate-850 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          {filtered.map(p => (
            <button key={p.documentId} type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/80 transition text-left gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-200 truncate">{p.nombreProducto}</p>
                {p.sku && <p className="text-[9px] text-slate-500 font-mono">{p.sku}</p>}
              </div>
              {p.costo != null && (
                <span className="text-[10px] text-emerald-400 font-semibold shrink-0">
                  {p.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
