import { CdlType, CdlPayload } from "@/types/cdl-metricas"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cdl-metricas`

export async function createCdl(payload: CdlPayload): Promise<CdlType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function updateCdl(documentId: string, payload: Partial<CdlPayload>): Promise<CdlType> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function deleteCdl(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
