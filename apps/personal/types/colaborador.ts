export type ColaboradorType = {
  id:               number
  documentId:       string
  nombre:           string
  puesto:           string | null
  area:             string | null
  foto:             { url: string } | null
  fecha_nacimiento: string | null
  fecha_ingreso:    string | null
  email:            string | null
  activo:           boolean
  orden:            number
  createdAt?:       string
  updatedAt?:       string
}
