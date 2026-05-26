import { useEffect, useState, useCallback } from "react"
import { PagoTrabajoType } from "@/types/pago-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

const fetchPagos = async () => {
  const res  = await fetch(`${BASE}/api/pago-trabajos?populate[0]=clienteTrabajo&populate[1]=proyecto&populate[2]=categoriaPago&pagination[pageSize]=2000&sort[0]=fecha:desc&sort[1]=createdAt:desc`)
  const json = await res.json()
  return (json.data ?? []) as PagoTrabajoType[]
}

export function useGetPagosTrabajo() {
  const [pagos,   setPagos]   = useState<PagoTrabajoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  const refetch = useCallback(async () => {
    try {
      const data = await fetchPagos()
      setPagos(data)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchPagos()
        setPagos(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { pagos, setPagos, loading, error, refetch }
}
