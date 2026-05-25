export type PlataformaAnuncio = "Instagram" | "Facebook" | "Google" | "TikTok" | "Pinterest" | "Otro"
export type TipoAnuncio      = "imagen" | "video" | "carousel" | "stories" | "otro"
export type EstadoAnuncio    = "activo" | "pausado" | "finalizado" | "borrador"

export const PLATAFORMAS: PlataformaAnuncio[] = ["Instagram", "Facebook", "Google", "TikTok", "Pinterest", "Otro"]
export const TIPOS_ANUNCIO: TipoAnuncio[]     = ["imagen", "video", "carousel", "stories", "otro"]
export const ESTADOS_ANUNCIO: EstadoAnuncio[] = ["borrador", "activo", "pausado", "finalizado"]

export const ESTADO_BADGE: Record<EstadoAnuncio, string> = {
  borrador:   "bg-slate-500/15 text-slate-400 border-slate-500/20",
  activo:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  pausado:    "bg-amber-500/15 text-amber-300 border-amber-500/20",
  finalizado: "bg-rose-500/15 text-rose-300 border-rose-500/20",
}

export const PLATAFORMA_COLOR: Record<PlataformaAnuncio, string> = {
  Instagram: "bg-pink-500/15 text-pink-300 border-pink-500/20",
  Facebook:  "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Google:    "bg-amber-500/15 text-amber-300 border-amber-500/20",
  TikTok:    "bg-slate-500/15 text-slate-300 border-slate-500/20",
  Pinterest: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  Otro:      "bg-violet-500/15 text-violet-300 border-violet-500/20",
}

export type AnuncioType = {
  id:           number
  documentId:   string
  nombre:       string
  plataforma:   PlataformaAnuncio
  tipo:         TipoAnuncio
  estado:       EstadoAnuncio
  presupuesto:  number
  gastado:      number
  impresiones:  number
  clics:        number
  conversiones: number
  fecha_inicio: string | null
  fecha_fin:    string | null
  objetivo:     string | null
  notas:        string | null
  createdAt?:   string
}

export type AnuncioPayload = Omit<AnuncioType, "id" | "documentId" | "createdAt">
