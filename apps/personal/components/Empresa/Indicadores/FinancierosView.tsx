"use client"

import { useMemo, useState } from "react"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { useGetGastos } from "@/api/gasto/getGastos"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type Periodo = "mes_actual" | "mes_anterior" | "anio_actual"

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "mes_actual",    label: "Este mes" },
  { value: "mes_anterior",  label: "Mes anterior" },
  { value: "anio_actual",   label: "Este año" },
]

function fechaEnPeriodo(fechaStr: string | null, periodo: Periodo): boolean {
  if (!fechaStr) return false
  const fecha = new Date(fechaStr)
  const hoy   = new Date()
  if (periodo === "mes_actual") {
    return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth()
  }
  if (periodo === "mes_anterior") {
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    return fecha.getFullYear() === mesAnterior.getFullYear() && fecha.getMonth() === mesAnterior.getMonth()
  }
  return fecha.getFullYear() === hoy.getFullYear()
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)
}

export function FinancierosView() {
  const { ventas,  loading: lv } = useGetVentas()
  const { gastos,  loading: lg } = useGetGastos("empresa")
  const [periodo, setPeriodo] = useState<Periodo>("mes_actual")

  const stats = useMemo(() => {
    const ventasFiltradas = ventas.filter(v =>
      v.estado !== "Cancelado" && fechaEnPeriodo(v.fecha, periodo)
    )
    const gastosFiltrados = gastos.filter(g => fechaEnPeriodo(g.fecha, periodo))

    const ingresos  = ventasFiltradas.reduce((s, v) => s + (v.monto ?? 0), 0)
    const egresos   = gastosFiltrados.reduce((s, g) => s + (g.monto ?? 0), 0)
    const margen    = ingresos - egresos
    const numVentas = ventasFiltradas.length

    const porMetodo: Record<string, number> = {}
    for (const v of ventasFiltradas) {
      const m = v.metodoPago ?? "Sin método"
      porMetodo[m] = (porMetodo[m] ?? 0) + v.monto
    }

    return { ingresos, egresos, margen, numVentas, ventasFiltradas, gastosFiltrados, porMetodo }
  }, [ventas, gastos, periodo])

  const loading = lv || lg

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Indicadores Financieros</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ingresos, gastos y margen del negocio</p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {PERIODOS.map(p => (
            <button key={p.value} type="button"
              onClick={() => setPeriodo(p.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                periodo === p.value
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300"
              )}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos"
          value={loading ? "—" : fmt(stats.ingresos)}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          label="Gastos"
          value={loading ? "—" : fmt(stats.egresos)}
          icon={TrendingDown}
          color="rose"
        />
        <KpiCard
          label="Margen bruto"
          value={loading ? "—" : fmt(stats.margen)}
          icon={stats.margen >= 0 ? DollarSign : Minus}
          color={stats.margen >= 0 ? "violet" : "amber"}
        />
        <KpiCard
          label="Ventas"
          value={loading ? "—" : String(stats.numVentas)}
          icon={ShoppingCart}
          color="sky"
          suffix="pedidos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Últimas ventas</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {loading ? (
              <p className="px-4 py-6 text-xs text-slate-600 text-center">Cargando…</p>
            ) : stats.ventasFiltradas.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-600 text-center">Sin ventas en este período</p>
            ) : (
              stats.ventasFiltradas.slice(0, 8).map(v => (
                <div key={v.documentId} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{v.concepto}</p>
                    <p className="text-[11px] text-slate-600">{v.cliente?.nombre ?? "Sin cliente"} · {v.fecha}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 shrink-0 ml-3">{fmt(v.monto)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Últimos gastos */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Últimos gastos</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {loading ? (
              <p className="px-4 py-6 text-xs text-slate-600 text-center">Cargando…</p>
            ) : stats.gastosFiltrados.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-600 text-center">Sin gastos en este período</p>
            ) : (
              stats.gastosFiltrados.slice(0, 8).map(g => (
                <div key={g.documentId} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{g.concepto}</p>
                    <p className="text-[11px] text-slate-600">{g.centro_costo?.nombre ?? "Sin centro"} · {g.fecha}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-400 shrink-0 ml-3">{fmt(g.monto ?? 0)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Desglose por método de pago */}
      {!loading && Object.keys(stats.porMetodo).length > 0 && (
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Ingresos por método de pago</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.porMetodo).map(([metodo, total]) => (
              <div key={metodo} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-slate-500">{metodo}</p>
                <p className="text-sm font-semibold text-slate-200">{fmt(total)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, color, suffix,
}: {
  label: string; value: string; icon: typeof TrendingUp; color: string; suffix?: string
}) {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
    rose:    { bg: "bg-rose-500/10",    icon: "text-rose-400",    border: "border-rose-500/20" },
    violet:  { bg: "bg-violet-500/10",  icon: "text-violet-400",  border: "border-violet-500/20" },
    amber:   { bg: "bg-amber-500/10",   icon: "text-amber-400",   border: "border-amber-500/20" },
    sky:     { bg: "bg-sky-500/10",     icon: "text-sky-400",     border: "border-sky-500/20" },
  }
  const c = colors[color] ?? colors.sky

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", c.bg, c.border)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={cn("h-4 w-4", c.icon)} />
      </div>
      <p className="text-xl font-bold text-slate-100 leading-none">{value}</p>
      {suffix && <p className="text-[11px] text-slate-600">{suffix}</p>}
    </div>
  )
}
