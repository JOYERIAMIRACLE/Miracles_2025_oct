import { getToken } from "@/lib/auth"
import { MovimientoMaterial, MovimientoMaterialPayload } from "@/types/movimiento-material"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` })

export async function createMovimientoMaterial(payload: MovimientoMaterialPayload): Promise<MovimientoMaterial> {
  const r = await fetch(`${BASE}/api/movimientos-material`, {
    method: "POST", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al registrar movimiento") }
  return (await r.json()).data
}

export async function updateMovimientoMaterial(documentId: string, payload: Partial<MovimientoMaterialPayload>): Promise<MovimientoMaterial> {
  const r = await fetch(`${BASE}/api/movimientos-material/${documentId}`, {
    method: "PUT", headers: hdrs(), body: JSON.stringify({ data: payload }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message ?? "Error al actualizar movimiento") }
  return (await r.json()).data
}

export async function deleteMovimientoMaterial(documentId: string): Promise<void> {
  await fetch(`${BASE}/api/movimientos-material/${documentId}`, { method: "DELETE", headers: hdrs() })
}

// Cada línea de compra recibida genera un único movimiento de entrada — se
// busca por esa relación para poder corregirlo (gramos/material) o revertirlo
// al editar una compra ya recibida, en vez de dejar el stock desincronizado.
export async function getMovimientoPorCompraLinea(compraLineaDocumentId: string): Promise<MovimientoMaterial | null> {
  const r = await fetch(
    `${BASE}/api/movimientos-material?filters[compraLinea][documentId][$eq]=${compraLineaDocumentId}&pagination[pageSize]=1`,
    { headers: hdrs() }
  )
  if (!r.ok) return null
  const j = await r.json()
  return j.data?.[0] ?? null
}
