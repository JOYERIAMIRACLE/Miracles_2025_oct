import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { Material, MaterialPayload } from "@/types/material"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })

export function useGetMateriales() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading]       = useState(true)
  const [tick, setTick]             = useState(0)

  useEffect(() => {
    fetch(`${BASE}/api/materiales?sort=nombre:asc&pagination[pageSize]=200`, { headers: hdrs() })
      .then(r => r.json())
      .then(j => setMateriales((j.data ?? []).filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tick])

  return { materiales, setMateriales, loading, reload: () => setTick(t => t + 1) }
}

function clean(payload: MaterialPayload) {
  return {
    nombre: payload.nombre.trim(),
    unidadMedida: payload.unidadMedida ?? "gramo",
    precioReferenciaGramo: payload.precioReferenciaGramo ?? null,
    activo: payload.activo ?? true,
    notas: payload.notas?.trim() || null,
  }
}

export async function createMaterial(payload: MaterialPayload): Promise<Material> {
  const r = await fetch(`${BASE}/api/materiales`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: clean(payload) }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al crear") }
  return (await r.json()).data
}

export async function updateMaterial(documentId: string, payload: Partial<MaterialPayload>): Promise<Material> {
  const r = await fetch(`${BASE}/api/materiales/${documentId}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al actualizar") }
  return (await r.json()).data
}

export async function deleteMaterial(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/materiales/${documentId}`, { method: "DELETE", headers: hdrs() })
}
