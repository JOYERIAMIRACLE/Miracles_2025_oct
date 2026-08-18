export type DocumentoLegalCaracteristica = {
  label: string
  valor: string
}

export type DocumentoLegalArchivo = {
  id: number
  url: string
  name: string
  size: number
  mime: string
  ext?: string
}

export type DocumentoLegalType = {
  id: number
  documentId: string
  nombre: string
  subtitulo: string | null
  caracteristicas: DocumentoLegalCaracteristica[] | null
  archivos: DocumentoLegalArchivo[] | null
  activo: boolean
  orden: number
}
