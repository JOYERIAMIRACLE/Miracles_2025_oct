export type EventoTipo    = "ingreso" | "pago"
export type TipoPagoEvento = "efectivo" | "debito" | "bonos" | "credito" | "inversion"

export type CategoriaEvento =
  | "vivienda" | "alimentación" | "transporte" | "servicios"
  | "gastos_personales" | "entretenimiento" | "salud" | "ropa"
  | "educación" | "ahorro" | "inversión" | "ingreso"

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
  categoria: CategoriaEvento | null
  cuenta: { id: number; documentId: string; nombre: string; tipo: string; saldoActual: number | null; saldoInicial: number | null } | null
}

export type EventoCalendarioPayload = {
  titulo: string
  monto: number
  tipo: EventoTipo
  tipoPago?: TipoPagoEvento | null
  fecha: string
  descripcion?: string
  recurrente?: boolean
  categoria?: CategoriaEvento | null
  cuenta?: string | null  // documentId de la cuenta
}
