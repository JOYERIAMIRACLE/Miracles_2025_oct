import { useEffect, useState } from "react"
import { CategoriaType } from "@/types/categoria"

export function useGetCategorias() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categorias?pagination[pageSize]=200&sort=orden:asc`
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setCategorias(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { categorias, setCategorias, loading, error }
}
