import { useEffect, useState } from "react"
import { InventarioType, InventarioPayload } from "@/types/inventario"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/inventarios`

export function useGetInventario() {
  const [items,   setItems]   = useState<InventarioType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "pagination[pageSize]": "500",
          "sort":                 "nombre:asc",
          "populate":             "product_category",
        })
        const res  = await fetch(`${URL}?${params}`)
        const json = await res.json()
        setItems(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { items, setItems, loading }
}

export async function createInventario(payload: Omit<InventarioPayload, "product_category"> & { product_category?: string | null }): Promise<InventarioType> {
  const res = await fetch(URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  return json.data
}

export async function updateInventario(documentId: string, payload: Partial<InventarioPayload> & { product_category?: string | null }): Promise<InventarioType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  return json.data
}

export async function deleteInventario(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}

export async function patchStock(documentId: string, stock: number): Promise<InventarioType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { stock } }),
  })
  return (await res.json()).data
}
