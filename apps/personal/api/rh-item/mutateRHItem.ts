import { getToken } from "@/lib/auth"
import type { RHItemTipo, RHCaracteristica } from "@/types/rhItem"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/rh-items`

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export type RHItemPayload = {
  nombre: string
  subtitulo: string
  tipo: RHItemTipo
  caracteristicas: RHCaracteristica[]
  archivos: number[]
  activo: boolean
  orden?: number
}

export async function createRHItem(payload: RHItemPayload): Promise<void> {
  const res = await fetch(BASE(), { method: "POST", headers: authHeaders(), body: JSON.stringify({ data: payload }) })
  if (!res.ok) throw new Error(`Error al guardar (${res.status})`)
}

export async function updateRHItem(documentId: string, payload: Partial<RHItemPayload>): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ data: payload }) })
  if (!res.ok) throw new Error(`Error al guardar (${res.status})`)
}

export async function deleteRHItem(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  if (!res.ok) throw new Error(`Error al eliminar (${res.status})`)
}
