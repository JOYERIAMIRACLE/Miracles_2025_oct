import { ClientePayload, ClienteType } from "@/types/cliente"

// ─── Función: actualizar un cliente en Strapi ─────────────────────────────────
// Strapi v5 usa documentId (string) en lugar del id numérico para mutaciones
// Uso: const actualizado = await updateCliente("abc123documentId", { nombre: "..." })

export async function updateCliente(documentId: string, payload: Partial<ClientePayload>): Promise<ClienteType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes/${documentId}`

  const res = await fetch(url, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: payload }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar cliente")
  }

  const json = await res.json()
  return json.data
}
