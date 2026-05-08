// ─── Tipos de Transaccion ─────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/transaccion/content-types/transaccion/schema.json

import { CuentaType } from "@/types/cuenta"

export type TipoTransaccion =
  | "ingreso"
  | "gasto"
  | "transferencia"

// categoria ahora es texto libre que referencia Categoria.nombre
// (la tabla Categoria define los valores válidos, grupos y colores)
export type TransaccionType = {
  id:            number
  documentId:    string
  descripcion:   string
  tipo:          TipoTransaccion
  monto:         number
  fecha:         string
  categoria:     string     | null
  notas:         string     | null
  cuentaOrigen:  CuentaType | null
  cuentaDestino: CuentaType | null
}

export type TransaccionPayload = {
  descripcion:   string
  tipo:          TipoTransaccion
  monto:         number
  fecha:         string
  categoria?:    string | null
  notas?:        string | null
  cuentaOrigen?: string | number | null
  cuentaDestino?: string | number | null
}
