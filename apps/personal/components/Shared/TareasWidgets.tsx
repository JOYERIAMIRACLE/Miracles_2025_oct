"use client"

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { Input } from "@/components/ui/input"

// ─── Barra de progreso arrastrable ───────────────────────────────────────────

export function ProgresoBar({ value, onSave }: { value: number; onSave: (pct: number) => void }) {
  const [local, setLocal] = useState(value)
  const dragging = useRef(false)
  const barRef  = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(() => { if (!dragging.current) setLocal(value) }, [value])

  useLayoutEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${local}%`
  }, [local])

  const calcPct = useCallback((clientX: number) => {
    if (!barRef.current) return 0
    const { left, width } = barRef.current.getBoundingClientRect()
    return Math.min(Math.max(Math.round((clientX - left) / width * 100), 0), 100)
  }, [])

  useEffect(() => {
    const onMove  = (e: MouseEvent) => { if (dragging.current) setLocal(calcPct(e.clientX)) }
    const onUp    = (e: MouseEvent) => {
      if (!dragging.current) return
      const pct = calcPct(e.clientX); setLocal(pct); dragging.current = false; onSaveRef.current(pct)
    }
    const onTMove = (e: TouchEvent) => { if (dragging.current) { e.preventDefault(); setLocal(calcPct(e.touches[0].clientX)) } }
    const onTEnd  = (e: TouchEvent) => {
      if (!dragging.current) return
      const pct = calcPct(e.changedTouches[0].clientX); setLocal(pct); dragging.current = false; onSaveRef.current(pct)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    window.addEventListener("touchmove", onTMove, { passive: false })
    window.addEventListener("touchend",  onTEnd)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
      window.removeEventListener("touchmove", onTMove)
      window.removeEventListener("touchend",  onTEnd)
    }
  }, [calcPct])

  const color = local >= 100 ? "bg-emerald-500" : local >= 60 ? "bg-blue-500" : local >= 30 ? "bg-amber-500" : "bg-red-400"

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        ref={barRef}
        onMouseDown={e => { e.preventDefault(); dragging.current = true; setLocal(calcPct(e.clientX)) }}
        onTouchStart={e => { dragging.current = true; setLocal(calcPct(e.touches[0].clientX)) }}
        aria-label={`Progreso ${local}%`}
        className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer select-none"
      >
        <div ref={fillRef} className={`h-full rounded-full ${color}`} />
      </div>
      <span className={`text-[10px] font-mono w-8 text-right shrink-0 tabular-nums ${local >= 100 ? "text-emerald-500" : "text-muted-foreground"}`}>
        {local}%
      </span>
    </div>
  )
}

// ─── Panel de avances ────────────────────────────────────────────────────────

export function AvancesPanel({ notas, open, onAgregar }: {
  notas: string | null
  open: boolean
  onAgregar: (nota: string) => void | Promise<void>
}) {
  const [input, setInput] = useState("")
  const [guardando, setGuardando] = useState(false)

  const entradas = notas ? notas.split("\n").filter(Boolean) : []

  const enviar = async () => {
    if (!input.trim()) return
    setGuardando(true)
    await onAgregar(input.trim())
    setInput("")
    setGuardando(false)
  }

  if (entradas.length === 0 && !open) return null

  return (
    <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
      {entradas.length > 0 && (
        <div className="space-y-1 mb-2">
          {entradas.map((entrada, i) => {
            const sepIdx = entrada.indexOf(" · ")
            const fecha = sepIdx !== -1 ? entrada.slice(0, sepIdx) : ""
            const texto = sepIdx !== -1 ? entrada.slice(sepIdx + 3) : entrada
            return (
              <div key={i} className="flex gap-2 items-baseline">
                {fecha && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 min-w-[44px] font-mono">
                    {fecha}
                  </span>
                )}
                <p className="text-[11px] text-muted-foreground leading-snug">{texto}</p>
              </div>
            )
          })}
        </div>
      )}
      {open && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Anotar avance o pendiente..."
            className="h-7 text-xs flex-1"
            onKeyDown={e => { if (e.key === "Enter") enviar() }}
            autoFocus
          />
          <button
            type="button"
            onClick={enviar}
            disabled={guardando || !input.trim()}
            className="h-7 px-2.5 text-xs rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40 hover:opacity-80 transition shrink-0"
          >
            {guardando ? "..." : "Anotar"}
          </button>
        </div>
      )}
    </div>
  )
}
