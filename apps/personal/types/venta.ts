// ─── Tipos de Venta ───────────────────────────────────────────────────────────
// Refleja schema: backend-store-miracles/src/api/venta/content-types/venta/schema.json
// ⚠️ El campo fecha está como "fehca" en Strapi — corregir en Content-Type Builder

import { CuentaType } from "@/types/cuenta"
import { CentroVentaType } from "@/types/centro-venta"
import { ClienteType } from "@/types/cliente"
import { InventarioType } from "@/types/inventario"

export type EstadoVenta = "Pendiente" | "Pagado" | "Cancelado"

export type VentaType = {
  id:           number
  documentId:   string
  concepto:     string
  monto:        number
  fecha:        string           | null  // "YYYY-MM-DD"
  cuenta:       CuentaType       | null
  centro_venta: CentroVentaType  | null
  cliente:      ClienteType      | null
  inventario:   InventarioType   | null
  cantidad:     number           | null
  estado:       EstadoVenta      | null
  notas:        string           | null
}

export type VentaPayload = {
  concepto:     string
  monto:        number
  fecha:        string        | null
  cuenta:       number        | null
  centro_venta: number        | null
  cliente:      number        | null
  inventario:   number        | null
  cantidad:     number        | null
  estado:       EstadoVenta   | null
  notas:        string        | null
}
