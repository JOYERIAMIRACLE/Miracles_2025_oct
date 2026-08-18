"use client"

import { useMemo, useState } from "react"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Minus, Wallet } from "lucide-react"

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
  const { transacciones, loading: lt } = useGetTransacciones("empresa")
  const { cuentas, loading: lc } = useGetCuentas("empresa")
  const [periodo, setPeriodo] = useState<Periodo>("mes_actual")

  const gastos       = useMemo(() => transacciones.filter(t => t.tipo === "gasto"),   [transacciones])
  const ingresosAdmin = useMemo(() => transacciones.filter(t => t.tipo === "ingreso"), [transacciones])
  const saldoTotal = useMemo(() =>
    cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito").reduce((s, c) => s + (c.saldoActual ?? 0), 0), [cuentas])

  const stats = useMemo(() => {
    const ventasFiltradas = ventas.filter(v =>
      v.estado !== "Cancelado" && fechaEnPeriodo(v.fecha, periodo)
    )
    const gastosFiltrados   = gastos.filter(g => fechaEnPeriodo(g.fecha, periodo))
    const ingresosFiltrados = ingresosAdmin.filter(i => fechaEnPeriodo(i.fecha, periodo))

    const ingresos  = ventasFiltradas.reduce((s, v) => s + (v.monto ?? 0), 0) + ingresosFiltrados.reduce((s, i) => s + (i.monto ?? 0), 0)
    const egresos   = gastosFiltrados.reduce((s, g) => s + (g.monto ?? 0), 0)
    const margen    = ingresos - egresos
    const numVentas = ventasFiltradas.length

    const porMetodo: Record<string, number> = {}
    for (const v of ventasFiltradas) {
      const m = v.metodoPago ?? "Sin método"
      porMetodo[m] = (porMetodo[m] ?? 0) + v.monto
    }
    for (const i of ingresosFiltrados) {
      const m = i.metodoPago ?? "Sin método"
      porMetodo[m] = (porMetodo[m] ?? 0) + i.monto
    }

    return { ingresos, egresos, margen, numVentas, ventasFiltradas, gastosFiltrados, porMetodo }
  }, [ventas, gastos, ingresosAdmin, periodo])

  const loading = lv || lt || lc

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-end">
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm">
          {PERIODOS.map(p => (
            <button key={p.value} type="button"
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                periodo === p.value
                  ? "bg-violet-500 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Saldo en cuentas" value={loading ? "—" : fmt(saldoTotal)}    icon={Wallet}       destacado />
        <KpiCard label="Ingresos"         value={loading ? "—" : fmt(stats.ingresos)} icon={TrendingUp} />
        <KpiCard label="Gastos"           value={loading ? "—" : fmt(stats.egresos)}  icon={TrendingDown} negativo />
        <KpiCard
          label="Margen bruto"
          value={loading ? "—" : fmt(stats.margen)}
          icon={stats.margen >= 0 ? DollarSign : Minus}
          negativo={stats.margen < 0}
        />
        <KpiCard label="Ventas" value={loading ? "—" : String(stats.numVentas)} icon={ShoppingCart} suffix="pedidos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Últimas ventas</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">Cargando…</p>
            ) : stats.ventasFiltradas.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">Sin ventas en este período</p>
            ) : (
              stats.ventasFiltradas.slice(0, 8).map(v => (
                <div key={v.documentId} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{v.concepto}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{v.cliente?.nombre ?? "Sin cliente"} · {v.fecha}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 shrink-0 ml-3">{fmt(v.monto)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Últimos gastos */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Últimos gastos</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">Cargando…</p>
            ) : stats.gastosFiltrados.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">Sin gastos en este período</p>
            ) : (
              stats.gastosFiltrados.slice(0, 8).map(g => (
                <div key={g.documentId} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{g.descripcion}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{g.categoria ?? g.centro_costo?.nombre ?? "Sin categoría"} · {g.fecha.slice(0, 10)}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 shrink-0 ml-3">{fmt(g.monto ?? 0)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Desglose por método de pago */}
      {!loading && Object.keys(stats.porMetodo).length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Ingresos por método de pago</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.porMetodo).map(([metodo, total]) => (
              <div key={metodo} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{metodo}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmt(total)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, suffix, destacado, negativo,
}: {
  label: string; value: string; icon: typeof TrendingUp; suffix?: string; destacado?: boolean; negativo?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-500/10">
          <Icon className="h-3.5 w-3.5 text-violet-500" />
        </div>
      </div>
      <p className={`text-xl font-bold leading-none ${negativo ? "text-red-500 dark:text-red-400" : destacado ? "text-violet-600 dark:text-violet-400" : "text-slate-900 dark:text-slate-100"}`}>{value}</p>
      {suffix && <p className="text-[11px] text-slate-400 dark:text-slate-500">{suffix}</p>}
    </div>
  )
}
