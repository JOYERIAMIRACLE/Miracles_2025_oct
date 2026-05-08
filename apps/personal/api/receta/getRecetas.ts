import { useEffect, useState } from "react"
import { RecetaType } from "@/types/recetario"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetRecetas() {
  const [recetas,  setRecetas]  = useState<RecetaType[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/recetas?pagination[pageSize]=200&sort=createdAt:desc`)
        const json = await res.json()
        setRecetas(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { recetas, setRecetas, loading }
}

export async function createReceta(payload: Partial<RecetaType>) {
  const res = await fetch(`${BASE}/api/recetas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateReceta(documentId: string, payload: Partial<RecetaType>) {
  const res = await fetch(`${BASE}/api/recetas/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteReceta(documentId: string) {
  await fetch(`${BASE}/api/recetas/${documentId}`, { method: "DELETE" })
}
