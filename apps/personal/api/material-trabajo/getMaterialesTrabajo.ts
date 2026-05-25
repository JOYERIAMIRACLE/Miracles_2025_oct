import { useEffect, useState } from "react"
import { MaterialTrabajoType, AmbitoMaterial } from "@/types/material-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetMaterialesTrabajo(ambito: AmbitoMaterial = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"

  const [materiales, setMateriales] = useState<MaterialTrabajoType[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/material-trabajos?pagination[pageSize]=200&sort=nombre:asc${filter}`)
        const json = await res.json()
        setMateriales(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [filter])

  return { materiales, setMateriales, loading, error }
}
