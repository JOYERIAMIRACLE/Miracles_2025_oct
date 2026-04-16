// ─── Tipos de Transaccion ─────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/transaccion/content-types/transaccion/schema.json

import { CuentaType } from "@/types/cuenta"

export type TipoTransaccion =
  | "ingreso"
  | "gasto"
  | "transferencia"

export type CategoriaTransaccion =
  | "alimentacion"
  | "transporte"
  | "vivienda"
  | "servicios"
  | "salud"
  | "educacion"
  | "entretenimiento"
  | "ropa"
  | "ahorro"
  | "inversion"
  | "sueldo"
  | "freelance"
  | "venta"
  | "transferencia"
  | "otro"

export type TransaccionType = {
  id:            number
  documentId:    string
  descripcion:   string
  tipo:          TipoTransaccion
  monto:         number
  fecha:         string
  categoria:     CategoriaTransaccion | null
  notas:         string               | null
  cuentaOrigen:  CuentaType           | null
  cuentaDestino: CuentaType           | null
}

export type TransaccionPayload = {
  descripcion:   string
  tipo:          TipoTransaccion
  monto:         number
  fecha:         string
  categoria?:    CategoriaTransaccion | null
  notas?:        string               | null
  cuentaOrigen?: string | number      | null
  cuentaDestino?: string | number     | null
}
