export const CATEGORIAS_DIGITAL = [
  // Identidad
  "BRANDING",
  "HERRAMIENTAS_VENTAS",
  "FORMATOS_INTERNOS",
  "INSTALACIONES_VEHICULOS",
  "COLABORADOR",
  "EVENTOS_PROYECTOS",
  // Assets
  "ASSETS_MACHINERY",
  "ASSETS_CONTROL",
  "ASSETS_COMPUTO",
  "ASSETS_CONVEYORS",
  // Links de utilidad
  "LINK_CORRECCION",
  "LINK_CALENDARIOS",
  "LINK_WORDPRESS",
  "LINK_MAIL",
  "LINK_CONTRASENAS",
  // Links de base de datos
  "BD_MKT_2023",
  "BD_MKT_2024",
  "BD_MKT_2025",
  "BD_MKT_2026",
] as const

export type CategoriaDigital = typeof CATEGORIAS_DIGITAL[number]

export const CATEGORIA_CONFIG: Record<CategoriaDigital, { label: string; color: string; accent: string }> = {
  BRANDING:               { label: "Branding",                  color: "violet",  accent: "bg-violet-500/10 text-violet-400 border-violet-500/20"  },
  HERRAMIENTAS_VENTAS:    { label: "Herramientas de ventas",    color: "blue",    accent: "bg-blue-500/10 text-blue-400 border-blue-500/20"        },
  FORMATOS_INTERNOS:      { label: "Formatos internos",         color: "amber",   accent: "bg-amber-500/10 text-amber-400 border-amber-500/20"     },
  INSTALACIONES_VEHICULOS:{ label: "Instalaciones y vehículos", color: "cyan",    accent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"        },
  COLABORADOR:            { label: "Branding Colaborador",      color: "emerald", accent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"},
  EVENTOS_PROYECTOS:      { label: "Eventos y proyectos",       color: "rose",    accent: "bg-rose-500/10 text-rose-400 border-rose-500/20"        },
  // Assets
  ASSETS_MACHINERY:       { label: "Machinery",                 color: "orange",  accent: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  ASSETS_CONTROL:         { label: "Control",                   color: "orange",  accent: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  ASSETS_COMPUTO:         { label: "Cómputo",                   color: "orange",  accent: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  ASSETS_CONVEYORS:       { label: "Conveyors",                 color: "orange",  accent: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  // Links de utilidad
  LINK_CORRECCION:        { label: "App corrección ortografía", color: "teal",    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20"        },
  LINK_CALENDARIOS:       { label: "App calendarios",           color: "teal",    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20"        },
  LINK_WORDPRESS:         { label: "App WordPress",             color: "teal",    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20"        },
  LINK_MAIL:              { label: "App sistema de mail",       color: "teal",    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20"        },
  LINK_CONTRASENAS:       { label: "App contraseñas",           color: "teal",    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20"        },
  // Base de datos
  BD_MKT_2023:            { label: "Base MKT 2023",             color: "blue",    accent: "bg-blue-500/10 text-blue-400 border-blue-500/20"        },
  BD_MKT_2024:            { label: "Base MKT 2024",             color: "blue",    accent: "bg-blue-500/10 text-blue-400 border-blue-500/20"        },
  BD_MKT_2025:            { label: "Base MKT 2025",             color: "blue",    accent: "bg-blue-500/10 text-blue-400 border-blue-500/20"        },
  BD_MKT_2026:            { label: "Base MKT 2026",             color: "blue",    accent: "bg-blue-500/10 text-blue-400 border-blue-500/20"        },
}

export const SUBCATEGORIAS: Record<CategoriaDigital, string[]> = {
  BRANDING:               ["Logos", "Iconografía", "Tipografía", "Manual de identidad", "Packaging"],
  HERRAMIENTAS_VENTAS:    ["Presentaciones", "Folletos", "Brochures", "Demos", "Promocionales", "Lonas"],
  FORMATOS_INTERNOS:      [
    "Plantilla de presentación", "Hoja membretada", "Folder de proyectos",
    "Términos y condiciones", "Plantillas de reclutamiento",
    "Garantías", "Recepción de equipos", "Reportes de servicio",
  ],
  INSTALACIONES_VEHICULOS: ["Branding edificio", "Branding autos"],
  COLABORADOR:             ["Fotografías", "Gafetes", "Tarjetas", "Firmas digitales", "Vestimenta"],
  EVENTOS_PROYECTOS:       [],
  ASSETS_MACHINERY:        [],
  ASSETS_CONTROL:          [],
  ASSETS_COMPUTO:          [],
  ASSETS_CONVEYORS:        [],
  LINK_CORRECCION:         [],
  LINK_CALENDARIOS:        [],
  LINK_WORDPRESS:          [],
  LINK_MAIL:               [],
  LINK_CONTRASENAS:        [],
  BD_MKT_2023:             [],
  BD_MKT_2024:             [],
  BD_MKT_2025:             [],
  BD_MKT_2026:             [],
}

export type GrupoMaterial = {
  id:          string
  label:       string
  collapsible: boolean
  categorias:  CategoriaDigital[]
}

export const GRUPOS_MATERIAL: GrupoMaterial[] = [
  {
    id: "identidad", label: "Identidad", collapsible: false,
    categorias: ["BRANDING", "HERRAMIENTAS_VENTAS", "FORMATOS_INTERNOS", "INSTALACIONES_VEHICULOS", "COLABORADOR", "EVENTOS_PROYECTOS"],
  },
  {
    id: "assets", label: "assets", collapsible: true,
    categorias: ["ASSETS_MACHINERY", "ASSETS_CONTROL", "ASSETS_COMPUTO", "ASSETS_CONVEYORS"],
  },
  {
    id: "links_utilidad", label: "links de utilidad", collapsible: true,
    categorias: ["LINK_CORRECCION", "LINK_CALENDARIOS", "LINK_WORDPRESS", "LINK_MAIL", "LINK_CONTRASENAS"],
  },
  {
    id: "links_bd", label: "links de base de datos", collapsible: true,
    categorias: ["BD_MKT_2023", "BD_MKT_2024", "BD_MKT_2025", "BD_MKT_2026"],
  },
]

export const TIPOS_MATERIAL = ["pdf", "imagen", "presentacion", "video", "documento", "link"] as const
export type TipoMaterial = typeof TIPOS_MATERIAL[number]

export const TIPO_CONFIG: Record<TipoMaterial, { label: string; badge: string }> = {
  pdf:          { label: "PDF",           badge: "bg-red-500/10 text-red-400 border-red-500/20"         },
  imagen:       { label: "Imagen",        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20"      },
  presentacion: { label: "Presentación",  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"      },
  video:        { label: "Video",         badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"   },
  documento:    { label: "Documento",     badge: "bg-sky-500/10 text-sky-400 border-sky-500/20"         },
  link:         { label: "Link",          badge: "bg-slate-500/10 text-slate-400 border-slate-500/20"   },
}

export type MaterialDigitalType = {
  id:           number
  documentId:   string
  nombre:       string
  url:          string
  categoria:    CategoriaDigital
  subcategoria: string
  tipo:         TipoMaterial
  descripcion:  string | null
  evento:       string | null
  createdAt?:   string
  updatedAt?:   string
}

export type MaterialDigitalPayload = Omit<MaterialDigitalType, "id" | "documentId" | "createdAt" | "updatedAt">
