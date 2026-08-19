export type VentaLinea = {
  id:             number
  documentId:     string
  producto:       { id: number; documentId: string; nombreProducto: string; sku: string | null } | null
  descripcion:    string
  cantidad:       number
  precioUnitario: number
  subtotal:       number | null
}

export type VentaLineaPayload = {
  venta?:          string | number
  producto:        string | number | null
  descripcion:     string
  cantidad:        number
  precioUnitario:  number
  subtotal?:       number | null
}
