import { EventoCalendarioType, EventoCalendarioPayload } from "@/types/evento-calendario"

export async function updateEvento(documentId: string, payload: EventoCalendarioPayload): Promise<EventoCalendarioType> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/evento-calendarios/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al actualizar evento")
  return json.data
}
