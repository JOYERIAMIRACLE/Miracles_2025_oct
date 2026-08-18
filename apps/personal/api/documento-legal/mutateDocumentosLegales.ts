import type { DocumentoLegalType, DocumentoLegalCaracteristica } from "@/types/documento-legal"
import { getToken } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/documentos-legales`

export type DocumentoLegalPayload = {
  nombre?: string
  subtitulo?: string
  caracteristicas?: DocumentoLegalCaracteristica[]
  archivos?: number[]
  activo?: boolean
  orden?: number
}

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function checkOk(res: Response) {
  if (!res.ok) {
    let detail = ""
    try { const b = await res.json(); detail = b?.error?.message ?? "" } catch {}
    throw new Error(`${res.status}${detail ? ` · ${detail}` : ""}`)
  }
}

export async function createDocumentoLegal(payload: DocumentoLegalPayload): Promise<DocumentoLegalType> {
  const res = await fetch(BASE(), { method: "POST", headers: authHeaders(), body: JSON.stringify({ data: payload }) })
  await checkOk(res)
  return (await res.json()).data
}

export async function updateDocumentoLegal(documentId: string, payload: DocumentoLegalPayload): Promise<DocumentoLegalType> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ data: payload }) })
  await checkOk(res)
  return (await res.json()).data
}

export async function deleteDocumentoLegal(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  await checkOk(res)
}
