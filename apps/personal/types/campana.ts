export const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
] as const
export type MesCampana = typeof MESES[number]

export type CampanaType = {
  id:              number
  documentId:      string
  unidadNegocio:   string
  mes:             MesCampana
  anio:            number
  categoria:       string | null
  atributos:       string | null
  semana1Partes:   string | null
  semana1Titulo:   string | null
  semana1Archivo:  string | null
  semana2Partes:   string | null
  semana2Titulo:   string | null
  semana2Archivo:  string | null
  semana3Partes:   string | null
  semana3Titulo:   string | null
  semana3Archivo:  string | null
  semana4Partes:   string | null
  semana4Titulo:   string | null
  semana4Archivo:  string | null
  notas:           string | null
  createdAt?:      string
  updatedAt?:      string
}

export type CampanaPayload = Omit<CampanaType, "id" | "documentId" | "createdAt" | "updatedAt">
