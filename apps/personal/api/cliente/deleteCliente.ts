// ─── Función: eliminar un cliente en Strapi ───────────────────────────────────
// Strapi v5 usa documentId para mutaciones
// Uso: await deleteCliente("abc123documentId")

import { authFetch } from "@/lib/auth"

export async function deleteCliente(documentId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes/${documentId}`

  const res = await authFetch(url, { method: "DELETE" })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al eliminar cliente")
  }
}
