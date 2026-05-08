import { TransaccionPayload, TransaccionType } from "@/types/transaccion"

export async function createTransaccion(payload: TransaccionPayload): Promise<TransaccionType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaccions`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear transaccion")
  }
  const json = await res.json()
  return json.data
}
