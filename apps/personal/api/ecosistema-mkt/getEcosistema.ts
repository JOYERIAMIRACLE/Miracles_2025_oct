import { useEffect, useState } from "react"
import { EcosistemaType } from "@/types/ecosistema-mkt"

export function useGetEcosistema() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ecosistema-mkts?pagination[pageSize]=200&sort=anio:desc,mes:asc`
  const [registros, setRegistros] = useState<EcosistemaType[]>([])
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
