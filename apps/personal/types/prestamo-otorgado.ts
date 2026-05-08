export type EstadoPrestamo = "activo" | "liquidado" | "vencido"

export type PrestamoOtorgadoType = {
  id:                number
  documentId:        string
  beneficiario:      string
  monto_original:    number
  saldo_pendiente:   number
  fecha_inicio:      string | null  // "YYYY-MM-DD"
  fecha_vencimiento: string | null  // "YYYY-MM-DD"
  tasa_interes:      number | null
  estado:            EstadoPrestamo | null
  notas:             string | null
}

export type PrestamoOtorgadoPayload = Omit<PrestamoOtorgadoType, "id" | "documentId">
