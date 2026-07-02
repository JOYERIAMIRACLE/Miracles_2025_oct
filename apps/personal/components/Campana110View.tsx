"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Pencil, X, Check } from "lucide-react"

// Valores por defecto (se sobreescriben con ?avance=XXXXX&meta=XXXXX en la URL)
const DEFAULT_META    = 110_000
const DEFAULT_AVANCE  =  82_687

function formatMiles(n: number) {
  return `$${n.toLocaleString("es-MX")} mil`
}

function AnimatedBar({ pct }: { pct: number }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    setDisplayed(0)
    const timeout = setTimeout(() => {
      let current = 0
      const id = setInterval(() => {
        current = Math.min(current + 0.8, pct)
        setDisplayed(current)
        if (current >= pct) clearInterval(id)
      }, 16)
      return () => clearInterval(id)
    }, 400)
    return () => clearTimeout(timeout)
  }, [pct])

  return (
    <div className="relative h-10 bg-white/15 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${displayed}%`,
          background: "linear-gradient(90deg, #c46800 0%, #ED8000 60%, #ffaa44 100%)",
          transition: "width 16ms linear",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-end pr-4">
        <span className="text-white font-black text-lg tracking-wide">
          {displayed.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function Campana110View() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const avance = Number(searchParams.get("avance") ?? DEFAULT_AVANCE)
  const meta   = Number(searchParams.get("meta")   ?? DEFAULT_META)
  const pct    = Math.min((avance / meta) * 100, 100)

  // Modal de edición
  const [editOpen, setEditOpen] = useState(false)
  const [draftAvance, setDraftAvance] = useState("")
  const [draftMeta,   setDraftMeta]   = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function openEdit() {
    setDraftAvance(String(avance))
    setDraftMeta(String(meta))
    setEditOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function applyEdit() {
    const a = Number(draftAvance.replace(/[^0-9]/g, ""))
    const m = Number(draftMeta.replace(/[^0-9]/g, ""))
    if (!a || !m) return
    const params = new URLSearchParams()
    params.set("avance", String(a))
    params.set("meta", String(m))
    router.replace(`?${params.toString()}`)
    setEditOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyEdit()
    if (e.key === "Escape") setEditOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden px-8 py-12">

      {/* Triángulo naranja — esquina inferior derecha */}
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width:0, height:0, borderStyle:"solid",
          borderWidth:"0 0 260px 220px",
          borderColor:"transparent transparent #ED8000 transparent" }} />
      <div className="absolute bottom-0 right-0 pointer-events-none opacity-40"
        style={{ width:0, height:0, borderStyle:"solid",
          borderWidth:"0 0 180px 140px",
          borderColor:"transparent transparent #ED8000 transparent",
          transform:"translate(-60px,0)" }} />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* Hero: logo + headline */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-12">
          <div className="shrink-0 w-48 h-48 sm:w-56 sm:h-56">
            <Image src="/logo-3s.png" alt="SDI — Servir, Solucionar, Simplificar"
              width={224} height={224} className="w-full h-full object-contain" priority />
          </div>
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h1 className="text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">
              ¡Jugemos al 110!
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold text-white leading-snug">
              Logremos cumplir al 110%{" "}
              <br className="hidden sm:block" />
              la <span className="italic text-[#ED8000]">promesa al cliente</span>
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <AnimatedBar pct={pct} />
          <div className="flex justify-between items-baseline mt-3 px-1">
            <p className="text-white/60 text-base font-medium">{formatMiles(avance)}</p>
            <p className="text-white/40 text-sm">meta {formatMiles(meta)}</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8">
          <span className="text-white/50 text-lg italic font-medium">Filosofía de equipo</span>
          <span className="hidden sm:block text-white/20 text-xl">·</span>
          <span className="text-white/50 text-lg italic font-medium">Objetivo claro</span>
        </div>
      </div>

      {/* Botón flotante de edición */}
      <button
        type="button"
        onClick={openEdit}
        title="Actualizar avance"
        className="fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-[#ED8000] text-white/50 hover:text-white flex items-center justify-center transition-all shadow-lg"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Modal de edición */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#242424] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onKeyDown={handleKey}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-base">Actualizar avance</h2>
              <button type="button" onClick={() => setEditOpen(false)} aria-label="Cerrar" className="text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                  Avance actual (miles de pesos)
                </label>
                <input
                  ref={inputRef}
                  type="number"
                  value={draftAvance}
                  onChange={e => setDraftAvance(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#ED8000] transition-colors"
                  placeholder="82687"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                  Meta anual (miles de pesos)
                </label>
                <input
                  type="number"
                  value={draftMeta}
                  onChange={e => setDraftMeta(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#ED8000] transition-colors"
                  placeholder="110000"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={applyEdit}
                className="flex-1 py-2.5 rounded-xl bg-[#ED8000] hover:bg-[#d47200] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <Check className="h-4 w-4" /> Actualizar
              </button>
            </div>

            <p className="text-white/20 text-[11px] text-center mt-4 leading-relaxed">
              El % se calcula automáticamente. Copia la URL para compartir el avance actualizado.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
