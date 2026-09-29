export type GrupoArquitectura = "landing" | "app" | "cuenta"

export type PaginaArquitecturaType = {
  id:         number
  documentId: string
  ruta:       string
  nota:       string | null
  grupo:      GrupoArquitectura
  orden:      number
}

export type ReglaArquitecturaType = {
  id:         number
  documentId: string
  texto:      string
  orden:      number
}
