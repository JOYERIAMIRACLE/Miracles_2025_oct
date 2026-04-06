export type EventoTipo = "ingreso" | "pago"

export type EventoCalendarioType = {
  id: number
  documentId: string
  titulo: string
  monto: number
  tipo: EventoTipo
  fecha: string
  descripcion: string | null
  recurrente: boolean
}

export type EventoCalendarioPayload = {
  titulo: string
  monto: number
  tipo: EventoTipo
  fecha: string
  descripcion?: string
  recurrente?: boolean
}
