import { useEffect, useState } from "react"
import { VentaEmpresa, VentaPayload } from "@/types/ventaEmpresa"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/ventas`
const POPULATE = "cliente,producto,centro_venta,lineas.producto"

export function useGetVentas() {
  const [ventas,  setVentas]  = useState<VentaEmpresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "pagination[pageSize]": "500",
          "sort":                 "fecha:desc",
          "populate":             POPULATE,
        })
        const res  = await fetch(`${URL}?${params}`)
        const json = await res.json()
        setVentas(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { ventas, setVentas, loading }
}

export async function useGetVentasByCliente(clienteDocumentId: string) {
  const params = new URLSearchParams({
    "filters[cliente][documentId][$eq]": clienteDocumentId,
    "pagination[pageSize]": "100",
    "sort": "fecha:desc",
    "populate": POPULATE,
  })
  const res  = await fetch(`${URL}?${params}`)
  const json = await res.json()
  return json.data ?? []
}

export async function createVenta(payload: VentaPayload): Promise<VentaEmpresa> {
  const body: Record<string, unknown> = { ...payload }
  if (payload.cliente)      body.cliente      = { connect: [{ documentId: payload.cliente }] }
  if (payload.producto)     body.producto     = { connect: [{ documentId: payload.producto }] }
  if (payload.centro_venta) body.centro_venta = { connect: [{ documentId: payload.centro_venta }] }
  const res  = await fetch(`${URL}?populate=${POPULATE}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  })
  return (await res.json()).data
}

export async function updateVenta(documentId: string, payload: Partial<VentaPayload>): Promise<VentaEmpresa> {
  const body: Record<string, unknown> = { ...payload }
  if (payload.centro_venta !== undefined) body.centro_venta = payload.centro_venta || null
  const res  = await fetch(`${URL}/${documentId}?populate=${POPULATE}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  })
  return (await res.json()).data
}

export async function deleteVenta(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}
