import { getToken } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/recursos`

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export async function createRecurso(payload: { nombre: string; descripcion?: string | null; archivo: number; seccion: string; orden?: number }): Promise<void> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ data: { activo: true, orden: 0, ...payload } }),
  })
  if (!res.ok) throw new Error(`Error al subir (${res.status})`)
}

export async function deleteRecurso(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  if (!res.ok) throw new Error(`Error al eliminar (${res.status})`)
}
