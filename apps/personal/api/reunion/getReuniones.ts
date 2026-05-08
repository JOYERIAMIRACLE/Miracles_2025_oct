import { useEffect, useState } from "react"
import { ReunionType } from "@/types/reunion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetReuniones() {
  const [reuniones, setReuniones] = useState<ReunionType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/reuniones?populate=clienteTrabajo,proyecto&pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setReuniones(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { reuniones, setReuniones, loading, error }
}
