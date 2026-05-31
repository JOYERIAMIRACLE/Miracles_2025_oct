import { useEffect, useState } from "react"
import { GastoType, AmbitoGasto } from "@/types/gasto"

export function useGetGastos(ambito: AmbitoGasto = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gastos?populate=*${filter}&pagination[pageSize]=2000&sort=fecha:asc`
  const [gastos, setGastos] = useState<GastoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(url)
        const json = await res.json()
        const all: GastoType[] = json.data ?? []
        const filtered = ambito === "empresa"
          ? all.filter(g => g.ambito === "empresa")
          : all.filter(g => g.ambito === "trabajo" || g.ambito == null)
        setGastos(filtered)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { gastos, loading, error }
}
