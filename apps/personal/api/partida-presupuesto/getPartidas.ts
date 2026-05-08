import { useState, useEffect } from "react"
import { PartidaPresupuestoType } from "@/types/partida-presupuesto"

export function useGetPartidas() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/partida-presupuestos`
  const [partidas, setPartidas] = useState<PartidaPresupuestoType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setPartidas(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { partidas, setPartidas, loading, error }
}
