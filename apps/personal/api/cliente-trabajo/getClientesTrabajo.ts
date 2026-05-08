import { useEffect, useState } from "react"
import { ClienteTrabajoType } from "@/types/cliente-trabajo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetClientesTrabajo() {
  const [clientes, setClientes] = useState<ClienteTrabajoType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/cliente-trabajos?pagination[pageSize]=200&sort=nombre:asc`)
        const json = await res.json()
        setClientes(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { clientes, setClientes, loading, error }
}
