import { useEffect, useState } from "react"
import { CampanaType, AmbitoCampana } from "@/types/campana"

export function useGetCampanas(ambito: AmbitoCampana = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campanas?pagination[pageSize]=200&sort=anio:desc,mes:asc,createdAt:desc${filter}`
  const [campanas, setCampanas] = useState<CampanaType[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setCampanas(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { campanas, setCampanas, loading, error }
}
