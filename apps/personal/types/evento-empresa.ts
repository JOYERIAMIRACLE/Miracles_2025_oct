export type EventoEmpresaType = {
  id:          number
  documentId:  string
  titulo:      string
  fecha:       string
  descripcion: string | null
  seccion:     string | null
  activo:      boolean
  createdAt?:  string
  updatedAt?:  string
}
