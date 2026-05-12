import { CategoriaPagoType } from "./categoria-pago"

export type EstadoPago = "pendiente" | "pagado" | "parcial"

export type PagoTrabajoType = {
  id:              number
  documentId:      string
  concepto:        string
  monto:           number
  fecha:           string | null
  estado:          EstadoPago
  categoriaPago:   CategoriaPagoType | null
  proveedor:       string | null
  descripcion:     string | null
  notas:           string | null
  clienteTrabajo?: { id: number; documentId: string; nombre: string } | null
  proyecto?:       { id: number; documentId: string; nombre: string } | null
  createdAt?:      string
  updatedAt?:      string
}

export type PagoTrabajoPayload = {
  concepto:        string
  monto:           number
  fecha?:          string | null
  estado?:         EstadoPago
  categoriaPago?:  { connect: [{ id: number }] } | null
  proveedor?:      string | null
  descripcion?:    string | null
  notas?:          string | null
  clienteTrabajo?: { connect: [{ id: number }] } | null
  proyecto?:       { connect: [{ id: number }] } | null
}
