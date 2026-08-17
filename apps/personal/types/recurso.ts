export type RecursoType = {
  id:         number
  documentId: string
  nombre:     string
  descripcion: string | null
  archivo:    { url: string; name: string; mime: string; ext?: string } | null
  activo:     boolean
  orden:      number
  seccion:    string
  createdAt?: string
}
