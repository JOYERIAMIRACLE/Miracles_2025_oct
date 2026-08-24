export type EstadoEnvio    = "pendiente" | "preparando" | "enviado" | "en_transito" | "entregado" | "devuelto" | "cancelado"
export type PaqueteriaEnvio = "fedex" | "dhl" | "estafeta" | "ups" | "correos_mex" | "otro"

export type EnvioType = {
  id:             number
  documentId:     string
  numero_guia?:   string | null
  paqueteria?:    PaqueteriaEnvio | null
  estado:         EstadoEnvio
  cliente?:       string | null
  concepto?:      string | null
  fecha_envio?:   string | null
  fecha_estimada?: string | null
  costo_envio?:   number | null
  notas?:         string | null
  createdAt:      string
  venta?:         { id: number; documentId: string; concepto: string; cliente?: { nombre: string } | null } | null
}

export const ESTADO_ENVIO_LABELS: Record<EstadoEnvio, string> = {
  pendiente:   "Pendiente",
  preparando:  "Preparando",
  enviado:     "Enviado",
  en_transito: "En tránsito",
  entregado:   "Entregado",
  devuelto:    "Devuelto",
  cancelado:   "Cancelado",
}

export const ESTADO_ENVIO_COLORS: Record<EstadoEnvio, string> = {
  pendiente:   "bg-slate-500/15 text-slate-400 border-slate-500/20",
  preparando:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  enviado:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  en_transito: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  entregado:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  devuelto:    "bg-orange-500/15 text-orange-400 border-orange-500/20",
  cancelado:   "bg-red-500/15 text-red-400 border-red-500/20",
}

export const PAQUETERIA_LABELS: Record<PaqueteriaEnvio, string> = {
  fedex:       "FedEx",
  dhl:         "DHL",
  estafeta:    "Estafeta",
  ups:         "UPS",
  correos_mex: "Correos MX",
  otro:        "Otro",
}
