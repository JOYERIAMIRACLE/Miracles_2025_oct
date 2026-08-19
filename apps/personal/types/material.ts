export type Material = {
  id:                     number
  documentId:             string
  nombre:                 string
  unidadMedida:           "gramo"
  precioReferenciaGramo:  number | null
  stockGramos:            number
  activo:                 boolean
  notas:                  string | null
  createdAt:              string
}

export type MaterialPayload = {
  nombre:                  string
  unidadMedida?:           "gramo"
  precioReferenciaGramo?:  number | null
  activo?:                 boolean
  notas?:                  string | null
}
