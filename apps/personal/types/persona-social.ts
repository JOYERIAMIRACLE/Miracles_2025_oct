export type RelacionPersona = "familia" | "amigo" | "pareja" | "compañero" | "conocido" | "otro"

export type PersonaSocial = {
  id:          number
  documentId:  string
  nombre:      string
  relacion:    RelacionPersona
  telefono:    string | null
  cumpleaños:  string | null
  ultimaVez:   string | null
  notas:       string | null
}

export type PersonaSocialPayload = Omit<PersonaSocial, "id" | "documentId">

export const RELACIONES: RelacionPersona[] = ["familia", "amigo", "pareja", "compañero", "conocido", "otro"]

export const RELACION_LABEL: Record<RelacionPersona, string> = {
  familia:   "Familia",
  amigo:     "Amigo",
  pareja:    "Pareja",
  compañero: "Compañero",
  conocido:  "Conocido",
  otro:      "Otro",
}

export const RELACION_COLOR: Record<RelacionPersona, string> = {
  familia:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
  amigo:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pareja:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  compañero: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  conocido:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  otro:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
}
