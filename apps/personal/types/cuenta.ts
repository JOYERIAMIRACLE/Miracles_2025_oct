// ─── Tipos de Cuenta ──────────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/cuenta/content-types/cuenta/schema.json

export type TipoCuenta    = "Efectivo" | "Crédito" | "Debito"
export type PropositoCuenta = "Operativa" | "Ahorro" | "Inversión" | "Apartado" | "Presupuesto 1"

export type AmbitoCuenta = "trabajo" | "empresa"

export type CuentaType = {
  id:            number
  documentId:    string
  nombre:        string
  tipo:          TipoCuenta      | null
  proposito:     PropositoCuenta | null
  saldoActual:   number          | null
  saldoBanco:    number          | null
  metaDeCuenta:  number          | null
  color:         string          | null
  activa:        boolean         | null
  ambito?:       AmbitoCuenta   | null
  saldoInicial?: number          | null
}

export type CuentaPayload = Omit<CuentaType, "id" | "documentId">
