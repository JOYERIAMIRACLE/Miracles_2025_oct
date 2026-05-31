export type FunnelEtapa     = "Lead" | "Oferta" | "Pedido" | "Entrega" | "Rechazada"
export type SegmentoCliente = "Pareja" | "Matrimonio" | "Familiar" | "Personalizado"
export type EstadoCliente   = "Activo" | "Inactivo"

// Progresión lineal (sin Rechazada — es un estado terminal lateral)
export const FUNNEL_ETAPAS: FunnelEtapa[] = ["Lead", "Oferta", "Pedido", "Entrega"]

// Todas las etapas para renderizar pipeline completo
export const FUNNEL_ALL: FunnelEtapa[] = ["Lead", "Oferta", "Pedido", "Entrega", "Rechazada"]

export const FUNNEL_LABEL: Record<FunnelEtapa, string> = {
  Lead:      "Lead",
  Oferta:    "Oferta",
  Pedido:    "Pedido",
  Entrega:   "Entrega",
  Rechazada: "Rechazada",
}

export const FUNNEL_COLOR: Record<FunnelEtapa, string> = {
  Lead:      "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Oferta:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Pedido:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Entrega:   "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Rechazada: "bg-red-500/15 text-red-300 border-red-500/30",
}

export const SEGMENTOS: SegmentoCliente[] = ["Pareja", "Matrimonio", "Familiar", "Personalizado"]

export type ClienteEmpresa = {
  id:               number
  documentId:       string
  nombre:           string
  email:            string | null
  telefono:         string | null
  direccion:        string | null
  segmento:         SegmentoCliente | null
  Funnel:           FunnelEtapa | null
  calificado:       boolean | null
  canalContacto:    string | null
  origenContacto:   string | null
  Estado:           EstadoCliente | null
  notas:            string | null
  fechaLead:        string | null
  fechaCalificado:  string | null
  fechaOferta:      string | null
  fechaPedido:      string | null
  fechaEntrega:     string | null
  fechaRechazada:   string | null
  createdAt:        string
}

export type ClientePayload = {
  nombre:            string
  email?:            string | null
  telefono?:         string | null
  direccion?:        string | null
  segmento?:         SegmentoCliente | null
  Funnel?:           FunnelEtapa | null
  calificado?:       boolean | null
  canalContacto?:    string | null
  origenContacto?:   string | null
  Estado?:           EstadoCliente | null
  notas?:            string | null
  fechaLead?:        string | null
  fechaCalificado?:  string | null
  fechaOferta?:      string | null
  fechaPedido?:      string | null
  fechaEntrega?:     string | null
  fechaRechazada?:   string | null
}
