export type TipoEvento  = "familiar" | "amigos" | "pareja" | "trabajo" | "otro"
export type EstadoEvento = "pendiente" | "realizado"

export type EventoSocial = {
  id:          number
  documentId:  string
  fecha:       string
  tipo:        TipoEvento
  lugar:       string | null
  descripcion: string | null
  personas:    string | null
  notas:       string | null
  estado:      EstadoEvento
}

export type EventoSocialPayload = Omit<EventoSocial, "id" | "documentId">

export const TIPOS_EVENTO: TipoEvento[] = ["familiar", "amigos", "pareja", "trabajo", "otro"]

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  familiar: "Familiar",
  amigos:   "Amigos",
  pareja:   "Pareja",
  trabajo:  "Trabajo",
  otro:     "Otro",
}

export const TIPO_EVENTO_COLOR: Record<TipoEvento, string> = {
  familiar: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  amigos:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pareja:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  trabajo:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  otro:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

export const TIPO_EVENTO_EMOJI: Record<TipoEvento, string> = {
  familiar: "👨‍👩‍👧",
  amigos:   "👥",
  pareja:   "❤️",
  trabajo:  "💼",
  otro:     "📅",
}
