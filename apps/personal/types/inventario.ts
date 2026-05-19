export type MaterialInventario = "producto" | "servicio"
export type CategoriaJoya    = "Anillos" | "Cadenas" | "Esclavas" | "Dijes" | "Broqueles" | "Aretes" | "Pulsos" | "Rosarios" | "Argollas"
export type MaterialJoya     = "Oro 10k" | "Plata 925"

export const CATEGORIAS_JOYA:  CategoriaJoya[] = ["Anillos", "Cadenas", "Esclavas", "Dijes", "Broqueles", "Aretes", "Pulsos", "Rosarios", "Argollas"]
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
