import { useState, useEffect } from "react"
import { PasivoType } from "@/types/pasivo"

export function useGetPasivos() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pasivos`
  const [pasivos,  setPasivos]  = useState<PasivoType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setPasivos(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { pasivos, setPasivos, loading, error }
}
