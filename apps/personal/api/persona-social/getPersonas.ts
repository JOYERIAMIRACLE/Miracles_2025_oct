import { useEffect, useState } from "react"
import { PersonaSocial, PersonaSocialPayload } from "@/types/persona-social"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL_BASE = `${BASE}/api/persona-socials`

export function useGetPersonas() {
  const [personas, setPersonas] = useState<PersonaSocial[]>([])
  const [loading,  setLoading]  = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${URL_BASE}?pagination[pageSize]=200&sort=nombre:asc`)
        const json = await res.json()
        setPersonas(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])
  return { personas, setPersonas, loading }
}

async function mutate(url: string, method: string, payload?: unknown): Promise<PersonaSocial> {
  const res = await fetch(url, {
    method, headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify({ data: payload }) : undefined,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? `Error ${res.status}`) }
  return (await res.json()).data
}

export const createPersona  = (p: PersonaSocialPayload)                  => mutate(URL_BASE, "POST", p)
export const updatePersona  = (id: string, p: Partial<PersonaSocialPayload>) => mutate(`${URL_BASE}/${id}`, "PUT", p)
export const deletePersona  = async (id: string) => {
  const res = await fetch(`${URL_BASE}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
