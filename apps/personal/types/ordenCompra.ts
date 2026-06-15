export type EstadoOrden = "borrador" | "enviada" | "recibida_parcial" | "recibida" | "cancelada"

export type LineaOrden = {
  id:               string
  sku:              string
  nombre:           string
  cantidad:         number
  cantidadRecibida: number
  costoUnitario:    number
}

export type OrdenCompra = {
  id:                    number
  documentId:            string
  numero:                string
  fecha:                 string | null
  fechaEntregaEstimada:  string | null
  estado:                EstadoOrden
  lineas:                LineaOrden[]
  totalEstimado:         number | null
  notas:                 string | null
  proveedor:             { id: number; documentId: string; nombre: string } | null
  createdAt:             string
}

export type OrdenPayload = {
  numero?:               string
  fecha?:                string | null
  fechaEntregaEstimada?: string | null
  estado?:               EstadoOrden
  lineas?:               LineaOrden[]
  totalEstimado?:        number | null
  notas?:                string | null
  proveedor?:            string | null  // documentId
}

export const ESTADO_CONFIG: Record<EstadoOrden, { label: string; color: string; dot: string }> = {
  borrador:          { label: "Borrador",         color: "bg-slate-500/10 text-slate-400 border-slate-500/20",   dot: "bg-slate-500"   },
  enviada:           { label: "Enviada",           color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     dot: "bg-blue-400"    },
  recibida_parcial:  { label: "Recibida parcial",  color: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400"   },
  recibida:          { label: "Recibida",          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  cancelada:         { label: "Cancelada",         color: "bg-red-500/10 text-red-400 border-red-500/20",       dot: "bg-red-400"     },
}
