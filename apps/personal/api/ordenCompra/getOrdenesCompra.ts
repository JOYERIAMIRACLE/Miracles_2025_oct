import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { OrdenCompra, OrdenPayload } from "@/types/ordenCompra"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })

// Normaliza la relación proveedor que Strapi puede devolver flat o anidada
function normalizeOrden(d: any): OrdenCompra {
  const prov = d.proveedor?.data ?? d.proveedor ?? null
  return {
    ...d,
    lineas:    d.lineas    ?? [],
    proveedor: prov ? { id: prov.id, documentId: prov.documentId, nombre: prov.nombre ?? prov.attributes?.nombre ?? "" } : null,
  }
}

export function useGetOrdenesCompra() {
  const [ordenes,  setOrdenes]  = useState<OrdenCompra[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/ordenes-compra?populate=proveedor&sort=createdAt:desc&pagination[pageSize]=500`, { headers: hdrs() })
      .then(r => r.json())
      .then(j => setOrdenes((j.data ?? []).filter(Boolean).map(normalizeOrden)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { ordenes, setOrdenes, loading }
}

export async function createOrden(payload: OrdenPayload): Promise<OrdenCompra> {
  const r = await fetch(`${BASE}/api/ordenes-compra?populate=proveedor`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return normalizeOrden(j.data)
}

export async function updateOrden(documentId: string, payload: Partial<OrdenPayload>): Promise<OrdenCompra> {
  const r = await fetch(`${BASE}/api/ordenes-compra/${documentId}?populate=proveedor`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return normalizeOrden(j.data)
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
