import { PrestamoOtorgadoType, PrestamoOtorgadoPayload } from "@/types/prestamo-otorgado"

export async function updatePrestamo(documentId: string, payload: PrestamoOtorgadoPayload): Promise<PrestamoOtorgadoType> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ""))
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prestamo-otorgados/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: clean }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al actualizar préstamo")
  return json.data
}
