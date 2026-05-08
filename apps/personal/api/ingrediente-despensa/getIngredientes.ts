import { useEffect, useState } from "react"
import { IngredienteType } from "@/types/recetario"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetIngredientes() {
  const [ingredientes, setIngredientes] = useState<IngredienteType[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/ingrediente-despensas?pagination[pageSize]=500&sort=nombre:asc`)
        const json = await res.json()
        setIngredientes(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { ingredientes, setIngredientes, loading }
}

export async function createIngrediente(payload: Partial<IngredienteType>) {
  const res = await fetch(`${BASE}/api/ingrediente-despensas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateIngrediente(documentId: string, payload: Partial<IngredienteType>) {
  const res = await fetch(`${BASE}/api/ingrediente-despensas/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteIngrediente(documentId: string) {
  await fetch(`${BASE}/api/ingrediente-despensas/${documentId}`, { method: "DELETE" })
}
