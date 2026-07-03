"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Sun, Moon, Building2 } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { TrabajoSidebar } from "./TrabajoSidebar"

const TITLES: Record<string, string> = {
  "/marketing/tareas":                   "Tareas",
  "/marketing/campanas":                 "Campañas",
  "/marketing/campanas-planner":         "Planeador de campañas",
  "/marketing/pagos":                    "Registro de gastos",
  "/marketing/inventario":               "Material Físico",
  "/marketing/mkt/ecosistema":           "Ecosistema marketing",
  "/marketing/mkt/inventario-digital":   "Material Digital",
  "/marketing/mkt/roles":                "Roles del equipo",
  "/marketing/mkt/contrasenas":          "Contraseñas",
}

export function TrabajoHeader() {
  const pathname    = usePathname()
  const title       = TITLES[pathname] ?? "Marketing team"
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden h-8 w-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/soportedinamico" className="shrink-0">
            <Image src="/logo-sdi.png" alt="SDI" width={32} height={32} className="w-8 h-8 object-contain rounded" />
          </Link>
          <h1 className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Portal SDI */}
          <Link
            href="/portal"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            Portal SDI
          </Link>

          {/* Toggle dark/light */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

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
