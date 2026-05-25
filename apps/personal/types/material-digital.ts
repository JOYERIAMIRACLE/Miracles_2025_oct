export type TipoMaterialDigital = "logo" | "manual" | "presentacion" | "fotografia" | "video" | "plantilla" | "otro"

export const TIPOS_MATERIAL: TipoMaterialDigital[] = ["logo", "manual", "presentacion", "fotografia", "video", "plantilla", "otro"]

export const TIPO_LABEL: Record<TipoMaterialDigital, string> = {
  logo:          "Logo",
  manual:        "Manual",
  presentacion:  "Presentación",
  fotografia:    "Fotografía",
  video:         "Video",
  plantilla:     "Plantilla",
  otro:          "Otro",
}

export const TIPO_BADGE: Record<TipoMaterialDigital, string> = {
  logo:          "bg-violet-500/15 text-violet-300 border-violet-500/20",
  manual:        "bg-sky-500/15 text-sky-300 border-sky-500/20",
  presentacion:  "bg-blue-500/15 text-blue-300 border-blue-500/20",
  fotografia:    "bg-rose-500/15 text-rose-300 border-rose-500/20",
  video:         "bg-amber-500/15 text-amber-300 border-amber-500/20",
  plantilla:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  otro:          "bg-slate-500/15 text-slate-400 border-slate-500/20",
}

export type MaterialDigital = {
  id:          number
  documentId:  string
  nombre:      string
  tipo:        TipoMaterialDigital
  url:         string | null
  descripcion: string | null
  notas:       string | null
  createdAt?:  string
  updatedAt?:  string
}

export type MaterialDigitalPayload = Omit<MaterialDigital, "id" | "documentId" | "createdAt" | "updatedAt">
