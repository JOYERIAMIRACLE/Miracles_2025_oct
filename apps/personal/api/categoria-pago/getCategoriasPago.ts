import { useEffect, useState, useCallback } from "react"
import { CategoriaPagoType } from "@/types/categoria-pago"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

const fetchCategorias = async () => {
  const res  = await authFetch(`${BASE}/api/categoria-pagos?sort[0]=nombre:asc&pagination[pageSize]=100`)
  const json = await res.json()
  return (json.data ?? []) as CategoriaPagoType[]
}

export function useGetCategoriasPago() {
  const [categorias, setCategorias] = useState<CategoriaPagoType[]>([])
  const [loading,    setLoading]    = useState(true)

  const refetch = useCallback(async () => {
    const data = await fetchCategorias()
    setCategorias(data)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchCategorias()
        setCategorias(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { categorias, setCategorias, loading, refetch }
}
