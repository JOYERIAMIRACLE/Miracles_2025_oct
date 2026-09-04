"use client"

import { useState } from "react"
import { ProductType, CATEGORIAS_JOYA, CategoriaJoya } from "@/types/product"
import { CAT_COLOR } from "@/components/Empresa/Almacen/InventarioEmpresaView"

// Mismo "menú" que Inventario: pastillas de categoría + búsqueda, para elegir
// una pieza real ya dada de alta (no solo autocompletar si ya sabes el nombre).
export function ProductoSearch({
  value, onChange, onSelect, productos,
}: {
  value:     string
  onChange:  (v: string) => void
  onSelect:  (p: ProductType) => void
  productos: ProductType[]
}) {
  const [open, setOpen]         = useState(false)
  const [filtroCat, setFiltroCat] = useState<CategoriaJoya | "todas">("todas")

  const filtered = productos.filter(p => {
    const matchSearch = !value ||
      p.nombreProducto.toLowerCase().includes(value.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(value.toLowerCase())
    const matchCat = filtroCat === "todas" || p.categoriaJoya === filtroCat
    return matchSearch && matchCat
  }).slice(0, 30)

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar o elegir por categoría…"
        className="px-2 py-1.5 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full"
      />
      {open && (
        <div className="absolute z-20 top-full left-0 w-80 mt-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-800">
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setFiltroCat("todas")}
              className={`h-6 px-2 rounded-full text-[10px] font-medium border transition-all ${filtroCat==="todas"?"bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600":"border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              Todas
            </button>
            {CATEGORIAS_JOYA.map(c => (
              <button key={c} type="button" onMouseDown={e => e.preventDefault()}
                onClick={() => setFiltroCat(prev => prev===c?"todas":c)}
                className={`h-6 px-2 rounded-full text-[10px] font-medium border transition-all ${filtroCat===c?`${CAT_COLOR[c]} shadow-sm`:"border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-[11px] text-slate-400 dark:text-slate-600 text-center">Sin productos para este filtro.</p>
            )}
            {filtered.map(p => (
              <button key={p.documentId} type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false); setFiltroCat("todas") }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition text-left gap-2 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-800 dark:text-slate-200 truncate">{p.nombreProducto}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.sku && <p className="text-[9px] text-slate-500 dark:text-slate-500 font-mono">{p.sku}</p>}
                    {p.categoriaJoya && (
                      <span className={`text-[9px] px-1.5 rounded border ${CAT_COLOR[p.categoriaJoya]}`}>{p.categoriaJoya}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {p.costo != null && (
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold block">
                      {p.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 dark:text-slate-600">stock {p.stock ?? 0}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
