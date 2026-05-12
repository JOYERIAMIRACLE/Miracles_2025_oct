import { MaterialTrabajoPayload } from "@/types/material-trabajo"

const BASE    = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createMaterialTrabajo(payload: MaterialTrabajoPayload) {
  const res = await fetch(`${BASE}/api/material-trabajos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateMaterialTrabajo(documentId: string, payload: Partial<MaterialTrabajoPayload>) {
  const res = await fetch(`${BASE}/api/material-trabajos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteMaterialTrabajo(documentId: string) {
  await fetch(`${BASE}/api/material-trabajos/${documentId}`, { method: "DELETE" })
}
