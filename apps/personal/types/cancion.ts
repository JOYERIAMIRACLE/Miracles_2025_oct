export type EstadoCancion = "idea" | "en_proceso" | "terminada" | "publicada"

export type Cancion = {
  id:            number
  documentId:    string
  titulo:        string
  estilo:        string | null
  estado:        EstadoCancion
  slogan:        string | null
  hookPrincipal: string | null
  referencias:   string | null
  letra:         string | null
  notasProceso:  string | null
  orden?:        number | null
  createdAt?:    string
  updatedAt?:    string
}

export type CancionPayload = Omit<Cancion, "id" | "documentId" | "createdAt" | "updatedAt">

export const ESTADOS_CANCION: EstadoCancion[] = ["idea", "en_proceso", "terminada", "publicada"]

export const ESTADO_CANCION_LABEL: Record<EstadoCancion, string> = {
  idea:       "Idea",
  en_proceso: "En proceso",
  terminada:  "Terminada",
  publicada:  "Publicada",
}

export const ESTADO_CANCION_COLOR: Record<EstadoCancion, string> = {
  idea:       "bg-slate-500/10 text-slate-400 border-slate-500/20",
  en_proceso: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  terminada:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  publicada:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
}
