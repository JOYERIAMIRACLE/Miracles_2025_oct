export type MaterialProducto = "Oro 10k" | "Plata 925"
export type CategoriaJoya   = "Anillos" | "Cadenas" | "Esclavas" | "Dijes" | "Broqueles" | "Aretes" | "Pulsos" | "Rosarios" | "Argollas"
export type MaterialItem    = "producto" | "servicio"

export const CATEGORIAS_JOYA: CategoriaJoya[] = ["Anillos","Cadenas","Esclavas","Dijes","Broqueles","Aretes","Pulsos","Rosarios","Argollas"]
export const MATERIALES:      MaterialProducto[] = ["Oro 10k","Plata 925"]

export type ImageType = {
  id:              number
  url:             string
  alternativeText: string | null
}

export type CategoriaType = {
  id?:             number
  documentId?:     string
  NombreCategoria: string
  slug:            string | null
  MainImage?:      { url: string } | null
}

export type ProductType = {
  id:               number
  documentId:       string
  nombreProducto:   string
  slug:             string | null
  sku:              string | null
  descripcion:      string | null
  figura:           string | null
  talla:            string | null
  categoriaJoya:    CategoriaJoya | null
  materialProducto: MaterialProducto | null
  costoProduccion:  number | null
  costo:            number | null
  stock:            number | null
  material:         MaterialItem | null
  imagenes:         ImageType[]
  activo:           boolean
  isFeatured:       boolean
  categoria:        CategoriaType | null
}
