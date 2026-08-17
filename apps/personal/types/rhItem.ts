export type RHItemTipo = "prestacion" | "politica" | "emergencia"

export type RHCaracteristica = { label: string; valor: string }

export type RHItemType = {
  id:         number
  documentId: string
  nombre:     string
  subtitulo:  string | null
  tipo:       RHItemTipo
  caracteristicas: RHCaracteristica[] | null
  archivos:   { id: number; name: string; url: string; size: number }[] | null
  activo:     boolean
  orden:      number
  createdAt?: string
}
