"use client"

import { useEffect, useState } from "react"
import { Users, FileText, ShoppingCart, Package } from "lucide-react"
import { useGetLeads } from "@/api/lead/getLead"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { USE_DEMO, DEMO_DATA } from "./SeccionVentas"

const CICLO_MS = 2500
const $m = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

function contarPorMes(fechas: (string | null | undefined)[]): number[] {
  const porMes: Record<string, number> = {}
  fechas.forEach(f => {
    if (!f) return
    const mes = f.slice(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + 1
  })
  return normalizarBarras(Object.keys(porMes).sort().map(m => porMes[m]))
}

function sumarPorMes(items: { fecha: string | null | undefined; monto: number }[]): number[] {
  const porMes: Record<string, number> = {}
  items.forEach(({ fecha, monto }) => {
    if (!fecha) return
    const mes = fecha.slice(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + monto
  })
  return normalizarBarras(Object.keys(porMes).sort().map(m => porMes[m]))
}

function normalizarBarras(valores: number[]): number[] {
  if (valores.length === 0) return []
  const max = Math.max(...valores, 1)
  return valores.map(v => Math.round((v / max) * 88) + 12)
}

/**
 * Resumen de Ventas — mismos datos que SeccionVentas.tsx (real o demo,
 * según USE_DEMO), condensados en 4 métricas para el Inicio.
 */
export function DashboardCard() {
  const { leads: leadsReal }              = useGetLeads()
  const { cotizaciones: cotsReal }        = useGetAllCotizaciones()
  const { ventas: ventasReal }            = useGetVentas()

  const leads  = USE_DEMO ? DEMO_DATA.leads  : leadsReal
  const cots   = USE_DEMO ? DEMO_DATA.cots   : cotsReal
  const ventas = USE_DEMO ? DEMO_DATA.ventas : ventasReal

  const entregados = ventas.filter(v => v.estado === "Entregado")
  const ingresos = entregados.reduce((s, v) => s + v.monto, 0)

  const METRICAS = [
    { key: "leads",  label: "Leads",        sub: "Total capturados", icon: Users,        value: `${leads.length}`,
      bars: contarPorMes(leads.map(l => l.fechaLead ?? l.createdAt)) },
    { key: "cots",   label: "Cotizaciones", sub: "Total generadas",  icon: FileText,     value: `${cots.length}`,
      bars: contarPorMes(cots.map(c => c.fecha ?? c.createdAt)) },
    { key: "ventas", label: "Pedidos",      sub: "Total registrados", icon: ShoppingCart, value: `${ventas.length}`,
      bars: contarPorMes(ventas.map(v => v.fecha ?? v.createdAt)) },
    { key: "ing",    label: "Ingresos",     sub: "Pedidos entregados", icon: Package,     value: $m(ingresos),
      bars: sumarPorMes(entregados.map(v => ({ fecha: v.fecha ?? v.createdAt, monto: v.monto }))) },
  ]

  const [idx, setIdx] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    const iv = setInterval(() => setIdx(i => (i + 1) % METRICAS.length), CICLO_MS)
    return () => clearInterval(iv)
  }, [pausado]) // eslint-disable-line react-hooks/exhaustive-deps

  function seleccionar(i: number) {
    if (pausado && idx === i) { setPausado(false); return }
    setIdx(i)
    setPausado(true)
  }

  const activa = METRICAS[idx]

  return (
    <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2a1b3d] shadow-sm p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Dashboard</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">
            {USE_DEMO ? "Datos de ejemplo" : "Resumen del panel"}
          </span>
          {!pausado && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-violet-500">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> En vivo
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {activa.label} · {activa.sub}
        </p>
      </div>

      <div className="relative rounded-xl p-5 h-40 flex items-end justify-between gap-1.5 bg-gradient-to-br from-violet-950 via-slate-900 to-black overflow-hidden">
        <span className="absolute top-3 left-4 text-[10px] font-semibold text-white/50 uppercase tracking-wider">{activa.label}</span>
        {activa.bars.map((hgt, i) => (
          <div key={i} className="w-2 sm:w-2.5 rounded-t-full bg-white/90 transition-all duration-500 ease-out" style={{ height: `${hgt}%` }} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {METRICAS.map((m, i) => {
          const activo = i === idx
          return (
            <button key={m.key} type="button" onClick={() => seleccionar(i)} className="text-left">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 transition-all ${
                activo ? "bg-violet-500 text-white scale-110 shadow-md shadow-violet-500/30" : "bg-violet-500/15 text-violet-500"
              }`}>
                <m.icon size={16} />
              </div>
              <p className={`text-lg font-bold transition-colors ${activo ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-slate-100"}`}>{m.value}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">{m.label}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
