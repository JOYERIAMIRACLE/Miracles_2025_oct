"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Plus, Minus } from "lucide-react"
import { SegundoCerebroDrawer } from "@/components/GameEmpresa/SegundoCerebroDrawer"
import type { SegundoCerebroGameHandle } from "@/components/GameEmpresa/SegundoCerebroGame"

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

export default function SegundoCerebroPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const gameRef = useRef<SegundoCerebroGameHandle>(null)

  return (
    <div className="relative overflow-hidden" style={{ height: "100svh" }}>
      <SegundoCerebroGame ref={gameRef} onEnterZone={setActiveModule} paused={!!activeModule} />

      {/* Controles hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-[9px] font-mono text-slate-700 bg-[#0a0714]/80 border border-violet-900/30 px-4 py-1.5 rounded-full">
          WASD / ↑↓←→ &nbsp;·&nbsp; E para entrar &nbsp;·&nbsp; Arrastra el fondo para moverte &nbsp;·&nbsp; Arrastra una caja para reposicionarla
        </p>
      </div>

      {/* Zoom +/- */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
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

      <SegundoCerebroDrawer module={activeModule} onClose={() => setActiveModule(null)} />
    </div>
  )
}
