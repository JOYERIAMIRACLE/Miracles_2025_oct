"use client"

import { useState, useEffect } from "react"
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { useGetGastos } from "@/api/gasto/getGastos"
import { useGetVentas } from "@/api/venta/getVentas"
import { CuentaType } from "@/types/cuenta"
import { GastoType } from "@/types/gasto"
import { VentaType } from "@/types/venta"

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

// ─── Sub-componente: Tarjeta KPI ──────────────────────────────────────────────
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
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color.includes("emerald") ? "bg-emerald-50 dark:bg-emerald-500/10" : color.includes("red") ? "bg-red-50 dark:bg-red-500/10" : color.includes("indigo") ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-zinc-100 dark:bg-zinc-800"}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </Card>
  )
}

// ─── Sub-componente: Barra de proporción ──────────────────────────────────────
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FinanzasPage() {
  // 1. HOOKS
  const { cuentas: dataCuentas, loading: loadC } = useGetCuentas()
  const { gastos:  dataGastos,  loading: loadG } = useGetGastos()
  const { ventas:  dataVentas,  loading: loadV } = useGetVentas()

  const [cuentas, setCuentas] = useState<CuentaType[]>([])
  const [gastos,  setGastos]  = useState<GastoType[]>([])
  const [ventas,  setVentas]  = useState<VentaType[]>([])

  const [periodo,    setPeriodo]    = useState<"mes" | "anio" | "custom">("mes")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  useEffect(() => { setCuentas(dataCuentas ?? []) }, [dataCuentas])
  useEffect(() => { setGastos(dataGastos ?? [])   }, [dataGastos])
  useEffect(() => { setVentas(dataVentas ?? [])   }, [dataVentas])

  // 2. LOGS
  if (process.env.NODE_ENV === "development") {}

  // ─── Saldo actual por cuenta (acumulativo, sin filtro de periodo) ───────────
  const calcSaldoActual = (cuentaDocId: string, saldoIni: number) => {
    const ingresos = ventas
      .filter(v => v.cuenta?.documentId === cuentaDocId && v.estado !== "Cancelado")
      .reduce((s, v) => s + (v.monto ?? 0), 0)
    const egresos = gastos
      .filter(g => g.cuenta?.documentId === cuentaDocId)
      .reduce((s, g) => s + (g.monto ?? 0), 0)
    return saldoIni + ingresos - egresos
  }

  // ─── Cálculos del periodo ───────────────────────────────────────────────────
  const { desde, hasta } = getRango(periodo, fechaDesde, fechaHasta)

  const gastosPeriodo = gastos.filter(g => inRango(g.fecha, desde, hasta))
  const ventasPeriodo = ventas.filter(v => inRango(v.fecha, desde, hasta))

  const totalVentas  = ventasPeriodo.reduce((s, v) => s + (v.monto ?? 0), 0)
  const totalGastos  = gastosPeriodo.reduce((s, g) => s + (g.monto ?? 0), 0)
  const utilidad     = totalVentas - totalGastos

  // Capital = suma de saldos actuales de cuentas activas
  const cuentasActivas = cuentas.filter(c => c.activa)
  const capitalTotal   = cuentasActivas.reduce(
    (s, c) => s + calcSaldoActual(c.documentId, c.saldoInicial ?? 0), 0
  )

  // ─── Capital por propósito ──────────────────────────────────────────────────
  const porProposito = ["Operativa", "Ahorro", "Inversión", "Apartado", "Presupuesto 1"].map(p => ({
    label: p === "Presupuesto 1" ? "Presupuesto" : p,
    monto: cuentasActivas
      .filter(c => c.proposito === p)
      .reduce((s, c) => s + calcSaldoActual(c.documentId, c.saldoInicial ?? 0), 0),
  })).filter(p => p.monto > 0)

  // ─── Gastos por centro de costo ─────────────────────────────────────────────
  const gastosPorCentro = Object.values(
    gastosPeriodo.reduce<Record<string, { label: string; monto: number }>>((acc, g) => {
      const key = g.centro_costo?.documentId ?? "__sin__"
      const label = g.centro_costo?.nombre ?? "Sin categoría"
      acc[key] = { label, monto: (acc[key]?.monto ?? 0) + (g.monto ?? 0) }
      return acc
    }, {})
  ).sort((a, b) => b.monto - a.monto).slice(0, 5)

  // ─── Ventas por centro de venta ─────────────────────────────────────────────
  const ventasPorCanal = Object.values(
    ventasPeriodo.reduce<Record<string, { label: string; monto: number }>>((acc, v) => {
      const key = v.centro_venta?.documentId ?? "__sin__"
      const label = v.centro_venta?.nombre ?? "Sin canal"
      acc[key] = { label, monto: (acc[key]?.monto ?? 0) + (v.monto ?? 0) }
      return acc
    }, {})
  ).sort((a, b) => b.monto - a.monto).slice(0, 5)

  const loading = loadC || loadG || loadV

  // 3. GUARDS — n/a

  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">

      {/* ── Título ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Finanzas</h1>
          <p className="text-sm text-zinc-500">Resumen consolidado de tu situación financiera.</p>
        </div>

        {/* ── Selector de periodo ── */}
        <div className="flex flex-wrap items-center gap-2">
          {(["mes", "anio", "custom"] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`h-8 px-3 rounded-full text-xs font-medium border transition-all ${
                periodo === p
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {p === "mes" ? "Este mes" : p === "anio" ? "Este año" : "Personalizado"}
            </button>
          ))}
          {periodo === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" title="Fecha desde" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100" />
              <span className="text-zinc-400 text-xs">—</span>
              <input type="date" title="Fecha hasta" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100" />
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs principales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Capital Total"    value={loading ? "..." : fmt(capitalTotal)} sub="Suma de cuentas activas"    color="text-zinc-900 dark:text-zinc-50"           icon={Wallet} />
        <KpiCard label="Ventas"           value={loading ? "..." : fmt(totalVentas)}  sub="Ingresos del periodo"       color="text-emerald-600 dark:text-emerald-400"     icon={TrendingUp} />
        <KpiCard label="Gastos"           value={loading ? "..." : fmt(totalGastos)}  sub="Egresos del periodo"        color="text-red-600 dark:text-red-400"             icon={TrendingDown} />
        <KpiCard
          label="Utilidad"
          value={loading ? "..." : fmt(utilidad)}
          sub={utilidad >= 0 ? "Positiva" : "Negativa"}
          color={utilidad >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}
          icon={DollarSign}
        />
      </div>

      {/* ── Fila 2: Capital por propósito + Gastos por centro ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Capital por propósito */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Capital por propósito</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : porProposito.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin cuentas activas registradas.</p>
          ) : (
            <div className="space-y-4">
              {porProposito.map(p => (
                <BarraItem key={p.label} label={p.label} monto={p.monto} total={capitalTotal}
                  color={p.label === "Ahorro" ? "bg-emerald-500" : p.label === "Inversión" ? "bg-violet-500" : p.label === "Apartado" ? "bg-amber-500" : p.label === "Presupuesto" ? "bg-zinc-400" : "bg-blue-500"} />
              ))}
            </div>
          )}
        </Card>

        {/* Gastos por centro de costo */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Gastos por categoría</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : gastosPorCentro.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin gastos en el periodo seleccionado.</p>
          ) : (
            <div className="space-y-4">
              {gastosPorCentro.map(c => (
                <BarraItem key={c.label} label={c.label} monto={c.monto} total={totalGastos} color="bg-red-400" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Fila 3: Ventas por canal + Cuentas activas ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ventas por canal de venta */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Ventas por canal</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : ventasPorCanal.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin ventas en el periodo seleccionado.</p>
          ) : (
            <div className="space-y-4">
              {ventasPorCanal.map(c => (
                <BarraItem key={c.label} label={c.label} monto={c.monto} total={totalVentas} color="bg-emerald-500" />
              ))}
            </div>
          )}
        </Card>

        {/* Detalle de cuentas activas */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Cuentas activas</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : cuentas.filter(c => c.activa).length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin cuentas activas registradas.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {cuentasActivas.map(c => {
                const saldoActual = calcSaldoActual(c.documentId, c.saldoInicial ?? 0)
                const delta = saldoActual - (c.saldoInicial ?? 0)
                return (
                  <div key={c.documentId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      {c.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[var(--dot-color)]"
                          style={{ "--dot-color": c.color } as React.CSSProperties}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.nombre}</p>
                        <p className="text-xs text-zinc-400">{c.tipo ?? "—"} · {c.proposito ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{fmt(saldoActual)}</p>
                      {delta !== 0 && (
                        <p className={`text-xs ${delta > 0 ? "text-emerald-500" : "text-red-400"}`}>
                          {delta > 0 ? "+" : ""}{fmt(delta)}
                        </p>
                      )}
                      {c.metaDeCuenta && (
                        <p className="text-xs text-zinc-400">meta: {fmt(c.metaDeCuenta)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

    </div>
  )
}
