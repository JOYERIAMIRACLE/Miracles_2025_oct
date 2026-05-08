import { useState, useEffect } from "react"
import { PrestamoOtorgadoType } from "@/types/prestamo-otorgado"

export function useGetPrestamos() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prestamo-otorgados`
  const [prestamos, setPrestamos] = useState<PrestamoOtorgadoType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setPrestamos(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { prestamos, setPrestamos, loading, error }
}
