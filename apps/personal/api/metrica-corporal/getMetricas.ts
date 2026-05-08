import { useEffect, useState } from "react"
import { MetricaCorporalType } from "@/types/salud"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetMetricas() {
  const [metricas, setMetricas] = useState<MetricaCorporalType[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/metrica-corporals?pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setMetricas(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { metricas, setMetricas, loading }
}

export async function createMetrica(payload: Partial<MetricaCorporalType>) {
  const res = await fetch(`${BASE}/api/metrica-corporals`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteMetrica(documentId: string) {
  await fetch(`${BASE}/api/metrica-corporals/${documentId}`, { method: "DELETE" })
}
