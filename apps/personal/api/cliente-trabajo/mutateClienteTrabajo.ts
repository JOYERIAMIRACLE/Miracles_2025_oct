import { ClienteTrabajoPayload } from "@/types/cliente-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createClienteTrabajo(payload: ClienteTrabajoPayload) {
  const res = await fetch(`${BASE}/api/cliente-trabajos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateClienteTrabajo(documentId: string, payload: Partial<ClienteTrabajoPayload>) {
  const res = await fetch(`${BASE}/api/cliente-trabajos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteClienteTrabajo(documentId: string) {
  await fetch(`${BASE}/api/cliente-trabajos/${documentId}`, { method: "DELETE" })
}
