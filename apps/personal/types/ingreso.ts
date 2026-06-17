export type MetodoPagoIngreso  = "Efectivo" | "Transferencia" | "Tarjeta" | "Otro"
export type CategoriaIngreso   = "VENTA - JOYERÍA" | "VENTA - ANTICIPO" | "VENTA - SALDO" | "OTRO"

export const METODOS_PAGO_INGRESO: MetodoPagoIngreso[] = ["Efectivo", "Transferencia", "Tarjeta", "Otro"]
export const CATEGORIAS_INGRESO:   CategoriaIngreso[]  = ["VENTA - JOYERÍA", "VENTA - ANTICIPO", "VENTA - SALDO", "OTRO"]

export const METODO_COLOR: Record<MetodoPagoIngreso, string> = {
  "Efectivo":      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Transferencia": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Tarjeta":       "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Otro":          "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

export type Ingreso = {
  id:                number
  documentId:        string
  concepto:          string
  monto:             number | null
  fecha:             string | null
  metodoPago:        MetodoPagoIngreso | null
  categoria:         CategoriaIngreso  | null
  notas:             string | null
  referencia:        string | null
  clienteDocumentId: string | null
  ambito:            "trabajo" | "empresa" | null
  createdAt:         string
}

export type IngresoPayload = {
  concepto:           string
  monto:              number | null
  fecha:              string | null
  metodoPago?:        MetodoPagoIngreso | null
  categoria?:         CategoriaIngreso  | null
  notas?:             string | null
  referencia?:        string | null
  clienteDocumentId?: string | null
  ambito?:            "trabajo" | "empresa" | null
}
