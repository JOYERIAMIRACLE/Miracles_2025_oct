"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { useGetTareas } from "@/api/tarea/getTareas"
import type { TareaType } from "@/types/tarea"

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"]

// Todo lo que se ve aquí es exclusivo de Portal Medallitadeoro: "Tareas" son
// las tareas reales ambito=empresa (la misma colección que usa la sección
// Tareas del portal). "Eventos" todavía no tiene módulo propio — por ahora
// siempre está vacío, no se toman prestadas tareas de Gestión Personal
// (ambito=personal) ni de ningún otro lado para rellenarlo.
const LOOP = ["tareas", "eventos"] as const
type Categoria = (typeof LOOP)[number]
const CICLO_MS = 3000

function diasRestantes(fecha: string | null): number | null {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + "T12:00:00")
  return Math.ceil((f.getTime() - hoy.getTime()) / 86400000)
}

export function CalendarioPendientesCard() {
  const { tareas, loading } = useGetTareas("empresa")
  const [mesActual, setMesActual] = useState(new Date())
  const [filtro, setFiltro] = useState<Categoria>("tareas")
  const [pausado, setPausado] = useState(false)
  const [hover,   setHover]   = useState(false)
  const [diaSel, setDiaSel] = useState<Date | null>(null)
  const enPausa = pausado || hover

  useEffect(() => {
    if (enPausa) return
    const iv = setInterval(() => {
      setFiltro(f => LOOP[(LOOP.indexOf(f) + 1) % LOOP.length])
    }, CICLO_MS)
    return () => clearInterval(iv)
  }, [enPausa])

  function seleccionar(v: Categoria) {
    if (pausado && filtro === v) { setPausado(false); return }
    setFiltro(v)
    setPausado(true)
  }

  const pendientesTareas = useMemo(
    () => tareas.filter(t => t.estado !== "completada" && t.fechaVencimiento),
    [tareas]
  )
  // Eventos todavía no tiene fuente de datos propia — placeholder honesto, no toma nada de otra parte.
  const filtradas: TareaType[] = filtro === "tareas" ? pendientesTareas : []

  const diasDelMes = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) })
  const primerDia  = getDay(startOfMonth(mesActual))

  const pendientesDelDia = (dia: Date): TareaType[] =>
    filtradas.filter(t => t.fechaVencimiento && isSameDay(new Date(t.fechaVencimiento + "T12:00:00"), dia))

  const proximos7 = useMemo(
    () => filtradas.filter(t => { const d = diasRestantes(t.fechaVencimiento); return d !== null && d >= 0 && d <= 7 }).length,
    [filtradas]
  )

  return (
    <section
      className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Pendientes</h2>
          {proximos7 > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">
              {proximos7} esta semana
            </span>
          )}
          {!enPausa && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-violet-500">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> En vivo
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {([["tareas", "Tareas"], ["eventos", "Eventos"]] as const).map(([v, l]) => {
            const activo = filtro === v
            return (
              <button key={v} type="button" onClick={() => seleccionar(v)}
                className={`h-6 px-2 text-[10px] rounded-md border font-medium transition-all ${
                  activo ? "bg-violet-500 text-white border-violet-500 scale-105 shadow-sm shadow-violet-500/30" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}>
                {l}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button type="button" title="Mes anterior" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() - 1))}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition"><ChevronLeft size={16} /></button>
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{format(mesActual, "MMMM yyyy", { locale: es })}</h3>
        <button type="button" title="Mes siguiente" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + 1))}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition"><ChevronRight size={16} /></button>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-slate-600">Cargando pendientes…</div>
      ) : (
        <>
          {filtro === "eventos" && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-2">Módulo de Eventos aún no existe · Próximamente en Portal Medallitadeoro</p>
          )}
          <div className="grid grid-cols-7 mb-0.5">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium py-0.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {Array.from({ length: primerDia }).map((_, i) => <div key={`e-${i}`} />)}
            {diasDelMes.map(dia => {
              const evs = pendientesDelDia(dia)
              const seleccionado = diaSel && isSameDay(dia, diaSel)
              return (
                <button key={dia.toISOString()} type="button"
                  title={format(dia, "d 'de' MMMM", { locale: es })}
                  onClick={() => setDiaSel(prev => (prev && isSameDay(prev, dia) ? null : dia))}
                  className={`relative h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
                    seleccionado ? "bg-violet-500 text-white"
                    : isToday(dia) ? "border border-violet-400 text-violet-600 dark:text-violet-400 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}>
                  {format(dia, "d")}
                  {evs.length > 0 && !seleccionado && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-violet-500 animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5 min-h-[32px]">
            {diaSel ? (
              pendientesDelDia(diaSel).length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-2">Sin pendientes este día</p>
              ) : (
                pendientesDelDia(diaSel).map(t => (
                  <div key={t.documentId} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200 truncate flex-1">{t.titulo}</span>
                  </div>
                ))
              )
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-1">Toca un día para ver los pendientes</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
