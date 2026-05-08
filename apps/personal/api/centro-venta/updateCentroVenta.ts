import { CentroVentaPayload, CentroVentaType } from "@/types/centro-venta"

export async function updateCentroVenta(documentId: string, payload: Partial<CentroVentaPayload>): Promise<CentroVentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/centro-ventas/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar centro de venta")
  }
  const json = await res.json()
  return json.data
}
