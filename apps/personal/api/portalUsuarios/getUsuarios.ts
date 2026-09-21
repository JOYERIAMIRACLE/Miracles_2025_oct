import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export type UsuarioPortal = {
  id: number
  username: string
  email: string
  blocked: boolean
  createdAt: string
}

export function useGetUsuariosPortal() {
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    authFetch(`${BASE}/api/portal/usuarios`)
      .then(r => r.json())
      .then(j => setUsuarios(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { usuarios, setUsuarios, loading }
}

export async function invitarUsuario(username: string, email: string): Promise<UsuarioPortal> {
  const r = await authFetch(`${BASE}/api/portal/usuarios`, {
    method: "POST",
    body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase() }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j?.error?.message ?? "No se pudo invitar al usuario")
  return j.data
}

export async function bloquearUsuario(id: number): Promise<void> {
  const r = await authFetch(`${BASE}/api/portal/usuarios/${id}/bloquear`, { method: "PUT" })
  if (!r.ok) { const j = await r.json(); throw new Error(j?.error?.message ?? "No se pudo bloquear") }
}

export async function desbloquearUsuario(id: number): Promise<void> {
  const r = await authFetch(`${BASE}/api/portal/usuarios/${id}/desbloquear`, { method: "PUT" })
  if (!r.ok) { const j = await r.json(); throw new Error(j?.error?.message ?? "No se pudo desbloquear") }
}
