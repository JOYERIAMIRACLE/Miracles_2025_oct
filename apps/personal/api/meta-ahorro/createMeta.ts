import { MetaAhorroType, MetaAhorroPayload } from "@/types/meta-ahorro"

export async function createMeta(payload: MetaAhorroPayload): Promise<MetaAhorroType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meta-ahorros`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al crear meta")
  return json.data
}
