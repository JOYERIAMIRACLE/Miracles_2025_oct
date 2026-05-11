"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Wallet,
  Tags,
  Users,
  Building2,
  Box,
  ShoppingCart,
  Banknote,
  PiggyBank,
  Calendar,
  UserPlus,
  Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/gestion-empresa", icon: LayoutDashboard },
  { name: "Finanzas", href: "/gestion-empresa/finanzas", icon: Wallet },
  { name: "Gastos", href: "/gestion-empresa/gastos", icon: Banknote },
  { name: "Ventas", href: "/gestion-empresa/ventas", icon: ShoppingCart },
  { name: "Inventario", href: "/gestion-empresa/inventario", icon: Box },
  { name: "Calendario", href: "/gestion-empresa/calendario", icon: Calendar },
]

const catalogos = [
  { name: "Cuentas", href: "/gestion-empresa/catalogos/cuentas", icon: PiggyBank },
  { name: "Proveedores", href: "/gestion-empresa/catalogos/proveedores", icon: Building2 },
  { name: "Clientes", href: "/gestion-empresa/catalogos/clientes", icon: Users },
  { name: "Suscriptores", href: "/gestion-empresa/catalogos/suscriptores", icon: UserPlus },
  { name: "Socios Comerciales", href: "/gestion-empresa/catalogos/socios-comerciales", icon: Briefcase },
  { name: "Centros de Costos", href: "/gestion-empresa/catalogos/centros-costos", icon: Tags },
  { name: "Centros de Ventas", href: "/gestion-empresa/catalogos/centros-ventas", icon: Tags },
]

export function AdminSidebar() {
  // 1. HOOKS
  const pathname = usePathname()

  // 2. LOGS DE DESARROLLO
  if (process.env.NODE_ENV === "development") {
    // console.log("Current Admin Path:", pathname)
  }

  // 3. GUARDS
  // N/A

  // 4. RETURN PRINCIPAL
  return (
    <div className="flex flex-col w-64 border-r bg-background min-h-screen h-full">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          Mi Gestión
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Operaciones
          </p>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Catálogos
          </p>
          <ul className="space-y-1">
            {catalogos.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
