import { DiaSemana } from "./ejercicio"
import { RecetaType } from "./recetario"

export type PlanComidaType = {
  id:           number
  documentId:   string
  semanaInicio: string
  diaSemana:    DiaSemana
  receta:       RecetaType
  createdAt:    string
}

export type PlanComidaPayload = {
  semanaInicio: string
  diaSemana:    DiaSemana
  receta:       string
}
