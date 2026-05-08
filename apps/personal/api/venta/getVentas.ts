import { useEffect, useState } from "react"
import { VentaType } from "@/types/venta"

export function useGetVentas() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ventas?populate=*`
  const [ventas, setVentas] = useState<VentaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(url)
        const json = await res.json()
        setVentas(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { ventas, loading, error }
}
