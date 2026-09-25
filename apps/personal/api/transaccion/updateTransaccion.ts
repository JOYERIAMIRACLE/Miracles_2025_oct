import { TransaccionPayload, TransaccionType } from "@/types/transaccion"
import { authFetch } from "@/lib/auth"

export async function updateTransaccion(
  documentId: string,
  payload: Partial<TransaccionPayload>
): Promise<TransaccionType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaccions/${documentId}`
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar transaccion")
  }
  const json = await res.json()
  return json.data
}
