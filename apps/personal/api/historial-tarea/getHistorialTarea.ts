import { useEffect, useState } from "react"
import { HistorialTareaType } from "@/types/historial-tarea"
import { AmbitoTarea } from "@/types/tarea"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}`

export function useGetHistorialTarea(ambito: AmbitoTarea) {
  const [historial, setHistorial] = useState<HistorialTareaType[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const url = `${BASE()}/api/historial-tareas?filters[ambito][$eq]=${ambito}&pagination[pageSize]=2000&sort=timestamp:asc`
        const res  = await fetch(url)
        const json = await res.json()
        setHistorial(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [ambito])

  return { historial, setHistorial, loading }
}
