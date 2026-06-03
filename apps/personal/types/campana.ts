export const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
] as const
export type MesCampana  = typeof MESES[number]
export type TipoCampana = "completa" | "titulos_extra"

export type AmbitoCampana = "trabajo" | "empresa"

export type CampanaType = {
  id:              number
  documentId:      string
  ambito:          AmbitoCampana
  unidadNegocio:   string
  mes:             MesCampana
  anio:            number
  tipo:            TipoCampana
  orden:           number
  categoria:       string | null
  atributos:       string | null
  semana1Fecha:    string | null
  semana1Titulo:   string | null
  semana1Partes:   string | null
  semana1Archivo:  string | null
  semana2Fecha:    string | null
  semana2Titulo:   string | null
  semana2Partes:   string | null
  semana2Archivo:  string | null
  semana3Fecha:    string | null
  semana3Titulo:   string | null
  semana3Partes:   string | null
  semana3Archivo:  string | null
  semana4Fecha:    string | null
  semana4Titulo:   string | null
  semana4Partes:   string | null
  semana4Archivo:  string | null
  notas:           string | null
  keyword:         string | null
  etapas:          string | null
  createdAt?:      string
  updatedAt?:      string
}

export type CampanaPayload = Omit<CampanaType, "id" | "documentId" | "createdAt" | "updatedAt">
