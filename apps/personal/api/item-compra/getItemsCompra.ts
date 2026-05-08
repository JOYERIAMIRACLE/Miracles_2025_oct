import { useEffect, useState } from "react"
import { ItemCompraType } from "@/types/recetario"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetItemsCompra() {
  const [items,   setItems]   = useState<ItemCompraType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/item-compras?pagination[pageSize]=200&sort=createdAt:asc`)
        const json = await res.json()
        setItems(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { items, setItems, loading }
}

export async function createItemCompra(payload: Partial<ItemCompraType>) {
  const res = await fetch(`${BASE}/api/item-compras`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateItemCompra(documentId: string, payload: Partial<ItemCompraType>) {
  const res = await fetch(`${BASE}/api/item-compras/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteItemCompra(documentId: string) {
  await fetch(`${BASE}/api/item-compras/${documentId}`, { method: "DELETE" })
}
