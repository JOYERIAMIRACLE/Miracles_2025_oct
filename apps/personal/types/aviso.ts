export type AvisoColor = "violet" | "emerald" | "blue" | "orange" | "red" | "amber"

export type AvisoType = {
  id:         number
  documentId: string
  titulo:     string
  desc:       string
  area:       string
  emoji:      string
  color:      AvisoColor
  autor:      string | null
  vigencia:   string | null
  activo:     boolean
  orden:      number
  imagen:     { url: string } | null
  createdAt?: string
  updatedAt?: string
}
