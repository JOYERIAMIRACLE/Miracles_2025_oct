import { useEffect, useState } from "react"
import { MaterialDigital } from "@/types/material-digital"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/material-digitals?pagination[pageSize]=200&sort=nombre:asc`

export function useGetMaterialDigital() {
  const [materiales, setMateriales] = useState<MaterialDigital[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(URL)
        const json = await res.json()
        setMateriales(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { materiales, setMateriales, loading }
}

export async function createMaterialDigital(payload: Record<string, unknown>): Promise<MaterialDigital> {
  const res = await fetch(`${BASE}/api/material-digitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updateMaterialDigital(documentId: string, payload: Record<string, unknown>): Promise<MaterialDigital> {
  const res = await fetch(`${BASE}/api/material-digitals/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function deleteMaterialDigital(documentId: string) {
  await fetch(`${BASE}/api/material-digitals/${documentId}`, { method: "DELETE" })
}
