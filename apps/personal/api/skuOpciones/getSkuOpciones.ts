import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/sku-opciones`

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type SkuOpcionRaw = {
  documentId: string
  categoria: "material" | "tipo" | "estilo" | "talla" | "extra" | "piedra"
  code: string
  label: string
  parentCode?: string
  meta?: Record<string, unknown>
  orden?: number
}

export async function fetchSkuOpciones(): Promise<SkuOpcionRaw[]> {
  try {
    const res = await fetch(
      `${URL}?pagination[pageSize]=300&sort=orden:asc,label:asc`,
      { cache: "no-store" }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as SkuOpcionRaw[]
  } catch { return [] }
}

export async function createSkuOpcion(
  data: Omit<SkuOpcionRaw, "documentId">
): Promise<SkuOpcionRaw | null> {
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ data }),
    })
    const json = await res.json()
    return json.data ?? null
  } catch { return null }
}
