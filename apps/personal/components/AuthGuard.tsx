"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isTokenValid, getUserRole } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // No basta con "hay JWT válido" — un cliente_tienda también tiene uno.
    // Solo el rol de staff puede pasar a las secciones internas de gestión.
    if (isTokenValid(getToken()) && getUserRole() === "authenticated") {
      setReady(true)
    } else {
      router.replace("/portal/login")
    }
  }, [router])

  if (!ready) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
    </div>
  )

  return <>{children}</>
}
