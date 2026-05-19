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
          "populate":             "product_category,foto",
        })
        let res = await fetch(`${URL}?${params}`)
        if (!res.ok) {
          // Fallback: Strapi sin campo foto (schema anterior)
          const fallback = new URLSearchParams({
            "pagination[pageSize]": "500",
            "sort":                 "nombre:asc",
            "populate":             "product_category",
          })
          res = await fetch(`${URL}?${fallback}`)
        }
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
  if (!json.data) throw new Error(json.error?.message ?? "Error al crear")
  return json.data
}

export async function updateInventario(documentId: string, payload: Partial<InventarioPayload> & { product_category?: string | null }): Promise<InventarioType> {
  const res = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!json.data) throw new Error(json.error?.message ?? "Error al actualizar")
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

export async function uploadFoto(file: File): Promise<{ id: number; url: string }> {
  const fd = new FormData()
  fd.append("files", file)
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd })
  if (!res.ok) throw new Error("Error al subir imagen")
  const data = await res.json()
  return { id: data[0].id, url: data[0].url }
}

export async function publishToTienda(inv: InventarioType): Promise<string> {
  const PRODUCTS = `${BASE}/api/products`

  // Resolver categoría: usar product_category enlazado o buscar por nombre (categoriaJoya)
  let categoriaDocId = inv.product_category?.documentId
  if (!categoriaDocId && inv.categoriaJoya) {
    try {
      const catRes = await fetch(
        `${BASE}/api/product-categories?filters[NombreCategoria][$eq]=${encodeURIComponent(inv.categoriaJoya)}&fields[0]=documentId`
      )
      const catJson = await catRes.json()
      categoriaDocId = catJson.data?.[0]?.documentId
    } catch {}
  }

  const body: Record<string, unknown> = {
    nombreProducto:   inv.nombre,
    descripcion:      inv.descripcion,
    costo:            inv.precioVenta,
    sku:              inv.sku,
    talla:            inv.talla,
    figura:           inv.figura,
    materialProducto: inv.materialJoya,
    activo:           true,
    ...(inv.foto ? { imagenes: [inv.foto.id] } : {}),
    ...(categoriaDocId ? { categoria: categoriaDocId } : {}),
  }

  let productDocId: string

  if (inv.productoTiendaId) {
    const res = await fetch(`${PRODUCTS}/${inv.productoTiendaId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: body }),
    })
    const json = await res.json()
    productDocId = json.data?.documentId ?? inv.productoTiendaId
  } else {
    const res = await fetch(`${PRODUCTS}?status=published`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: body }),
    })
    const json = await res.json()
    productDocId = json.data?.documentId
    if (!productDocId) throw new Error("No se pudo crear el producto en tienda")
  }

  await fetch(`${URL}/${inv.documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { publicadoEnTienda: true, productoTiendaId: productDocId } }),
  })

  return productDocId
}
