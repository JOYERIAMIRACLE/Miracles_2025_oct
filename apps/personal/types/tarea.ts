// ─── Tipos de Tarea ───────────────────────────────────────────────────────────

export type AmbitoTarea    = "personal" | "trabajo"
export type EstadoTarea    = "pendiente" | "en_progreso" | "completada"
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
  proyecto?:         { connect: [{ id: number }] } | null
}
