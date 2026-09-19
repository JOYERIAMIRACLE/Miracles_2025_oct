import { EventoEmpresaType } from "@/types/evento-empresa"
import { getToken } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/evento-empresas`

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export type EventoEmpresaPayload = {
  titulo: string
  fecha: string
  descripcion: string | null
  seccion: string | null
  activo: boolean
}

async function checkOk(res: Response) {
  if (!res.ok) {
    let detail = ""
    try { const b = await res.json(); detail = b?.error?.message ?? "" } catch {}
    throw new Error(`${res.status}${detail ? ` · ${detail}` : ""}`)
  }
}

export async function createEventoEmpresa(payload: EventoEmpresaPayload): Promise<EventoEmpresaType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  await checkOk(res)
  return (await res.json()).data
}

export async function updateEventoEmpresa(documentId: string, payload: Partial<EventoEmpresaPayload>): Promise<EventoEmpresaType> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  await checkOk(res)
  return (await res.json()).data
}

export async function deleteEventoEmpresa(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  await checkOk(res)
}
