// ─── Tipos de Partida de Presupuesto ──────────────────────────────────────────
// categoria ahora es texto libre que referencia Categoria.nombre

export type TipoPartida      = "necesidad" | "gastos prescindibles" | "ahorro" | "ingreso"
export type TipoPagoPartida  = "efectivo" | "TDC" | "apartado" | "transferencia" | "bonos" | "debito"
export type FrecuenciaPartida = "diario" | "semanal" | "quincenal" | "mensual" | "anual"

export type PartidaPresupuestoType = {
  id:          number
  documentId:  string
  descripcion: string
  categoria:   string | null
  tipo:        TipoPartida       | null
  tipoPago:    TipoPagoPartida   | null
  frecuencia:  FrecuenciaPartida | null
  monto:       number
  activo:      boolean | null
}

export type PartidaPresupuestoPayload = Omit<PartidaPresupuestoType, "id" | "documentId">
