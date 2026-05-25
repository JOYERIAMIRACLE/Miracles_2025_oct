export type CdlType = {
  id:                      number
  documentId:              string
  semana:                  number | null
  mes:                     string
  anio:                    number
  nuevosLeads:             number
  cantidadCampanas:        number
  ventasCuentasNuevas:     number
  porcentajeRetencion:     number
  clientesNuevos:          number
  costoAdquisicion:        number
  contenidosNancy:         number
  puntajeEncuestaNancy:    number
  contenidosRichard:       number
  puntajeEncuestaRichard:  number
  ambito:                  "trabajo" | "empresa" | null
  createdAt?:              string
  updatedAt?:              string
}

export type CdlPayload = Omit<CdlType, "id" | "documentId" | "createdAt" | "updatedAt">
