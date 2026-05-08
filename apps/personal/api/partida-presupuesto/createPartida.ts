import { PartidaPresupuestoType, PartidaPresupuestoPayload } from "@/types/partida-presupuesto"

export async function createPartida(payload: PartidaPresupuestoPayload): Promise<PartidaPresupuestoType> {
  // Strapi v5 rechaza enumeraciones con valor null — se omiten los campos nulos
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== "")
  )
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partida-presupuestos`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error("Strapi 400 detail:", JSON.stringify(json, null, 2))
    throw new Error(json?.error?.message ?? "Error al crear la partida")
  }
  return json.data
}
