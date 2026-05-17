"use client"

import { useState, useMemo, useRef, useLayoutEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Wallet, CalendarDays } from "lucide-react"

import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetEventos }       from "@/api/evento-calendario/getEventos"
import { useGetCuentas }       from "@/api/cuenta/getCuentas"
import { useGetPartidas }      from "@/api/partida-presupuesto/getPartidas"
import { useGetSnapshotsMes, useGetSnapshotsCuenta } from "@/api/snapshot/getSnapshots"
import { CerrarMesButton }     from "@/components/Personal/Snapshot/CerrarMesButton"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtDia = (iso: string) => {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const CHART_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#14b8a6","#f97316","#ec4899","#84cc16","#06b6d4","#a78bfa"]
const TOOLTIP_STYLE = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }

function calcMensual(monto: number, frecuencia: string | null) {
  switch (frecuencia) {
    case "diario":    return monto * 30
    case "semanal":   return monto * 4.33
    case "quincenal": return monto * 2
    case "mensual":   return monto
    case "anual":     return monto / 12
    default:          return 0
  }
}

// ─── ColorDot sin inline styles ───────────────────────────────────────────────

function ColorDot({ color }: { color: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.backgroundColor = color ?? "#6366f1"
  }, [color])
  return <span ref={ref} className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" />
}

