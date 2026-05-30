import { useEffect, useState } from "react"
import { MaterialDigitalType, AmbitoMaterialDigital } from "@/types/material-digital"

const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}`

export function useGetMaterialDigital(ambito: AmbitoMaterialDigital = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"

  const [materiales, setMateriales] = useState<MaterialDigitalType[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE()}/api/material-digitals?pagination[pageSize]=500&sort=categoria:asc,subcategoria:asc,nombre:asc${filter}`)
        const json = await res.json()
        setMateriales(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [ambito])

  return { materiales, setMateriales, loading }
}
