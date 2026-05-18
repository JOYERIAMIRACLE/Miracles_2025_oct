import { DiaSemana } from "./ejercicio"
import { EjercicioType } from "./ejercicio"

export type PlanEjercicioType = {
  id:           number
  documentId:   string
  semanaInicio: string
  diaSemana:    DiaSemana
  ejercicio:    EjercicioType
  createdAt:    string
}

export type PlanEjercicioPayload = {
  semanaInicio: string
  diaSemana:    DiaSemana
  ejercicio:    string
}
