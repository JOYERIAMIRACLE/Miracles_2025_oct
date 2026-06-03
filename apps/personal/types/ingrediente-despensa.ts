export type UnidadDespensa = "pz" | "kg" | "g" | "L" | "ml" | "taza" | "bolsa" | "lata" | "caja" | "botella"
export type CategoriaDespensa = "verduras" | "frutas" | "carnes" | "lácteos" | "granos" | "especias" | "aceites" | "bebidas" | "enlatados" | "otros"

export type IngredienteDespensa = {
  id:            number
  documentId:    string
  nombre:        string
  cantidad:      number
  unidad:        UnidadDespensa
  categoria:     CategoriaDespensa
  cantidadMinima: number
  notas:         string | null
  enProceso:     boolean
}

export type IngredientePayload = Omit<IngredienteDespensa, "id" | "documentId">

export const UNIDADES: UnidadDespensa[] = ["pz","kg","g","L","ml","taza","bolsa","lata","caja","botella"]

export const CATEGORIAS_DESPENSA: CategoriaDespensa[] = [
  "verduras","frutas","carnes","lácteos","granos","especias","aceites","bebidas","enlatados","otros"
]

export const CATEGORIA_LABEL: Record<CategoriaDespensa, string> = {
  verduras:  "Verduras",
  frutas:    "Frutas",
  carnes:    "Carnes",
  lácteos:   "Lácteos",
  granos:    "Granos",
  especias:  "Especias",
  aceites:   "Aceites",
  bebidas:   "Bebidas",
  enlatados: "Enlatados",
  otros:     "Otros",
}

export const CATEGORIA_COLOR: Record<CategoriaDespensa, string> = {
  verduras:  "text-green-400 bg-green-500/10 border-green-500/20",
  frutas:    "text-pink-400 bg-pink-500/10 border-pink-500/20",
  carnes:    "text-red-400 bg-red-500/10 border-red-500/20",
  lácteos:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  granos:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  especias:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
  aceites:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  bebidas:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  enlatados: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  otros:     "text-purple-400 bg-purple-500/10 border-purple-500/20",
}
