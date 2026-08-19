export type EstadoCotizacion = "Borrador" | "Enviada" | "Aceptada" | "Rechazada"

export const ESTADOS_COT: EstadoCotizacion[] = ["Borrador", "Enviada", "Aceptada", "Rechazada"]

export const ESTADO_COT_COLOR: Record<EstadoCotizacion, string> = {
  Borrador:  "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Enviada:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Aceptada:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Rechazada: "bg-red-500/15 text-red-300 border-red-500/30",
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
}
