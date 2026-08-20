"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import type { AvisoType } from "@/types/aviso"
import { Skeleton } from "@/components/ui/skeleton"

const CHIP_COLOR: Record<string, string> = {
  violet:  "bg-violet-100 text-violet-700",
  emerald: "bg-violet-100 text-violet-700",
  blue:    "bg-violet-100 text-violet-700",
  orange:  "bg-violet-100 text-violet-700",
  red:     "bg-red-100 text-red-700",
  amber:   "bg-violet-100 text-violet-700",
}
const BG_COLOR: Record<string, string> = {
  violet:  "bg-violet-600",
  emerald: "bg-violet-500",
  blue:    "bg-violet-600",
  orange:  "bg-violet-500",
  red:     "bg-red-500",
  amber:   "bg-violet-500",
}

function fmtVigencia(aviso: AvisoType) {
  const parts: string[] = []
  if (aviso.autor) parts.push(aviso.autor)
  if (aviso.vigencia) parts.push(`Vigente hasta ${new Date(aviso.vigencia + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`)
  return parts.join(" · ")
}

export function HeroCarusel({ avisos, onGestionar, isAdmin, loading }: { avisos: AvisoType[]; onGestionar?: () => void; isAdmin?: boolean; loading?: boolean }) {
  const [idx, setIdx] = useState(0)
  const total = avisos.length

  useEffect(() => {
    if (total === 0) return
    const iv = setInterval(() => setIdx(p => (p + 1) % total), 6000)
    return () => clearInterval(iv)
  }, [total])

  if (loading) return (
    <section className="p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-900 grid grid-cols-1 xl:grid-cols-2 gap-1.5 min-h-[300px] xl:aspect-32/9">
      <div className="rounded-xl p-8 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-2 w-6 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
      <Skeleton className="min-h-[260px] xl:min-h-0 rounded-xl" />
    </section>
  )

  if (total === 0) return (
    <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 dark:text-slate-500 min-h-[120px] flex flex-col items-center justify-center gap-3">
      <p>Sin comunicados activos</p>
      {isAdmin && onGestionar && (
        <button type="button" onClick={onGestionar}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">
          <Pencil size={11} /> Gestionar comunicados
        </button>
      )}
    </section>
  )

  const prev = () => setIdx(p => (p - 1 + total) % total)
  const next = () => setIdx(p => (p + 1) % total)
  const a = avisos[idx]
  const chip = CHIP_COLOR[a.color] ?? CHIP_COLOR.violet
  const bg   = BG_COLOR[a.color]   ?? BG_COLOR.violet

  return (
    <section className="p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-900 grid grid-cols-1 xl:grid-cols-2 gap-1.5 min-h-[300px] xl:aspect-32/9">
      <div className="rounded-xl p-8 flex flex-col justify-between gap-4 relative overflow-hidden">
        {isAdmin && onGestionar && (
          <button type="button" onClick={onGestionar}
            className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg px-2.5 py-1 transition-colors bg-white/80 dark:bg-slate-900/80">
            <Pencil size={10} /> Gestionar
          </button>
        )}
        <div className="flex flex-col gap-3">
          <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${chip}`}>{a.area}</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{a.titulo}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a.desc}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{fmtVigencia(a)}</p>
        </div>
        <div className="flex items-center gap-2">
          {avisos.map((_, i) => (
            <button key={i} type="button" aria-label={`Ir a slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-violet-500" : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"}`}
            />
          ))}
        </div>
      </div>
      <div className={`${a.imagen?.url ? "" : bg} rounded-xl relative flex flex-col items-center justify-center gap-3 min-h-[260px] xl:min-h-0 overflow-hidden`}>
        {a.imagen?.url
          ? <img src={a.imagen.url} alt={a.titulo} className="absolute inset-0 w-full h-full object-cover" />
          : <>
              <span className="text-6xl select-none">{a.emoji}</span>
              <p className="text-white/80 text-[11px] font-semibold tracking-widest uppercase text-center">Medallitadeoro · Comunicados</p>
            </>
        }
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <button type="button" aria-label="Anterior" onClick={prev}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors text-lg font-bold">
            ‹
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button type="button" aria-label="Siguiente" onClick={next}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors text-lg font-bold">
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
