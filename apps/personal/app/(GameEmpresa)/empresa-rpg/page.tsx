"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { ModuleDrawer } from "@/components/GameEmpresa/ModuleDrawer"

const PhaserGame = dynamic(
  () => import("@/components/GameEmpresa/PhaserGame").then(m => ({ default: m.PhaserGame })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050810]">
        <p className="text-[10px] font-mono text-cyan-500/40 uppercase tracking-[0.2em] animate-pulse">
          Cargando mapa...
        </p>
      </div>
    ),
  }
)

export default function EmpresaRPGPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  return (
    <div className="relative overflow-hidden" style={{ height: "calc(100svh - 48px)" }}>
      <PhaserGame onEnterZone={setActiveModule} />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-[9px] font-mono text-slate-700 bg-[#050810]/80 border border-slate-800/40 px-4 py-1.5 rounded-full">
          WASD / ↑↓←→ &nbsp;·&nbsp; E para entrar
        </p>
      </div>

      <ModuleDrawer module={activeModule} onClose={() => setActiveModule(null)} />
    </div>
  )
}
