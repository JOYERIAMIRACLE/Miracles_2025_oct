import { TicketPayload, TicketType } from "@/types/ticket"

export async function createTicket(payload: TicketPayload): Promise<TicketType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear ticket")
  }
  const json = await res.json()
  return json.data
}
