"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { SegundoCerebroDrawer } from "@/components/GameEmpresa/SegundoCerebroDrawer"

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

  return (
    <div className="relative overflow-hidden" style={{ height: "100svh" }}>
      <SegundoCerebroGame onEnterZone={setActiveModule} paused={!!activeModule} />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-[9px] font-mono text-slate-700 bg-[#0a0714]/80 border border-violet-900/30 px-4 py-1.5 rounded-full">
          WASD / ↑↓←→ &nbsp;·&nbsp; E para entrar
        </p>
      </div>

      <SegundoCerebroDrawer module={activeModule} onClose={() => setActiveModule(null)} />
    </div>
  )
}
