"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CheckSquare, Wallet, ChevronRight, Archive, Megaphone,
  TrendingUp, FileImage, Users, BookOpen, Globe,
} from "lucide-react"
import { isProveedorWeb } from "@/lib/auth"

const SECTIONS = [
  {
    title: "Operación",
    items: [
      { label: "Tareas",             href: "/trabajo/tareas",   icon: CheckSquare },
      { label: "Campañas",           href: "/trabajo/campanas", icon: Megaphone   },
      { label: "Registro de gastos", href: "/trabajo/pagos",    icon: Wallet      },
    ],
  },
  {
    title: "Indicadores",
    items: [
      { label: "Ecosistema marketing", href: "/trabajo/mkt/ecosistema", icon: TrendingUp },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Material Físico",   href: "/trabajo/inventario",           icon: Archive   },
      { label: "Material Digital",  href: "/trabajo/mkt/inventario-digital", icon: FileImage },
    ],
  },
  {
    title: "Equipo",
    items: [
      { label: "Roles",        href: "/trabajo/mkt/roles",       icon: Users    },
      { label: "Tutorial de procesos mkt", href: "/trabajo/mkt/tutoriales", icon: BookOpen },
    ],
  },
  {
    title: "Web",
    items: [
      { label: "Sitio web", href: "/trabajo/sitio-web", icon: Globe },
    ],
  },
]

export function TrabajoSidebar() {
  const pathname = usePathname()
  const [isProveedor, setIsProveedor] = useState(false)

  useEffect(() => {
    setIsProveedor(isProveedorWeb())
  }, [])
  const visibleSections = isProveedor
    ? SECTIONS.filter(s => s.title === "Web")
    : SECTIONS

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-800/60 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
          {isProveedor ? <Globe className="h-3.5 w-3.5 text-white" /> : <Megaphone className="h-3.5 w-3.5 text-white" />}
        </div>
        <span className="text-sm font-bold text-slate-100">
          {isProveedor ? "Sitio Web" : "Marketing team"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {visibleSections.map(({ title, items }) => (
          <div key={title}>
            {!isProveedor && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {title}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                    ].join(" ")}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3 w-3 text-blue-500/50" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/60">
        <p className="text-[10px] text-slate-600">
          {isProveedor ? "Miracles · Proveedor Web" : "Miracles · Marketing team"}
        </p>
      </div>
    </div>
  )
}
