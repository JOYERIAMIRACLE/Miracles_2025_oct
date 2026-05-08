"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Gamepad2,
  Swords,
  Target,
  Package,
  CalendarDays,
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Archive,
  CheckSquare,
  ChefHat,
  Dumbbell,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; color: string }

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Finanzas Personales",
    items: [
      { name: "Dashboard",      href: "/gestion-personal",                 icon: LayoutDashboard, color: "cyan"   },
      { name: "Presupuesto",    href: "/gestion-personal/presupuesto",     icon: Swords,          color: "cyan"   },
      { name: "Objetivos",      href: "/gestion-personal/objetivos",       icon: Target,          color: "amber"  },
      { name: "Calendario",     href: "/gestion-personal/calendario",      icon: CalendarDays,    color: "blue"   },
      { name: "Cuentas",        href: "/gestion-personal/cuentas",         icon: Package,         color: "green"  },
      { name: "Transacciones",  href: "/gestion-personal/transacciones",   icon: ArrowLeftRight,  color: "cyan"   },
      { name: "Etiquetas",      href: "/gestion-personal/categorias",      icon: Tag,             color: "pink"   },
      { name: "Histórico",      href: "/gestion-personal/historial",       icon: Archive,         color: "purple" },
    ],
  },
  {
    title: "Productividad",
    items: [
      { name: "Tareas Personales", href: "/gestion-personal/tareas-personales", icon: CheckSquare, color: "purple" },
    ],
  },
  {
    title: "Salud",
    items: [
      { name: "Recetario",  href: "/gestion-personal/recetario",        icon: ChefHat,   color: "green"  },
      { name: "Gym",        href: "/gestion-personal/salud/gym",         icon: Dumbbell,  color: "red"    },
      { name: "Métricas",   href: "/gestion-personal/salud/metricas",    icon: Activity,  color: "purple" },
    ],
  },
]

const activeColors: Record<string, string> = {
  cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-cyan-500/5",
  purple: "bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-violet-500/5",
  amber:  "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/5",
  green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5",
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/5",
  pink:   "bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-pink-500/5",
  red:    "bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/5",
}

const iconActiveColors: Record<string, string> = {
  cyan:   "text-cyan-400",
  purple: "text-violet-400",
  amber:  "text-amber-400",
  green:  "text-emerald-400",
  blue:   "text-blue-400",
  pink:   "text-pink-400",
  red:    "text-red-400",
}

export function PersonalSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-slate-950 min-h-screen h-full border-r border-slate-800/80">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 tracking-tight">Miracles</p>
            <p className="text-[10px] text-slate-600 -mt-0.5">Life Manager</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <div className="px-3 space-y-5">
          {sections.map((section, sIdx) => (
            <div key={section.title}>
              {/* Separador entre secciones */}
              {sIdx > 0 && <div className="h-px bg-slate-800/80 mx-2 mb-4" />}
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3 px-2">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map(item => {
                  const isActive =
                    pathname === item.href ||
                    (item.name === "Cuentas" && pathname === "/gestion-personal/patrimonio")
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 border",
                          isActive
                            ? `${activeColors[item.color]} shadow-sm`
                            : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? iconActiveColors[item.color] : "text-slate-600"
                        )} />
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
            RR
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Ricardo</p>
            <p className="text-[10px] text-slate-600">Jugador activo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
