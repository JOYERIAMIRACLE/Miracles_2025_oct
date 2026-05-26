import { HistorialTareaType, HistorialTareaPayload } from "@/types/historial-tarea"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/historial-tareas`

export async function createHistorialTarea(payload: HistorialTareaPayload): Promise<HistorialTareaType> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()).data
}
