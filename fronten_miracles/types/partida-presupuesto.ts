// ─── Tipos de Partida de Presupuesto ──────────────────────────────────────────

export type CategoriaPresupuesto =
  | "vivienda"
  | "alimentación"
  | "transporte"
  | "servicios"
  | "gastos Personales"
  | "entretenimiento"
  | "salud"
  | "ropa"
  | "educación"
  | "ahorro"
  | "inversión"
  | "ingreso"

export type TipoPartida      = "necesidad" | "gastos prescindibles" | "ahorro" | "ingreso"
export type TipoPagoPartida  = "efectivo" | "TDC" | "apartado" | "transferencia" | "bonos" | "debito"
export type FrecuenciaPartida = "diario" | "semanal" | "quincenal" | "mensual" | "anual"

export type PartidaPresupuestoType = {
  id:          number
  documentId:  string
  descripcion: string
  categoria:   CategoriaPresupuesto | null
  tipo:        TipoPartida          | null
  tipoPago:    TipoPagoPartida      | null
  frecuencia:  FrecuenciaPartida    | null
  monto:       number
  activo:      boolean | null
}

export type PartidaPresupuestoPayload = Omit<PartidaPresupuestoType, "id" | "documentId">
