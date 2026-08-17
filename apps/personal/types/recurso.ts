export type RecursoType = {
  id:         number
  documentId: string
  nombre:     string
  descripcion: string | null
  archivo:    { id: number; url: string; name: string; mime: string; ext?: string; size: number } | null
  activo:     boolean
  orden:      number
  seccion:    string
  categoria:  string | null
  grupo:      string | null
  variante:   string | null
  tipo:       string | null
  fecha_lanzamiento: string | null
  rol_autor:  string | null
  createdAt?: string
}

export type RecursoCategoriaType = {
  id:         number
  documentId: string
  nombre:     string
  seccion:    string
  orden:      number
}
