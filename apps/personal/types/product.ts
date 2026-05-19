export type ProductType = {
  id:               number
  documentId:       string
  nombreProducto:   string
  slug:             string
  descripcion:      string | null
  activo:           boolean
  isFeatured:       boolean
  materialProducto: "Oro 10k" | "Plata 925" | null
  costo:            number | null
  figura:           string | null
  talla:            string | null
  sku:              string | null
  imagenes:         ImageType[]
  categoria:        CategoriaType | null
}

export type ImageType = {
  id:              number
  url:             string
  alternativeText: string | null
}

export type CategoriaType = {
  slug:            string
  NombreCategoria: string
}
