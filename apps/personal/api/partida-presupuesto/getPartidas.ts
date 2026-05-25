import { useState, useEffect } from "react"
import { PartidaPresupuestoType, AmbitoPartida } from "@/types/partida-presupuesto"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function buildUrl(ambito?: AmbitoPartida) {
  const base = `${BASE}/api/partida-presupuestos?pagination[pageSize]=200`
  if (!ambito || ambito === "trabajo") {
    return `${base}&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true`
  }
  return `${base}&filters[ambito][$eq]=empresa`
}

export function useGetPartidas(ambito?: AmbitoPartida) {
  const url = buildUrl(ambito)
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
