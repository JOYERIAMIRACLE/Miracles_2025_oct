export type CategoriaPasivo =
  | "tdc"
  | "credito_personal"
  | "hipoteca"
  | "automotriz"
  | "educativo"
  | "otros"

export type PasivoType = {
  id:            number
  documentId:    string
  nombre:        string
  categoria:     CategoriaPasivo | null
  saldo:         number | null
  tasa_interes:  number | null
  dia_corte:     number | null
  descripcion:   string | null
}

export type PasivoPayload = Omit<PasivoType, "id" | "documentId">
