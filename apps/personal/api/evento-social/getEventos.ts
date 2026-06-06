import { useEffect, useState } from "react"
import { EventoSocial, EventoSocialPayload } from "@/types/evento-social"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL_BASE = `${BASE}/api/evento-socials`

export function useGetEventos() {
  const [eventos,  setEventos]  = useState<EventoSocial[]>([])
  const [loading,  setLoading]  = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${URL_BASE}?pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setEventos(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])
  return { eventos, setEventos, loading }
}

async function mutate(url: string, method: string, payload?: unknown): Promise<EventoSocial> {
  const res = await fetch(url, {
    method, headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify({ data: payload }) : undefined,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? `Error ${res.status}`) }
  return (await res.json()).data
}

export const createEvento = (p: EventoSocialPayload)                    => mutate(URL_BASE, "POST", p)
export const updateEvento = (id: string, p: Partial<EventoSocialPayload>) => mutate(`${URL_BASE}/${id}`, "PUT", p)
export const deleteEvento = async (id: string) => {
  const res = await fetch(`${URL_BASE}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
