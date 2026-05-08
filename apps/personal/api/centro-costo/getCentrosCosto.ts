import { useEffect, useState } from "react"
import { CentroCostoType } from "@/types/centro-costo"

export function useGetCentrosCosto() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/centro-costos`
  const [centrosCosto, setCentrosCosto] = useState<CentroCostoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setCentrosCosto(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { centrosCosto, loading, error }
}
