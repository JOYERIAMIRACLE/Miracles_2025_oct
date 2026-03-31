import { useState, useEffect } from "react"
import { ActivoType } from "@/types/activo"

export function useGetActivos() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/activos`
  const [activos,  setActivos]  = useState<ActivoType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setActivos(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { activos, setActivos, loading, error }
}
