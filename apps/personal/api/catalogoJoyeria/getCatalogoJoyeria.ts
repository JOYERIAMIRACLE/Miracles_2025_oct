import { getToken } from "@/lib/auth"
import { CatalogoNodo, arbolInicial } from "@/types/catalogoJoyeria"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// Migra nodos guardados antes de que existiera el campo descripcion
function normalizar(nodos: CatalogoNodo[]): CatalogoNodo[] {
  return nodos.map(n => ({
    ...n,
    descripcion: n.descripcion ?? "",
    children:    normalizar(n.children ?? []),
  }))
}

export async function fetchCatalogo(): Promise<CatalogoNodo[]> {
  const token = getToken()
  const res = await fetch(`${BASE}/api/catalogo-joyeria`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return arbolInicial()
  const json = await res.json()
  const arbol: CatalogoNodo[] = json?.data?.arbol
  return Array.isArray(arbol) && arbol.length > 0 ? normalizar(arbol) : arbolInicial()
}

export async function saveCatalogo(arbol: CatalogoNodo[]): Promise<void> {
  const token = getToken()
  await fetch(`${BASE}/api/catalogo-joyeria`, {
    method:  "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { arbol } }),
  })
}
