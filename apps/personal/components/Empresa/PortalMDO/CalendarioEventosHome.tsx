"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Card, ColumnHeading } from "./shared"
import { Skeleton } from "@/components/ui/skeleton"
import type { EventoEmpresaType } from "@/types/evento-empresa"
import type { ColaboradorType } from "@/types/colaborador"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

function fmtFechaEvento(fechaStr: string): { label: string; hoy: boolean } {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  const fecha = new Date(fechaStr + "T12:00:00")
  if (fecha.getTime() === hoy.getTime()) return { label: "Hoy", hoy: true }
  if (fecha.getTime() === manana.getTime()) return { label: "Mañana", hoy: false }
  return { label: fecha.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }), hoy: false }
}

/**
 * Portado de sdi-portal/components/Trabajo/portal/CalendarioEventosHome.tsx —
 * calendario embebido (siempre visible) + lista "Próximos" debajo, mismo
 * arreglo `eventos` para ambas partes. Único cambio de fondo vs. el original:
 * un solo color de punto (violeta) para todos los eventos en vez del mapa de
 * 6 tonos por categoría (regla de un solo acento de MDO) — el punto de
 * cumpleaños/aniversario del día se queda en azul fijo, igual que el
 * original (no es un color "por categoría de evento", es un tipo de dato
 * distinto). `eventos` viene de useGetEventosEmpresa(), que solo trae desde
 * hoy en adelante — meses pasados no muestran puntos a propósito.
 */
