import { useEffect, useState } from "react"
import { ClienteType } from "@/types/cliente"

// ─── Hook: obtener lista de clientes desde Strapi ─────────────────────────────
// Uso: const { clientes, loading, error } = useGetClientes()

export function useGetClientes() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes`

  const [clientes, setClientes] = useState<ClienteType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setClientes(json.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { clientes, loading, error }
}
