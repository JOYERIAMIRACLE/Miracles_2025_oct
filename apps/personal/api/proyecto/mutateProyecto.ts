import { ProyectoPayload, ProyectoType } from "@/types/proyecto"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createProyecto(payload: ProyectoPayload): Promise<ProyectoType> {
  const res = await fetch(`${BASE}/api/proyectos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear proyecto")
  }
  const json = await res.json()
  return json.data
}

export async function updateProyecto(documentId: string, payload: Partial<ProyectoPayload>): Promise<ProyectoType> {
  const res = await fetch(`${BASE}/api/proyectos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar proyecto")
  }
  const json = await res.json()
  return json.data
}

export async function deleteProyecto(documentId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/proyectos/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
