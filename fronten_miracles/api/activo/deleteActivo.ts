export async function deleteActivo(documentId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/activos/${documentId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar activo")
}
