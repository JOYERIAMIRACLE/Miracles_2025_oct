export type ReunionType = {
  id:              number
  documentId:      string
  titulo:          string
  fecha:           string
  participantes:   string | null
  notas:           string | null
  acuerdos:        string | null
  clienteTrabajo?: { id: number; documentId: string; nombre: string } | null
  proyecto?:       { id: number; documentId: string; nombre: string } | null
  createdAt?:      string
  updatedAt?:      string
}

export type ReunionPayload = {
  titulo:           string
  fecha:            string
  participantes?:   string | null
  notas?:           string | null
  acuerdos?:        string | null
  clienteTrabajo?:  { connect: [{ id: number }] } | null
  proyecto?:        { connect: [{ id: number }] } | null
}
