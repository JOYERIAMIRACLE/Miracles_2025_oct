export type CategoriaMeta = "emergencia" | "viaje" | "equipo" | "inversion" | "educacion" | "otros"

export type MetaAhorroType = {
  id:             number
  documentId:     string
  nombre:         string
  monto_meta:     number
  monto_actual:   number
  fecha_objetivo: string | null  // "YYYY-MM-DD"
  categoria:      CategoriaMeta | null
  descripcion:    string | null
  activo:         boolean | null
}

export type MetaAhorroPayload = Omit<MetaAhorroType, "id" | "documentId">
