"use client"

import Link from "next/link"
import {
  CheckSquare, FolderOpen, LayoutDashboard, Swords, CalendarDays, Wallet,
  Dumbbell, CalendarRange, ChefHat, ShoppingCart, Sofa, Wrench, Car,
  Users, CalendarHeart, ArrowRight,
} from "lucide-react"

/**
 * Espejo del sidebar real de gestión-personal (components/Personal/PersonalSidebar.tsx)
 * — mismo orden, mismas 6 salas. Hogar/Inventario y Hogar/Mantenimiento están
 * marcados "pendiente": son escritorios vacíos de verdad, no un link roto.
 */
const SIDEBAR_REAL = [
  {
    titulo: "Productividad",
    items: [
      { label: "Tareas",           href: "/gestion-personal/tareas-personales", icon: CheckSquare },
      { label: "Material Digital", href: "/gestion-personal/material-digital",  icon: FolderOpen  },
    ],
  },
  {
    titulo: "Salud — Financiera",
    items: [
      { label: "Dashboard",   href: "/gestion-personal",             icon: LayoutDashboard },
      { label: "Presupuesto", href: "/gestion-personal/presupuesto", icon: Swords          },
      { label: "Calendario",  href: "/gestion-personal/calendario",  icon: CalendarDays    },
      { label: "Cuentas",     href: "/gestion-personal/cuentas",     icon: Wallet          },
    ],
  },
  {
    titulo: "Salud — Ejercicio",
    items: [
      { label: "Ejercicio", href: "/gestion-personal/salud/ejercicio",          icon: Dumbbell     },
      { label: "Planeador", href: "/gestion-personal/salud/planeador-ejercicio",icon: CalendarRange },
    ],
  },
  {
    titulo: "Salud — Alimentación",
    items: [
      { label: "Recetario", href: "/gestion-personal/vivienda/recetario", icon: ChefHat       },
      { label: "Planeador", href: "/gestion-personal/vivienda/planeador", icon: CalendarRange },
      { label: "Compras",   href: "/gestion-personal/vivienda/despensa",  icon: ShoppingCart  },
    ],
  },
  {
    titulo: "Salud — Hogar y Vehículos",
    items: [
      { label: "Inventario",    href: "/gestion-personal/hogar/inventario",    icon: Sofa,   pendiente: true },
      { label: "Mantenimiento", href: "/gestion-personal/hogar/mantenimiento", icon: Wrench, pendiente: true },
      { label: "Vehículos",     href: "/gestion-personal/hogar/vehiculos",     icon: Car },
    ],
  },
  {
    titulo: "Salud — Social",
    items: [
      { label: "Personas", href: "/gestion-personal/social/personas", icon: Users         },
      { label: "Eventos",  href: "/gestion-personal/social/eventos",  icon: CalendarHeart },
    ],
  },
]

export function RichiavrodHub() {
  return (
    <div className="p-5 space-y-6">
      <p className="text-xs text-slate-500">
        Espejo del sidebar real de gestión-personal — mismo orden, mismas 6 salas. Cada acceso te lleva a la página real, sales del mapa.
      </p>

      {SIDEBAR_REAL.map(grupo => (
        <div key={grupo.titulo}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-teal-500/60 mb-2">
            {grupo.titulo}
          </p>
          <div className="space-y-1.5">
            {grupo.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors group"
              >
                <item.icon size={14} className="text-teal-500/70 shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                {"pendiente" in item && item.pendiente && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/25 text-amber-500/70 bg-amber-500/5 shrink-0">
                    pendiente
                  </span>
                )}
                <ArrowRight size={13} className="text-slate-700 group-hover:text-teal-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
