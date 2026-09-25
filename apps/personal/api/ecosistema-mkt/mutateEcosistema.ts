import { EcosistemaType, EcosistemaPayload } from "@/types/ecosistema-mkt"
import { authFetch } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ecosistema-mkts`

export async function createEcosistema(payload: EcosistemaPayload): Promise<EcosistemaType> {
  const res = await authFetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function updateEcosistema(documentId: string, payload: Partial<EcosistemaPayload>): Promise<EcosistemaType> {
  const res = await authFetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function deleteEcosistema(documentId: string): Promise<void> {
  const res = await authFetch(`${BASE()}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
