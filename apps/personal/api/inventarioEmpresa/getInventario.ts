import { useEffect, useState } from "react"
import { ProductType } from "@/types/product"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/products`

export function useGetInventario() {
  const [items,   setItems]   = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "pagination[pageSize]": "500",
          "sort":                 "nombreProducto:asc",
          "populate":             "categoria,imagenes",
          "publicationState":     "preview",
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
  const res = await fetch(`${URL}?status=draft`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!json.data) throw new Error(json.error?.message ?? "Error al crear")
  return json.data
}

export async function updateProducto(documentId: string, payload: Record<string, unknown>): Promise<ProductType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!json.data) throw new Error(json.error?.message ?? "Error al actualizar")
  return json.data
}

export async function deleteProducto(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}

export async function patchStock(documentId: string, stock: number): Promise<ProductType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { stock } }),
  })
  return (await res.json()).data
}

export async function uploadFoto(file: File): Promise<{ id: number; url: string }> {
  const fd = new FormData()
  fd.append("files", file)
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd })
  if (!res.ok) throw new Error("Error al subir imagen")
  const data = await res.json()
  return { id: data[0].id, url: data[0].url }
}

export async function toggleActivoTienda(documentId: string, activo: boolean): Promise<void> {
  const status = activo ? "published" : "draft"
  await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { activo }, status }),
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
  await fetch(`${URL}/${item.documentId}?status=published`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { activo: true, ...(categoriaDocId ? { categoria: categoriaDocId } : {}) } }),
  })
}
