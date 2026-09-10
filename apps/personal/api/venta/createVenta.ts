import { VentaPayload, VentaType } from "@/types/venta"
import { authFetch } from "@/lib/auth"

export async function createVenta(payload: VentaPayload): Promise<VentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ventas`
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear venta")
  }
  const json = await res.json()
  return json.data
}
