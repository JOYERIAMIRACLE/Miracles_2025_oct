"use client"

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react"
import { Plus, X, Pencil, Loader2, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { toast } from "sonner"
import { useGetPartidas } from "@/api/partida-presupuesto/getPartidas"
import { createPartida } from "@/api/partida-presupuesto/createPartida"
import { updatePartida } from "@/api/partida-presupuesto/updatePartida"
import { deletePartida } from "@/api/partida-presupuesto/deletePartida"
import { useGetGastos } from "@/api/gasto/getGastos"
import { PartidaPresupuestoType } from "@/types/partida-presupuesto"

const CATEGORIAS_EMPRESA = ["Operaciones", "Marketing", "Ventas", "Administración", "Producción", "IT", "Otro"]
const FRECUENCIAS = ["mensual", "trimestral", "anual", "único"] as const

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6"]
const TOOLTIP_STYLE = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }

const CAT_BAR: Record<string, string> = {
  "Operaciones":    "bg-indigo-500",
  "Marketing":      "bg-blue-500",
  "Ventas":         "bg-emerald-500",
  "Administración": "bg-violet-500",
  "Producción":     "bg-amber-500",
  "IT":             "bg-cyan-500",
  "Otro":           "bg-zinc-500",
}

function calcMensual(monto: number, frecuencia: string | null): number {
  switch (frecuencia) {
    case "mensual":    return monto
    case "trimestral": return monto / 3
    case "anual":      return monto / 12
    default:           return monto
  }
}

const fmt = (n: number) =>
  Math.abs(n) < 0.5 ? "$0" : `$${Math.round(n).toLocaleString("es-MX")}`

function weekKey(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00")
  if (isNaN(d.getTime())) return ""
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().split("T")[0]
}

function weekRangeLabel(mondayStr: string): string {
  const mon = new Date(mondayStr + "T12:00:00")
  if (isNaN(mon.getTime())) return ""
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
  const mM = mon.toLocaleDateString("es-MX", { month: "short" })
  const sM = sun.toLocaleDateString("es-MX", { month: "short" })
  return mM === sM
    ? `${mon.getDate()} — ${sun.getDate()} ${sM}`
    : `${mon.getDate()} ${mM} — ${sun.getDate()} ${sM}`
}

function WeekBar({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.width = `${Math.min(pct, 100)}%` }, [pct])
  return (
    <div className="flex-1 h-1.5 rounded-full bg-slate-800">
      <div ref={ref} className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" />
    </div>
  )
}

function ChartDot({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = color }, [color])
  return <span ref={ref} className="w-2 h-2 rounded-full shrink-0 inline-block" />
}

type Form = { descripcion: string; categoria: string; tipo: string; frecuencia: string; monto: string }
const emptyForm = (): Form => ({ descripcion: "", categoria: "Operaciones", tipo: "gasto", frecuencia: "mensual", monto: "" })

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"

