"use client"

import { useMemo, useState, useRef, useLayoutEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { TareaType, EstadoTarea } from "@/types/tarea"
import { HistorialTareaType } from "@/types/historial-tarea"

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<EstadoTarea, string> = {
  pendiente:   "bg-amber-500",
  en_progreso: "bg-blue-500",
  en_pausa:    "bg-violet-500",
  completada:  "bg-emerald-500",
}

const ESTADO_HEX: Record<EstadoTarea, string> = {
  pendiente:   "#f59e0b",
  en_progreso: "#3b82f6",
  en_pausa:    "#8b5cf6",
  completada:  "#10b981",
}

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente:   "Pendiente",
  en_progreso: "En progreso",
  en_pausa:    "En pausa",
  completada:  "Completada",
}

const TOOLTIP_STYLE = {
  background: "#18181b", border: "1px solid #3f3f46",
  borderRadius: "8px", fontSize: "12px", color: "#a1a1aa",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTs(s: string): number {
  return new Date(s).getTime()
}

function msAHoras(ms: number): number {
  return ms / (1000 * 60 * 60)
}

function fmtDuracion(horas: number): string {
  if (horas < 1)   return "< 1h"
  if (horas < 24)  return `${Math.round(horas)}h`
  const d = Math.floor(horas / 24)
  const h = Math.round(horas % 24)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}

function fmtHorasCorto(horas: number): string {
  if (horas < 1)   return "< 1h"
  if (horas < 24)  return `${Math.round(horas)}h`
  return `${(horas / 24).toFixed(1)}d`
}

// Dado el historial de UNA tarea (ordenado por timestamp),
// devuelve las horas acumuladas en cada estado.
function calcularTiempoPorEstado(
  entradas: HistorialTareaType[],
  tarea: TareaType,
): Record<EstadoTarea, number> {
  const acc: Record<EstadoTarea, number> = { pendiente: 0, en_progreso: 0, en_pausa: 0, completada: 0 }

  if (entradas.length === 0) return acc

  const sorted = [...entradas].sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp))

  for (let i = 0; i < sorted.length; i++) {
    const desde = parseTs(sorted[i].timestamp)
    const hasta = i + 1 < sorted.length
      ? parseTs(sorted[i + 1].timestamp)
      : tarea.fechaCompletada
        ? parseTs(tarea.fechaCompletada)
        : Date.now()

    const estado = sorted[i].estadoNuevo as EstadoTarea
    if (estado in acc) {
      acc[estado] += msAHoras(Math.max(0, hasta - desde))
    }
  }

  return acc
}

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

