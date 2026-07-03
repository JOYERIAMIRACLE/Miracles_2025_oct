"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { EmpresaSidebar } from "./EmpresaSidebar"
import { EmpresaHeader } from "./EmpresaHeader"
import { AuthGuard } from "@/components/AuthGuard"
import { isSoloTrabajo } from "@/lib/auth"
import { useRouter } from "next/navigation"

export function EmpresaLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isSoloTrabajo()) router.replace("/portal")
  }, [router])

  return (
    <AuthGuard>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64">
        <EmpresaSidebar />
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col overflow-hidden transition-transform duration-300 md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <EmpresaSidebar onNavigate={() => setOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 w-full">
        <EmpresaHeader onMenuClick={() => setOpen(v => !v)} />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
