import { PagoTrabajoPayload } from "@/types/pago-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createPagoTrabajo(payload: PagoTrabajoPayload) {
  const res = await fetch(`${BASE}/api/pago-trabajos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updatePagoTrabajo(documentId: string, payload: Partial<PagoTrabajoPayload>) {
  const res = await fetch(`${BASE}/api/pago-trabajos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deletePagoTrabajo(documentId: string) {
  await fetch(`${BASE}/api/pago-trabajos/${documentId}`, { method: "DELETE" })
}
