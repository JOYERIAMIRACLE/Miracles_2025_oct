export type TipoTicket     = "Diseño" | "Landing" | "Campaña" | "Contenido" | "Soporte" | "Otro"
export type EstadoTicket   = "nuevo" | "en_revision" | "en_progreso" | "entregado" | "cerrado"
export type PrioridadTicket = "baja" | "media" | "alta" | "urgente"

export type TicketType = {
  id:           number
  documentId:   string
  titulo:       string
  descripcion:  string | null
  tipo:         TipoTicket | null
  estado:       EstadoTicket
  prioridad:    PrioridadTicket
  solicitante:  string | null
  responsable:  string | null
  estimacion:   number | null
  tiempoReal:   number | null
  fechaCierre:  string | null
  notas:        string | null
  tareas?:      { id: number; documentId: string; titulo: string; estado: string }[]
  createdAt?:   string
  updatedAt?:   string
}

export type TicketPayload = {
  titulo:       string
  descripcion?: string | null
  tipo?:        TipoTicket | null
  estado?:      EstadoTicket
  prioridad?:   PrioridadTicket
  solicitante?: string | null
  responsable?: string | null
  estimacion?:  number | null
  tiempoReal?:  number | null
  fechaCierre?: string | null
  notas?:       string | null
}
