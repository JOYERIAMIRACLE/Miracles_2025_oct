export type OrigenSuscriptor = "tienda" | "blog" | "manual"

export type Suscriptor = {
  id:                number
  documentId:        string
  email:             string
  nombre:            string | null
  activo:            boolean
  origen:            OrigenSuscriptor | null
  bienvenidaEnviada: boolean
  createdAt:         string
}

export type SuscriptorPayload = {
  email:              string
  nombre?:            string | null
  activo?:            boolean
  origen?:            OrigenSuscriptor
  bienvenidaEnviada?: boolean
}
