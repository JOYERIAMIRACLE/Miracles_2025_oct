import { MapaIdentidadType, MapaIdentidadPayload } from "@/types/mapa-identidad"

export async function createIdentidad(payload: MapaIdentidadPayload): Promise<MapaIdentidadType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mapa-identidades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al crear la identidad")
  return json.data
}
