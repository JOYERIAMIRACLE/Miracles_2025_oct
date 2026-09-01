import { AmbitoTarea } from "./tarea"

export type ProcesoTarea = {
  id:         number
  documentId: string
  nombre:     string
  ambito:     AmbitoTarea
  orden:      number
}
