import { CampanaType, CampanaPayload } from "@/types/campana"
import { authFetch } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campanas`

export async function createCampana(payload: CampanaPayload): Promise<CampanaType> {
  const res = await authFetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return json.data
}

export async function updateCampana(documentId: string, payload: Partial<CampanaPayload>): Promise<CampanaType> {
  const res = await authFetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return json.data
}

export async function deleteCampana(documentId: string): Promise<void> {
  const res = await authFetch(`${BASE()}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
