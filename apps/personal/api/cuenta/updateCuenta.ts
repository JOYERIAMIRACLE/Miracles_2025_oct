import { CuentaPayload, CuentaType } from "@/types/cuenta"

export async function updateCuenta(documentId: string, payload: Partial<CuentaPayload>): Promise<CuentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cuentas/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar cuenta")
  }
  const json = await res.json()
  return json.data
}
