// ─── Tipos de Tarea ───────────────────────────────────────────────────────────

export type AmbitoTarea    = "personal" | "trabajo" | "empresa"
export type EstadoTarea    = "sin_iniciar" | "pendiente" | "en_progreso" | "en_pausa" | "completada"
export type PrioridadTarea = "baja" | "media" | "alta" | "urgente"

export type TareaType = {
  id:               number
  documentId:       string
  titulo:           string
  descripcion:      string | null
  ambito:           AmbitoTarea
  estado:           EstadoTarea
  prioridad:        PrioridadTarea
  etiqueta:         string | null
  fechaVencimiento: string | null  // ISO date YYYY-MM-DD
  fechaCompletada:  string | null  // ISO datetime
  notas:            string | null
  links:            string | null
  progreso?:        number | null
  responsable?:     string | null
  area?:            string | null
  fechaInicio?:     string | null
  esTicket?:        boolean | null
  ticket?:          { id: number; documentId: string; titulo: string } | null
  proyecto?:        { id: number; documentId: string; nombre: string } | null
  createdAt?:       string
  updatedAt?:       string
}

export type TareaPayload = {
  titulo:            string
  descripcion?:      string | null
  ambito:            AmbitoTarea
  estado?:           EstadoTarea
  prioridad?:        PrioridadTarea
  etiqueta?:         string | null
  fechaVencimiento?: string | null
  fechaCompletada?:  string | null
  notas?:            string | null
  links?:            string | null
  progreso?:         number | null
  responsable?:      string | null
  area?:             string | null
  fechaInicio?:      string | null
  esTicket?:         boolean | null
  ticket?:           { connect: [{ documentId: string }] } | { disconnect: [] } | null
  proyecto?:         { connect: [{ id: number }] } | null
}
