import { useEffect, useState } from "react"
import { EnvioType } from "@/types/envio"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetEnvios() {
  const [envios,  setEnvios]  = useState<EnvioType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/envios?pagination[pageSize]=200&sort=createdAt:desc`)
        const json = await res.json()
        setEnvios(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { envios, setEnvios, loading }
}

export async function createEnvio(payload: Record<string, unknown>): Promise<EnvioType> {
  const res = await fetch(`${BASE}/api/envios`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updateEnvio(documentId: string, payload: Record<string, unknown>): Promise<EnvioType> {
  const res = await fetch(`${BASE}/api/envios/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function deleteEnvio(documentId: string) {
  await fetch(`${BASE}/api/envios/${documentId}`, { method: "DELETE" })
}
