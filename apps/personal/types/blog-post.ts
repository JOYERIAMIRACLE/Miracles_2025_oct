// ─── Strapi v5 Blocks format ──────────────────────────────────────────────────

export type TextNode = {
  type: "text" | "link"
  text?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  url?: string
  children?: TextNode[]
}

export type BlockNode =
  | { type: "paragraph"; children: TextNode[] }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: TextNode[] }
  | { type: "list"; format: "ordered" | "unordered"; children: ListItemNode[] }
  | { type: "quote"; children: TextNode[] }
  | { type: "code"; children: TextNode[] }
  | { type: "image"; image: { url: string; alternativeText?: string | null; width?: number; height?: number }; children: [] }

export type ListItemNode = {
  type: "list-item"
  children: TextNode[]
}

// ─── Blog Post ────────────────────────────────────────────────────────────────

export type BlogPostType = {
  id: number
  documentId: string
  titulo: string
  slug: string
  resumen: string | null
  contenido: BlockNode[] | null
  imagen_portada: {
    id: number
    url: string
    alternativeText: string | null
    width?: number
    height?: number
  } | null
  fecha_publicacion: string | null
  categoria_blog:
    | "tips-de-joyeria"
    | "cuidado-de-joyas"
    | "tendencias"
    | "guias-de-regalo"
    | "noticias"
    | null
  seo_descripcion: string | null
  publishedAt: string | null
}

export const CATEGORIA_BLOG_LABELS: Record<string, string> = {
  "tips-de-joyeria":  "Tips de Joyería",
  "cuidado-de-joyas": "Cuidado de Joyas",
  "tendencias":       "Tendencias",
  "guias-de-regalo":  "Guías de Regalo",
  "noticias":         "Noticias",
}
