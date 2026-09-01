import { AmbitoTarea } from "@/types/tarea"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/proceso-tareas`

export async function createProcesoTarea(nombre: string, ambito: AmbitoTarea, orden: number): Promise<void> {
  const res = await fetch(BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { nombre, ambito, orden } }),
  })
  if (!res.ok) throw new Error("Error al crear el proceso")
}

export async function updateProcesoTarea(documentId: string, payload: { nombre?: string; orden?: number }): Promise<void> {
  const res = await fetch(`${BASE()}/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error("Error al guardar el proceso")
}
