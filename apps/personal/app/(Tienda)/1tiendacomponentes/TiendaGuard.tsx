"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isProveedorWeb } from "@/lib/auth"

export function TiendaGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (isProveedorWeb()) {
      router.replace("/marketing/sitio-web")
    }
  }, [router])

  return <>{children}</>
}
