// ─── Tipos de Centro de Costo ─────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/centro-costo/content-types/centro-costo/schema.json

export type CentroCostoType = {
  id:          number
  documentId:  string
  nombre:      string
  codigo:      string | null
  descripcion: string | null
}

export type CentroCostoPayload = Omit<CentroCostoType, "id" | "documentId">
