import { authFetch } from "@/lib/auth"
export async function deletePrestamo(documentId: string): Promise<void> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prestamo-otorgados/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar préstamo")
}
