import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export async function uploadMedia(file: File): Promise<{ id: number; url: string }> {
  const token = getToken()
  const fd = new FormData()
  fd.append("files", file)
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) throw new Error(`Error al subir imagen (${res.status})`)
  const data = await res.json()
  return { id: data[0].id, url: data[0].url }
}
