import { useEffect, useState } from "react"
import { VentaEmpresa, VentaPayload } from "@/types/ventaEmpresa"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/ventas`
// Este Strapi no soporta el atajo "populate=a,b,c" (responde 400 "Invalid key") —
// hay que usar la sintaxis de objeto, igual que ya se usa en compra-material.
const POPULATE = "populate[cliente]=true&populate[producto]=true&populate[centro_venta]=true&populate[lineas][populate][producto]=true"

export function useGetVentas() {
  const [ventas,  setVentas]  = useState<VentaEmpresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${URL}?pagination[pageSize]=500&sort=fecha:desc&${POPULATE}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message ?? "Error al cargar pedidos")
        setVentas(json.data ?? [])
      } catch { setVentas([]) }
      finally { setLoading(false) }
    })()
  }, [])

  return { ventas, setVentas, loading }
}

export async function useGetVentasByCliente(clienteDocumentId: string) {
  const res  = await fetch(`${URL}?filters[cliente][documentId][$eq]=${clienteDocumentId}&pagination[pageSize]=100&sort=fecha:desc&${POPULATE}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? "Error al cargar pedidos del cliente")
  return json.data ?? []
}

export async function createVenta(payload: VentaPayload): Promise<VentaEmpresa> {
  const body: Record<string, unknown> = { ...payload }
  if (payload.cliente)      body.cliente      = { connect: [{ documentId: payload.cliente }] }
  if (payload.producto)     body.producto     = { connect: [{ documentId: payload.producto }] }
  if (payload.centro_venta) body.centro_venta = { connect: [{ documentId: payload.centro_venta }] }
  const res  = await fetch(`${URL}?${POPULATE}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al crear el pedido")
  return json.data
}

export async function updateVenta(documentId: string, payload: Partial<VentaPayload>): Promise<VentaEmpresa> {
  const body: Record<string, unknown> = { ...payload }
  if (payload.centro_venta !== undefined) body.centro_venta = payload.centro_venta || null
  const res  = await fetch(`${URL}/${documentId}?${POPULATE}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al actualizar el pedido")
  return json.data
}

export async function deleteVenta(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}
