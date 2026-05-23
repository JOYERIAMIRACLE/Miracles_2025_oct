import { useEffect, useState } from "react"
import { Cotizacion, CotizacionPayload } from "@/types/cotizacion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/cotizaciones`

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

export async function createCotizacion(payload: CotizacionPayload): Promise<Cotizacion> {
  const res = await fetch(URL, {
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
  const res = await fetch(`${URL}/${documentId}`, {
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
