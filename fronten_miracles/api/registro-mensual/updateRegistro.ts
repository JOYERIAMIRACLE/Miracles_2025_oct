import { RegistroMensualType, RegistroMensualPayload } from "@/types/registro-mensual"

export async function updateRegistro(documentId: string, payload: RegistroMensualPayload): Promise<RegistroMensualType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/registro-mensuals/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al actualizar registro")
  return json.data
}
