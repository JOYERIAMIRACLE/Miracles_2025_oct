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
    const headers = authHeaders()
    const res = await fetch(
      `${URL}?pagination[pageSize]=300&sort=orden:asc,label:asc`,
      { cache: "no-store", headers }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn("[sku-opcion] GET falló", res.status, err?.error?.message ?? "")
      return []
    }
    const json = await res.json()
    return (json.data ?? []) as SkuOpcionRaw[]
  } catch (e) {
    console.error("[sku-opcion] GET excepción", e)
    return []
  }
}

export async function deleteSkuOpcion(documentId: string): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/${documentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    return res.ok
  } catch { return false }
}

export async function createSkuOpcion(
  data: Omit<SkuOpcionRaw, "documentId">
): Promise<SkuOpcionRaw | null> {
  try {
    const headers = { "Content-Type": "application/json", ...authHeaders() }
    const res = await fetch(URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ data }),
    })
    const json = await res.json()
    if (!res.ok) {
      console.warn("[sku-opcion] POST falló", res.status, json?.error?.message ?? json)
    }
    return json.data ?? null
  } catch (e) {
    console.error("[sku-opcion] POST excepción", e)
    return null
  }
}
