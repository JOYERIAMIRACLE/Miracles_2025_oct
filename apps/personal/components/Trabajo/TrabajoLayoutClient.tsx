"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { TrabajoSidebar } from "./TrabajoSidebar"
import { TrabajoHeader } from "./TrabajoHeader"
import { AuthGuard } from "@/components/AuthGuard"
import { isProveedorWeb } from "@/lib/auth"

export function TrabajoLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    if (isProveedorWeb() && !pathname.startsWith("/trabajo/sitio-web")) {
      router.replace("/trabajo/sitio-web")
    }
  }, [pathname, router])

  return (
    <AuthGuard>
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64">
        <TrabajoSidebar />
      </aside>
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 w-full">
        <TrabajoHeader />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
