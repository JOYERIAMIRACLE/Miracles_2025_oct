import { useEffect, useState } from "react"
import { BoxscoreType } from "@/types/boxscore-semana"

export function useGetBoxscore(ambito: "trabajo" | "empresa" = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boxscore-semanas?pagination[pageSize]=500&sort=anio:desc,semana:asc${filter}`
  const [registros, setRegistros] = useState<BoxscoreType[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setRegistros(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { registros, setRegistros, loading, error }
}
