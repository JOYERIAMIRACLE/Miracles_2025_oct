export type MuscuoGrupo = "pecho"|"espalda"|"hombros"|"biceps"|"triceps"|"core"|"piernas"|"gluteos"|"cardio"|"cuerpo_completo"
export type TipoEjercicio = "fuerza"|"cardio"|"flexibilidad"|"funcional"

export type EjercicioType = {
  id:          number
  documentId:  string
  nombre:      string
  musculo:     MuscuoGrupo | null
  tipo:        TipoEjercicio
  descripcion: string | null
  videoUrl:    string | null
}

export type EjercicioEnRutina = {
  ejercicioId:  number
  nombre:       string
  series:       number
  repeticiones: number
  peso:         number | null
  descanso:     number | null
  notas:        string | null
}

export type RutinaType = {
  id:          number
  documentId:  string
  nombre:      string
  descripcion: string | null
  diasSemana:  string | null
  activa:      boolean
  ejercicios:  EjercicioEnRutina[] | null
}

export type EjercicioRealizado = {
  ejercicioId:  number
  nombre:       string
  series:       { reps: number; peso: number | null; completada: boolean }[]
  notas:        string | null
}

export type SesionGymType = {
  id:                   number
  documentId:           string
  fecha:                string
  duracion:             number | null
  notas:                string | null
  ejerciciosRealizados: EjercicioRealizado[] | null
  rutina?:              { id: number; documentId: string; nombre: string } | null
}

export type MetricaCorporalType = {
  id:         number
  documentId: string
  fecha:      string
  peso:       number | null
  grasa:      number | null
  musculo:    number | null
  medidas:    Record<string, number> | null
  notas:      string | null
}
