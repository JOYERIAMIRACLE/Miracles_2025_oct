import { useState, useEffect } from "react"
import { EventoCalendarioType } from "@/types/evento-calendario"

export function useGetEventos() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/evento-calendarios?populate=cuenta&sort[0]=fecha:desc&pagination[pageSize]=500`
  const [eventos, setEventos] = useState<EventoCalendarioType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(url)
        const json = await res.json()
        setEventos(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { eventos, setEventos, loading, error }
}
