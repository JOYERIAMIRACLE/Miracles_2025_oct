import { useEffect, useState } from "react"
import { RecursoType } from "@/types/recurso"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetRecursos(seccion: string) {
  const [recursos, setRecursos] = useState<RecursoType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tick,     setTick]     = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/recursos?filters[activo][$eq]=true&filters[seccion][$eq]=${encodeURIComponent(seccion)}&sort=orden:asc&pagination[pageSize]=50&populate=archivo`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setRecursos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [seccion, tick])

  return { recursos, loading, reload: () => setTick(t => t + 1) }
}
