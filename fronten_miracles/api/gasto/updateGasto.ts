import { GastoPayload, GastoType } from "@/types/gasto"

export async function updateGasto(documentId: string, payload: Partial<GastoPayload>): Promise<GastoType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gastos/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar gasto")
  }
  const json = await res.json()
  return json.data
}
