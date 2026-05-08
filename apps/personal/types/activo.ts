export type CategoriaActivo =
  | "efectivo"
  | "inversion"
  | "bien_inmueble"
  | "vehiculo"
  | "otros"

export type ActivoType = {
  id:          number
  documentId:  string
  nombre:      string
  categoria:   CategoriaActivo | null
  valor:       number | null
  descripcion: string | null
}

export type ActivoPayload = Omit<ActivoType, "id" | "documentId">
