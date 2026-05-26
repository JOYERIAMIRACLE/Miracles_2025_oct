import { useEffect, useState } from "react"
import { MaterialDigitalType } from "@/types/material-digital"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}`

export function useGetMaterialDigital() {
  const [materiales, setMateriales] = useState<MaterialDigitalType[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE()}/api/material-digitals?pagination[pageSize]=500&sort=categoria:asc,subcategoria:asc,nombre:asc`)
        const json = await res.json()
        setMateriales(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { materiales, setMateriales, loading }
}
