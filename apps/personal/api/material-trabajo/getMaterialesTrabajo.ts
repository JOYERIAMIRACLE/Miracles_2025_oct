import { useEffect, useState } from "react"
import { MaterialTrabajoType } from "@/types/material-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetMaterialesTrabajo() {
  const [materiales, setMateriales] = useState<MaterialTrabajoType[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/material-trabajos?pagination[pageSize]=200&sort=nombre:asc`)
        const json = await res.json()
        setMateriales(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { materiales, setMateriales, loading, error }
}