function ChartDot({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = color }, [color])
  return <span ref={ref} className="w-2 h-2 rounded-full shrink-0 inline-block" />
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon, delay }: {
  label: string; value: string; sub?: string
  color: "green" | "red" | "blue" | "slate"; icon: React.ElementType; delay: number
}) {
  const cls = {
    green: "border-emerald-800/40 bg-emerald-950/30 text-emerald-300",
    red:   "border-red-800/40 bg-red-950/30 text-red-300",
    blue:  "border-blue-800/40 bg-blue-950/30 text-blue-300",
    slate: "border-slate-700 bg-slate-900 text-slate-300",
  }[color]
  const iconCls = {
    green: "text-emerald-400", red: "text-red-400", blue: "text-blue-400", slate: "text-slate-400",
  }[color]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`p-4 rounded-xl border ${cls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconCls}`} />
      </div>
    </motion.div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function GestionPersonalPage() {
  const hoy = new Date()
  const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActualKey)
  const esMesActual = mesSeleccionado === mesActualKey

  const mesDate  = new Date(mesSeleccionado + "-15")
  const mesLabel = mesDate.toLocaleString("es-MX", { month: "long", year: "numeric" })

  const navMes = (dir: -1 | 1) => {
    const d = new Date(mesSeleccionado + "-15")
    d.setMonth(d.getMonth() + dir)
    setMesSeleccionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const { transacciones: dataTx,     loading: loadTx    } = useGetTransacciones()
  const { eventos,                    loading: loadEv    } = useGetEventos()
  const { cuentas: dataCuentas,       loading: loadCu    } = useGetCuentas()
  const { partidas,                   loading: loadPart  } = useGetPartidas()
  const { snapshots: snapshotsMes }    = useGetSnapshotsMes()
  const { snapshots: snapshotsCuenta } = useGetSnapshotsCuenta()

  const loading = loadTx || loadEv || loadCu || loadPart

  const transacciones = dataTx ?? []
  const cuentas       = dataCuentas ?? []

  // ── Movimientos unificados: transacciones + eventos sin tx ────────────────
  type Mov = { tipo: "ingreso" | "gasto" | "transferencia"; monto: number; categoria: string | null; fecha: string; descripcion?: string }

  function movsDeMes(mesKey: string): Mov[] {
    const tx = transacciones.filter(t => t.fecha?.slice(0, 7) === mesKey)
    const ev = eventos.filter(e => e.fecha?.slice(0, 7) === mesKey)
    const huellas = new Set(tx.map(t => `${t.fecha.slice(0, 10)}_${Number(t.monto)}`))
    const evSinTx: Mov[] = ev
      .filter(e => !huellas.has(`${e.fecha.slice(0, 10)}_${Number(e.monto)}`))
      .map(e => ({ tipo: e.tipo === "ingreso" ? "ingreso" : "gasto", monto: Number(e.monto), categoria: e.categoria, fecha: e.fecha, descripcion: e.titulo }))
    return [
      ...tx.map(t => ({ tipo: t.tipo as Mov["tipo"], monto: Number(t.monto), categoria: t.categoria, fecha: t.fecha, descripcion: t.descripcion })),
      ...evSinTx,
    ]
  }

  const txMes = movsDeMes(mesSeleccionado)

  const ingresoReal = txMes.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0)
  const gastoReal   = txMes.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0)
  const flujoNeto   = ingresoReal - gastoReal

  // ── Presupuesto referencia ─────────────────────────────────────────────────
  const activasPartidas = (partidas ?? []).filter(p => p.activo !== false)
  const egresoPresupuestado = activasPartidas
    .filter(p => p.categoria !== "ingreso" && p.tipo !== "ingreso")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
  const ingresoPresupuestado = activasPartidas
    .filter(p => p.categoria === "ingreso" || p.tipo === "ingreso")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  // ── Cuentas ───────────────────────────────────────────────────────────────
  const cuentasActivas  = cuentas.filter(c => c.activa)
  const cuentasLiquidas = cuentasActivas.filter(c => c.tipo !== "Crédito")
  const cuentasCredito  = cuentasActivas.filter(c => c.tipo === "Crédito")
  const operativa = cuentasLiquidas.filter(c => c.proposito === "Operativa").reduce((s, c) => s + (c.saldoActual ?? 0), 0)
  const apartados = cuentasLiquidas.filter(c => c.proposito !== "Operativa").reduce((s, c) => s + (c.saldoActual ?? 0), 0)
  const deuda     = cuentasCredito.reduce((s, c) => s + (c.saldoActual ?? 0), 0)
  const disponible = operativa + apartados

  // ── Gasto por categoría real (donut) ──────────────────────────────────────
  const gastoPorCat = useMemo(() => {
    const map = new Map<string, number>()
    txMes.filter(m => m.tipo === "gasto").forEach(m => {
      const cat = m.categoria?.trim() || "Sin categoría"
      map.set(cat, (map.get(cat) ?? 0) + m.monto)
    })
    return [...map.entries()]
      .map(([cat, monto]) => ({ cat, monto }))
      .sort((a, b) => b.monto - a.monto)
  }, [txMes])

  // ── Ingresos del mes con fecha ────────────────────────────────────────────
  const ingresosDelMes = useMemo(() =>
    txMes
      .filter(m => m.tipo === "ingreso")
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  [txMes])

  const ingresoPorCat = useMemo(() => {
    const map = new Map<string, number>()
    txMes.filter(m => m.tipo === "ingreso").forEach(m => {
      const cat = m.categoria?.trim() || "Sin categoría"
      map.set(cat, (map.get(cat) ?? 0) + m.monto)
    })
    return [...map.entries()]
      .map(([cat, monto]) => ({ cat, monto }))
      .sort((a, b) => b.monto - a.monto)
  }, [txMes])

  // ── Tendencia 6 meses ─────────────────────────────────────────────────────
  const tendencia = useMemo(() => {
    const selDate = new Date(mesSeleccionado + "-15")
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(selDate.getFullYear(), selDate.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const movs = movsDeMes(key)
      return {
        name: MESES_CORTO[d.getMonth()],
        Ingresos: Math.round(movs.filter(x => x.tipo === "ingreso").reduce((s, x) => s + x.monto, 0)),
        Gastos:   Math.round(movs.filter(x => x.tipo === "gasto").reduce((s, x) => s + x.monto, 0)),
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacciones, eventos, mesSeleccionado])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Resumen</h1>
          <p className="text-sm text-slate-500 capitalize">{mesLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navMes(-1)}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm transition-colors">
            ←
          </button>
          <span className="text-sm font-semibold text-slate-300 min-w-[130px] text-center capitalize">{mesLabel}</span>
          <button type="button" onClick={() => navMes(1)}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm transition-colors">
            →
          </button>
          {!esMesActual && (
            <button type="button" onClick={() => setMesSeleccionado(mesActualKey)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 ml-1">Hoy</button>
          )}
          <CerrarMesButton
            mes={mesSeleccionado}
            cuentas={cuentas}
            metricas={{
              ingresoReal, gastoReal, flujoNeto,
              ahorroReal: 0, ahorroAcumulado: apartados,
              liquidezTotal: disponible,
              operativaSaldo: operativa, apartadosSaldo: apartados,
              deudaTotal: deuda,
              necesidadesReal: 0, prescindiblesReal: 0,
              ingresoPresupuestado, egresoPresupuestado,
            }}
            snapshotMesExistente={snapshotsMes.find(s => s.mes === mesSeleccionado) ?? null}
            snapshotsCuentaExistentes={snapshotsCuenta.filter(s => s.mes === mesSeleccionado)}
            onDone={() => window.location.reload()}
          />
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Ingreso" value={fmt(ingresoReal)}
              sub={ingresoPresupuestado > 0 ? `de ${fmt(ingresoPresupuestado)} presupuestado` : undefined}
              icon={TrendingUp} color="green" delay={0.05} />
            <KpiCard label="Gasto" value={fmt(gastoReal)}
              sub={egresoPresupuestado > 0 ? `de ${fmt(egresoPresupuestado)} presupuestado` : undefined}
              icon={TrendingDown} color="red" delay={0.1} />
            <KpiCard label="Flujo neto" value={fmt(flujoNeto)}
              sub={flujoNeto >= 0 ? "Mes positivo" : "Mes negativo"}
              icon={flujoNeto >= 0 ? TrendingUp : TrendingDown}
              color={flujoNeto >= 0 ? "blue" : "red"} delay={0.15} />
            <KpiCard label="Disponible" value={fmt(disponible)}
              sub={deuda > 0 ? `Deuda: ${fmt(deuda)}` : "Sin deuda activa"}
              icon={Wallet} color="slate" delay={0.2} />
          </div>

          {/* Gasto por categoría + Tendencia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Donut — en qué gasté */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">En qué gasté</h2>
              {gastoPorCat.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-10">Sin gastos registrados</p>
              ) : (
                <div className="flex items-start gap-4">
                  <ResponsiveContainer width="45%" height={170}>
                    <PieChart>
                      <Pie data={gastoPorCat} dataKey="monto" nameKey="cat"
                        cx="50%" cy="50%" innerRadius={48} outerRadius={72} strokeWidth={0}>
                        {gastoPorCat.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE}
                        formatter={(v: number) => [fmt(v), ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 min-w-0 max-h-[170px] overflow-y-auto pr-1">
                    {gastoPorCat.map((g, i) => {
                      const pct = gastoReal > 0 ? Math.round((g.monto / gastoReal) * 100) : 0
                      return (
                        <div key={g.cat} className="flex items-center gap-2 min-w-0">
                          <ChartDot color={CHART_COLORS[i % CHART_COLORS.length]} />
                          <span className="text-[11px] text-slate-400 truncate flex-1 capitalize">{g.cat}</span>
                          <span className="text-[11px] text-slate-300 font-medium shrink-0 tabular-nums">{fmt(g.monto)}</span>
                          <span className="text-[10px] text-slate-600 shrink-0 w-8 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Barras — tendencia 6 meses */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Ingresos vs Gastos — 6 meses</h2>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={tendencia} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => `$${v.toLocaleString("es-MX")}`} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="Ingresos" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="Gastos"   fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cuándo gané + Cuentas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Ingresos del mes con fecha */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuándo gané</h2>
                <Link href="/gestion-personal/calendario"
                  className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                  <CalendarDays size={10} /> Ver calendario
                </Link>
              </div>
              {ingresosDelMes.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">Sin ingresos registrados</p>
              ) : (
                <div className="space-y-2">
                  {ingresoPorCat.map((g, i) => (
                    <div key={g.cat} className="flex items-center gap-2">
                      <ChartDot color={CHART_COLORS[i % CHART_COLORS.length]} />
                      <span className="text-xs text-slate-400 capitalize flex-1 truncate">{g.cat}</span>
                      <span className="text-xs text-emerald-400 font-semibold tabular-nums">+{fmt(g.monto)}</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-slate-800 space-y-1.5 max-h-[140px] overflow-y-auto">
                    {ingresosDelMes.map((m, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 shrink-0 w-14">{fmtDia(m.fecha)}</span>
                        <span className="text-slate-400 truncate flex-1">{m.descripcion ?? m.categoria ?? "Ingreso"}</span>
                        <span className="text-emerald-400 font-medium shrink-0 tabular-nums">+{fmt(m.monto)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cuentas — saldos actuales */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mis cuentas</h2>
                <Link href="/gestion-personal/cuentas"
                  className="text-[10px] text-cyan-500 hover:text-cyan-400">Ver detalle</Link>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-emerald-400 font-medium mb-0.5">Operativa</p>
                  <p className="text-sm font-bold text-emerald-300 tabular-nums">{fmt(operativa)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-medium mb-0.5">Apartados</p>
                  <p className="text-sm font-bold text-slate-200 tabular-nums">{fmt(apartados)}</p>
                </div>
                <div className="bg-red-950/40 border border-red-800/30 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-red-400 font-medium mb-0.5">Deuda</p>
                  <p className="text-sm font-bold text-red-300 tabular-nums">{fmt(deuda)}</p>
                </div>
              </div>

              {/* Lista de cuentas */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {cuentasActivas.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">Sin cuentas activas</p>
                ) : (
                  cuentasActivas.map(c => {
                    const saldo = c.saldoActual ?? 0
                    const esCredito = c.tipo === "Crédito"
                    return (
                      <div key={c.id} className="flex items-center gap-2.5 py-1.5 border-b border-slate-800/60 last:border-0">
                        <ColorDot color={c.color} />
                        <span className="text-xs text-slate-300 flex-1 truncate">{c.nombre}</span>
                        <span className="text-[10px] text-slate-600 shrink-0">{c.proposito ?? c.tipo}</span>
                        <span className={`text-xs font-semibold tabular-nums shrink-0 ${esCredito ? "text-red-400" : "text-slate-200"}`}>
                          {fmt(saldo)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
