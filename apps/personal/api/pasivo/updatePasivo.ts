import { PasivoType, PasivoPayload } from "@/types/pasivo"

export async function updatePasivo(documentId: string, payload: PasivoPayload): Promise<PasivoType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pasivos/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al actualizar pasivo")
  return json.data
}
