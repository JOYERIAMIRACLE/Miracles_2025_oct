export type AmbitoGasto    = "trabajo" | "empresa"

export type CategoriaGasto =
  | "MKT - ADQUISICION"
  | "MKT - OPERACION"
  | "MKT - DIGITAL"
  | "MKT - IMPRENTA"
  | "MKT - PROMOCIONALES"
  | "MKT - PUBLICIDAD"
  | "MKT - NUTRIMIENTO"
  | "IT - SOPORTE HARDWARE"
  | "IT - LICENCIAS"
  | "IT - DESARROLLO"

export const CATEGORIAS: CategoriaGasto[] = [
  "MKT - ADQUISICION",
  "MKT - OPERACION",
  "MKT - DIGITAL",
  "MKT - IMPRENTA",
  "MKT - PROMOCIONALES",
  "MKT - PUBLICIDAD",
  "MKT - NUTRIMIENTO",
  "IT - SOPORTE HARDWARE",
  "IT - LICENCIAS",
  "IT - DESARROLLO",
]

export const CATEGORIA_COLOR: Record<CategoriaGasto, string> = {
  "MKT - ADQUISICION":    "#3b82f6",
  "MKT - OPERACION":      "#8b5cf6",
  "MKT - DIGITAL":        "#06b6d4",
  "MKT - IMPRENTA":       "#f59e0b",
  "MKT - PROMOCIONALES":  "#ec4899",
  "MKT - PUBLICIDAD":     "#f97316",
  "MKT - NUTRIMIENTO":    "#10b981",
  "IT - SOPORTE HARDWARE":"#64748b",
  "IT - LICENCIAS":       "#a855f7",
  "IT - DESARROLLO":      "#22c55e",
}

export type GastoType = {
  id:         number
  documentId: string
  concepto:   string
  monto:      number        | null
  fecha:      string        | null
  categoria:  CategoriaGasto | null
  proveedor:  string        | null
  factura:    string        | null
  notas:      string        | null
  ambito:     AmbitoGasto   | null
}

export type GastoPayload = {
  concepto:   string
  monto:      number        | null
  fecha:      string        | null
  categoria?: CategoriaGasto | null
  proveedor?: string        | null
  factura?:   string        | null
  notas?:     string        | null
  ambito?:    AmbitoGasto   | null
}
