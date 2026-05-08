export async function deleteMeta(documentId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meta-ahorros/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar meta")
}
