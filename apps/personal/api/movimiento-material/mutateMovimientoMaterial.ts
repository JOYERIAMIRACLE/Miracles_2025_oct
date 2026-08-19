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
