import { CentroVentaPayload, CentroVentaType } from "@/types/centro-venta"

export async function createCentroVenta(payload: CentroVentaPayload): Promise<CentroVentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/centro-ventas`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear centro de venta")
  }
  const json = await res.json()
  return json.data
}
