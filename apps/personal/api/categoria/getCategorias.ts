import { useEffect, useState } from "react"
import { CategoriaType } from "@/types/categoria"

export function useGetCategorias(ambito: "trabajo" | "empresa" = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categorias?pagination[pageSize]=200&sort=orden:asc${filter}`
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
