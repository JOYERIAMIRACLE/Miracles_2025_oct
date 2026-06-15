import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { Proveedor, ProveedorPayload } from "@/types/proveedor"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })

export function useGetProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/proveedores?sort=nombre:asc&pagination[pageSize]=500`, { headers: hdrs() })
      .then(r => r.json())
      .then(j => setProveedores(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { proveedores, setProveedores, loading }
}

export async function createProveedor(payload: ProveedorPayload): Promise<Proveedor> {
  const r = await fetch(`${BASE}/api/proveedores`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return j.data
}

export async function updateProveedor(documentId: string, payload: Partial<ProveedorPayload>): Promise<Proveedor> {
  const r = await fetch(`${BASE}/api/proveedores/${documentId}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  const j = await r.json()
  return j.data
}

export async function deleteProveedor(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/proveedores/${documentId}`, { method: "DELETE", headers: hdrs() })
}
