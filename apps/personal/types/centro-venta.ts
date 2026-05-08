// ─── Tipos de Centro de Venta ─────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/centro-venta/content-types/centro-venta/schema.json

export type CentroVentaType = {
  id:         number
  documentId: string
  nombre:     string | null
  codigo:     string | null
}

export type CentroVentaPayload = Omit<CentroVentaType, "id" | "documentId">
