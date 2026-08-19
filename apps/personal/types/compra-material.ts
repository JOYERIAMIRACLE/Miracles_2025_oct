export type EstadoCompraMaterial = "borrador" | "recibida"

export type CompraMaterialLinea = {
  id:             number
  documentId:     string
  material:       { id: number; documentId: string; nombre: string } | null
  descripcion:    string
  gramos:         number
  precioPorGramo: number
  total:          number | null
}

export type CompraMaterialLineaPayload = {
  compra?:         string | number
  material:        string | number | null
  descripcion:     string
  gramos:          number
  precioPorGramo:  number
  total?:          number | null
}

export type CompraMaterial = {
  id:          number
  documentId:  string
  numero:      string | null
  fecha:       string
  estado:      EstadoCompraMaterial
  notas:       string | null
  proveedor:   { id: number; documentId: string; nombre: string } | null
  lineas:      CompraMaterialLinea[]
  transaccion: { id: number; documentId: string } | null
  createdAt:   string
}

export type CompraMaterialPayload = {
  numero?:    string | null
  fecha:      string
  estado?:    EstadoCompraMaterial
  notas?:     string | null
  proveedor?: string | number | null
}
