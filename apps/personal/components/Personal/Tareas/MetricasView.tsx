"use client"

import { useMemo, useState, useRef, useLayoutEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { TareaType, EstadoTarea } from "@/types/tarea"

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<EstadoTarea, string> = {
  pendiente:   "bg-amber-500",
  en_progreso: "bg-blue-500",
  completada:  "bg-emerald-500",
}

const TOOLTIP_STYLE = {
  background: "#18181b", border: "1px solid #3f3f46",
  borderRadius: "8px", fontSize: "12px", color: "#a1a1aa",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const diasEntre = (a: string, b: string) =>
  Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000)

const fmtDias = (d: number) => d === 1 ? "1 día" : `${d} días`

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function Fill({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.width = `${pct}%` }, [pct])
  return <div ref={ref} className={`h-full rounded-full ${color}`} />
}

function ColorDot({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = color }, [color])
  return <span ref={ref} className="w-2 h-2 rounded-full shrink-0" />
}

function HBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <Fill pct={pct} color={color} />
    </div>
  )
}

type PeriodFilter = "todo" | "mes" | "semana"

// ─── Componente principal ─────────────────────────────────────────────────────

export function MetricasView({ tareas }: { tareas: TareaType[] }) {
  const [periodo, setPeriodo] = useState<PeriodFilter>("todo")

  const hoyMs = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() }, [])
  const hoyIso = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
  }, [])

  const tareasFiltradas = useMemo(() => {
    if (periodo === "todo") return tareas
    const corte = new Date(hoyMs)
    if (periodo === "semana") corte.setDate(corte.getDate() - 7)
    if (periodo === "mes")    corte.setMonth(corte.getMonth() - 1)
    const corteMs = corte.getTime()
    return tareas.filter(t => {
      const ref = t.fechaCompletada ?? t.createdAt
      if (!ref) return true
      return new Date(ref).getTime() >= corteMs
    })
  }, [tareas, periodo, hoyMs])

  // ── Estadísticas generales ─────────────────────────────────────────────────

  const total       = tareasFiltradas.length
  const completadas = tareasFiltradas.filter(t => t.estado === "completada").length
  const enProgreso  = tareasFiltradas.filter(t => t.estado === "en_progreso").length
  const pendientes  = tareasFiltradas.filter(t => t.estado === "pendiente").length
  const tasaCompletado   = total ? Math.round(completadas / total * 100) : 0
  const progresoPromedio = total
    ? Math.round(tareasFiltradas.reduce((s, t) => s + (t.progreso ?? 0), 0) / total)
    : 0

  const conRango = tareasFiltradas.filter(t => t.fechaInicio && t.fechaVencimiento)
  const duracionPromedio = conRango.length
    ? Math.round(conRango.reduce((s, t) => s + diasEntre(t.fechaInicio!, t.fechaVencimiento!), 0) / conRango.length)
    : null

  const enCursoHoy = tareasFiltradas.filter(t => {
    if (t.estado === "completada") return false
    const desde = t.fechaInicio ?? null
    const hasta  = t.fechaVencimiento ?? null
    if (!desde && !hasta) return false
    return (desde ? desde <= hoyIso : true) && (hasta ? hoyIso <= hasta : true)
  }).length

  // ── Donut estado ──────────────────────────────────────────────────────────

  const donutEstado = [
    { name: "Completadas", value: completadas, color: "#10b981" },
    { name: "En progreso", value: enProgreso,  color: "#3b82f6" },
    { name: "Pendientes",  value: pendientes,  color: "#f59e0b" },
  ].filter(d => d.value > 0)

  // ── Por responsable ────────────────────────────────────────────────────────

  const porResponsable = useMemo(() => {
    const map = new Map<string, TareaType[]>()
    tareasFiltradas.forEach(t => {
      const key = t.responsable?.trim() || "(Sin asignar)"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return [...map.entries()]
      .map(([nombre, ts]) => {
        const conDur = ts.filter(t => t.fechaInicio && t.fechaVencimiento)
        return {
          nombre,
          total: ts.length,
          completadas: ts.filter(t => t.estado === "completada").length,
          enProgreso:  ts.filter(t => t.estado === "en_progreso").length,
          pendientes:  ts.filter(t => t.estado === "pendiente").length,
          progreso: ts.length
            ? Math.round(ts.reduce((s, t) => s + (t.progreso ?? 0), 0) / ts.length)
            : 0,
          durPromedio: conDur.length
            ? Math.round(conDur.reduce((s, t) => s + diasEntre(t.fechaInicio!, t.fechaVencimiento!), 0) / conDur.length)
            : null,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [tareasFiltradas])

  // ── Por área ──────────────────────────────────────────────────────────────

  const porArea = useMemo(() => {
    const map = new Map<string, TareaType[]>()
    tareasFiltradas.forEach(t => {
      const key = t.area?.trim() || "(Sin área)"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return [...map.entries()]
      .map(([area, ts]) => ({
        area,
        total: ts.length,
        completadas: ts.filter(t => t.estado === "completada").length,
      }))
      .sort((a, b) => b.total - a.total)
  }, [tareasFiltradas])

  const maxArea = porArea.reduce((m, a) => Math.max(m, a.total), 0)

  // ── Por etiqueta ──────────────────────────────────────────────────────────

  const porEtiqueta = useMemo(() => {
    const map = new Map<string, TareaType[]>()
    tareasFiltradas.forEach(t => {
      const key = t.etiqueta?.trim() || "(Sin etiqueta)"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return [...map.entries()]
      .map(([etiqueta, ts]) => ({
        etiqueta,
        total: ts.length,
        completadas: ts.filter(t => t.estado === "completada").length,
      }))
      .sort((a, b) => b.total - a.total)
  }, [tareasFiltradas])

  const maxEtiqueta = porEtiqueta.reduce((m, e) => Math.max(m, e.total), 0)

  // ── Duración por tarea ────────────────────────────────────────────────────

  const tareasConRango = useMemo(() =>
    tareasFiltradas
      .filter(t => t.fechaInicio && t.fechaVencimiento)
      .map(t => ({
        ...t,
        duracion: diasEntre(t.fechaInicio!, t.fechaVencimiento!),
        vencida: t.fechaVencimiento! < hoyIso && t.estado !== "completada",
      }))
      .sort((a, b) => a.fechaInicio! < b.fechaInicio! ? -1 : a.fechaInicio! > b.fechaInicio! ? 1 : 0),
  [tareasFiltradas, hoyIso])

  const maxDuracion = tareasConRango.reduce((m, t) => Math.max(m, t.duracion), 0)

  // ── Completadas por mes — recharts ────────────────────────────────────────

  const completadasPorMes = useMemo(() => {
    const map = new Map<string, number>()
    tareasFiltradas
      .filter(t => t.estado === "completada" && t.fechaCompletada)
      .forEach(t => {
        const d = new Date(t.fechaCompletada!)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        map.set(key, (map.get(key) ?? 0) + 1)
      })
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, count]) => {
        const [anio, m] = key.split("-")
        const label = new Date(Number(anio), Number(m) - 1, 1)
          .toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
        return { mes: label, count }
      })
  }, [tareasFiltradas])

  // ── Tickets de servicio ───────────────────────────────────────────────────

  const tickets = useMemo(() =>
    tareasFiltradas.filter(t => t.esTicket === true), [tareasFiltradas])

  const ticketStats = useMemo(() => {
    const comp = tickets.filter(t => t.estado === "completada").length
    const pend  = tickets.filter(t => t.estado === "pendiente").length
    const prog  = tickets.filter(t => t.estado === "en_progreso").length
    return { total: tickets.length, comp, pend, prog, tasa: tickets.length ? Math.round(comp / tickets.length * 100) : 0 }
  }, [tickets])

  const donutTickets = useMemo(() => [
    { name: "Tickets",       value: tickets.length,                           color: "#3b82f6" },
    { name: "Tareas normal", value: tareasFiltradas.length - tickets.length,  color: "#3f3f46" },
  ].filter(d => d.value > 0), [tickets, tareasFiltradas])

  const ticketsPorMes = useMemo(() => {
    const map = new Map<string, { total: number; completados: number }>()
    tickets.forEach(t => {
      const fecha = t.fechaInicio ?? t.createdAt
      if (!fecha) return
      const d   = new Date(fecha)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const e   = map.get(key) ?? { total: 0, completados: 0 }
      map.set(key, { total: e.total + 1, completados: e.completados + (t.estado === "completada" ? 1 : 0) })
    })
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const [anio, m] = key.split("-")
        const label = new Date(Number(anio), Number(m) - 1, 1)
          .toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
        return { mes: label, ...v }
      })
  }, [tickets])

  const ticketsPorArea = useMemo(() => {
    const map = new Map<string, { total: number; completados: number }>()
    tickets.forEach(t => {
      const key = t.area?.trim() || "(Sin área)"
      const e   = map.get(key) ?? { total: 0, completados: 0 }
      map.set(key, { total: e.total + 1, completados: e.completados + (t.estado === "completada" ? 1 : 0) })
    })
    return [...map.entries()]
      .map(([area, v]) => ({ area, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [tickets])

  const ticketsPorResp = useMemo(() => {
    const map = new Map<string, { total: number; completados: number }>()
    tickets.forEach(t => {
      const key = t.responsable?.trim() || "(Sin asignar)"
      const e   = map.get(key) ?? { total: 0, completados: 0 }
      map.set(key, { total: e.total + 1, completados: e.completados + (t.estado === "completada" ? 1 : 0) })
    })
    return [...map.entries()]
      .map(([resp, v]) => ({ resp, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [tickets])

  const fmtFechaCort = (iso: string) => {
    const d = new Date(iso + "T00:00:00")
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Filtro de periodo */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Periodo:</span>
        {(["todo", "mes", "semana"] as PeriodFilter[]).map(p => (
          <button key={p} type="button" onClick={() => setPeriodo(p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              periodo === p
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}>
            {p === "todo" ? "Todo" : p === "mes" ? "Último mes" : "Última semana"}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total"          value={total} />
        <StatCard label="Completadas"    value={completadas}  sub={`${tasaCompletado}% del total`} />
        <StatCard label="En progreso"    value={enProgreso} />
        <StatCard label="Pendientes"     value={pendientes} />
        <StatCard label="Progreso prom." value={`${progresoPromedio}%`} />
        <StatCard label="En curso hoy"   value={enCursoHoy}
          sub={duracionPromedio !== null ? `Dur. prom. ${fmtDias(duracionPromedio)}` : undefined} />
      </div>

      {/* Tasa completado + donut estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Tasa de completado</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <Fill pct={tasaCompletado} color="bg-emerald-500" />
              <Fill pct={total ? Math.round(enProgreso / total * 100) : 0} color="bg-blue-500" />
              <Fill pct={total ? Math.round(pendientes / total * 100) : 0} color="bg-amber-500" />
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-10 text-right">{tasaCompletado}%</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {(["completada","en_progreso","pendiente"] as EstadoTarea[]).map(e => (
              <div key={e} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ESTADO_COLOR[e]}`} />
                <span className="text-[11px] text-muted-foreground capitalize">{e.replace("_"," ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut distribución estado */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Distribución por estado</h3>
          {donutEstado.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sin datos</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={120}>
                <PieChart>
                  <Pie data={donutEstado} cx="50%" cy="50%" innerRadius={36} outerRadius={55}
                    dataKey="value" paddingAngle={2}>
                    {donutEstado.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 flex-1">
                {donutEstado.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px]">
                    <ColorDot color={d.color} />
                    <span className="text-muted-foreground flex-1">{d.name}</span>
                    <span className="font-medium">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por responsable */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Por responsable</h3>
          {porResponsable.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {porResponsable.map(r => (
                <div key={r.nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate max-w-[140px]" title={r.nombre}>{r.nombre}</span>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                      <span className="text-emerald-600 dark:text-emerald-400">{r.completadas} ✓</span>
                      <span>{r.progreso}% prog</span>
                      {r.durPromedio !== null && <span>{fmtDias(r.durPromedio)} prom</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HBar value={r.completadas} max={r.total} color="bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{r.total} t</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por área */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Por área de solicitud</h3>
          {porArea.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-2.5">
              {porArea.map(a => (
                <div key={a.area} className="flex items-center gap-2">
                  <span className="text-xs truncate w-28 shrink-0" title={a.area}>{a.area}</span>
                  <HBar value={a.total} max={maxArea} color="bg-violet-500" />
                  <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{a.total}</span>
                  <span className="text-[10px] text-emerald-500 w-6 shrink-0">{a.completadas > 0 ? `${Math.round(a.completadas/a.total*100)}%` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por etiqueta */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Por categoría (etiqueta)</h3>
          {porEtiqueta.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-2.5">
              {porEtiqueta.map(e => (
                <div key={e.etiqueta} className="flex items-center gap-2">
                  <span className="text-xs truncate w-28 shrink-0" title={e.etiqueta}>{e.etiqueta}</span>
                  <HBar value={e.total} max={maxEtiqueta} color="bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{e.total}</span>
                  <span className="text-[10px] text-emerald-500 w-6 shrink-0">{e.completadas > 0 ? `${Math.round(e.completadas/e.total*100)}%` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completadas por mes — BarChart */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Completadas por mes</h3>
          {completadasPorMes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin completadas registradas</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={completadasPorMes} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={24} />
                <RCTooltip formatter={(v: number) => [v, "Completadas"]} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#71717a", marginBottom: 4 }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Duración por tarea */}
      {tareasConRango.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Duración de tareas (fecha inicio → fin)</h3>
          <div className="space-y-2">
            {tareasConRango.map(t => (
              <div key={t.documentId} className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <p className="text-xs truncate font-medium" title={t.titulo}>{t.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{t.responsable ?? "—"}</p>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <HBar value={t.duracion} max={maxDuracion}
                    color={t.estado === "completada" ? "bg-emerald-500" : t.vencida ? "bg-red-500" : t.estado === "en_progreso" ? "bg-blue-500" : "bg-amber-400"} />
                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                    {fmtFechaCort(t.fechaInicio!)} → {fmtFechaCort(t.fechaVencimiento!)}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 w-12 text-right">{fmtDias(t.duracion)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════ TICKETS DE SERVICIO ══════════════════════════════ */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Tickets de servicio</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {ticketStats.total} total
          </span>
        </div>

        {ticketStats.total === 0 ? (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-xs text-muted-foreground">
            No hay tickets de servicio en este periodo. Marca tareas como tickets desde la vista de lista.
          </div>
        ) : (
          <>
            {/* Stat cards tickets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl p-4">
                <p className="text-[10px] text-blue-500 uppercase tracking-wide">Tickets</p>
                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{ticketStats.total}</p>
              </div>
              <div className="border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-xl p-4">
                <p className="text-[10px] text-emerald-500 uppercase tracking-wide">Resueltos</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{ticketStats.comp}</p>
              </div>
              <div className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 rounded-xl p-4">
                <p className="text-[10px] text-amber-500 uppercase tracking-wide">Pendientes</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{ticketStats.pend}</p>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasa resolución</p>
                <p className="text-2xl font-bold mt-1">{ticketStats.tasa}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Donut tickets vs tareas */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2">Tickets vs tareas normales</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={120}>
                    <PieChart>
                      <Pie data={donutTickets} cx="50%" cy="50%" innerRadius={36} outerRadius={55}
                        dataKey="value" paddingAngle={2}>
                        {donutTickets.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="space-y-2 flex-1">
                    {donutTickets.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px]">
                        <ColorDot color={d.color} />
                        <span className="text-muted-foreground flex-1">{d.name}</span>
                        <span className="font-medium">{d.value}</span>
                        <span className="text-muted-foreground">
                          {tareasFiltradas.length > 0 ? `${Math.round(d.value / tareasFiltradas.length * 100)}%` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tickets por mes */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Tickets por mes</h3>
                {ticketsPorMes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">Sin datos con fecha</p>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={ticketsPorMes} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={24} />
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#71717a", marginBottom: 4 }} />
                      <Bar dataKey="total"      name="Total"     fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Tickets por área */}
              {ticketsPorArea.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Tickets por área</h3>
                  <ResponsiveContainer width="100%" height={Math.max(100, ticketsPorArea.length * 28)}>
                    <BarChart data={ticketsPorArea} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="area" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={80} />
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                      <Bar dataKey="total"       name="Total"     fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={14} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tickets por responsable */}
              {ticketsPorResp.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Tickets por responsable</h3>
                  <ResponsiveContainer width="100%" height={Math.max(100, ticketsPorResp.length * 28)}>
                    <BarChart data={ticketsPorResp} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="resp" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={80} />
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                      <Bar dataKey="total"       name="Total"     fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={14} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
