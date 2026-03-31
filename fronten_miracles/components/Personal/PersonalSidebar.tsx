"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Landmark,
  ListChecks,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard",   href: "/gestion-personal",              icon: LayoutDashboard },
  { name: "Presupuesto", href: "/gestion-personal/presupuesto",  icon: ListChecks      },
  { name: "Patrimonio",  href: "/gestion-personal/patrimonio",   icon: Landmark        },
]

export function PersonalSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 border-r bg-background min-h-screen h-full">
      {/* Logo / título */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="h-6 w-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          Vida Personal
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Módulos
          </p>
          <ul className="space-y-1">
            {navigation.map(item => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Footer del sidebar */}
      <div className="px-6 py-4 border-t">
        <p className="text-xs text-muted-foreground">Ricardo Rodríguez</p>
        <p className="text-xs text-muted-foreground/60">Finanzas Personales</p>
      </div>
    </div>
  )
}
