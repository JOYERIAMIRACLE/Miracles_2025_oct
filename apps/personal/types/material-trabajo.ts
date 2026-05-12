export type CategoriaMaterial = "promocional" | "folleto" | "camisa" | "otro"

export type MaterialTrabajoType = {
  id:         number
  documentId: string
  nombre:     string
  categoria:  CategoriaMaterial
  cantidad:   number
  minimo:     number
  notas:      string | null
  createdAt?: string
  updatedAt?: string
}

export type MaterialTrabajoPayload = {
  nombre:    string
  categoria: CategoriaMaterial
  cantidad?: number
  minimo?:   number
  notas?:    string | null
}
