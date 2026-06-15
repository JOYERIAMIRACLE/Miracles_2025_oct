export type Proveedor = {
  id:         number
  documentId: string
  nombre:     string
  contacto:   string | null
  telefono:   string | null
  email:      string | null
  rfc:        string | null
  direccion:  string | null
  notas:      string | null
  activo:     boolean
  createdAt:  string
}

export type ProveedorPayload = {
  nombre:    string
  contacto?: string | null
  telefono?: string | null
  email?:    string | null
  rfc?:      string | null
  direccion?: string | null
  notas?:    string | null
  activo?:   boolean
}
