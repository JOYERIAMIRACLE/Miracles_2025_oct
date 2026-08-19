export type TipoMovimientoMaterial = "entrada" | "salida"

export type MovimientoMaterial = {
  id:          number
  documentId:  string
  tipo:        TipoMovimientoMaterial
  material:    { id: number; documentId: string; nombre: string } | null
  gramos:      number
  fecha:       string
  notas:       string | null
  compraLinea: { id: number; documentId: string } | null
  producto:    { id: number; documentId: string } | null
  createdAt:   string
}

export type MovimientoMaterialPayload = {
  tipo:         TipoMovimientoMaterial
  material:     string | number
  gramos:       number
  fecha:        string
  notas?:       string | null
  compraLinea?: string | number | null
  producto?:    string | number | null
}
