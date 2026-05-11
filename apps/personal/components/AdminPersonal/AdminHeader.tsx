"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"
import { AppLauncher } from "@/components/AppLauncher"
import { AdminSidebar } from "./AdminSidebar"

export function AdminHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const title = (() => {
    if (!pathname || pathname === "/gestion-empresa") return "Dashboard de Inicio"
    const parts = pathname.split("/").filter(Boolean)
    return parts[parts.length - 1]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  })()

  return (
    <>
      <header className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppLauncher />
          <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shadow border border-zinc-800">
            RR
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl flex flex-col overflow-hidden" onClick={() => setMobileOpen(false)}>
            <AdminSidebar />
          </div>
        </div>
      )}
    </>
  )
}
