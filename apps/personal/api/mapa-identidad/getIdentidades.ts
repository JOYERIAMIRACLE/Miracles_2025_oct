import { MapaIdentidadType } from "@/types/mapa-identidad"

export async function getIdentidades(): Promise<MapaIdentidadType[]> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mapa-identidades?pagination[limit]=200`
  const res  = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al cargar identidades del mapa")
  return json.data ?? []
}
