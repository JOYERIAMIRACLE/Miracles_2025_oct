export type EventoTipo    = "ingreso" | "pago"
export type TipoPagoEvento = "efectivo" | "debito" | "bonos" | "credito" | "inversion"

// categoria ahora es texto libre que referencia Categoria.nombre

export type EventoCalendarioType = {
  id: number
  documentId: string
  titulo: string
  monto: number
  tipo: EventoTipo
  tipoPago: TipoPagoEvento | null
  fecha: string
  descripcion: string | null
  recurrente: boolean
  categoria: string | null
  cuenta: { id: number; documentId: string; nombre: string; tipo: string; saldoActual: number | null; saldoInicial: number | null } | null
  txDocumentId?: string | null
}

export type EventoCalendarioPayload = {
  titulo: string
  monto: number
  tipo: EventoTipo
  tipoPago?: TipoPagoEvento | null
  fecha: string
  descripcion?: string
  recurrente?: boolean
  categoria?: string | null
  cuenta?: string | null
  txDocumentId?: string | null
}
