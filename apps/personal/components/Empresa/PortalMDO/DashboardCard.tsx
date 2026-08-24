"use client"

import { useEffect, useState } from "react"
import { Users, MousePointerClick, ShoppingCart, Package } from "lucide-react"

// Datos de ejemplo — mismo criterio que el resto del portal (aún no
// conectado a analítica real de medallitadeoro).
const METRICAS = [
  { key: "usuarios", label: "Usuarios mensuales", sub: "Tráfico web", icon: Users,             value: "36K",  delta: "+23%", pct: 62, bars: [45, 78, 30, 55, 90, 20, 65, 40, 82, 35] },
  { key: "clics",     label: "Clics",              sub: "Este mes",   icon: MousePointerClick, value: "2M",   delta: "+18%", pct: 78, bars: [60, 40, 75, 50, 30, 85, 45, 65, 55, 70] },
  { key: "ventas",    label: "Ventas",             sub: "Este mes",   icon: ShoppingCart,       value: "$435", delta: "+9%",  pct: 45, bars: [30, 55, 40, 80, 60, 25, 70, 45, 90, 35] },
  { key: "piezas",    label: "Piezas",             sub: "Este mes",   icon: Package,            value: "43",   delta: "+5%",  pct: 30, bars: [50, 65, 35, 70, 45, 85, 30, 60, 40, 75] },
]
const CICLO_MS = 2500

export function DashboardCard() {
  const [idx, setIdx] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    const iv = setInterval(() => setIdx(i => (i + 1) % METRICAS.length), CICLO_MS)
    return () => clearInterval(iv)
  }, [pausado])

  function seleccionar(i: number) {
    if (pausado && idx === i) { setPausado(false); return }
    setIdx(i)
    setPausado(true)
  }

  const activa = METRICAS[idx]

  return (
    <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Dashboard</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">Datos de ejemplo</span>
          {!pausado && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-violet-500">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> En vivo
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          <span className="text-violet-500 font-semibold">({activa.delta})</span> {activa.label} · {activa.sub}
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
              <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${activo ? "bg-violet-500" : "bg-violet-500/40"}`} style={{ width: `${m.pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
