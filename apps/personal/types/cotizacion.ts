export type EstadoCotizacion = "Borrador" | "Enviada" | "Aceptada" | "Rechazada" | "Convertida"

export const ESTADOS_COT: EstadoCotizacion[] = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Convertida"]

// Un solo acento (violeta), sin colores decorativos por estado — el rojo
// queda solo para Rechazada (alerta real). Convertida = verde, es un
// estado terminal exitoso (ya se volvió pedido), no una alerta.
export const ESTADO_COT_COLOR: Record<EstadoCotizacion, string> = {
  Borrador:   "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Enviada:    "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Aceptada:   "bg-violet-600/25 text-violet-100 border-violet-500/50",
  Rechazada:  "bg-red-500/15 text-red-300 border-red-500/30",
  Convertida: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
}

export type ItemCotizacion = {
  sku:         string
  descripcion: string
  cantidad:    number
  precio:      number
  subtotal:    number
  productoId?: string | null
}

export type Cotizacion = {
  id:          number
  documentId:  string
  numero:      string | null
  items:       ItemCotizacion[]
  precioEnvio: number
  total:       number
  estado:      EstadoCotizacion
  notas:       string | null
  fecha:       string | null
  createdAt:   string
  cliente?:    { documentId: string; nombre: string; telefono: string | null; email: string | null } | null
  ventaGenerada?: { id: number; documentId: string; concepto: string; estado: string } | null
}

export type CotizacionPayload = {
  numero?:      string | null
  cliente?:     string
  items?:       ItemCotizacion[]
  precioEnvio?: number
  total?:       number
  estado?:      EstadoCotizacion
  notas?:       string | null
  fecha?:       string | null
  ventaGenerada?: { connect: [{ id: number }] } | null
}
