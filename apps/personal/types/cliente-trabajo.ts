export type ClienteTrabajoType = {
  id:         number
  documentId: string
  nombre:     string
  empresa:    string | null
  email:      string | null
  telefono:   string | null
  notas:      string | null
  activo:     boolean
  createdAt?: string
  updatedAt?: string
}

export type ClienteTrabajoPayload = {
  nombre:    string
  empresa?:  string | null
  email?:    string | null
  telefono?: string | null
  notas?:    string | null
  activo?:   boolean
}
