export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"

export const DIAS: DiaSemana[] = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

export const DIA_LABEL: Record<DiaSemana, string> = {
  lunes:    "Lunes",
  martes:   "Martes",
  miercoles:"Miércoles",
  jueves:   "Jueves",
  viernes:  "Viernes",
  sabado:   "Sábado",
  domingo:  "Domingo",
}

export type EjercicioType = {
  id:          number
  documentId:  string
  titulo:      string
  descripcion: string | null
  diaSemana:   DiaSemana | null
  createdAt:   string
}

export type EjercicioPayload = {
  titulo:      string
  descripcion: string | null
  diaSemana:   DiaSemana | null
}
