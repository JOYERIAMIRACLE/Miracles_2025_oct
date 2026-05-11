"use client"

import { usePathname } from "next/navigation"
import { AppLauncher } from "@/components/AppLauncher"
import { Menu } from "lucide-react"
import { useState } from "react"
import { TrabajoSidebar } from "./TrabajoSidebar"

const TITLES: Record<string, string> = {
  "/trabajo":           "Dashboard",
  "/trabajo/tareas":    "Tareas",
  "/trabajo/proyectos": "Proyectos",
  "/trabajo/clientes":  "Clientes",
  "/trabajo/reuniones": "Reuniones",
  "/trabajo/pagos":     "Pagos",
}

export function TrabajoHeader() {
  const pathname = usePathname()
  const title = TITLES[pathname] ?? "Trabajo"
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 backdrop-blur px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm md:text-base font-semibold text-slate-300 tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <AppLauncher />
          <div className="h-7 w-7 rounded-md bg-linear-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
            RR
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64" onClick={() => setMobileOpen(false)}>
            <TrabajoSidebar />
          </div>
        </div>
      )}
    </>
  )
}
