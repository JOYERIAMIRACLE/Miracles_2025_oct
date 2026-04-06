import { EventoCalendarioType, EventoCalendarioPayload } from "@/types/evento-calendario"

export async function createEvento(payload: EventoCalendarioPayload): Promise<EventoCalendarioType> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/evento-calendarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al crear evento")
  return json.data
}
