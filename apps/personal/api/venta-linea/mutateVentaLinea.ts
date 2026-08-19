import { VentaLinea, VentaLineaPayload } from "@/types/venta-linea"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export async function createVentaLinea(payload: VentaLineaPayload): Promise<VentaLinea> {
  const r = await fetch(`${BASE}/api/venta-lineas?populate=producto`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al crear línea de pedido") }
  return (await r.json()).data
}

export async function updateVentaLinea(documentId: string, payload: Partial<VentaLineaPayload>): Promise<VentaLinea> {
  const r = await fetch(`${BASE}/api/venta-lineas/${documentId}?populate=producto`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al actualizar línea de pedido") }
  return (await r.json()).data
}

export async function deleteVentaLinea(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/venta-lineas/${documentId}`, { method: "DELETE" })
}
