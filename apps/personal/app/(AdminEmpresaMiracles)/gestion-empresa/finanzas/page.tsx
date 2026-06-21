"use client"

import { useState } from "react"
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { useGetGastos } from "@/api/gasto/getGastos"
import { useGetIngresos } from "@/api/ingreso/getIngresos"
import { CuentaType } from "@/types/cuenta"
import { GastoType } from "@/types/gasto"
import { Ingreso } from "@/types/ingreso"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const getRango = (periodo: "mes" | "anio" | "custom", desde: string, hasta: string) => {
  const hoy  = new Date()
  const hoyS = hoy.toISOString().split("T")[0]
  if (periodo === "mes")  return { desde: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`, hasta: hoyS }
  if (periodo === "anio") return { desde: `${hoy.getFullYear()}-01-01`, hasta: hoyS }
  return { desde, hasta }
}

const inRango = (fecha: string | null, desde: string, hasta: string) => {
  if (!fecha || !desde || !hasta) return true
  return fecha >= desde && fecha <= hasta
}

function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string
  color: string; icon: React.ElementType
}) {
  return (
    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
          color.includes("emerald") ? "bg-emerald-50 dark:bg-emerald-500/10" :
          color.includes("red")     ? "bg-red-50 dark:bg-red-500/10" :
          color.includes("indigo")  ? "bg-indigo-50 dark:bg-indigo-500/10" :
                                      "bg-zinc-100 dark:bg-zinc-800"
        }`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </Card>
  )
}

function BarraItem({ label, monto, total, color }: { label: string; monto: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((monto / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{label}</span>
        <span className="text-zinc-500 tabular-nums">{fmt(monto)} <span className="text-zinc-400 text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function FinanzasPage() {
  const { cuentas,  loading: loadC } = useGetCuentas()
  const { gastos,   loading: loadG } = useGetGastos()
  const { ingresos, loading: loadI } = useGetIngresos("empresa")

  const [periodo,    setPeriodo]    = useState<"mes" | "anio" | "custom">("mes")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  const { desde, hasta } = getRango(periodo, fechaDesde, fechaHasta)

  const gastosPeriodo   = gastos.filter(g   => inRango(g.fecha,   desde, hasta))
  const ingresosPeriodo = ingresos.filter(i  => inRango(i.fecha,  desde, hasta))

  const totalIngresos = ingresosPeriodo.reduce((s, i) => s + (i.monto ?? 0), 0)
  const totalGastos   = gastosPeriodo.reduce((s, g)   => s + (g.monto ?? 0), 0)
  const utilidad      = totalIngresos - totalGastos

  const cuentasActivas = cuentas.filter(c => c.activa)
  const capitalTotal   = cuentasActivas.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)

  // Ingresos por método de pago
  const ingresosPorMetodo = Object.values(
    ingresosPeriodo.reduce<Record<string, { label: string; monto: number }>>((acc, i) => {
      const key = i.metodoPago ?? "Sin método"
      acc[key] = { label: key, monto: (acc[key]?.monto ?? 0) + (i.monto ?? 0) }
      return acc
    }, {})
  ).sort((a, b) => b.monto - a.monto)

  // Gastos por categoría
  const gastosPorCategoria = Object.values(
    gastosPeriodo.reduce<Record<string, { label: string; monto: number }>>((acc, g) => {
      const key = g.categoria ?? "Sin categoría"
      acc[key] = { label: key, monto: (acc[key]?.monto ?? 0) + (g.monto ?? 0) }
      return acc
    }, {})
  ).sort((a, b) => b.monto - a.monto).slice(0, 5)

  const loading = loadC || loadG || loadI

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Finanzas</h1>
          <p className="text-sm text-zinc-500">Resumen consolidado · ingresos, gastos y capital.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["mes", "anio", "custom"] as const).map(p => (
            <button key={p} type="button" onClick={() => setPeriodo(p)}
              className={`h-8 px-3 rounded-full text-xs font-medium border transition-all ${
                periodo === p
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}>
              {p === "mes" ? "Este mes" : p === "anio" ? "Este año" : "Personalizado"}
            </button>
          ))}
          {periodo === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" title="Desde" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs focus:outline-none text-zinc-900 dark:text-zinc-100" />
              <span className="text-zinc-400 text-xs">—</span>
              <input type="date" title="Hasta" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs focus:outline-none text-zinc-900 dark:text-zinc-100" />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Capital total"  value={loading ? "..." : fmt(capitalTotal)} sub="Suma de cuentas activas"  color="text-zinc-900 dark:text-zinc-50"       icon={Wallet} />
        <KpiCard label="Ingresos"       value={loading ? "..." : fmt(totalIngresos)} sub="Cobros del periodo"      color="text-emerald-600 dark:text-emerald-400" icon={TrendingUp} />
        <KpiCard label="Gastos"         value={loading ? "..." : fmt(totalGastos)}   sub="Egresos del periodo"     color="text-red-600 dark:text-red-400"         icon={TrendingDown} />
        <KpiCard
          label="Utilidad"
          value={loading ? "..." : fmt(utilidad)}
          sub={utilidad >= 0 ? "Positiva" : "Negativa"}
          color={utilidad >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}
          icon={DollarSign}
        />
      </div>

      {/* Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Ingresos por método de pago</h2>
          {loading ? (
            <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : ingresosPorMetodo.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin ingresos en el periodo.</p>
          ) : (
            <div className="space-y-4">
              {ingresosPorMetodo.map(m => (
                <BarraItem key={m.label} label={m.label} monto={m.monto} total={totalIngresos} color="bg-emerald-500" />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Gastos por categoría</h2>
          {loading ? (
            <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : gastosPorCategoria.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin gastos en el periodo.</p>
          ) : (
            <div className="space-y-4">
              {gastosPorCategoria.map(c => (
                <BarraItem key={c.label} label={c.label} monto={c.monto} total={totalGastos} color="bg-red-400" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Cuentas activas */}
      <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Cuentas activas</h2>
        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-10 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
        ) : cuentasActivas.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">Sin cuentas registradas.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {cuentasActivas.map(c => {
              const saldo = c.saldoActual ?? c.saldoInicial ?? 0
              return (
                <div key={c.documentId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    {c.color && (
                      <span className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }} />
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.nombre}</p>
                      <p className="text-xs text-zinc-400">{c.tipo ?? "—"} · {c.proposito ?? "—"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{fmt(saldo)}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

    </div>
  )
}
