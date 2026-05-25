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
  createdAt?:     string
  updatedAt?:     string
}

export type IdentidadPayload = Omit<IdentidadEmpresa, "id" | "documentId" | "createdAt" | "updatedAt">
