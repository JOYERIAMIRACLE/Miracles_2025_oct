export async function deleteTicket(documentId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/${documentId}`
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al eliminar ticket")
  }
}
