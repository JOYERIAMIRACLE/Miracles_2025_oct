import { useEffect, useState } from "react"
import { CampanaType } from "@/types/campana"

export function useGetCampanas() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campanas?pagination[pageSize]=200&sort=anio:desc,mes:asc,createdAt:desc`
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
