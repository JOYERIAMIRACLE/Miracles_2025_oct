import { MaterialDigitalType, MaterialDigitalPayload } from "@/types/material-digital"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/material-digitals`

export async function createMaterialDigital(payload: MaterialDigitalPayload): Promise<MaterialDigitalType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Error ${res.status}`)
  }
  return (await res.json()).data
}

export async function updateMaterialDigital(documentId: string, payload: Partial<MaterialDigitalPayload>): Promise<MaterialDigitalType> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Error ${res.status}`)
  }
  return (await res.json()).data
}

export async function deleteMaterialDigital(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
