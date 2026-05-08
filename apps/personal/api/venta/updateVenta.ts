import { VentaPayload, VentaType } from "@/types/venta"

export async function updateVenta(documentId: string, payload: Partial<VentaPayload>): Promise<VentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ventas/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar venta")
  }
  const json = await res.json()
  return json.data
}
