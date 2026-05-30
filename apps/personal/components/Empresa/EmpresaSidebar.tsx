"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  BarChart3, Activity, Globe2,
  Target, CheckSquare, Receipt, HardDrive,
  Megaphone, BookOpen, Tv, Palette,
  Users, ShoppingBag,
  Package, Truck,
  PieChart, CreditCard, CalendarDays,
  UserCog, ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { name: string; href: string; icon: typeof Building2; color: string }

const sections: { title: string | null; color: string; items: NavItem[] }[] = [
  {
    title: "Indicadores", color: "violet",
    items: [
      { name: "Financieros", href: "/gestion-empresa/indicadores/financieros", icon: BarChart3, color: "violet" },
      { name: "Operativos",  href: "/gestion-empresa/indicadores/operativos",  icon: Activity,  color: "violet" },
      { name: "Ecosistema",  href: "/gestion-empresa/indicadores/ecosistema",  icon: Globe2,    color: "violet" },
    ],
  },
  {
    title: "Gestión General", color: "sky",
    items: [
      { name: "Identidad",        href: "/gestion-empresa/general/identidad",        icon: Target,      color: "sky" },
      { name: "Tareas",           href: "/gestion-empresa/general/tareas",            icon: CheckSquare, color: "sky" },
      { name: "Gastos",           href: "/gestion-empresa/general/gastos",            icon: Receipt,     color: "sky" },
      { name: "Material digital", href: "/gestion-empresa/general/material-digital",  icon: HardDrive,   color: "sky" },
    ],
  },
  {
    title: "Marketing", color: "blue",
    items: [
      { name: "Campañas SEO",     href: "/gestion-empresa/marketing/campanas",      icon: Megaphone, color: "blue" },
      { name: "Blog",             href: "/gestion-empresa/marketing/blog",           icon: BookOpen,  color: "blue" },
      { name: "Anuncios",         href: "/gestion-empresa/marketing/anuncios",       icon: Tv,        color: "blue" },
      { name: "Merch",                href: "/gestion-empresa/marketing/promocionales", icon: Palette, color: "blue" },
    ],
  },
  {
    title: "Ventas", color: "emerald",
    items: [
      { name: "Pipeline", href: "/gestion-empresa/ventas/pipeline", icon: Users,       color: "emerald" },
      { name: "Pedidos",  href: "/gestion-empresa/ventas/pedidos",  icon: ShoppingBag, color: "emerald" },
    ],
  },
  {
    title: "Suministro", color: "amber",
    items: [
      { name: "Inventario", href: "/gestion-empresa/almacen/inventario",  icon: Package, color: "amber" },
      { name: "Envíos",     href: "/gestion-empresa/suministro/envios",   icon: Truck,   color: "amber" },
    ],
  },
  {
    title: "Finanzas", color: "rose",
    items: [
      { name: "Presupuestos",       href: "/gestion-empresa/finanzas/presupuestos", icon: PieChart,     color: "rose" },
      { name: "Cuentas",            href: "/gestion-empresa/finanzas/cuentas",      icon: CreditCard,   color: "rose" },
      { name: "Calendario de pagos",href: "/gestion-empresa/finanzas/calendario",   icon: CalendarDays, color: "rose" },
    ],
  },
  {
    title: "Administración", color: "slate",
    items: [
      { name: "Personas", href: "/gestion-empresa/admin/personas", icon: UserCog,    color: "slate" },
      { name: "Roles",    href: "/gestion-empresa/admin/roles",    icon: ShieldCheck, color: "slate" },
    ],
  },
]

const activeColors: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber:   "bg-amber-500/10 text-amber-400 border-amber-500/30",
  blue:    "bg-blue-500/10 text-blue-400 border-blue-500/30",
  violet:  "bg-violet-500/10 text-violet-400 border-violet-500/30",
  rose:    "bg-rose-500/10 text-rose-400 border-rose-500/30",
  sky:     "bg-sky-500/10 text-sky-400 border-sky-500/30",
  slate:   "bg-slate-500/10 text-slate-300 border-slate-500/30",
}

const iconActive: Record<string, string> = {
  emerald: "text-emerald-400",
  amber:   "text-amber-400",
  blue:    "text-blue-400",
  violet:  "text-violet-400",
  rose:    "text-rose-400",
  sky:     "text-sky-400",
  slate:   "text-slate-300",
}

const sectionLabel: Record<string, string> = {
  violet:  "text-violet-700",
  sky:     "text-sky-800",
  blue:    "text-blue-700",
  emerald: "text-emerald-700",
  amber:   "text-amber-700",
  rose:    "text-rose-700",
  slate:   "text-slate-500",
}

export function EmpresaSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-slate-950 h-full border-r border-slate-800/80">
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 shrink-0">
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

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          {sections.map((section, sIdx) => (
            <div key={section.title ?? "_top"}>
              {sIdx > 0 && <div className="h-px bg-slate-800/60 mx-2 my-3" />}
              {section.title && (
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 mb-1.5 mt-0.5",
                  sectionLabel[section.color] ?? "text-slate-600"
                )}>
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = item.href === "/gestion-empresa"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 border",
                          isActive
                            ? `${activeColors[item.color]} shadow-sm`
                            : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}>
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? iconActive[item.color] : "text-slate-600"
                        )} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-slate-800/80 shrink-0">
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
