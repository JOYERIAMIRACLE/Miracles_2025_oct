"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2, Users, ShoppingBag, LayoutDashboard, Package,
  Megaphone, CheckSquare, Wallet, Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; color: string }

const sections: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [
      { name: "Dashboard", href: "/gestion-empresa", icon: LayoutDashboard, color: "emerald" },
    ],
  },
  {
    title: "Ventas",
    items: [
      { name: "Pipeline",  href: "/gestion-empresa/ventas/pipeline", icon: Users,       color: "emerald" },
      { name: "Pedidos",   href: "/gestion-empresa/ventas/pedidos",  icon: ShoppingBag, color: "emerald" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Campañas",      href: "/gestion-empresa/marketing/campanas",      icon: Megaphone,   color: "blue" },
      { name: "Tareas",        href: "/gestion-empresa/marketing/tareas",        icon: CheckSquare, color: "blue" },
      { name: "Gastos",        href: "/gestion-empresa/marketing/gastos",        icon: Wallet,      color: "blue" },
      { name: "Promocionales", href: "/gestion-empresa/marketing/promocionales", icon: Archive,     color: "blue" },
    ],
  },
  {
    title: "Almacén",
    items: [
      { name: "Inventario", href: "/gestion-empresa/almacen/inventario", icon: Package, color: "amber" },
    ],
  },
]

const activeColors: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5",
  amber:   "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/5",
  blue:    "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/5",
  violet:  "bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-violet-500/5",
}

const iconActiveColors: Record<string, string> = {
  emerald: "text-emerald-400",
  amber:   "text-amber-400",
  blue:    "text-blue-400",
  violet:  "text-violet-400",
}

export function EmpresaSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-slate-950 min-h-screen h-full border-r border-slate-800/80">
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 tracking-tight">Miracles</p>
            <p className="text-[10px] text-slate-600 -mt-0.5">Gestión Empresa</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <div className="px-3 space-y-1">
          {sections.map((section, sIdx) => (
            <div key={section.title ?? "_top"}>
              {sIdx > 0 && <div className="h-px bg-slate-800/80 mx-2 my-3" />}
              {section.title && (
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5 px-2 mt-1">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = item.href === "/gestion-empresa"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  return (
                    <li key={item.name}>
                      <Link href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
                          isActive
                            ? `${activeColors[item.color]} shadow-sm`
                            : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}>
                        <item.icon className={cn("h-4 w-4 transition-colors", isActive ? iconActiveColors[item.color] : "text-slate-600")} />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
            M
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Miracles</p>
            <p className="text-[10px] text-slate-600">Joyería</p>
          </div>
        </div>
      </div>
    </div>
  )
}
