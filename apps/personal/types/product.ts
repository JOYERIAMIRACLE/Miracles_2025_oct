// ─── Tipos de producto ────────────────────────────────────────────────────────
 
export type ProductType = {
  id: number
  documentId: string
  nombreProducto: string
  slug: string
  descripcion: string
  activo: boolean
  isFeatured: boolean
  materialProducto: string
  costo: number
  estiloProducto: string
  imagenes: ImageType[]
  categoria: CategoriaType
}
 
// ─── Tipos relacionados ───────────────────────────────────────────────────────
 
export type ImageType = {
  id: number
  url: string
  // CAMPO OPCIONAL — Strapi lo devuelve null si no se cargó en el panel
  alternativeText: string | null
}
 
export type CategoriaType = {
  slug: string
  // ⚠ VERIFICAR EN STRAPI — asegúrate que el campo se llama exactamente así
  NombreCategoria: string
}
 