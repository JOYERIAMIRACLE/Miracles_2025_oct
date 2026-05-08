import { useEffect, useState } from "react"
import { PagoTrabajoType } from "@/types/pago-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetPagosTrabajo() {
  const [pagos,   setPagos]   = useState<PagoTrabajoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/pago-trabajos?populate=clienteTrabajo,proyecto&pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setPagos(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { pagos, setPagos, loading, error }
}
