import { useEffect, useState } from "react"
import { GastoType } from "@/types/gasto"

export function useGetGastos() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gastos?populate=*`
  const [gastos, setGastos] = useState<GastoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(url)
        const json = await res.json()
        setGastos(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { gastos, loading, error }
}
