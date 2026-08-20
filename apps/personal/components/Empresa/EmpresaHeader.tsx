"use client"

import { usePathname } from "next/navigation"
import { Menu, LogOut, Gamepad2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppLauncher } from "@/components/AppLauncher"
import { removeToken } from "@/lib/auth"

const titles: Record<string, string> = {
  "/gestion-empresa":                                "Dashboard",
  // Indicadores
  "/gestion-empresa/indicadores/financieros":        "Indicadores Financieros",
  "/gestion-empresa/indicadores/operativos":         "Indicadores Operativos",
  "/gestion-empresa/indicadores/ecosistema":         "Ecosistema",
  // Gestión General
  "/gestion-empresa/general/identidad":              "Identidad Corporativa",
  "/gestion-empresa/general/tareas":                 "Tareas",
  "/gestion-empresa/general/gastos":                 "Registro de Gastos",
  "/gestion-empresa/general/material-digital":       "Material Digital",
  // Marketing
  "/gestion-empresa/marketing/campanas":             "Campañas SEO",
  "/gestion-empresa/marketing/blog":                 "Blog",
  "/gestion-empresa/marketing/anuncios":             "Anuncios",
  "/gestion-empresa/marketing/promocionales":        "Material y Branding",
  "/gestion-empresa/marketing/tareas":               "Tareas de Marketing",
  "/gestion-empresa/marketing/gastos":               "Gastos de Marketing",
  // Ventas
  "/gestion-empresa/ventas/pipeline":                "Pipeline CRM",
  "/gestion-empresa/ventas/pedidos":                 "Pedidos",
  // Suministro
  "/gestion-empresa/almacen/inventario":             "Inventario",
  "/gestion-empresa/suministro/envios":              "Envíos",
  // Finanzas
  "/gestion-empresa/finanzas/presupuestos":          "Presupuestos",
  "/gestion-empresa/finanzas/cuentas":               "Cuentas",
  "/gestion-empresa/finanzas/calendario":            "Calendario de Pagos",
}

export function EmpresaHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  function handleLogout() { removeToken(); router.push("/login") }
  const title = titles[pathname] ?? pathname.split("/").filter(Boolean).pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Empresa"

  return (
    <header className="h-14 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 backdrop-blur supports-backdrop-filter:bg-slate-950/80 px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm md:text-base font-semibold text-slate-300 tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/empresa-rpg"
          className="p-1.5 text-slate-600 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Modo Juego"
        >
          <Gamepad2 size={15} />
        </Link>
        <AppLauncher />
        <button type="button" onClick={handleLogout} title="Cerrar sesión"
          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut size={15} />
        </button>
        <div className="h-7 w-7 rounded-md bg-linear-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-violet-500/20 shrink-0">
          M
        </div>
      </div>
    </header>
  )
}
