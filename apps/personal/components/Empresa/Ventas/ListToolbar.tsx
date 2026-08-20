"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, BarChart3, Check } from "lucide-react"

export type FiltroOpcion<T extends string> = { value: T; label: string }
export type MetricaItem = { label: string; value: string | number; colorClass?: string }

// Toolbar estándar para las listas de Comercial (Leads, Cotizaciones, Pedidos,
// Clientes…): buscador + botón de filtros (popover) + botón de métricas
// (popover) — reemplaza la fila fija de tarjetas KPI + pastillas de filtro
// siempre visibles, para que la pantalla se sienta menos cargada.
export function ListToolbar<T extends string>({
  search, onSearchChange, searchPlaceholder = "Buscar…",
  filtros, filtroActivo, filtroDefault, onFiltroChange,
  metricas,
}: {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filtros: FiltroOpcion<T>[]
  filtroActivo: T
  filtroDefault: T
  onFiltroChange: (v: T) => void
  metricas?: MetricaItem[]
}) {
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [metricasOpen, setMetricasOpen] = useState(false)
  const filtroEsActivo = filtroActivo !== filtroDefault
  const labelActivo = filtros.find(f => f.value === filtroActivo)?.label

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input type="text" placeholder={searchPlaceholder}
          value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
      </div>

      {/* Filtros */}
      <div className="relative">
        <button type="button" onClick={() => { setFiltrosOpen(o => !o); setMetricasOpen(false) }}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-all ${
            filtroEsActivo
              ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
              : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}>
          <SlidersHorizontal size={14} />
          {filtroEsActivo ? labelActivo : "Filtros"}
        </button>
        {filtrosOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFiltrosOpen(false)} />
            <div className="absolute z-50 top-full right-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5">
              {filtros.map(f => (
                <button key={f.value} type="button"
                  onClick={() => { onFiltroChange(f.value); setFiltrosOpen(false) }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                    filtroActivo === f.value ? "bg-violet-500/15 text-violet-300" : "text-slate-300 hover:bg-slate-800"
                  }`}>
                  {f.label}
                  {filtroActivo === f.value && <Check size={13} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Métricas */}
      {metricas && metricas.length > 0 && (
        <div className="relative">
          <button type="button" onClick={() => { setMetricasOpen(o => !o); setFiltrosOpen(false) }}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-all ${
              metricasOpen
                ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}>
            <BarChart3 size={14} /> Métricas
          </button>
          {metricasOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMetricasOpen(false)} />
              <div className="absolute z-50 top-full right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 grid grid-cols-2 gap-2.5">
                {metricas.map(m => (
                  <div key={m.label} className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{m.label}</p>
                    <p className={`text-lg font-bold ${m.colorClass ?? "text-slate-200"}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