export function PresupuestosEmpresaView() {
  const { partidas: raw, loading, error } = useGetPartidas("empresa")
  const { gastos } = useGetGastos("empresa")

  const [partidas,  setPartidas]  = useState<PartidaPresupuestoType[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<PartidaPresupuestoType | null>(null)
  const [form,      setForm]      = useState<Form>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const hoy = new Date()
  const mesDefault = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
  const [mes, setMes] = useState(mesDefault)

  useEffect(() => { setPartidas(raw ?? []) }, [raw])

  const activas = useMemo(() => partidas.filter(p => p.activo !== false), [partidas])
  const gastosMes = useMemo(() => gastos.filter(g => g.fecha?.slice(0, 7) === mes), [gastos, mes])

  const totalPresupuestado = useMemo(() =>
    activas.filter(p => p.tipo !== "ingreso").reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0), [activas])

  const totalGastado = useMemo(() =>
    gastosMes.reduce((s, g) => s + Number(g.monto ?? 0), 0), [gastosMes])

  const disponible = totalPresupuestado - totalGastado
  const pct = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0

  const porCategoria = useMemo(() =>
    CATEGORIAS_EMPRESA.map(cat => ({
      cat,
      items: activas.filter(p => (p.categoria ?? "Otro") === cat && p.tipo !== "ingreso"),
    })).filter(g => g.items.length > 0), [activas])

  const comparativa = useMemo(() =>
    porCategoria.map(({ cat, items }) => {
      const presupuestado = items.reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
      const pctCat = totalPresupuestado > 0 ? (presupuestado / totalPresupuestado) * 100 : 0
      return { cat, presupuestado, pctCat }
    }), [porCategoria, totalPresupuestado])

  const flujoPorFrecuencia = useMemo(() =>
    activas.reduce(
      (acc, p) => {
        const mensual = calcMensual(p.monto ?? 0, p.frecuencia)
        const sign = p.tipo === "ingreso" ? 1 : -1
        return {
          semana:      acc.semana      + sign * (mensual / 4.33),
          mensual:     acc.mensual     + sign * mensual,
          trimestral:  acc.trimestral  + sign * mensual * 3,
          anual:       acc.anual       + sign * mensual * 12,
        }
      },
      { semana: 0, mensual: 0, trimestral: 0, anual: 0 }
    ), [activas])

  const gastoPorSemana = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of gastos) {
      const k = weekKey(g.fecha)
      if (!k) continue
      map.set(k, (map.get(k) ?? 0) + Number(g.monto ?? 0))
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8).reverse()
      .map(([monday, total]) => ({ monday, rangeLabel: weekRangeLabel(monday), total: Math.round(total) }))
  }, [gastos])

  const semanaActualKey = weekKey(new Date().toISOString().split("T")[0])
  const mesLabel = new Date(mes + "-15").toLocaleString("es-MX", { month: "long", year: "numeric" })
  const esMesActual = mes === mesDefault

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(p: PartidaPresupuestoType) {
    setEditing(p)
    setForm({ descripcion: p.descripcion, categoria: p.categoria ?? "Operaciones", tipo: p.tipo ?? "gasto", frecuencia: p.frecuencia ?? "mensual", monto: p.monto ? String(p.monto) : "" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) { toast.error("La descripción es obligatoria"); return }
    if (!form.monto) { toast.error("El monto es obligatorio"); return }
    setSaving(true)
    try {
      const payload = { descripcion: form.descripcion, categoria: form.categoria || null, tipo: form.tipo as any || null, frecuencia: form.frecuencia as any || null, monto: Number(form.monto), activo: true, ambito: "empresa" }
      if (editing) {
        const updated = await updatePartida(editing.documentId, payload)
        setPartidas(prev => prev.map(p => p.documentId === editing.documentId ? updated : p))
        toast.success("Partida actualizada")
      } else {
        const nueva = await createPartida(payload)
        setPartidas(prev => [...prev, nueva])
        toast.success("Partida creada")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deletePartida(documentId)
      setPartidas(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Partida eliminada")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  if (error) return <div className="p-8 text-sm text-red-400">Error: {error}</div>

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Presupuesto</h1>
          <p className="text-sm text-slate-500">Planifica ingresos y egresos por área de la empresa.</p>
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
          <Plus size={15} /> Nueva partida
        </button>
      </div>

      {/* Presupuesto vs Real */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-5 space-y-5">

        {/* Selector de mes */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Presupuesto vs Real</h2>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => {
                const d = new Date(mes + "-15"); d.setMonth(d.getMonth() - 1)
                setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
              }} className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors">←</button>
              <input type="month" title="Seleccionar mes" value={mes} onChange={e => setMes(e.target.value)}
                className="h-7 text-xs bg-slate-800 border border-slate-700 rounded-md px-2 text-slate-300" />
              <button type="button" onClick={() => {
                const d = new Date(mes + "-15"); d.setMonth(d.getMonth() + 1)
                setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
              }} className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors">→</button>
              {!esMesActual && (
                <button type="button" onClick={() => setMes(mesDefault)} className="text-[10px] text-cyan-400 hover:text-cyan-300 ml-1">Hoy</button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 capitalize">{mesLabel}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">Presupuesto mensual</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{fmt(totalPresupuestado)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">total gastos planificados</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">Gastado en {mesLabel}</span>
            </div>
            <div className="flex items-end justify-between">
              <p className={`text-lg font-bold ${pct > 100 ? "text-red-400" : "text-amber-400"}`}>{fmt(totalGastado)}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pct > 100 ? "bg-red-500/10 text-red-400" : pct > 80 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {Math.round(pct)}%
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              {disponible >= 0
                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
              <span className="text-[10px] text-slate-500 uppercase font-medium">Disponible</span>
            </div>
            <p className={`text-lg font-bold ${disponible >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(disponible)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">restante del presupuesto</p>
          </motion.div>
        </div>

        {/* Barra total presupuesto vs real */}
        {totalPresupuestado > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Total gastos del mes</span>
              <span className="text-[10px] text-slate-500">{fmt(totalGastado)} / {fmt(totalPresupuestado)}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-blue-500"}`}
              />
            </div>
          </div>
        )}

        {/* Barras por área */}
        {comparativa.length > 0 && (
          <>
            <h4 className="text-[10px] text-slate-500 uppercase font-medium">Distribución por área</h4>
            <div className="space-y-3">
              {comparativa.map((c, i) => (
                <motion.div key={c.cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{c.cat}</span>
                    <span className="text-[10px] text-slate-500">{fmt(c.presupuestado)} · {Math.round(c.pctCat)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pctCat}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 * i }}
                      className={`h-full rounded-full ${CAT_BAR[c.cat] ?? "bg-zinc-500"}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      {comparativa.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Distribución presupuesto mensual</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={comparativa} dataKey="presupuestado" nameKey="cat" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                    {comparativa.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`$${Math.round(v).toLocaleString("es-MX")}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {comparativa.map((c, i) => (
                  <div key={c.cat} className="flex items-center gap-2 min-w-0">
                    <ChartDot color={CHART_COLORS[i % CHART_COLORS.length]} />
                    <span className="text-[11px] text-slate-400 truncate flex-1">{c.cat}</span>
                    <span className="text-[11px] text-slate-300 font-medium shrink-0">{fmt(c.presupuestado)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Presupuesto por área — {mesLabel}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparativa.map(c => ({ cat: c.cat.length > 9 ? c.cat.slice(0, 9) + "…" : c.cat, Presupuesto: Math.round(c.presupuestado) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="cat" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `$${v.toLocaleString("es-MX")}`} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                <Bar dataKey="Presupuesto" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gasto por semana */}
      {gastoPorSemana.length > 0 && (() => {
        const maxTotal = Math.max(...gastoPorSemana.map(s => s.total))
        return (
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Gasto por semana</h3>
            <div className="space-y-1">
              {[...gastoPorSemana].reverse().map(semana => {
                const esActual = semana.monday === semanaActualKey
                const pctW = maxTotal > 0 ? (semana.total / maxTotal) * 100 : 0
                return (
                  <div key={semana.monday} className={`rounded-lg px-3 py-3 transition-colors ${esActual ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-slate-800/40"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-mono w-36 shrink-0 ${esActual ? "text-blue-300 font-semibold" : "text-slate-400"}`}>{semana.rangeLabel}</span>
                      <WeekBar pct={pctW} />
                      <span className={`text-sm font-bold w-24 text-right shrink-0 ${esActual ? "text-blue-200" : "text-slate-300"}`}>{fmt(semana.total)}</span>
                      {esActual && <span className="text-[10px] text-blue-400 font-medium shrink-0">esta semana</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Tabla de partidas con proyecciones */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-slate-800 bg-slate-800/60">
              <tr>
                <th className="h-10 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Área / Tipo</th>
                <th className="h-10 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Semana</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Mensual</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Trimestral</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Anual</th>
                <th className="h-10 px-4"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3.5 rounded bg-slate-800 animate-pulse" /></td>
                  ))}
                </tr>
              ))}

              {!loading && porCategoria.map(({ cat, items }) => {
                const subtotal = items.reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
                return [
                  <tr key={`cat-${cat}`} className="bg-slate-800/40 border-t-2 border-slate-700/60">
                    <td colSpan={2} className="px-4 py-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{cat}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-slate-400">{fmt(subtotal / 4.33)}</td>
                    <td className="px-4 py-2 text-right text-xs font-bold text-slate-200">{fmt(subtotal)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-slate-400">{fmt(subtotal * 3)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-slate-400">{fmt(subtotal * 12)}</td>
                    <td />
                  </tr>,
                  ...items.map(p => {
                    const mensual = calcMensual(p.monto ?? 0, p.frecuencia)
                    const esIng = p.tipo === "ingreso"
                    const colorNum = esIng ? "text-emerald-400" : "text-slate-200"
                    return (
                      <tr key={p.documentId} className="border-b border-slate-800/40 hover:bg-slate-800/20 group transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">{p.frecuencia ?? "mensual"}</span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-200">{p.descripcion}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums text-xs text-slate-400`}>{fmt(mensual / 4.33)}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums text-sm font-semibold ${colorNum}`}>{fmt(mensual)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">{fmt(mensual * 3)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">{fmt(mensual * 12)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" title="Editar" onClick={() => openEditar(p)} className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                            {delId === p.documentId ? (
                              <div className="flex items-center gap-1 px-1">
                                <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 font-medium">Sí</button>
                                <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                              </div>
                            ) : (
                              <button type="button" title="Eliminar" onClick={() => setDelId(p.documentId)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><X size={13} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }),
                ]
              })}

              {!loading && activas.length > 0 && (
                <tr className="border-t-2 border-slate-600 bg-slate-900">
                  <td colSpan={2} className="px-4 py-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Flujo neto</span>
                  </td>
                  {([flujoPorFrecuencia.semana, flujoPorFrecuencia.mensual, flujoPorFrecuencia.trimestral, flujoPorFrecuencia.anual]).map((val, i) => (
                    <td key={i} className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {val >= 0 ? "+" : ""}{fmt(val)}
                      </span>
                    </td>
                  ))}
                  <td />
                </tr>
              )}
            </tbody>
          </table>

          {!loading && activas.length === 0 && (
            <div className="py-16 text-center text-slate-600">
              <TrendingDown size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin partidas. Agrega la primera.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar partida" : "Nueva partida"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción <span className="text-red-400">*</span></label>
                <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inp} placeholder="Ej. Renta bodega, Campaña Meta…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Área</label>
                  <select title="Área" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inp + " cursor-pointer"}>
                    {CATEGORIAS_EMPRESA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select title="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp + " cursor-pointer"}>
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Frecuencia</label>
                  <select title="Frecuencia" value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} className={inp + " cursor-pointer"}>
                    {FRECUENCIAS.map(fr => <option key={fr} value={fr}>{fr.charAt(0).toUpperCase() + fr.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($) <span className="text-red-400">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} className={inp} placeholder="0.00" />
                </div>
              </div>
              {form.monto && Number(form.monto) > 0 && form.frecuencia !== "mensual" && (
                <p className="text-[11px] text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                  Equivale a {fmt(calcMensual(Number(form.monto), form.frecuencia))} / mes
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
