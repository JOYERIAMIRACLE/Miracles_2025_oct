export type NotaMejoraEstado = "pendiente" | "resuelta"

export type NotaMejoraType = {
  id:           number
  documentId:   string
  texto:        string
  ruta:         string
  x:            number
  y:            number
  autor_nombre: string | null
  estado:       NotaMejoraEstado
  respuesta:    string | null
  createdAt:    string
}
