"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isTokenValid } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isTokenValid(getToken())) {
      setReady(true)
    } else {
      router.replace("/login")
    }
  }, [router])

  if (!ready) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
    </div>
  )

  return <>{children}</>
}
