import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { CompraMaterial, CompraMaterialPayload, CompraMaterialLinea, CompraMaterialLineaPayload } from "@/types/compra-material"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })
const POPULATE = "populate[proveedor]=true&populate[transaccion]=true&populate[lineas][populate][material]=true"

export function useGetComprasMaterial() {
  const [compras, setCompras] = useState<CompraMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    fetch(`${BASE}/api/compras-material?${POPULATE}&sort=fecha:desc&pagination[pageSize]=200`, { headers: hdrs() })
      .then(r => r.json())
      .then(j => setCompras((j.data ?? []).filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tick])

  return { compras, setCompras, loading, reload: () => setTick(t => t + 1) }
}

export async function createCompraMaterial(payload: CompraMaterialPayload): Promise<CompraMaterial> {
  const r = await fetch(`${BASE}/api/compras-material?${POPULATE}`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al crear compra") }
  return (await r.json()).data
}

export async function updateCompraMaterial(documentId: string, payload: Partial<CompraMaterialPayload> & { transaccion?: string | number | null }): Promise<CompraMaterial> {
  const r = await fetch(`${BASE}/api/compras-material/${documentId}?${POPULATE}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al actualizar compra") }
  return (await r.json()).data
}

export async function deleteCompraMaterial(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/compras-material/${documentId}`, { method: "DELETE", headers: hdrs() })
}

export async function createCompraMaterialLinea(payload: CompraMaterialLineaPayload): Promise<CompraMaterialLinea> {
  const r = await fetch(`${BASE}/api/compra-material-lineas?populate=material`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al crear línea") }
  return (await r.json()).data
}

export async function deleteCompraMaterialLinea(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/compra-material-lineas/${documentId}`, { method: "DELETE", headers: hdrs() })
}
