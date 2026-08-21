export async function updateIdentidadPosicion(documentId: string, x: number, y: number): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mapa-identidades/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { x: Math.round(x), y: Math.round(y) } }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.error?.message ?? "Error al guardar la posición")
  }
}
