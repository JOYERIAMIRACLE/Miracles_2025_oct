import { AvisoType, AvisoColor } from "@/types/aviso"
import { getToken } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/avisos`

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export type AvisoPayload = {
  titulo: string
  desc: string
  area: string
  color: AvisoColor
  autor: string | null
  vigencia: string | null
  activo: boolean
  orden: number
  imagen?: number | null
}

async function checkOk(res: Response) {
  if (!res.ok) {
    let detail = ""
    try { const b = await res.json(); detail = b?.error?.message ?? "" } catch {}
    throw new Error(`${res.status}${detail ? ` · ${detail}` : ""}`)
  }
}

export async function createAviso(payload: AvisoPayload): Promise<AvisoType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  await checkOk(res)
  return (await res.json()).data
}

export async function updateAviso(documentId: string, payload: Partial<AvisoPayload>): Promise<AvisoType> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  await checkOk(res)
  return (await res.json()).data
}

export async function deleteAviso(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  await checkOk(res)
}
