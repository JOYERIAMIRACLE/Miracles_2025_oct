"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export interface CurrentUser {
  username: string
  email: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json) setUser({ username: json.username, email: json.email }) })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
