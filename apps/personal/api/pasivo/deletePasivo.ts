export async function deletePasivo(documentId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pasivos/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar pasivo")
}
