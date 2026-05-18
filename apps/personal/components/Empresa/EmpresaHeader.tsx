"use client"

import { usePathname } from "next/navigation"
import { AppLauncher } from "@/components/AppLauncher"

const titles: Record<string, string> = {
  "/gestion-empresa":                    "Dashboard",
  "/gestion-empresa/ventas/pipeline":    "Pipeline CRM",
  "/gestion-empresa/ventas/pedidos":     "Pedidos",
  "/gestion-empresa/almacen/inventario": "Inventario",
}

export function EmpresaHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? pathname.split("/").filter(Boolean).pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Empresa"

  return (
    <header className="h-14 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 px-4 md:px-6 sticky top-0 z-40">
      <h1 className="text-sm md:text-base font-semibold text-slate-300 tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <AppLauncher />
        <div className="h-7 w-7 rounded-md bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-emerald-500/20 shrink-0">
          M
        </div>
      </div>
    </header>
  )
}
