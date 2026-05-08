export type EstadoPago = "pendiente" | "pagado" | "parcial"

export type PagoTrabajoType = {
  id:              number
  documentId:      string
  concepto:        string
  monto:           number
  fecha:           string | null
  estado:          EstadoPago
  notas:           string | null
  clienteTrabajo?: { id: number; documentId: string; nombre: string } | null
  proyecto?:       { id: number; documentId: string; nombre: string } | null
  createdAt?:      string
  updatedAt?:      string
}

export type PagoTrabajoPayload = {
  concepto:         string
  monto:            number
  fecha?:           string | null
  estado?:          EstadoPago
  notas?:           string | null
  clienteTrabajo?:  { connect: [{ id: number }] } | null
  proyecto?:        { connect: [{ id: number }] } | null
}
