import { useEffect, useState } from "react"
import { Cancion, CancionPayload } from "@/types/cancion"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL_BASE = `${BASE}/api/canciones`

export function useGetCanciones() {
  const [canciones, setCanciones] = useState<Cancion[]>([])
  const [loading,   setLoading]   = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const res  = await authFetch(`${URL_BASE}?pagination[pageSize]=200&sort=updatedAt:desc`)
        const json = await res.json()
        setCanciones(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])
  return { canciones, setCanciones, loading }
}

async function mutate(url: string, method: string, payload?: unknown): Promise<Cancion> {
  const res = await authFetch(url, {
    method, headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify({ data: payload }) : undefined,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? `Error ${res.status}`) }
  return (await res.json()).data
}

export const createCancion = (p: CancionPayload)                  => mutate(URL_BASE, "POST", p)
export const updateCancion = (id: string, p: Partial<CancionPayload>) => mutate(`${URL_BASE}/${id}`, "PUT", p)
export const deleteCancion = async (id: string) => {
  const res = await authFetch(`${URL_BASE}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
