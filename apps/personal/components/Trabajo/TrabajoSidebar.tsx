"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CheckSquare, Wallet, ChevronRight, Archive, Megaphone, BarChart3,
} from "lucide-react"

const NAV = [
  { label: "Tareas",                   href: "/trabajo/tareas",     icon: CheckSquare },
  { label: "Campañas",                 href: "/trabajo/campanas",   icon: BarChart3   },
  { label: "Registro de gastos",       href: "/trabajo/pagos",      icon: Wallet      },
  { label: "Promocionales e impresos", href: "/trabajo/inventario", icon: Archive     },
]

export function TrabajoSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-800/60 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
          <Megaphone className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-100">Marketing team</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href)
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
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/60">
        <p className="text-[10px] text-slate-600">Miracles · Marketing team</p>
      </div>
    </div>
  )
}
