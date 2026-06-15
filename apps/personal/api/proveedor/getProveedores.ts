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
      .then(j => setProveedores((j.data ?? []).filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { proveedores, setProveedores, loading }
}

function clean(payload: ProveedorPayload) {
  return {
    nombre:    payload.nombre.trim(),
    contacto:  payload.contacto?.trim()  || null,
    telefono:  payload.telefono?.trim()  || null,
    email:     payload.email?.trim()     || null,
    rfc:       payload.rfc?.trim()       || null,
    direccion: payload.direccion?.trim() || null,
    notas:     payload.notas?.trim()     || null,
    activo:    payload.activo ?? true,
  }
}

export async function createProveedor(payload: ProveedorPayload): Promise<Proveedor> {
  const r = await fetch(`${BASE}/api/proveedores`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: clean(payload) }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al crear") }
  const j = await r.json()
  return j.data
}

export async function updateProveedor(documentId: string, payload: Partial<ProveedorPayload>): Promise<Proveedor> {
  const r = await fetch(`${BASE}/api/proveedores/${documentId}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: clean(payload as ProveedorPayload) }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al actualizar") }
  const j = await r.json()
  return j.data
}

export async function deleteProveedor(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/proveedores/${documentId}`, { method: "DELETE", headers: hdrs() })
}
