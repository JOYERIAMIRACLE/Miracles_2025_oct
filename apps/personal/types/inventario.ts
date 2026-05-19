export type MaterialInventario = "producto" | "servicio"
export type CategoriaJoya    = "Anillo" | "Collar" | "Pulsera" | "Arete" | "Set" | "Dijes" | "Otro"
export type MaterialJoya     = "Oro 10k" | "Plata 925"

export const CATEGORIAS_JOYA:  CategoriaJoya[] = ["Anillo", "Collar", "Pulsera", "Arete", "Set", "Dijes", "Otro"]
export const MATERIALES_JOYA:  MaterialJoya[]  = ["Oro 10k", "Plata 925"]

export type InventarioType = {
  id:               number
  documentId:       string
  nombre:           string
  sku:              string | null
  descripcion:      string | null
  figura:           string | null
  costoProduccion:  number | null
  precioVenta:      number | null
  stock:            number | null
  material:         MaterialInventario | null
  categoriaJoya:    CategoriaJoya | null
  materialJoya:     MaterialJoya | null
  talla:            string | null
  product_category: { id: number; documentId: string; NombreCategoria: string } | null
}

export type InventarioPayload = Omit<InventarioType, "id" | "documentId" | "product_category"> & {
  product_category: number | null
}
