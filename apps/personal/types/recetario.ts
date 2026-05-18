export type CategoriaReceta = "proteina" | "carbohidratos" | "verduras" | "frutas"

export const CATEGORIAS: CategoriaReceta[] = ["proteina", "carbohidratos", "verduras", "frutas"]

export const CATEGORIA_LABEL: Record<CategoriaReceta, string> = {
  proteina:      "Proteína",
  carbohidratos: "Carbos",
  verduras:      "Verduras",
  frutas:        "Frutas",
}

export const CATEGORIA_COLOR: Record<CategoriaReceta, string> = {
  proteina:      "bg-orange-500/15 text-orange-300 border-orange-500/30",
  carbohidratos: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  verduras:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  frutas:        "bg-pink-500/15 text-pink-300 border-pink-500/30",
}

export type RecetaType = {
  id:          number
  documentId:  string
  nombre:      string
  descripcion: string | null
  videoUrl:    string | null
  categorias:  CategoriaReceta[]
  createdAt:   string
}

export type RecetaPayload = {
  nombre:      string
  descripcion: string | null
  videoUrl:    string | null
  categorias:  CategoriaReceta[]
}
