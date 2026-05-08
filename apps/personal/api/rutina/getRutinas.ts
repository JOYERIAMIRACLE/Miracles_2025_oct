import { useEffect, useState } from "react"
import { RutinaType } from "@/types/salud"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetRutinas() {
  const [rutinas,  setRutinas]  = useState<RutinaType[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/rutinas?pagination[pageSize]=100&sort=nombre:asc`)
        const json = await res.json()
        setRutinas(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { rutinas, setRutinas, loading }
}

export async function createRutina(payload: Partial<RutinaType>) {
  const res = await fetch(`${BASE}/api/rutinas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateRutina(documentId: string, payload: Partial<RutinaType>) {
  const res = await fetch(`${BASE}/api/rutinas/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteRutina(documentId: string) {
  await fetch(`${BASE}/api/rutinas/${documentId}`, { method: "DELETE" })
}
