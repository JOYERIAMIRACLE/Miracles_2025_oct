import { useEffect, useState } from "react"
import { CentroVentaType } from "@/types/centro-venta"

export function useGetCentrosVenta() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/centro-ventas`
  const [centrosVenta, setCentrosVenta] = useState<CentroVentaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setCentrosVenta(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { centrosVenta, loading, error }
}
