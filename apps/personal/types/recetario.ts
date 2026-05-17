export type RecetaType = {
  id:          number
  documentId:  string
  nombre:      string
  descripcion: string | null
  videoUrl:    string | null
  createdAt:   string
}

export type RecetaPayload = {
  nombre:      string
  descripcion: string | null
  videoUrl:    string | null
}
