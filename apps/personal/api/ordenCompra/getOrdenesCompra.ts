import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { OrdenCompra, OrdenPayload } from "@/types/ordenCompra"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })

export function useGetOrdenesCompra() {
  const [ordenes,  setOrdenes]  = useState<OrdenCompra[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/ordenes-compra?populate=proveedor&sort=createdAt:desc&pagination[pageSize]=500`, { headers: hdrs() })
      .then(r => r.json())
      .then(j => setOrdenes((j.data ?? []).map((d: any) => ({
        ...d,
        lineas: d.lineas ?? [],
        proveedor: d.proveedor ?? null,
      }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { ordenes, setOrdenes, loading }
}

export async function createOrden(payload: OrdenPayload): Promise<OrdenCompra> {
  const r = await fetch(`${BASE}/api/ordenes-compra`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return { ...j.data, lineas: j.data.lineas ?? [], proveedor: j.data.proveedor ?? null }
}

export async function updateOrden(documentId: string, payload: Partial<OrdenPayload>): Promise<OrdenCompra> {
  const r = await fetch(`${BASE}/api/ordenes-compra/${documentId}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return { ...j.data, lineas: j.data.lineas ?? [], proveedor: j.data.proveedor ?? null }
}

export async function deleteOrden(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/ordenes-compra/${documentId}`, { method: "DELETE", headers: hdrs() })
}

export async function fetchInventarioRaw() {
  const r = await fetch(
    `${BASE}/api/products?pagination[pageSize]=1000&sort=nombreProducto:asc`,
    { headers: hdrs() }
  )
  const j = await r.json()
  return (j.data ?? []) as Array<{ documentId: string; sku: string | null; nombreProducto: string; stock: number | null }>
}

export async function createGastoCompra(params: {
  concepto: string; monto: number; fecha: string
  proveedor: string; factura: string
}) {
  await fetch(`${BASE}/api/gastos`, {
    method: "POST", headers: hdrs(),
    body: JSON.stringify({
      data: {
        concepto:   params.concepto,
        monto:      params.monto,
        fecha:      params.fecha,
        proveedor:  params.proveedor,
        factura:    params.factura,
        categoria:  "SUMINISTRO - COMPRA MERCANCÍA",
        ambito:     "empresa",
        publishedAt: new Date().toISOString(),
      }
    }),
  })
}
