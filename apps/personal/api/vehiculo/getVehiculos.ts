import { useEffect, useState } from "react"
import { Vehiculo, VehiculoPayload, ServicioVehiculo, ServicioVehiculoPayload } from "@/types/vehiculo"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// ── Vehículos ──────────────────────────────────────────────────────────────

export function useGetVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading,   setLoading]   = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/vehiculos?pagination[pageSize]=50&sort=nombre:asc`)
        const json = await res.json()
        setVehiculos(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])
  return { vehiculos, setVehiculos, loading }
}

async function mutateV(url: string, method: string, payload?: unknown): Promise<Vehiculo> {
  const res = await fetch(url, {
    method, headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify({ data: payload }) : undefined,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? `Error ${res.status}`) }
  return (await res.json()).data
}

export const createVehiculo = (p: VehiculoPayload)                      => mutateV(`${BASE}/api/vehiculos`, "POST", p)
export const updateVehiculo = (id: string, p: Partial<VehiculoPayload>) => mutateV(`${BASE}/api/vehiculos/${id}`, "PUT", p)
export const deleteVehiculo = async (id: string) => {
  const res = await fetch(`${BASE}/api/vehiculos/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

// ── Servicios ──────────────────────────────────────────────────────────────

export function useGetServicios(vehiculoDocumentId: string | null) {
  const [servicios, setServicios] = useState<ServicioVehiculo[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!vehiculoDocumentId) { setServicios([]); return }
    setLoading(true)
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/servicio-vehiculos?filters[vehiculoDocumentId][$eq]=${vehiculoDocumentId}&pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setServicios(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [vehiculoDocumentId])

  return { servicios, setServicios, loading }
}

async function mutateS(url: string, method: string, payload?: unknown): Promise<ServicioVehiculo> {
  const res = await fetch(url, {
    method, headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify({ data: payload }) : undefined,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? `Error ${res.status}`) }
  return (await res.json()).data
}

export const createServicio = (p: ServicioVehiculoPayload)                        => mutateS(`${BASE}/api/servicio-vehiculos`, "POST", p)
export const updateServicio = (id: string, p: Partial<ServicioVehiculoPayload>)   => mutateS(`${BASE}/api/servicio-vehiculos/${id}`, "PUT", p)
export const deleteServicio = async (id: string) => {
  const res = await fetch(`${BASE}/api/servicio-vehiculos/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
