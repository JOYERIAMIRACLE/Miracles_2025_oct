// ─── Tipos de Transaccion ─────────────────────────────────────────────────────
// Libro contable único: respalda Ingresos, Gastos y Transferencias (tipo).
// Refleja schema: apps/backend/src/api/transaccion/content-types/transaccion/schema.json

import { CuentaType } from "@/types/cuenta"

export type TipoTransaccion =
  | "ingreso"
  | "gasto"
  | "transferencia"

export type MetodoPagoTransaccion = "Efectivo" | "Transferencia" | "Tarjeta" | "Otro"
export const METODOS_PAGO: MetodoPagoTransaccion[] = ["Efectivo", "Transferencia", "Tarjeta", "Otro"]

// categoria es texto libre que referencia Categoria.nombre
// (la tabla Categoria define los valores válidos, ambito y colores)
export type TransaccionType = {
  id:                number
  documentId:        string
  descripcion:       string
  tipo:              TipoTransaccion
  monto:             number
  fecha:             string
  categoria:         string     | null
  notas:             string     | null
  cuentaOrigen:      CuentaType | null
  cuentaDestino:     CuentaType | null
  ambito:            "trabajo" | "empresa" | null
  comprobante:       { id: number; url: string; name: string; size: number; mime: string } | null
  proveedor:         string | null
  factura:           string | null
  metodoPago:        MetodoPagoTransaccion | null
  referencia:        string | null
  clienteDocumentId: string | null
  centro_costo:      { id: number; documentId: string; nombre: string } | null
  cliente:           { id: number; documentId: string; nombre: string } | null
  ventaOrigen:       { id: number; documentId: string; concepto: string; numero: string | null } | null
  createdAt?:        string
}

export type TransaccionPayload = {
  descripcion:        string
  tipo:               TipoTransaccion
  monto:              number
  fecha:              string
  categoria?:         string | null
  notas?:             string | null
  cuentaOrigen?:       string | number | null
  cuentaDestino?:      string | number | null
  ambito?:            "trabajo" | "empresa" | null
  comprobante?:       number | null
  proveedor?:         string | null
  factura?:           string | null
  metodoPago?:        MetodoPagoTransaccion | null
  referencia?:        string | null
  clienteDocumentId?: string | null
  centro_costo?:      string | number | null
  cliente?:           string | number | null
  ventaOrigen?:       string | number | null
}
