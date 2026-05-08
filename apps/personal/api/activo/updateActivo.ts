import { ActivoType, ActivoPayload } from "@/types/activo"

export async function updateActivo(documentId: string, payload: ActivoPayload): Promise<ActivoType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/activos/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al actualizar activo")
  return json.data
}
