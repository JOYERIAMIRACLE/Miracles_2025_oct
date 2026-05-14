import { TicketPayload, TicketType } from "@/types/ticket"

export async function updateTicket(documentId: string, payload: Partial<TicketPayload>): Promise<TicketType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar ticket")
  }
  const json = await res.json()
  return json.data
}
