import { useEffect, useState } from "react"
import { TareaType, AmbitoTarea } from "@/types/tarea"

export function useGetTareas(ambito?: AmbitoTarea) {
  const filterStr = ambito ? `&filters[ambito][$eq]=${ambito}` : ""
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tareas?pagination[pageSize]=200&sort=createdAt:desc${filterStr}`
  const [tareas, setTareas]   = useState<TareaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setTareas(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { tareas, setTareas, loading, error }
}
