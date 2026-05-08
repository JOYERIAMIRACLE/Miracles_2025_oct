import { ProyectoPayload } from "@/types/proyecto"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createProyecto(payload: ProyectoPayload) {
  const res = await fetch(`${BASE}/api/proyectos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateProyecto(documentId: string, payload: Partial<ProyectoPayload>) {
  const res = await fetch(`${BASE}/api/proyectos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteProyecto(documentId: string) {
  await fetch(`${BASE}/api/proyectos/${documentId}`, { method: "DELETE" })
}
