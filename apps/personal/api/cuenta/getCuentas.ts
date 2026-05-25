import { useEffect, useState } from "react"
import { CuentaType, AmbitoCuenta } from "@/types/cuenta"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function buildUrl(ambito?: AmbitoCuenta) {
  const base = `${BASE}/api/cuentas?pagination[pageSize]=100`
  if (!ambito || ambito === "trabajo") {
    return `${base}&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true`
  }
  return `${base}&filters[ambito][$eq]=empresa`
}

export function useGetCuentas(ambito?: AmbitoCuenta) {
  const url = buildUrl(ambito)
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

  return { cuentas, setCuentas, loading, error }
}
