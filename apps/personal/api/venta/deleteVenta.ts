import { authFetch } from "@/lib/auth"

export async function deleteVenta(documentId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ventas/${documentId}`
  const res = await authFetch(url, { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al eliminar venta")
  }
}
