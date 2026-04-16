import { useEffect, useState } from "react"
import { TransaccionType } from "@/types/transaccion"

export function useGetTransacciones() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaccions?populate=*&sort=fecha:desc`
  const [transacciones, setTransacciones] = useState<TransaccionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setTransacciones(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { transacciones, setTransacciones, loading, error }
}
