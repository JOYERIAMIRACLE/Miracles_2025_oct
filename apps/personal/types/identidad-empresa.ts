export type IdentidadImagen = {
  url:    string
  width?: number
  height?: number
  mime?:  string
} | null

export type IdentidadEmpresa = {
  id:             number
  documentId:     string
  nombre:         string | null
  slogan:         string | null
  mision:         string | null
  vision:         string | null
  valores:        string | null
  colores:        string | null
  tipografia:     string | null
  sitioWeb:       string | null
  redesSociales:  string | null
  notas:          string | null
  descripcion_conoce:      string | null
  portada_conoce:          IdentidadImagen
  portada_conoce_original: IdentidadImagen
  foto_equipo:             IdentidadImagen
  imagen_mision:           IdentidadImagen
  imagen_vision:           IdentidadImagen
  telefono:       string | null
  correo:         string | null
  direccion:      string | null
  createdAt?:     string
  updatedAt?:     string
}

export type IdentidadPayload = Omit<IdentidadEmpresa, "id" | "documentId" | "createdAt" | "updatedAt">
