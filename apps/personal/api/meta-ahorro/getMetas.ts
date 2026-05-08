import { useState, useEffect } from "react"
import { MetaAhorroType } from "@/types/meta-ahorro"

export function useGetMetas() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meta-ahorros`
  const [metas,   setMetas]   = useState<MetaAhorroType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setMetas(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { metas, setMetas, loading, error }
}
