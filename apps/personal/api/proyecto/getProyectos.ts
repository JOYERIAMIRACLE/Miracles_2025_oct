import { useEffect, useState } from "react"
import { ProyectoType } from "@/types/proyecto"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetProyectos() {
  const [proyectos, setProyectos] = useState<ProyectoType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/proyectos?populate=clienteTrabajo&pagination[pageSize]=200&sort=createdAt:desc`)
        const json = await res.json()
        setProyectos(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { proyectos, setProyectos, loading, error }
}
