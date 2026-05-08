import { PasivoType, PasivoPayload } from "@/types/pasivo"

export async function createPasivo(payload: PasivoPayload): Promise<PasivoType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pasivos`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al crear pasivo")
  return json.data
}
