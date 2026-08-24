"use client"

import { Users, MousePointerClick, ShoppingCart, Package } from "lucide-react"

// Datos de ejemplo — mismo criterio que el resto del Dashboard (aún no
// conectado a analítica real de medallitadeoro).
const BARS = [45, 78, 30, 55, 90, 20, 65, 40, 82, 35]

const STATS = [
  { icon: Users,             label: "Usuarios", value: "36K",  pct: 62 },
  { icon: MousePointerClick, label: "Clics",     value: "2M",   pct: 78 },
  { icon: ShoppingCart,      label: "Ventas",    value: "$435", pct: 45 },
  { icon: Package,           label: "Piezas",    value: "43",   pct: 30 },
]

export function ActiveUsersCard() {
  return (
    <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-5">
      <div className="rounded-xl p-5 h-40 flex items-end gap-1.5 bg-gradient-to-br from-violet-950 via-slate-900 to-black">
        {BARS.map((h, i) => (
          <div key={i} className="flex-1 rounded-full bg-white/90" style={{ height: `${h}%` }} />
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Usuarios activos</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">Datos de ejemplo</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          <span className="text-violet-500 font-semibold">(+23%)</span> que la semana pasada
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label}>
            <div className="h-9 w-9 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center mb-2">
              <s.icon size={16} />
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">{s.label}</p>
            <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
