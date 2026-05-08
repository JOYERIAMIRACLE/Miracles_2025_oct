"use client"

import { usePathname } from "next/navigation"
import { MobileSidebar } from "./MobileSidebar"

const titles: Record<string, string> = {
  "/gestion-personal":                  "HUD Principal",
  "/gestion-personal/presupuesto":      "Finanzas",
  "/gestion-personal/registro-mensual": "Registro de Batalla",
  "/gestion-personal/patrimonio":       "Stats del Personaje",
  "/gestion-personal/metas":            "Misiones",
  "/gestion-personal/calendario":       "Calendario de Eventos",
  "/gestion-personal/cuentas":          "Inventario",
}

export function PersonalHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? pathname.split("/").filter(Boolean).pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Personal"

  return (
    <header className="h-14 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-sm md:text-base font-semibold text-slate-300 tracking-tight">{title}</h1>
      </div>
      <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-cyan-500/20 shrink-0">
        RR
      </div>
    </header>
  )
}
