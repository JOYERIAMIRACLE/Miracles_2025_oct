import { DiaSemana } from "./ejercicio"
import { RecetaType } from "./recetario"

export type Momento = "desayuno" | "comida" | "cena"

export const MOMENTOS: Momento[] = ["desayuno", "comida", "cena"]

export const MOMENTO_LABEL: Record<Momento, string> = {
  desayuno: "Desayuno",
  comida:   "Comida",
  cena:     "Cena",
}

export type PlanComidaType = {
  id:           number
  documentId:   string
  semanaInicio: string
  diaSemana:    DiaSemana
  momento:      Momento
  receta:       RecetaType
  createdAt:    string
}

export type PlanComidaPayload = {
  semanaInicio: string
  diaSemana:    DiaSemana
  momento:      Momento
  receta:       string
}
