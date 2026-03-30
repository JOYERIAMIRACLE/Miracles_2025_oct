// ─── Tipos de Gasto ───────────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/gasto/content-types/gasto/schema.json

import { CuentaType } from "@/types/cuenta"
import { CentroCostoType } from "@/types/centro-costo"

export type GastoType = {
  id:           number
  documentId:   string
  concepto:     string
  monto:        number        | null
  fecha:        string        | null  // "YYYY-MM-DD"
  cuenta:       CuentaType   | null
  centro_costo: CentroCostoType | null
  notas:        string        | null
}

export type GastoPayload = {
  concepto:     string
  monto:        number        | null
  fecha:        string        | null
  cuenta:       number        | null  // id de la cuenta
  centro_costo: number        | null  // id del centro de costo
  notas:        string        | null
}
