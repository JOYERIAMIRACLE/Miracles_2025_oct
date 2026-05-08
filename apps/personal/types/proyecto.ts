export type EstadoProyecto   = "activo" | "pausado" | "completado" | "cancelado"
export type PrioridadProyecto = "baja" | "media" | "alta"

export type ProyectoType = {
  id:              number
  documentId:      string
  nombre:          string
  descripcion:     string | null
  estado:          EstadoProyecto
  prioridad:       PrioridadProyecto
  fechaInicio:     string | null
  fechaFin:        string | null
  presupuesto:     number | null
  color:           string | null
  clienteTrabajo?: { id: number; documentId: string; nombre: string; empresa: string | null } | null
  createdAt?:      string
  updatedAt?:      string
}

export type ProyectoPayload = {
  nombre:           string
  descripcion?:     string | null
  estado?:          EstadoProyecto
  prioridad?:       PrioridadProyecto
  fechaInicio?:     string | null
  fechaFin?:        string | null
  presupuesto?:     number | null
  color?:           string | null
  clienteTrabajo?:  { connect: [{ id: number }] } | { disconnect: [{ id: number }] } | null
}
