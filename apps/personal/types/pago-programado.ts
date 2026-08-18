export type TipoPago    = "pago" | "cobro"
export type EstadoPago  = "pendiente" | "pagado" | "cancelado"
export type FrecuenciaPago = "mensual" | "trimestral" | "anual" | "unico"

export type PagoProgramadoType = {
  id:          number
  documentId:  string
  concepto:    string
  tipo:        TipoPago
  monto?:      number | null
  fecha?:      string | null
  estado:      EstadoPago
  recurrente?: boolean | null
  frecuencia?: FrecuenciaPago | null
  categoria?:  string | null
  notas?:      string | null
  cuenta?:      { id: number; documentId: string; nombre: string } | null
  transaccion?: { id: number; documentId: string } | null
  ambito?:      "trabajo" | "empresa" | null
  createdAt:   string
}

export const ESTADO_PAGO_COLORS: Record<EstadoPago, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pagado:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelado: "bg-red-500/15 text-red-400 border-red-500/20",
}

export const ESTADO_PAGO_LABELS: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  pagado:    "Pagado",
  cancelado: "Cancelado",
}
