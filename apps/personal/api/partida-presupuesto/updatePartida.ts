import { PartidaPresupuestoType, PartidaPresupuestoPayload } from "@/types/partida-presupuesto"

export async function updatePartida(documentId: string, payload: PartidaPresupuestoPayload): Promise<PartidaPresupuestoType> {
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== "")
  )
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partida-presupuestos/${documentId}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: clean }),
  })
  if (!res.ok) throw new Error("Error al actualizar la partida")
  const json = await res.json()
  return json.data
}
