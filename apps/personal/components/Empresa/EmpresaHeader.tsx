"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { AppLauncher } from "@/components/AppLauncher"

const titles: Record<string, string> = {
  "/gestion-empresa":                           "Dashboard",
  "/gestion-empresa/ventas/pipeline":           "Pipeline CRM",
  "/gestion-empresa/ventas/pedidos":            "Pedidos",
  "/gestion-empresa/almacen/inventario":        "Inventario",
  "/gestion-empresa/marketing/campanas":        "Campañas",
  "/gestion-empresa/marketing/tareas":          "Tareas de Marketing",
  "/gestion-empresa/marketing/gastos":          "Gastos de Marketing",
  "/gestion-empresa/marketing/promocionales":   "Promocionales e Impresos",
}

export function EmpresaHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
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
        <AppLauncher />
        <div className="h-7 w-7 rounded-md bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-emerald-500/20 shrink-0">
          M
        </div>
      </div>
    </header>
  )
}
