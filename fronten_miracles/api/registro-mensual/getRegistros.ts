import { useState, useEffect } from "react"
import { RegistroMensualType } from "@/types/registro-mensual"

export function useGetRegistros() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/registro-mensuals?pagination[limit]=500`
  const [registros, setRegistros] = useState<RegistroMensualType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setRegistros(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { registros, setRegistros, loading, error }
}
