"use client"

import { useMemo, useState } from "react"
import { TareaType, EstadoTarea } from "@/types/tarea"

const ESTADO_COLOR: Record<EstadoTarea, string> = {
  pendiente:   "bg-amber-500",
  en_progreso: "bg-blue-500",
  completada:  "bg-emerald-500",
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function HBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

type PeriodFilter = "todo" | "mes" | "semana"

export function MetricasView({ tareas }: { tareas: TareaType[] }) {
  const [periodo, setPeriodo] = useState<PeriodFilter>("todo")

  const hoyMs = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() }, [])

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

  const total       = tareasFiltradas.length
  const completadas = tareasFiltradas.filter(t => t.estado === "completada").length
  const enProgreso  = tareasFiltradas.filter(t => t.estado === "en_progreso").length
  const pendientes  = tareasFiltradas.filter(t => t.estado === "pendiente").length
  const tasaCompletado = total ? Math.round(completadas / total * 100) : 0
  const progresoPromedio = total
    ? Math.round(tareasFiltradas.reduce((s, t) => s + (t.progreso ?? 0), 0) / total)
    : 0
  const totalEstimado = tareasFiltradas.reduce((s, t) => s + (t.tiempoEstimado ?? 0), 0)
  const totalReal     = tareasFiltradas.reduce((s, t) => s + (t.tiempoReal ?? 0), 0)

  // ── Por responsable ─────────────────────────────────────────────────────────
  const porResponsable = useMemo(() => {
    const map = new Map<string, TareaType[]>()
    tareasFiltradas.forEach(t => {
      const key = t.responsable?.trim() || "(Sin asignar)"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return [...map.entries()]
      .map(([nombre, ts]) => ({
        nombre,
        total: ts.length,
        completadas: ts.filter(t => t.estado === "completada").length,
        enProgreso:  ts.filter(t => t.estado === "en_progreso").length,
        pendientes:  ts.filter(t => t.estado === "pendiente").length,
        estimado: ts.reduce((s, t) => s + (t.tiempoEstimado ?? 0), 0),
        real:     ts.reduce((s, t) => s + (t.tiempoReal ?? 0), 0),
        progreso: ts.length
          ? Math.round(ts.reduce((s, t) => s + (t.progreso ?? 0), 0) / ts.length)
          : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [tareasFiltradas])

  // ── Por área ─────────────────────────────────────────────────────────────────
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

  // ── Por etiqueta/categoría ────────────────────────────────────────────────
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

  // ── Tiempo estimado vs real ───────────────────────────────────────────────
  const conTiempo = useMemo(() =>
    tareasFiltradas
      .filter(t => t.tiempoEstimado || t.tiempoReal)
      .map(t => ({
        ...t,
        desviacion: (t.tiempoReal ?? 0) - (t.tiempoEstimado ?? 0),
        pct: t.tiempoEstimado
          ? Math.round(((t.tiempoReal ?? 0) / t.tiempoEstimado) * 100)
          : null,
      }))
      .sort((a, b) => b.desviacion - a.desviacion),
  [tareasFiltradas])

  // ── Por fechas (completadas por mes) ─────────────────────────────────────
  const porMes = useMemo(() => {
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
  }, [tareasFiltradas])

  const maxMes = porMes.reduce((m, [, c]) => Math.max(m, c), 0)

  const fmtH = (h: number) => h === 0 ? "—" : `${h % 1 === 0 ? h : h.toFixed(1)} h`

  return (
    <div className="space-y-6">
      {/* Filtro de periodo */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Periodo:</span>
        {(["todo", "mes", "semana"] as PeriodFilter[]).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              periodo === p
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            {p === "todo" ? "Todo" : p === "mes" ? "Último mes" : "Última semana"}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={total} />
        <StatCard label="Completadas" value={completadas} sub={`${tasaCompletado}% del total`} />
        <StatCard label="En progreso" value={enProgreso} />
        <StatCard label="Pendientes" value={pendientes} />
        <StatCard label="Progreso prom." value={`${progresoPromedio}%`} />
        <StatCard
          label="Horas est / real"
          value={`${fmtH(totalEstimado)}`}
          sub={`Real: ${fmtH(totalReal)}`}
        />
      </div>

      {/* Tasa de completado visual */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Tasa de completado</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${tasaCompletado}%` }} />
            <div className="h-full bg-blue-500 transition-all"    style={{ width: `${total ? Math.round(enProgreso / total * 100) : 0}%` }} />
            <div className="h-full bg-amber-500 transition-all"   style={{ width: `${total ? Math.round(pendientes / total * 100) : 0}%` }} />
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
                      {(r.estimado > 0 || r.real > 0) && (
                        <span>{fmtH(r.real)}/{fmtH(r.estimado)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HBar
                      value={r.completadas}
                      max={r.total}
                      color="bg-emerald-500"
                    />
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
                  <span className="text-[10px] text-emerald-500 w-4 shrink-0">{a.completadas > 0 ? `${Math.round(a.completadas/a.total*100)}%` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por etiqueta / categoría */}
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
                  <span className="text-[10px] text-emerald-500 w-4 shrink-0">{e.completadas > 0 ? `${Math.round(e.completadas/e.total*100)}%` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completadas por mes */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Completadas por mes</h3>
          {porMes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin completadas registradas</p>
          ) : (
            <div className="space-y-2.5">
              {porMes.map(([mes, count]) => {
                const [anio, m] = mes.split("-")
                const label = new Date(Number(anio), Number(m) - 1, 1)
                  .toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
                return (
                  <div key={mes} className="flex items-center gap-2">
                    <span className="text-xs w-14 shrink-0 capitalize">{label}</span>
                    <HBar value={count} max={maxMes} color="bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tiempo estimado vs real */}
      {conTiempo.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Tiempo estimado vs real</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left pb-2 font-medium">Tarea</th>
                  <th className="text-left pb-2 font-medium">Responsable</th>
                  <th className="text-right pb-2 font-medium">Estimado</th>
                  <th className="text-right pb-2 font-medium">Real</th>
                  <th className="text-right pb-2 font-medium">Desviación</th>
                </tr>
              </thead>
              <tbody>
                {conTiempo.map(t => {
                  const over = t.desviacion > 0
                  const under = t.desviacion < 0
                  return (
                    <tr key={t.documentId} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-muted/30">
                      <td className="py-2 max-w-[180px] truncate pr-3" title={t.titulo}>{t.titulo}</td>
                      <td className="py-2 text-muted-foreground pr-3">{t.responsable ?? "—"}</td>
                      <td className="py-2 text-right text-muted-foreground">{fmtH(t.tiempoEstimado ?? 0)}</td>
                      <td className="py-2 text-right">{fmtH(t.tiempoReal ?? 0)}</td>
                      <td className={`py-2 text-right font-medium ${over ? "text-red-500" : under ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {t.desviacion === 0 ? "=" : over ? `+${fmtH(t.desviacion)}` : fmtH(t.desviacion)}
                        {t.pct !== null && t.pct !== 100 && (
                          <span className="ml-1 text-[10px] opacity-70">({t.pct}%)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="text-[10px] font-semibold border-t border-zinc-200 dark:border-zinc-800">
                  <td colSpan={2} className="pt-2 text-muted-foreground">Total</td>
                  <td className="pt-2 text-right text-muted-foreground">{fmtH(totalEstimado)}</td>
                  <td className="pt-2 text-right">{fmtH(totalReal)}</td>
                  <td className={`pt-2 text-right ${totalReal > totalEstimado ? "text-red-500" : "text-emerald-500"}`}>
                    {totalReal === totalEstimado ? "=" : totalReal > totalEstimado ? `+${fmtH(totalReal - totalEstimado)}` : fmtH(totalReal - totalEstimado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
