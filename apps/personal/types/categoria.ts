// ─── Tipos de Categoria ───────────────────────────────────────────────────────

export type TipoCategoria  = "ingreso" | "gasto"
export type GrupoCategoria = "necesidad" | "prescindible" | "ahorro" | "ingreso"

export type AmbitoCategoria = "trabajo" | "empresa"

export type CategoriaType = {
  id:         number
  documentId: string
  nombre:     string
  tipo:       TipoCategoria
  grupo:      GrupoCategoria | null
  icono:      string | null
  color:      string | null
  orden:      number
  activa:     boolean
  ambito:     AmbitoCategoria | null
}

export type CategoriaPayload = {
  nombre: string
  tipo:   TipoCategoria
  grupo?: GrupoCategoria | null
  icono?: string | null
  color?: string | null
  orden?: number
  activa?: boolean
  ambito?: AmbitoCategoria | null
}
