import { authFetch } from "@/lib/auth"
export async function deletePasivo(documentId: string): Promise<void> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pasivos/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar pasivo")
}
