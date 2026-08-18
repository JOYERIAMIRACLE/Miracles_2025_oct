import { useEffect, useState } from "react"
import { TransaccionType } from "@/types/transaccion"

export function useGetTransacciones(ambito: "trabajo" | "empresa" = "trabajo") {
  const filter = ambito === "empresa"
    ? "&filters[ambito][$eq]=empresa"
    : "&filters[$or][0][ambito][$eq]=trabajo&filters[$or][1][ambito][$null]=true"
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaccions?populate=*&sort[0]=fecha:desc&pagination[pageSize]=500${filter}`
  const [transacciones, setTransacciones] = useState<TransaccionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setTransacciones(json.data ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  return { transacciones, setTransacciones, loading, error }
}

export function useGetTransaccionesByCliente(clienteDocumentId: string | null) {
  const [transacciones, setTransacciones] = useState<TransaccionType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clienteDocumentId) { setLoading(false); return }
    ;(async () => {
      try {
        const url  = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaccions?filters[clienteDocumentId][$eq]=${clienteDocumentId}&filters[tipo][$eq]=ingreso&populate=*&pagination[pageSize]=200&sort=createdAt:asc`
        const res  = await fetch(url)
        const json = await res.json()
        setTransacciones(json.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [clienteDocumentId])

  return { transacciones, setTransacciones, loading }
}
