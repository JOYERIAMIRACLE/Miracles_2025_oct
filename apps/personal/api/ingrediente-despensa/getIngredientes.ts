import { useEffect, useState } from "react"
import { IngredienteDespensa, IngredientePayload } from "@/types/ingrediente-despensa"

const BASE     = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL_BASE = `${BASE}/api/ingrediente-despensas`

export function useGetIngredientes() {
  const [ingredientes, setIngredientes] = useState<IngredienteDespensa[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${URL_BASE}?pagination[pageSize]=200&sort=nombre:asc`)
        const json = await res.json()
        setIngredientes(json.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { ingredientes, setIngredientes, loading }
}

export async function createIngrediente(payload: IngredientePayload): Promise<IngredienteDespensa> {
  const res = await fetch(URL_BASE, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear ingrediente")
  }
  return (await res.json()).data
}

export async function updateIngrediente(
  documentId: string,
  payload: Partial<IngredientePayload>
): Promise<IngredienteDespensa> {
  const res = await fetch(`${URL_BASE}/${documentId}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar ingrediente")
  }
  return (await res.json()).data
}

export async function deleteIngrediente(documentId: string): Promise<void> {
  const res = await fetch(`${URL_BASE}/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar ingrediente")
}
