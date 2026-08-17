"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { DashboardEmpresaView }    from "@/components/Empresa/DashboardEmpresaView"
import { PipelineView }            from "@/components/Empresa/Ventas/PipelineView"
import { IngresosEmpresaView }     from "@/components/Empresa/Finanzas/IngresosEmpresaView"
import { InventarioEmpresaView }   from "@/components/Empresa/Almacen/InventarioEmpresaView"
import { CampanasEmpresaView }     from "@/components/Empresa/Marketing/CampanasEmpresaView"
import { FinancierosView }         from "@/components/Empresa/Indicadores/FinancierosView"
import { RichiavrodHub }           from "@/components/GameEmpresa/RichiavrodHub"
import { SdiPortalGateway }        from "@/components/GameEmpresa/SdiPortalGateway"

const LABELS: Record<string, string> = {
  ventas:       "⚔️  Sala de Conquistas — Ventas",
  pipeline:     "🗺️  Mapa de Quests — Pipeline CRM",
  finanzas:     "🏦  Tesorería — Finanzas",
  almacen:      "📦  Inventario — Almacén",
  marketing:    "📢  Gremio Mercader — Marketing",
  indicadores:  "📊  Sala de Tácticas — KPIs",
  richiavrod:   "🏠  Tu Casa — Richiavrod",
  "sdi-portal": "🏭  Portal Externo — SDI",
}

function Content({ module }: { module: string }) {
  switch (module) {
    case "ventas":      return <DashboardEmpresaView />
    case "pipeline":    return <PipelineView />
    case "finanzas":    return <IngresosEmpresaView />
    case "almacen":     return <InventarioEmpresaView />
    case "marketing":   return <CampanasEmpresaView />
    case "indicadores": return <FinancierosView />
    case "richiavrod":  return <RichiavrodHub />
    case "sdi-portal":  return <SdiPortalGateway />
    default:            return <p className="p-8 text-sm text-slate-600">Módulo: {module}</p>
  }
}

interface Props {
  module:  string | null
  onClose: () => void
}

export function ModuleDrawer({ module, onClose }: Props) {
  useEffect(() => {
    if (!module) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [module, onClose])

  return (
    <AnimatePresence>
      {module && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: "min(720px, 72vw)",
              background: "rgba(4,7,14,0.98)",
              borderLeft: "1px solid rgba(0,212,255,0.09)",
              backdropFilter: "blur(24px)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b shrink-0"
              style={{ borderColor: "rgba(0,212,255,0.07)" }}
            >
              <div>
                <p className="text-[8px] font-mono text-cyan-500/40 uppercase tracking-[0.2em] mb-0.5">
                  ZONA ACTIVA
                </p>
                <h2 className="text-[13px] font-bold text-slate-200">
                  {LABELS[module] ?? module}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-700">ESC para cerrar</span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <Content module={module} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
