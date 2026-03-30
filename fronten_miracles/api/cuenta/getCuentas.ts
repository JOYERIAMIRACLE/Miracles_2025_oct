import { useEffect, useState } from "react"
import { CuentaType } from "@/types/cuenta"

export function useGetCuentas() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cuentas`
  const [cuentas, setCuentas] = useState<CuentaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setCuentas(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { cuentas, loading, error }
}
