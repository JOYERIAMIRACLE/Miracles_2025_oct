import { TareaPayload, TareaType } from "@/types/tarea"

export async function updateTarea(documentId: string, payload: Partial<TareaPayload>): Promise<TareaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tareas/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar tarea")
  }
  const json = await res.json()
  return json.data
}
