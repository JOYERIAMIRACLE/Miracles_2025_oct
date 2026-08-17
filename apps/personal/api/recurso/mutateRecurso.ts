import { getToken } from "@/lib/auth"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/recursos`
const BASE_CATEGORIAS = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/recurso-categorias`

function authHeaders() {
  const token = getToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function errorDeRespuesta(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json()
    const msg = json?.error?.message
    if (msg) return `${fallback} (${res.status}: ${msg})`
  } catch {}
  return `${fallback} (${res.status} ${res.statusText})`
}

export type RecursoPayload = {
  nombre: string
  descripcion?: string | null
  archivo?: number
  seccion: string
  activo?: boolean
  orden?: number
  categoria?: string | null
  grupo?: string | null
  variante?: string | null
  tipo?: string | null
  fecha_lanzamiento?: string | null
  rol_autor?: string | null
}

export async function createRecurso(payload: RecursoPayload): Promise<void> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ data: { activo: true, orden: 0, ...payload } }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al subir"))
}

export async function updateRecurso(documentId: string, payload: Partial<RecursoPayload>): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al guardar"))
}

export async function deleteRecurso(documentId: string): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al eliminar"))
}

export async function createRecursoCategoria(nombre: string, seccion: string, orden: number): Promise<void> {
  const res = await fetch(BASE_CATEGORIAS(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ data: { nombre, seccion, orden } }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al crear la categoría"))
}

export async function updateRecursoCategoria(documentId: string, payload: { nombre?: string; orden?: number }): Promise<void> {
  const res = await fetch(`${BASE_CATEGORIAS()}/${documentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al guardar la categoría"))
}

export async function deleteRecursoCategoria(documentId: string): Promise<void> {
  const res = await fetch(`${BASE_CATEGORIAS()}/${documentId}`, { method: "DELETE", headers: authHeaders() })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al eliminar la categoría"))
}
