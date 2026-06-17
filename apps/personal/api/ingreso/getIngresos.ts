import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import { Ingreso, IngresoPayload } from "@/types/ingreso"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetIngresos(ambito: "empresa" | "trabajo" = "empresa") {
  const [ingresos,    setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = getToken()
        const url   = `${BASE}/api/ingresos?filters[ambito][$eq]=${ambito}&pagination[pageSize]=2000&sort=fecha:desc`
        const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const json  = await res.json()
        setIngresos(json.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [ambito])

  return { ingresos, setIngresos, loading }
}

export function useGetIngresosByCliente(clienteDocumentId: string | null) {
  const [ingresos,    setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    if (!clienteDocumentId) { setLoading(false); return }
    ;(async () => {
      try {
        const token = getToken()
        const url   = `${BASE}/api/ingresos?filters[clienteDocumentId][$eq]=${clienteDocumentId}&pagination[pageSize]=200&sort=createdAt:asc`
        const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const json  = await res.json()
        setIngresos(json.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [clienteDocumentId])

  return { ingresos, setIngresos, loading }
}

export async function createIngreso(payload: IngresoPayload): Promise<Ingreso> {
  const token = getToken()
  const res   = await fetch(`${BASE}/api/ingresos`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ data: payload }),
  })
  if (!res.ok) throw new Error("Error al crear ingreso")
  const json = await res.json()
  return json.data
}

export async function deleteIngreso(documentId: string): Promise<void> {
  const token = getToken()
  const res   = await fetch(`${BASE}/api/ingresos/${documentId}`, {
    method:  "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Error al eliminar ingreso")
}
