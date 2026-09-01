import { ClienteEmpresa } from "./clienteEmpresa"
import { VentaLinea } from "./venta-linea"

export type EstadoVenta   = "Cotizado" | "Pagado" | "Preparando" | "Enviado" | "Entregado" | "Cancelado"
export type MetodoPago    = "Efectivo" | "Transferencia" | "Tarjeta" | "Otro"

export type CentroVentaRef = { id: number; documentId: string; nombre: string | null }

export const ESTADOS_VENTA: EstadoVenta[] = ["Cotizado", "Pagado", "Preparando", "Enviado", "Entregado", "Cancelado"]
export const METODOS_PAGO:  MetodoPago[]  = ["Efectivo", "Transferencia", "Tarjeta", "Otro"]

// Un solo acento (violeta), sin colores decorativos por estado — el rojo
// queda solo para Cancelado (alerta real). Intensidad sube con el avance.
export const ESTADO_VENTA_COLOR: Record<EstadoVenta, string> = {
  Cotizado:   "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Pagado:     "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Preparando: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  Enviado:    "bg-violet-500/25 text-violet-100 border-violet-500/45",
  Entregado:  "bg-violet-600/30 text-violet-50 border-violet-500/60",
  Cancelado:  "bg-red-500/15 text-red-300 border-red-500/30",
}

export type VentaEmpresa = {
  id:          number
  documentId:  string
  numero:      string | null
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
  cotizacionOrigen?:    { id: number; documentId: string; numero: string | null } | null
  envios?:              { id: number; documentId: string; estado: string }[]
  comprobantePago?:     { id: number; url: string; name: string } | null
}

export type VentaPayload = {
  numero?:     string | null
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
  comprobantePago?: number | null
}
