export type CategoriaReceta = "desayuno" | "comida" | "cena" | "snack" | "postre"
export type Dificultad = "fácil" | "media" | "difícil"
export type UnidadMedida = "pz" | "kg" | "g" | "L" | "ml" | "taza" | "bolsa" | "lata" | "caja" | "botella"
export type CategoriaIngrediente =
  | "verduras" | "frutas" | "carnes" | "lácteos" | "granos"
  | "especias" | "aceites" | "bebidas" | "enlatados" | "otros"

export type RecetaType = {
  id: number
  documentId: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaReceta
  videoUrl: string | null
  tiempoPrep: number | null
  dificultad: Dificultad
  notas: string | null
  createdAt: string
}

export type IngredienteType = {
  id: number
  documentId: string
  nombre: string
  cantidad: number
  unidad: UnidadMedida
  categoria: CategoriaIngrediente
  cantidadMinima: number
  notas: string | null
}

export type ItemCompraType = {
  id: number
  documentId: string
  nombre: string
  cantidadSugerida: number
  unidad: string
  categoria: string
  completado: boolean
  auto: boolean
  ingredienteRef: string | null
}
