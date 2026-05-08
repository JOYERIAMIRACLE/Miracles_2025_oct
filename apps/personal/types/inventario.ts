// ─── Tipos de Inventario ──────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/inventario/content-types/inventario/schema.json

export type MaterialInventario = "producto" | "servicio"

export type InventarioType = {
  id:               number
  documentId:       string
  nombre:           string
  sku:              string | null
  costoProduccion:  number | null
  precioVenta:      number | null
  stock:            number | null
  material:         MaterialInventario | null
  product_category: { id: number; documentId: string; NombreCategoria: string } | null
}

export type InventarioPayload = Omit<InventarioType, "id" | "documentId" | "product_category"> & {
  product_category: number | null  // se envía solo el id al crear/editar
}
