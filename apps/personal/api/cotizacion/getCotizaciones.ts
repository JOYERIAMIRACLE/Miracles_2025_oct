import { useEffect, useState } from "react"
import { Cotizacion, CotizacionPayload } from "@/types/cotizacion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/cotizaciones`

export function useGetAllCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const res  = await fetch(`${URL}?populate=*&sort=createdAt:desc&pagination[pageSize]=500`)
        const json = await res.json()
        setCotizaciones(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { cotizaciones, setCotizaciones, loading }
}

export function useGetCotizaciones(clienteDocumentId: string | null) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    if (!clienteDocumentId) { setCotizaciones([]); return }
    setLoading(true)
    ;(async () => {
      try {
        const res  = await fetch(`${URL}?filters[cliente][documentId][$eq]=${clienteDocumentId}&sort=createdAt:asc&pagination[pageSize]=100`)
        const json = await res.json()
        setCotizaciones(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [clienteDocumentId])

  return { cotizaciones, setCotizaciones, loading }
}

// populate=* en la respuesta de create/update — sin esto, "cliente" y
// "ventaGenerada" vuelven sin poblar y se pierden del estado local al
// fusionar la respuesta (aunque en la base de datos siguen intactos).
export async function createCotizacion(payload: CotizacionPayload): Promise<Cotizacion> {
  const res = await fetch(`${URL}?populate=*`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear cotización")
  }
  return (await res.json()).data
}

export async function updateCotizacion(documentId: string, payload: Partial<CotizacionPayload>): Promise<Cotizacion> {
  const res = await fetch(`${URL}/${documentId}?populate=*`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar cotización")
  }
  return (await res.json()).data
}

export async function deleteCotizacion(documentId: string): Promise<void> {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}