export function CalendarioEventosHome({ eventos, loadingEventos, colaboradores, puedeGestionar, onGestionar, onNavigateSeccion }: {
  eventos: EventoEmpresaType[]
  loadingEventos: boolean
  colaboradores: ColaboradorType[]
  puedeGestionar: boolean
  onGestionar: (fechaYmd?: string) => void
  onNavigateSeccion?: (seccion: string) => void
}) {
  const [cursor, setCursor]       = useState(() => new Date())
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDiaAbierto(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const year  = cursor.getUTCFullYear()
  const month = cursor.getUTCMonth()
  const firstDay    = new Date(Date.UTC(year, month, 1))
  const startOffset = (firstDay.getUTCDay() + 6) % 7 // semana empieza en lunes
  const diasEnMes   = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const celdas: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoEmpresaType[]>()
    for (const e of eventos) {
      if (!map.has(e.fecha)) map.set(e.fecha, [])
      map.get(e.fecha)!.push(e)
    }
    return map
  }, [eventos])

  // Cumpleaños/aniversarios del mes que se está mostrando -- punto azul fijo
  // (tipo de dato distinto a los eventos de empresa, no un color "por
  // categoría"). Mismo criterio que cumpleaniosDelMes/aniversariosDelMes
  // (api/colaborador/getColaboradores.ts): parseo con T12:00:00 para no
  // desfasarse de día por huso horario, aniversario solo cuenta si ya pasó
  // al menos un año completo.
  const colabsPorDia = useMemo(() => {
    const map = new Map<number, { nombre: string; tipo: "cumple" | "aniversario"; anos?: number }[]>()
    const push = (d: number, entry: { nombre: string; tipo: "cumple" | "aniversario"; anos?: number }) => {
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(entry)
    }
    for (const c of colaboradores) {
      if (c.fecha_nacimiento) {
        const f = new Date(c.fecha_nacimiento + "T12:00:00")
        if (f.getMonth() === month) push(f.getDate(), { nombre: c.nombre, tipo: "cumple" })
      }
      if (c.fecha_ingreso) {
        const f = new Date(c.fecha_ingreso + "T12:00:00")
        const anos = year - f.getFullYear()
        if (f.getMonth() === month && anos > 0) push(f.getDate(), { nombre: c.nombre, tipo: "aniversario", anos })
      }
    }
    return map
  }, [colaboradores, month, year])

  const hoy = new Date()
  const esHoy = (d: number) => hoy.getUTCFullYear() === year && hoy.getUTCMonth() === month && hoy.getUTCDate() === d

  return (
    <div ref={ref}>
    <div className="mb-3"><ColumnHeading>Calendario</ColumnHeading></div>
    <Card className="!p-4">
      <div className="flex items-center justify-center gap-3 mb-3">
        <button type="button" title="Mes anterior" onClick={() => { setCursor(new Date(Date.UTC(year, month - 1, 1))); setDiaAbierto(null) }}
          className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-bold text-slate-700 dark:text-slate-200 w-36 text-center">{MESES[month]} {year}</span>
        <button type="button" title="Mes siguiente" onClick={() => { setCursor(new Date(Date.UTC(year, month + 1, 1))); setDiaAbierto(null) }}
          className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["L","M","X","J","V","S","D"].map(d => (
          <p key={d} className="text-[9px] text-center font-semibold text-slate-400">{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {celdas.map((d, i) => {
          if (d === null) return <div key={i} />
          const fecha  = ymd(new Date(Date.UTC(year, month, d)))
          const delDia = eventosPorDia.get(fecha) ?? []
          const colabsDia = colabsPorDia.get(d) ?? []
          const abierto = diaAbierto === fecha
          return (
            <div key={i} className="relative">
              <button type="button" onClick={() => setDiaAbierto(abierto ? null : fecha)}
                className={`h-9 w-full text-xs rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  abierto ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600"
                    : esHoy(d) ? "text-violet-500 font-semibold border border-violet-300 dark:border-violet-500/40"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}>
                <span>{d}</span>
                <span className="flex gap-0.5 h-1">
                  {colabsDia.length > 0 && <span className="h-1 w-1 rounded-full bg-blue-500" />}
                  {delDia.slice(0, 3).map((e, j) => (
                    <span key={j} className="h-1 w-1 rounded-full bg-violet-500" />
                  ))}
                </span>
              </button>

              {abierto && (
                <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2.5">
                  {(delDia.length > 0 || colabsDia.length > 0) ? (
                    <div className="space-y-1.5 mb-1.5">
                      {colabsDia.map((c, j) => (
                        <div key={`c${j}`} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-blue-500" />
                          <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                            {c.nombre} {c.tipo === "cumple" ? "🎂" : `· ${c.anos} año${c.anos === 1 ? "" : "s"} 🎉`}
                          </span>
                        </div>
                      ))}
                      {delDia.map(e => (
                        <div key={e.documentId} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-violet-500" />
                          <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{e.titulo}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">Sin eventos</p>
                  )}
                  {puedeGestionar && (
                    <button type="button"
                      onClick={() => { setDiaAbierto(null); onGestionar(fecha) }}
                      className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-700 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                      <Plus size={11} /> {delDia.length > 0 ? "Gestionar" : "Agregar evento"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Eventos próximos ── */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Próximos</p>
          {puedeGestionar && (
            <button type="button" onClick={() => onGestionar()}
              className="text-[10px] text-violet-500 hover:text-violet-700 font-semibold transition-colors">
              Gestionar
            </button>
          )}
        </div>
        {loadingEventos
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Skeleton className="h-3 flex-1 rounded" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))
          : eventos.length === 0
            ? <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Sin eventos próximos</p>
            : eventos.map(e => {
                const { label, hoy: esHoyEvento } = fmtFechaEvento(e.fecha)
                const clickable = !!e.seccion && !!onNavigateSeccion
                return (
                  <div key={e.documentId}
                    onClick={clickable ? () => onNavigateSeccion!(e.seccion!) : undefined}
                    className={`flex items-center gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 ${clickable ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-1 -mx-1 transition-colors" : ""}`}>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-violet-500" />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{e.titulo}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${esHoyEvento ? "bg-violet-100 text-violet-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      {label} {esHoyEvento ? "🎉" : ""}
                    </span>
                  </div>
                )
              })
        }
      </div>
    </Card>
    </div>
  )
}
