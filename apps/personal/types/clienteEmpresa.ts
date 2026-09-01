export type FunnelEtapa     = "Lead" | "Oferta" | "Pedido" | "Entrega" | "Rechazada"
export type SegmentoCliente = "Pareja" | "Matrimonio" | "Familiar" | "Personalizado"
export type EstadoCliente   = "Activo" | "Inactivo"
export type EstadoCivil     = "Soltero(a)" | "En una relación" | "Comprometido(a)" | "Casado(a)" | "Otro"

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

// Un solo color de acento (violeta) en toda la app — sin variación decorativa
// por etapa/categoría. El rojo se reserva exclusivamente para alertas reales
// (Rechazada). La intensidad del violeta sube con el avance en el embudo.
export const FUNNEL_COLOR: Record<FunnelEtapa, string> = {
  Lead:      "bg-violet-500/10 text-violet-300/80 border-violet-500/20",
  Oferta:    "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Pedido:    "bg-violet-500/20 text-violet-200 border-violet-500/40",
  Entrega:   "bg-violet-600/25 text-violet-100 border-violet-500/50",
  Rechazada: "bg-red-500/15 text-red-300 border-red-500/30",
}

export const SEGMENTOS:      SegmentoCliente[] = ["Pareja", "Matrimonio", "Familiar", "Personalizado"]
export const ESTADOS_CIVILES: EstadoCivil[]    = ["Soltero(a)", "En una relación", "Comprometido(a)", "Casado(a)", "Otro"]

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
  tallaAnillo:      string | null
  ocasionFrecuente: string | null
  estadoCivil:      EstadoCivil | null
  redesSociales:    string | null
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
  tallaAnillo?:      string | null
  ocasionFrecuente?: string | null
  estadoCivil?:      EstadoCivil | null
  redesSociales?:    string | null
  fechaLead?:        string | null
  fechaCalificado?:  string | null
  fechaOferta?:      string | null
  fechaPedido?:      string | null
  fechaEntrega?:     string | null
  fechaRechazada?:   string | null
}
