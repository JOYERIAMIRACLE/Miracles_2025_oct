import { CentroCostoPayload, CentroCostoType } from "@/types/centro-costo"

export async function updateCentroCosto(documentId: string, payload: Partial<CentroCostoPayload>): Promise<CentroCostoType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/centro-costos/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar centro de costo")
  }
  const json = await res.json()
  return json.data
}
