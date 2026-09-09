"use client"
import { useCallback, useEffect, useState } from "react"
import { getClienteToken, isClienteTokenValid, removeClienteToken } from "@/lib/tiendaAuth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export interface ClienteUsuario {
  id:       number
  username: string
  email:    string
}

export function useClienteAuth() {
  const [cliente, setCliente] = useState<ClienteUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  const cargar = useCallback(async () => {
    const token = getClienteToken()
    if (!isClienteTokenValid(token)) {
      removeClienteToken()
      setCliente(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { removeClienteToken(); setCliente(null); return }
      const json = await res.json()
      setCliente({ id: json.id, username: json.username, email: json.email })
    } catch {
      setCliente(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar, tick])

  function logout() {
    removeClienteToken()
    setCliente(null)
  }

  return { cliente, loading, logout, reload: () => setTick(t => t + 1) }
}
