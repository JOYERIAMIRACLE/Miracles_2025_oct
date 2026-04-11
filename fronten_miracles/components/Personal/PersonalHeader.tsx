"use client"

import { usePathname } from "next/navigation"
import { MobileSidebar } from "./MobileSidebar"

const titles: Record<string, string> = {
  "/gestion-personal":                  "Dashboard Personal",
  "/gestion-personal/presupuesto":      "Presupuesto",
  "/gestion-personal/registro-mensual": "Registro Mensual",
  "/gestion-personal/patrimonio":       "Patrimonio",
  "/gestion-personal/metas":            "Metas de Ahorro",
  "/gestion-personal/calendario":       "Calendario",
  "/gestion-personal/cuentas":          "Mis Cuentas",
}

export function PersonalHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? pathname.split("/").filter(Boolean).pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Personal"

  return (
    <header className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-lg md:text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow shrink-0">
        RR
      </div>
    </header>
  )
}