export function MetricasView({ tareas, historial }: { tareas: TareaType[]; historial: HistorialTareaType[] }) {
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
  const enPausa     = tareasFiltradas.filter(t => t.estado === "en_pausa").length
  const tasaCompletado   = total ? Math.round(completadas / total * 100) : 0
  const progresoPromedio = total
    ? Math.round(tareasFiltradas.reduce((s, t) => s + (t.progreso ?? 0), 0) / total)
    : 0

  // ── Donut estado ──────────────────────────────────────────────────────────

  const donutEstado = [
    { name: "Completadas", value: completadas, color: "#10b981" },
    { name: "En progreso", value: enProgreso,  color: "#3b82f6" },
    { name: "En pausa",    value: enPausa,     color: "#8b5cf6" },
    { name: "Pendientes",  value: pendientes,  color: "#f59e0b" },
  ].filter(d => d.value > 0)

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

  // ══════════════════════════════════════════════════════════════════════════
  // TIEMPO POR ETAPA — usando historial
  // ══════════════════════════════════════════════════════════════════════════

  const historialPorTarea = useMemo(() => {
    const map = new Map<string, HistorialTareaType[]>()
    historial.forEach(h => {
      if (!map.has(h.tareaDocumentId)) map.set(h.tareaDocumentId, [])
      map.get(h.tareaDocumentId)!.push(h)
    })
    return map
  }, [historial])

  // Tareas con al menos una entrada de historial
  const tareasConHistorial = useMemo(() =>
    tareasFiltradas.filter(t => historialPorTarea.has(t.documentId)),
  [tareasFiltradas, historialPorTarea])

  // Acumulado global de horas por estado
  const acumuladoGlobal = useMemo(() => {
    const acc: Record<EstadoTarea, number> = { pendiente: 0, en_progreso: 0, en_pausa: 0, completada: 0 }
    tareasConHistorial.forEach(t => {
      const entradas = historialPorTarea.get(t.documentId) ?? []
      const tiempos  = calcularTiempoPorEstado(entradas, t)
      ;(Object.keys(tiempos) as EstadoTarea[]).forEach(e => { acc[e] += tiempos[e] })
    })
    return acc
  }, [tareasConHistorial, historialPorTarea])

  const totalHorasHistorial = Object.values(acumuladoGlobal).reduce((s, v) => s + v, 0)

  // Promedio por estado (solo sobre tareas con historial)
  const promedioEstado = useMemo(() => {
    const n = tareasConHistorial.length
    if (!n) return null
    return {
      pendiente:   acumuladoGlobal.pendiente   / n,
      en_progreso: acumuladoGlobal.en_progreso / n,
      en_pausa:    acumuladoGlobal.en_pausa    / n,
      completada:  acumuladoGlobal.completada  / n,
    }
  }, [acumuladoGlobal, tareasConHistorial])

  // Tiempo por etapa agrupado por etiqueta — para gráfica de barras apiladas
  const tiempoPorEtiqueta = useMemo(() => {
    const map = new Map<string, Record<EstadoTarea, number>>()
    tareasConHistorial.forEach(t => {
      const key      = t.etiqueta?.trim() || "(Sin etiqueta)"
      const entradas = historialPorTarea.get(t.documentId) ?? []
      const tiempos  = calcularTiempoPorEstado(entradas, t)
      const actual   = map.get(key) ?? { pendiente: 0, en_progreso: 0, en_pausa: 0, completada: 0 }
      ;(Object.keys(tiempos) as EstadoTarea[]).forEach(e => { actual[e] += tiempos[e] })
      map.set(key, actual)
    })
    return [...map.entries()]
      .map(([etiqueta, t]) => ({
        etiqueta: etiqueta.length > 14 ? etiqueta.slice(0, 13) + "…" : etiqueta,
        etiquetaFull: etiqueta,
        pendiente:   Math.round(t.pendiente),
        en_progreso: Math.round(t.en_progreso),
        en_pausa:    Math.round(t.en_pausa),
      }))
      .sort((a, b) => (b.pendiente + b.en_progreso + b.en_pausa) - (a.pendiente + a.en_progreso + a.en_pausa))
  }, [tareasConHistorial, historialPorTarea])

  // Ranking de tareas completadas por cycle time (en_progreso acumulado)
  const rankingCycleTime = useMemo(() =>
    tareasConHistorial
      .filter(t => t.estado === "completada")
      .map(t => {
        const entradas = historialPorTarea.get(t.documentId) ?? []
        const tiempos  = calcularTiempoPorEstado(entradas, t)
        return { tarea: t, horas: tiempos.en_progreso, pausaHoras: tiempos.en_pausa }
      })
      .filter(x => x.horas > 0 || x.pausaHoras > 0)
      .sort((a, b) => (b.horas + b.pausaHoras) - (a.horas + a.pausaHoras))
      .slice(0, 10),
  [tareasConHistorial, historialPorTarea])

  const maxCycleTime = rankingCycleTime.reduce((m, x) => Math.max(m, x.horas + x.pausaHoras), 0)

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
        <StatCard label="En pausa"       value={enPausa} />
        <StatCard label="Pendientes"     value={pendientes} />
        <StatCard label="Progreso prom." value={`${progresoPromedio}%`} />
      </div>

      {/* Tasa completado + donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Tasa de completado</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <Fill pct={tasaCompletado} color="bg-emerald-500" />
              <Fill pct={total ? Math.round(enProgreso / total * 100) : 0} color="bg-blue-500" />
              <Fill pct={total ? Math.round(enPausa / total * 100) : 0} color="bg-violet-500" />
              <Fill pct={total ? Math.round(pendientes / total * 100) : 0} color="bg-amber-500" />
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-10 text-right">{tasaCompletado}%</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {(["completada","en_progreso","en_pausa","pendiente"] as EstadoTarea[]).map(e => (
              <div key={e} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ESTADO_COLOR[e]}`} />
                <span className="text-[11px] text-muted-foreground capitalize">{ESTADO_LABEL[e]}</span>
              </div>
            ))}
          </div>
        </div>

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

      {/* Por área + Por etiqueta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span className="text-[10px] text-emerald-500 w-10 shrink-0 text-right">
                    {a.completadas > 0 ? `${Math.round(a.completadas/a.total*100)}%` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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
                  <span className="text-[10px] text-emerald-500 w-10 shrink-0 text-right">
                    {e.completadas > 0 ? `${Math.round(e.completadas/e.total*100)}%` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ TIEMPO POR ETAPA ══════════════════════════════════ */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Tiempo por etapa</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {tareasConHistorial.length} tareas con historial
          </span>
        </div>

        {tareasConHistorial.length === 0 ? (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Sin historial aún.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cada vez que cambies el estado de una tarea, se registrará el tiempo en cada etapa.
            </p>
          </div>
        ) : (
          <>
            {/* Cards promedio por estado */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["pendiente", "en_progreso", "en_pausa", "completada"] as EstadoTarea[]).map(e => (
                <div key={e} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_COLOR[e]}`} />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{ESTADO_LABEL[e]}</p>
                  </div>
                  <p className="text-xl font-bold">
                    {promedioEstado ? fmtDuracion(promedioEstado[e]) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">promedio por tarea</p>
                  <p className="text-[10px] text-muted-foreground">
                    total: {fmtDuracion(acumuladoGlobal[e])}
                  </p>
                </div>
              ))}
            </div>

            {/* Barra de distribución global */}
            {totalHorasHistorial > 0 && (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">Distribución global de tiempo</h3>
                <div className="h-4 w-full rounded-full overflow-hidden flex gap-0.5">
                  {(["pendiente","en_progreso","en_pausa","completada"] as EstadoTarea[]).map(e => {
                    const pct = Math.round(acumuladoGlobal[e] / totalHorasHistorial * 100)
                    if (pct === 0) return null
                    return (
                      <div key={e} title={`${ESTADO_LABEL[e]}: ${pct}%`}
                        style={{ width: `${pct}%`, backgroundColor: ESTADO_HEX[e] }}
                        className="h-full rounded-sm transition-all" />
                    )
                  })}
                </div>
                <div className="flex gap-4 flex-wrap">
                  {(["pendiente","en_progreso","en_pausa","completada"] as EstadoTarea[]).map(e => {
                    const pct = totalHorasHistorial ? Math.round(acumuladoGlobal[e] / totalHorasHistorial * 100) : 0
                    if (pct === 0) return null
                    return (
                      <div key={e} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${ESTADO_COLOR[e]}`} />
                        <span className="text-[11px] text-muted-foreground">{ESTADO_LABEL[e]}</span>
                        <span className="text-[11px] font-medium">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tiempo por etapa por categoría — stacked bar */}
            {tiempoPorEtiqueta.length > 0 && (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Tiempo por etapa por categoría (horas)</h3>
                <ResponsiveContainer width="100%" height={Math.max(140, tiempoPorEtiqueta.length * 32)}>
                  <BarChart data={tiempoPorEtiqueta} layout="vertical"
                    margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false}
                      tickFormatter={v => fmtHorasCorto(v)} />
                    <YAxis type="category" dataKey="etiqueta"
                      tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={90} />
                    <RCTooltip
                      contentStyle={TOOLTIP_STYLE}
                      itemStyle={{ color: "#a1a1aa" }}
                      formatter={(v: number, name: string) => [fmtDuracion(v), name]}
                    />
                    <Bar dataKey="pendiente"   name="Pendiente"   stackId="a" fill={ESTADO_HEX.pendiente}   maxBarSize={16} />
                    <Bar dataKey="en_pausa"    name="En pausa"    stackId="a" fill={ESTADO_HEX.en_pausa}    maxBarSize={16} />
                    <Bar dataKey="en_progreso" name="En progreso" stackId="a" fill={ESTADO_HEX.en_progreso} maxBarSize={16} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ranking de tareas por tiempo total activo */}
            {rankingCycleTime.length > 0 && (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Tareas completadas — tiempo activo (en progreso + pausa)</h3>
                <div className="space-y-2">
                  {rankingCycleTime.map(({ tarea, horas, pausaHoras }) => (
                    <div key={tarea.documentId} className="flex items-center gap-3">
                      <div className="w-44 shrink-0">
                        <p className="text-xs truncate font-medium" title={tarea.titulo}>{tarea.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{tarea.etiqueta ?? "—"}</p>
                      </div>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${maxCycleTime > 0 ? Math.round(horas / maxCycleTime * 100) : 0}%`, backgroundColor: ESTADO_HEX.en_progreso }}
                          className="h-full" />
                        <div style={{ width: `${maxCycleTime > 0 ? Math.round(pausaHoras / maxCycleTime * 100) : 0}%`, backgroundColor: ESTADO_HEX.en_pausa }}
                          className="h-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">
                        {fmtDuracion(horas + pausaHoras)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: ESTADO_HEX.en_progreso }} />
                    <span className="text-[10px] text-muted-foreground">En progreso</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: ESTADO_HEX.en_pausa }} />
                    <span className="text-[10px] text-muted-foreground">En pausa</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
            No hay tickets de servicio en este periodo.
          </div>
        ) : (
          <>
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
                      <Bar dataKey="total"       name="Total"     fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={24} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {ticketsPorArea.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Tickets por área</h3>
                  <ResponsiveContainer width="100%" height={Math.max(100, ticketsPorArea.length * 28)}>
                    <BarChart data={ticketsPorArea} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="area" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={80} />
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                      <Bar dataKey="total"       name="Total"     fill="#3b82f6" radius={[0,4,4,0]} maxBarSize={14} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[0,4,4,0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {ticketsPorResp.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Tickets por responsable</h3>
                  <ResponsiveContainer width="100%" height={Math.max(100, ticketsPorResp.length * 28)}>
                    <BarChart data={ticketsPorResp} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="resp" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={80} />
                      <RCTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#a1a1aa" }} />
                      <Bar dataKey="total"       name="Total"     fill="#8b5cf6" radius={[0,4,4,0]} maxBarSize={14} />
                      <Bar dataKey="completados" name="Resueltos" fill="#10b981" radius={[0,4,4,0]} maxBarSize={14} />
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
