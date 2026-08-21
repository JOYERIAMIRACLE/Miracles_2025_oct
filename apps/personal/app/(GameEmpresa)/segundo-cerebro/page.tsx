"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Plus, Minus, X } from "lucide-react"
import { SegundoCerebroDrawer } from "@/components/GameEmpresa/SegundoCerebroDrawer"
import type { SegundoCerebroGameHandle } from "@/components/GameEmpresa/SegundoCerebroGame"
import { createIdentidad } from "@/api/mapa-identidad/createIdentidad"
import type { MapaIdentidadType } from "@/types/mapa-identidad"

const SegundoCerebroGame = dynamic(
  () => import("@/components/GameEmpresa/SegundoCerebroGame").then(m => ({ default: m.SegundoCerebroGame })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0714]">
        <p className="text-[10px] font-mono text-violet-500/40 uppercase tracking-[0.2em] animate-pulse">
          Cargando mapa...
        </p>
      </div>
    ),
  }
)

const SECTORES_CONOCIDOS = ["richiavrod", "medallitadeoro", "sdi-portal"]

function CrearIdentidadForm({ onClose, onCreated }: { onClose: () => void; onCreated: (item: MapaIdentidadType) => void }) {
  const [nombre, setNombre]   = useState("")
  const [icono, setIcono]     = useState("✨")
  const [color, setColor]     = useState("#a78bfa")
  const [sector, setSector]   = useState("")
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !sector.trim()) { setError("Nombre y sector son obligatorios"); return }
    setSaving(true)
    setError("")
    try {
      const created = await createIdentidad({
        nombre: nombre.trim(),
        icono:  icono.trim() || "✨",
        color,
        sector: sector.trim(),
        x: 800,
        y: 450,
        moduleId: null,
        enlace: null,
        descripcion: null,
        placeholder: false,
        activo: true,
      })
      onCreated(created)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Error al crear")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(10,7,20,0.68)", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="w-full flex flex-col gap-3 rounded-2xl p-5"
        style={{ maxWidth: "360px", background: "rgba(14,9,24,0.98)", border: "1px solid rgba(167,139,250,0.16)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-slate-200">Nueva identidad</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-600 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>

        <label className="text-[10px] font-mono text-violet-400/60 uppercase tracking-wider">
          Nombre
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="TALLER PRUEBA V2"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-violet-900/30 text-slate-200 text-[12px] font-mono outline-none focus:border-violet-500/50" />
        </label>

        <div className="flex gap-3">
          <label className="text-[10px] font-mono text-violet-400/60 uppercase tracking-wider flex-1">
            Ícono (emoji)
            <input value={icono} onChange={e => setIcono(e.target.value)} placeholder="🧪"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-violet-900/30 text-slate-200 text-[14px] outline-none focus:border-violet-500/50" />
          </label>
          <label className="text-[10px] font-mono text-violet-400/60 uppercase tracking-wider">
            Color
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="mt-1 w-12 h-[38px] rounded-lg bg-black/30 border border-violet-900/30 cursor-pointer" />
          </label>
        </div>

        <label className="text-[10px] font-mono text-violet-400/60 uppercase tracking-wider">
          Sector / grupo — escribe uno existente o uno nuevo (crea el grupo)
          <input value={sector} onChange={e => setSector(e.target.value)} placeholder="pruebas-v2" list="sectores-conocidos"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-violet-900/30 text-slate-200 text-[12px] font-mono outline-none focus:border-violet-500/50" />
          <datalist id="sectores-conocidos">
            {SECTORES_CONOCIDOS.map(s => <option key={s} value={s} />)}
          </datalist>
        </label>

        {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

        <button type="submit" disabled={saving}
          className="mt-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-bold transition-colors disabled:opacity-50">
          {saving ? "Creando..." : "Crear en el mapa"}
        </button>
        <p className="text-[9px] font-mono text-slate-700 text-center">
          Aparece en el centro del mapa — arrástrala a donde quieras
        </p>
      </form>
    </div>
  )
}

export default function SegundoCerebroPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const gameRef = useRef<SegundoCerebroGameHandle>(null)

  return (
    <div className="relative overflow-hidden" style={{ height: "100svh" }}>
      <SegundoCerebroGame ref={gameRef} onEnterZone={setActiveModule} paused={!!activeModule || showCreate} />

      {/* Controles hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-[9px] font-mono text-slate-700 bg-[#0a0714]/80 border border-violet-900/30 px-4 py-1.5 rounded-full">
          WASD / ↑↓←→ &nbsp;·&nbsp; E para entrar &nbsp;·&nbsp; Arrastra el fondo para moverte &nbsp;·&nbsp; Arrastra una caja o un grupo entero para reposicionar
        </p>
      </div>

      {/* Zoom +/- y crear */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-violet-500/40 bg-violet-600/90 text-white hover:bg-violet-500 transition-colors"
          aria-label="Crear identidad nueva"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => gameRef.current?.zoomIn()}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-violet-900/30 bg-[#0a0714]/80 text-slate-400 hover:text-violet-300 hover:border-violet-500/40 transition-colors"
          aria-label="Acercar"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => gameRef.current?.zoomOut()}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-violet-900/30 bg-[#0a0714]/80 text-slate-400 hover:text-violet-300 hover:border-violet-500/40 transition-colors"
          aria-label="Alejar"
        >
          <Minus size={16} />
        </button>
      </div>

      {showCreate && (
        <CrearIdentidadForm
          onClose={() => setShowCreate(false)}
          onCreated={item => gameRef.current?.addIdentidad(item)}
        />
      )}

      <SegundoCerebroDrawer module={activeModule} onClose={() => setActiveModule(null)} />
    </div>
  )
}
