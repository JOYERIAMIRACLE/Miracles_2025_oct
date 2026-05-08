import { ReunionPayload } from "@/types/reunion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createReunion(payload: ReunionPayload) {
  const res = await fetch(`${BASE}/api/reuniones`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateReunion(documentId: string, payload: Partial<ReunionPayload>) {
  const res = await fetch(`${BASE}/api/reuniones/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteReunion(documentId: string) {
  await fetch(`${BASE}/api/reuniones/${documentId}`, { method: "DELETE" })
}
