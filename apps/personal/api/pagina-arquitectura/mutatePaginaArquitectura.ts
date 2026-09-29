import { authFetch } from "@/lib/auth"
import { GrupoArquitectura, PaginaArquitecturaType, ReglaArquitecturaType } from "@/types/pagina-arquitectura"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function errorDeRespuesta(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json()
    const msg = json?.error?.message
    if (msg) return `${fallback} (${res.status}: ${msg})`
  } catch {}
  return `${fallback} (${res.status} ${res.statusText})`
}

export async function createPaginaArquitectura(grupo: GrupoArquitectura, orden: number): Promise<PaginaArquitecturaType> {
  const res = await authFetch(`${BASE}/api/paginas-arquitectura`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { ruta: "", nota: "", grupo, orden } }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al crear la página"))
  return (await res.json()).data
}

export async function updatePaginaArquitectura(documentId: string, payload: Partial<Pick<PaginaArquitecturaType, "ruta" | "nota" | "orden">>): Promise<PaginaArquitecturaType> {
  const res = await authFetch(`${BASE}/api/paginas-arquitectura/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al guardar la página"))
  return (await res.json()).data
}

export async function deletePaginaArquitectura(documentId: string): Promise<void> {
  const res = await authFetch(`${BASE}/api/paginas-arquitectura/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al eliminar la página"))
}

export async function createReglaArquitectura(orden: number): Promise<ReglaArquitecturaType> {
  const res = await authFetch(`${BASE}/api/reglas-arquitectura`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { texto: "", orden } }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al crear la regla"))
  return (await res.json()).data
}

export async function updateReglaArquitectura(documentId: string, payload: Partial<Pick<ReglaArquitecturaType, "texto" | "orden">>): Promise<ReglaArquitecturaType> {
  const res = await authFetch(`${BASE}/api/reglas-arquitectura/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al guardar la regla"))
  return (await res.json()).data
}

export async function deleteReglaArquitectura(documentId: string): Promise<void> {
  const res = await authFetch(`${BASE}/api/reglas-arquitectura/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, "Error al eliminar la regla"))
}
