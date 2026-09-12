import { FunnelEtapa, SegmentoCliente } from "./clienteEmpresa"

export type OrigenApp = "manual" | "tienda"

export type CanalLead =
  | "WhatsApp" | "Teléfono" | "Correo"
  | "Instagram" | "Facebook" | "Mostrador" | "Formulario" | "Vendedor" | "Distribuidor"

export type OrigenLead =
  | "Prospección" | "Mostrador" | "Referido"
  | "Formulario web" | "Carrito"
  | "Anuncio Meta" | "Anuncio Google" | "Campaña email"

export type ReferidorTipo = "cliente" | "vendedor_externo"

export const CANALES_LEAD: CanalLead[] = [
  "WhatsApp", "Teléfono", "Correo", "Instagram", "Facebook", "Mostrador", "Formulario", "Vendedor", "Distribuidor",
]

export const ORIGENES_LEAD: OrigenLead[] = [
  "Prospección", "Mostrador", "Referido",
  "Formulario web", "Carrito",
  "Anuncio Meta", "Anuncio Google", "Campaña email",
]

export function prefijoLead(origen: OrigenLead | null | undefined): string {
  switch (origen) {
    case "Formulario web": return "WEB"
    case "Carrito":        return "CART"
    case "Anuncio Meta":
    case "Anuncio Google": return "ANU"
    case "Campaña email":  return "EML"
    default:               return "LEAD"
  }
}

export interface Lead {
  id:              number
  documentId:      string
  numero:          string | null
  Funnel:          FunnelEtapa
  calificado:      boolean
  // campos nuevos estructurados
  canal:           CanalLead | null
  origen:          OrigenLead | null
  referidorTipo:   ReferidorTipo | null
  referidorNombre: string | null
  referidorCliente: { documentId: string; nombre: string } | null
  campanaOrigen:   string | null
  notas:           string | null
  segmento:        SegmentoCliente | null
  fechaLead:       string | null
  fechaOferta:     string | null
  fechaPedido:     string | null
  fechaEntrega:    string | null
  fechaRechazada:  string | null
  fechaCalificado: string | null
  // campos legacy (mantener para datos existentes)
  origenApp:       OrigenApp | null
  canalContacto:   string | null
  origenContacto:  string | null
  createdAt:       string
  cliente: {
    documentId: string
    nombre:     string
    telefono:   string | null
  } | null
}

export interface LeadPayload {
  numero?:          string | null
  cliente:          string
  Funnel?:          FunnelEtapa
  calificado?:      boolean
  canal?:           CanalLead | null
  origen?:          OrigenLead | null
  referidorTipo?:   ReferidorTipo | null
  referidorNombre?: string | null
  referidorCliente?: string | null
  campanaOrigen?:   string | null
  notas?:           string | null
  segmento?:        SegmentoCliente | null
  fechaLead?:       string | null
  fechaOferta?:     string | null
  fechaPedido?:     string | null
  fechaEntrega?:    string | null
  fechaRechazada?:  string | null
  fechaCalificado?: string | null
  origenApp?:       OrigenApp | null
}

export const LEAD_COLOR: Record<FunnelEtapa, string> = {
  Lead:      "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600",
  Oferta:    "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600",
  Pedido:    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600",
  Entrega:   "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600",
  Rechazada: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700",
}
