import { FunnelEtapa, SegmentoCliente } from "./clienteEmpresa"

export type OrigenApp = "manual" | "tienda"

export interface Lead {
  id:              number
  documentId:      string
  numero:          string | null
  Funnel:          FunnelEtapa
  calificado:      boolean
  origenContacto:  string | null
  canalContacto:   string | null
  campanaOrigen:   string | null
  notas:           string | null
  segmento:        SegmentoCliente | null
  fechaLead:       string | null
  fechaOferta:     string | null
  fechaPedido:     string | null
  fechaEntrega:    string | null
  fechaRechazada:  string | null
  fechaCalificado: string | null
  origenApp:       OrigenApp | null
  createdAt:       string
  cliente: {
    documentId: string
    nombre:     string
    telefono:   string | null
  } | null
}

export interface LeadPayload {
  numero?:         string | null
  cliente:         string
  Funnel?:         FunnelEtapa
  calificado?:     boolean
  origenContacto?: string | null
  canalContacto?:  string | null
  campanaOrigen?:  string | null
  notas?:          string | null
  segmento?:       SegmentoCliente | null
  fechaLead?:      string | null
  fechaOferta?:    string | null
  fechaPedido?:    string | null
  fechaEntrega?:   string | null
  fechaRechazada?: string | null
  fechaCalificado?:string | null
  origenApp?:       OrigenApp | null
}

export const LEAD_COLOR: Record<FunnelEtapa, string> = {
  Lead:      "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600",
  Oferta:    "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600",
  Pedido:    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600",
  Entrega:   "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600",
  Rechazada: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700",
}
