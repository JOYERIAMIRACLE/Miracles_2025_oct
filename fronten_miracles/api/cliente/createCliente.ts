import { ClientePayload, ClienteType } from "@/types/cliente"

// ─── Función: crear un cliente en Strapi ──────────────────────────────────────
// Strapi v5 espera: POST /api/clientes  con body { data: {...} }
// Uso: const nuevo = await createCliente({ nombre: "...", ... })

export async function createCliente(payload: ClientePayload): Promise<ClienteType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes`

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ data: payload }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear cliente")
  }

  const json = await res.json()
  return json.data
}
