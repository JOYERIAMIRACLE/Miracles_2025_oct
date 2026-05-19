import { useEffect, useState } from "react"
import { ProductType } from "@/types/product"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/products`

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useGetInventario() {
  const [items,   setItems]   = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "pagination[pageSize]": "500",
          "sort":                 "nombreProducto:asc",
          "populate":             "*",
        })
        const res  = await fetch(`${URL}?${params}`)
        const json = await res.json()
        setItems(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { items, setItems, loading }
}

export async function createProducto(payload: Partial<ProductType> & { categoria?: string | null }): Promise<ProductType> {
  const res = await fetch(URL, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!json.data) throw new Error(json.error?.message ?? "Error al crear")
  return json.data
}

export async function updateProducto(documentId: string, payload: Record<string, unknown>): Promise<ProductType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!json.data) throw new Error(json.error?.message ?? "Error al actualizar")
  return json.data
}

export async function deleteProducto(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE", headers: authHeaders() })
}

export async function patchStock(documentId: string, stock: number): Promise<ProductType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: { stock } }),
  })
  return (await res.json()).data
}

export async function uploadFoto(file: File): Promise<{ id: number; url: string }> {
  const fd = new FormData()
  fd.append("files", file)
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", headers: authHeaders(), body: fd })
  if (!res.ok) throw new Error("Error al subir imagen")
  const data = await res.json()
  return { id: data[0].id, url: data[0].url }
}

export async function toggleActivoTienda(documentId: string, activo: boolean): Promise<void> {
  await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: { activo } }),
  })
}

async function resolverCategoriaId(categoriaJoya: string | null): Promise<string | undefined> {
  if (!categoriaJoya) return undefined
  try {
    const res = await fetch(
      `${BASE}/api/product-categories?filters[NombreCategoria][$eq]=${encodeURIComponent(categoriaJoya)}&fields[0]=documentId`
    )
    const json = await res.json()
    return json.data?.[0]?.documentId
  } catch { return undefined }
}

export async function publishToTienda(item: ProductType): Promise<void> {
  const categoriaDocId = item.categoria?.documentId ?? await resolverCategoriaId(item.categoriaJoya)
  await fetch(`${URL}/${item.documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: { activo: true, ...(categoriaDocId ? { categoria: categoriaDocId } : {}) } }),
  })
}
