import { useEffect, useState } from "react"
import { PagoProgramadoType } from "@/types/pago-programado"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetPagosProgramados() {
  const [pagos,   setPagos]   = useState<PagoProgramadoType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/pago-programados?populate=cuenta&pagination[pageSize]=200&sort=fecha:asc`)
        const json = await res.json()
        setPagos(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { pagos, setPagos, loading }
}

export async function createPagoProgramado(payload: Record<string, unknown>): Promise<PagoProgramadoType> {
  const res = await fetch(`${BASE}/api/pago-programados`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updatePagoProgramado(documentId: string, payload: Record<string, unknown>): Promise<PagoProgramadoType> {
  const res = await fetch(`${BASE}/api/pago-programados/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function deletePagoProgramado(documentId: string) {
  await fetch(`${BASE}/api/pago-programados/${documentId}`, { method: "DELETE" })
}
