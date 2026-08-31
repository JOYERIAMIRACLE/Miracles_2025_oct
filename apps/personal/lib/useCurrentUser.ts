"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export interface CurrentUser {
  id: number
  username: string
  email: string
  fotoUrl: string | null
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${BASE}/api/users/me?populate=foto`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!json) return
        setUser({ id: json.id, username: json.username, email: json.email, fotoUrl: json.foto?.url ?? null })
      })
      .finally(() => setLoading(false))
  }, [tick])

  return { user, loading, reload: () => setTick(t => t + 1) }
}

export async function updateFotoPerfil(userId: number, mediaId: number) {
  const token = getToken()
  const res = await fetch(`${BASE}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ foto: mediaId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Error al actualizar la foto de perfil")
  }
  return res.json()
}
