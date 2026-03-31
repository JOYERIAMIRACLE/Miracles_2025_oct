"use client"

import { useState, useEffect } from "react"
import { Wallet, TrendingUp, TrendingDown, ShieldCheck, PieChart, Landmark } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

import { useGetPartidas }  from "@/api/partida-presupuesto/getPartidas"
import { useGetActivos }   from "@/api/activo/getActivos"
import { useGetPasivos }   from "@/api/pasivo/getPasivos"
import { useGetPrestamos } from "@/api/prestamo-otorgado/getPrestamos"

import { PartidaPresupuestoType } from "@/types/partida-presupuesto"
import { ActivoType }             from "@/types/activo"
import { PasivoType }             from "@/types/pasivo"
import { PrestamoOtorgadoType }   from "@/types/prestamo-otorgado"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString("es-MX")}`

const fmtDec = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function calcFrecuencias(monto: number, frecuencia: string | null) {
  switch (frecuencia) {
    case "diario":    return { mensual: monto * 30 }
    case "semanal":   return { mensual: monto * 4.33 }
    case "quincenal": return { mensual: monto * 2 }
    case "mensual":   return { mensual: monto }
    case "anual":     return { mensual: monto / 12 }
    default:          return { mensual: 0 }
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon, href }: {
  label: string; value: string; sub?: string
  color: string; icon: React.ElementType; href?: string
}) {
  const inner = (
    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:shadow-md transition-shadow">
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
          color.includes("amber")   ? "bg-amber-50 dark:bg-amber-500/10" :
          "bg-zinc-100 dark:bg-zinc-800"}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function BarraItem({ label, monto, total, color, href }: {
  label: string; monto: number; total: number; color: string; href?: string
}) {
  const pct = total > 0 ? Math.min(100, Math.round((monto / total) * 100)) : 0
  const inner = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[180px] capitalize">{label}</span>
        <span className="text-zinc-500 tabular-nums text-xs">{fmt(monto)} <span className="text-zinc-400">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color} w-[var(--bar-pct)]`} style={{ "--bar-pct": `${pct}%` } as React.CSSProperties} />
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Página Dashboard ─────────────────────────────────────────────────────────
export default function GestionPersonalPage() {
  const { partidas: dataPartidas, loading: loadPart } = useGetPartidas()
  const { activos:  dataActivos,  loading: loadAct  } = useGetActivos()
  const { pasivos:  dataPasivos,  loading: loadPas  } = useGetPasivos()
  const { prestamos: dataPrest,   loading: loadPrest } = useGetPrestamos()

  const [partidas,  setPartidas]  = useState<PartidaPresupuestoType[]>([])
  const [activos,   setActivos]   = useState<ActivoType[]>([])
  const [pasivos,   setPasivos]   = useState<PasivoType[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoOtorgadoType[]>([])

  useEffect(() => { setPartidas(dataPartidas   ?? []) }, [dataPartidas])
  useEffect(() => { setActivos(dataActivos     ?? []) }, [dataActivos])
  useEffect(() => { setPasivos(dataPasivos     ?? []) }, [dataPasivos])
  useEffect(() => { setPrestamos(dataPrest     ?? []) }, [dataPrest])

  const loading = loadPart || loadAct || loadPas || loadPrest

  // ─── Cálculos de presupuesto ─────────────────────────────────────────────
  const activasPartidas = partidas.filter(p => p.activo !== false)

  const ingresoMensual = activasPartidas
    .filter(p => p.categoria === "ingreso" || p.tipo === "ingreso")
    .reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)

  const egresoMensual = activasPartidas
    .filter(p => p.categoria !== "ingreso" && p.tipo !== "ingreso")
    .reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)

  const flujoNeto = ingresoMensual - egresoMensual

  const necesidadesMensual = activasPartidas
    .filter(p => p.tipo === "necesidad")
    .reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)

  const prescindiblesMensual = activasPartidas
    .filter(p => p.tipo === "gastos prescindibles")
    .reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)

  const ahorroMensual = activasPartidas
    .filter(p => p.tipo === "ahorro")
    .reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)

  // ─── Cálculos de patrimonio ──────────────────────────────────────────────
  const totalActivos   = activos.reduce((s, a) => s + (a.valor ?? 0), 0)
  const totalPrestamos = prestamos.filter(p => p.estado === "activo").reduce((s, p) => s + (p.saldo_pendiente ?? 0), 0)
  const totalPasivos   = pasivos.reduce((s, p) => s + (p.saldo ?? 0), 0)
  const patrimonioNeto = totalActivos + totalPrestamos - totalPasivos

  // Ratio de supervivencia: meses que puedes vivir sin ingresos
  // Efectivo líquido = activos de categoría efectivo + inversión
  const efectivoLiquido = activos
    .filter(a => a.categoria === "efectivo" || a.categoria === "inversion")
    .reduce((s, a) => s + (a.valor ?? 0), 0)
  const ratioSupervivencia = egresoMensual > 0 ? efectivoLiquido / egresoMensual : 0

  // Alertas de salud financiera
  const pctPrescindibles = egresoMensual > 0 ? (prescindiblesMensual / egresoMensual) * 100 : 0
  const alertaPrescindibles = pctPrescindibles > 30

  // Top categorías de gasto del presupuesto
  const gastoPorCategoria = Object.values(
    activasPartidas
      .filter(p => p.categoria !== "ingreso" && p.tipo !== "ingreso" && p.categoria)
      .reduce<Record<string, { label: string; monto: number }>>((acc, p) => {
        const key = p.categoria!
        acc[key] = { label: key, monto: (acc[key]?.monto ?? 0) + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual }
        return acc
      }, {})
  ).sort((a, b) => b.monto - a.monto).slice(0, 5)

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard Personal</h1>
        <p className="text-sm text-zinc-500">Resumen de tu situación financiera personal.</p>
      </div>

      {/* ── KPIs fila 1 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Patrimonio Neto"
          value={loading ? "..." : fmtDec(patrimonioNeto)}
          sub="Activos − Pasivos"
          color={patrimonioNeto >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}
          icon={Landmark}
          href="/gestion-personal/patrimonio"
        />
        <KpiCard
          label="Flujo Neto Mensual"
          value={loading ? "..." : fmt(flujoNeto)}
          sub={flujoNeto >= 0 ? "Ingresos > Egresos" : "Egresos > Ingresos"}
          color={flujoNeto >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
          icon={flujoNeto >= 0 ? TrendingUp : TrendingDown}
          href="/gestion-personal/presupuesto"
        />
        <KpiCard
          label="Ratio Supervivencia"
          value={loading ? "..." : `${ratioSupervivencia.toFixed(1)} meses`}
          sub="Efectivo ÷ egresos/mes"
          color={
            ratioSupervivencia >= 6 ? "text-emerald-600 dark:text-emerald-400" :
            ratioSupervivencia >= 3 ? "text-amber-600 dark:text-amber-400" :
            "text-red-600 dark:text-red-400"
          }
          icon={ShieldCheck}
        />
        <KpiCard
          label="Ahorro Mensual"
          value={loading ? "..." : fmt(ahorroMensual)}
          sub="Presupuestado"
          color="text-emerald-600 dark:text-emerald-400"
          icon={Wallet}
          href="/gestion-personal/presupuesto"
        />
      </div>

      {/* ── Alerta si prescindibles > 30% ─────────────────────────────────── */}
      {!loading && alertaPrescindibles && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-5 py-3 flex items-center gap-3">
          <PieChart className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Alerta de salud financiera:</span> tus gastos prescindibles representan el{" "}
            <span className="font-bold">{Math.round(pctPrescindibles)}%</span> de tus egresos. Se recomienda no superar el 30%.
          </p>
        </div>
      )}

      {/* ── Fila 2 ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribución de egresos */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Distribución de egresos</h2>
            <Link href="/gestion-personal/presupuesto" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver presupuesto</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : egresoMensual === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin egresos en el presupuesto.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Necesidades",          monto: necesidadesMensual,   color: "bg-blue-500"  },
                { label: "Gastos Prescindibles",  monto: prescindiblesMensual, color: alertaPrescindibles ? "bg-amber-500" : "bg-zinc-400" },
                { label: "Ahorro",                monto: ahorroMensual,        color: "bg-emerald-500" },
              ].filter(i => i.monto > 0).map(item => (
                <BarraItem key={item.label} label={item.label} monto={item.monto} total={ingresoMensual || egresoMensual} color={item.color} />
              ))}
            </div>
          )}
          {!loading && egresoMensual > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-xs text-zinc-500">
              <span>Ingreso mensual: <span className="font-semibold text-emerald-600">{fmt(ingresoMensual)}</span></span>
              <span>Egreso mensual: <span className="font-semibold text-red-500">{fmt(egresoMensual)}</span></span>
            </div>
          )}
        </Card>

        {/* Top categorías de gasto */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top categorías de gasto</h2>
            <Link href="/gestion-personal/presupuesto" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver detalle</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
          ) : gastoPorCategoria.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Sin datos de presupuesto.</p>
          ) : (
            <div className="space-y-4">
              {gastoPorCategoria.map(c => (
                <BarraItem key={c.label} label={c.label} monto={c.monto} total={egresoMensual} color="bg-indigo-400" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Fila 3: Balance patrimonio ─────────────────────────────────────── */}
      <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Balance patrimonial</h2>
          <Link href="/gestion-personal/patrimonio" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver detalle</Link>
        </div>
        {loading ? (
          <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Activos + Por cobrar</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmtDec(totalActivos + totalPrestamos)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pasivos</p>
              <p className="text-xl font-bold text-red-500 dark:text-red-400">{fmtDec(totalPasivos)}</p>
            </div>
            <div className="border-l border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Patrimonio Neto</p>
              <p className={`text-xl font-bold ${patrimonioNeto >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}`}>
                {fmtDec(patrimonioNeto)}
              </p>
            </div>
          </div>
        )}
      </Card>

    </div>
  )
}
