import { AmbitoTarea, EstadoTarea } from "./tarea"

export type HistorialTareaType = {
  id:              number
  documentId:      string
  tareaDocumentId: string
  estadoAnterior:  EstadoTarea | null
  estadoNuevo:     EstadoTarea
  timestamp:       string
  ambito:          AmbitoTarea | null
}

export type HistorialTareaPayload = {
  tareaDocumentId: string
  estadoAnterior:  EstadoTarea | null
  estadoNuevo:     EstadoTarea
  timestamp:       string
  ambito:          AmbitoTarea | null
}
