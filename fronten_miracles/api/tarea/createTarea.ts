import { TareaPayload, TareaType } from "@/types/tarea"

export async function createTarea(payload: TareaPayload): Promise<TareaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tareas`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear tarea")
  }
  const json = await res.json()
  return json.data
}
