import { authFetch } from "@/lib/auth"
export async function deleteEvento(documentId: string): Promise<void> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/evento-calendarios/${documentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar evento")
}
