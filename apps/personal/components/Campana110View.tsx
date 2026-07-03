"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pencil, X, Check, Loader2 } from "lucide-react"

const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://miracles2025oct-production.up.railway.app"
const TOKEN  = process.env.NEXT_PUBLIC_CAMPANA_TOKEN ?? ""

const DEFAULT_META   = 110_000
const DEFAULT_AVANCE =  82_687

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
      <div className="h-full rounded-full"
        style={{ width: `${displayed}%`, background: "linear-gradient(90deg,#c46800 0%,#ED8000 60%,#ffaa44 100%)", transition: "width 16ms linear" }} />
      <div className="absolute inset-0 flex items-center justify-end pr-4">
        <span className="text-white font-black text-lg tracking-wide">{displayed.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function Campana110View() {
  const [avance, setAvance] = useState(DEFAULT_AVANCE)
  const [meta,   setMeta]   = useState(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [draftAvance, setDraftAvance] = useState("")
  const [draftMeta,   setDraftMeta]   = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar datos de Strapi al montar
  useEffect(() => {
    fetch(`${STRAPI}/api/campana-meta`)
      .then(r => r.json())
      .then(json => {
        const d = json?.data?.attributes ?? json?.data ?? {}
        if (d.avance) setAvance(d.avance)
        if (d.meta)   setMeta(d.meta)
      })
      .catch(() => {/* usa defaults si Strapi no responde */})
      .finally(() => setLoading(false))
  }, [])

  const pct = Math.min((avance / meta) * 100, 100)

  function openEdit() {
    setDraftAvance(String(avance))
    setDraftMeta(String(meta))
    setEditOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const [saveError, setSaveError] = useState("")

  async function applyEdit() {
    const a = Number(draftAvance.replace(/[^0-9]/g, ""))
    const m = Number(draftMeta.replace(/[^0-9]/g, ""))
    if (!a || !m) return
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch(`${STRAPI}/api/campana-meta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ data: { avance: a, meta: m } }),
      })
      if (res.ok) {
        setAvance(a)
        setMeta(m)
        setEditOpen(false)
      } else {
        setSaveError("No se pudo guardar. Verifica el token en Cloudflare.")
      }
    } catch {
      setSaveError("Error de conexión con Strapi.")
    } finally {
      setSaving(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyEdit()
    if (e.key === "Escape") setEditOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden px-8 py-12">

      {/* Triángulos naranja decorativos */}
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width:0,height:0,borderStyle:"solid",borderWidth:"0 0 260px 220px",borderColor:"transparent transparent #ED8000 transparent" }} />
      <div className="absolute bottom-0 right-0 pointer-events-none opacity-40"
        style={{ width:0,height:0,borderStyle:"solid",borderWidth:"0 0 180px 140px",borderColor:"transparent transparent #ED8000 transparent",transform:"translate(-60px,0)" }} />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* Hero */}
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
              Logremos cumplir al 110% la <span className="italic text-[#ED8000]">promesa al cliente</span>
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          {loading
            ? <div className="h-10 bg-white/10 rounded-full animate-pulse" />
            : <AnimatedBar pct={pct} />
          }
          <div className="flex justify-between items-baseline mt-3 px-1">
            <p className="text-white/60 text-base font-medium">{formatMiles(avance)}</p>
            <p className="text-white/40 text-sm">meta {formatMiles(meta)}</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 mb-8" />

        {/* Por 110 en */}
        <div className="mb-8">
          <p className="text-white/50 text-sm uppercase tracking-widest font-semibold mb-4 text-center sm:text-left">Por 110 en:</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            {["Eficiencia", "Entregas", "Actitud", "Servicio"].map(v => (
              <span key={v} className="px-4 py-2 rounded-full border border-[#ED8000]/40 text-[#ED8000] font-semibold text-sm tracking-wide">
                {v}
              </span>
            ))}
          </div>
          <p className="mt-5 text-white/30 text-sm italic text-center sm:text-left tracking-widest">
            Entrega tu 110 · · · · · · · · · · · · · muestra tu mejor versión
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center sm:justify-start">
          <Link href="/concurso">
            <button type="button"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white border border-[#ED8000]/60 hover:bg-[#ED8000] hover:border-[#ED8000] transition-all duration-200 tracking-wide">
              Únete · Somos Diferentes Innovando
            </button>
          </Link>
        </div>
      </div>

      {/* Botón edición flotante */}
      <button type="button" onClick={openEdit} aria-label="Actualizar avance"
        className="fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-[#ED8000] text-white/50 hover:text-white flex items-center justify-center transition-all shadow-lg">
        <Pencil className="h-4 w-4" />
      </button>

      {/* Modal edición */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#242424] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onKeyDown={handleKey}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-base">Actualizar avance</h2>
              <button type="button" onClick={() => setEditOpen(false)} aria-label="Cerrar"
                className="text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">Avance actual (miles de pesos)</label>
                <input ref={inputRef} type="number" value={draftAvance} onChange={e => setDraftAvance(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#ED8000] transition-colors"
                  placeholder="82687" />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">Meta anual (miles de pesos)</label>
                <input type="number" value={draftMeta} onChange={e => setDraftMeta(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-[#ED8000] transition-colors"
                  placeholder="110000" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={applyEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#ED8000] hover:bg-[#d47200] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Guardando..." : "Actualizar"}
              </button>
            </div>
            {saveError
              ? <p className="text-red-400 text-[11px] text-center mt-4">{saveError}</p>
              : <p className="text-white/20 text-[11px] text-center mt-4">El número se guarda en Strapi — todos ven el mismo avance.</p>
            }
          </div>
        </div>
      )}
    </div>
  )
}
