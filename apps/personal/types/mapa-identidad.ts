export type MapaIdentidadType = {
  id:          number
  documentId:  string
  nombre:      string
  icono:       string
  color:       string
  sector:      string
  x:           number
  y:           number
  moduleId:    string | null
  enlace:      string | null
  descripcion: string | null
  placeholder: boolean | null
  activo:      boolean | null
}

export type MapaIdentidadPayload = Omit<MapaIdentidadType, "id" | "documentId">
