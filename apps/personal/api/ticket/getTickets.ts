import { useEffect, useState } from "react"
import { TicketType } from "@/types/ticket"

export function useGetTickets() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets?pagination[pageSize]=200&sort=createdAt:desc&populate[tareas][fields][0]=documentId&populate[tareas][fields][1]=titulo&populate[tareas][fields][2]=estado`
  const [tickets, setTickets]   = useState<TicketType[]>([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setTickets(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { tickets, setTickets, loading, error }
}
