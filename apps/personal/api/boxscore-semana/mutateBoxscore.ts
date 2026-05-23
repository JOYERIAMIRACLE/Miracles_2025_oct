import { BoxscoreType, BoxscorePayload } from "@/types/boxscore-semana"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boxscore-semanas`

export async function createBoxscore(payload: BoxscorePayload): Promise<BoxscoreType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function updateBoxscore(documentId: string, payload: Partial<BoxscorePayload>): Promise<BoxscoreType> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}

export async function deleteBoxscore(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`${res.status}`)
}
