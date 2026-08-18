"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"

export const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export function CalendarioPicker({ value, onChange, onClear, label, min, max, className }: {
  value: Date | null; onChange: (d: Date) => void; onClear?: () => void; label: string
  min?: Date; max?: Date; className?: string
}) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => value ?? new Date())
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [open])

  const year = cursor.getUTCFullYear()
  const month = cursor.getUTCMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startOffset = (firstDay.getUTCDay() + 6) % 7
  const diasEnMes = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const celdas: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const hoy = new Date()
  const esHoy = (d: number) => hoy.getUTCFullYear() === year && hoy.getUTCMonth() === month && hoy.getUTCDate() === d
  const esSeleccionado = (d: number) => !!value && value.getUTCFullYear() === year && value.getUTCMonth() === month && value.getUTCDate() === d
  const fueraDeRango = (d: number) => {
    const fecha = new Date(Date.UTC(year, month, d))
    if (min && fecha < min) return true
    if (max && fecha > max) return true
    return false
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label}
        onClick={() => setOpen(v => { if (!v) setCursor(value ?? new Date()); return !v })}
        className={`h-9 flex items-center gap-2 pl-3 pr-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm min-w-[130px] justify-between ${className ?? ""}`}>
        <span className="truncate">{value ? `${value.getUTCDate()} ${MESES_CORTOS[value.getUTCMonth()]} ${value.getUTCFullYear()}` : "—"}</span>
        {value && onClear ? (
          <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); onClear() }} title="Limpiar fecha"
            className="shrink-0 p-0.5 -m-0.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={13} />
          </span>
        ) : (
          <CalendarDays size={13} className="text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div ref={panelRef} className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 w-64 p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" title="Mes anterior" onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"><ChevronLeft size={14} /></button>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{MESES_CORTOS[month]} {year}</p>
            <button type="button" title="Mes siguiente" onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"><ChevronRight size={14} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["L","M","X","J","V","S","D"].map(d => <p key={d} className="text-[9px] text-center font-semibold text-slate-400 py-1">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {celdas.map((d, i) => d === null ? <div key={i} /> : (
              <button key={i} type="button" disabled={fueraDeRango(d)}
                onClick={() => { onChange(new Date(Date.UTC(year, month, d))); setOpen(false) }}
                className={`h-7 w-7 text-xs rounded-lg transition-colors flex items-center justify-center mx-auto ${
                  esSeleccionado(d) ? "bg-violet-500 text-white font-semibold"
                    : esHoy(d) ? "text-violet-500 font-semibold border border-violet-300 dark:border-violet-500/40"
                    : fueraDeRango(d) ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CalendarioRango({ desde, hasta, onDesde, onHasta, onReset, limiteMin, limiteMax }: {
  desde: Date | null; hasta: Date | null
  onDesde: (d: Date) => void; onHasta: (d: Date) => void; onReset: () => void
  limiteMin?: Date | null; limiteMax?: Date | null
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarioPicker value={desde} onChange={onDesde} label="Desde" min={limiteMin ?? undefined} max={hasta ?? limiteMax ?? undefined} />
      <span className="text-slate-400 dark:text-slate-500">→</span>
      <CalendarioPicker value={hasta} onChange={onHasta} label="Hasta" min={desde ?? limiteMin ?? undefined} max={limiteMax ?? undefined} />
      <button type="button" onClick={onReset}
        className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 transition">
        Todo
      </button>
    </div>
  )
}
