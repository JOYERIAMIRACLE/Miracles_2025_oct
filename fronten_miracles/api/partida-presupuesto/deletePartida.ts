export async function deletePartida(documentId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partida-presupuestos/${documentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar la partida")
}
