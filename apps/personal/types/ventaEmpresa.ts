import { ClienteEmpresa } from "./clienteEmpresa"
import { VentaLinea } from "./venta-linea"

export type EstadoVenta   = "Cotizado" | "Pagado" | "Preparando" | "Enviado" | "Entregado" | "Cancelado"
export type MetodoPago    = "Efectivo" | "Transferencia" | "Tarjeta" | "Otro"

export type CentroVentaRef = { id: number; documentId: string; nombre: string | null }

export const ESTADOS_VENTA: EstadoVenta[] = ["Cotizado", "Pagado", "Preparando", "Enviado", "Entregado", "Cancelado"]
export const METODOS_PAGO:  MetodoPago[]  = ["Efectivo", "Transferencia", "Tarjeta", "Otro"]

export const ESTADO_VENTA_COLOR: Record<EstadoVenta, string> = {
  Cotizado:   "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Pagado:     "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Preparando: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Enviado:    "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Entregado:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Cancelado:  "bg-red-500/15 text-red-300 border-red-500/30",
}

export type VentaEmpresa = {
  id:          number
  documentId:  string
  concepto:    string
  monto:       number
  fecha:       string
  estado:      EstadoVenta | null
  metodoPago:  MetodoPago | null
  notas:       string | null
  cantidad:    number
  cliente:     Pick<ClienteEmpresa, "id" | "documentId" | "nombre" | "telefono"> | null
  producto:    { id: number; documentId: string; nombreProducto: string; costo: number | null } | null
  centro_venta: CentroVentaRef | null
  lineas:      VentaLinea[]
  createdAt:   string
}

export type VentaPayload = {
  concepto:    string
  monto:       number
  fecha:       string
  estado?:     EstadoVenta
  metodoPago?: MetodoPago | null
  notas?:      string | null
  cantidad?:   number
  cliente?:    string | null
  producto?:   string | null
  centro_venta?: string | null
}
