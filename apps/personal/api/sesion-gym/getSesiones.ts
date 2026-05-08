import { useEffect, useState } from "react"
import { SesionGymType } from "@/types/salud"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetSesiones() {
  const [sesiones, setSesiones] = useState<SesionGymType[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/sesion-gyms?populate=rutina&pagination[pageSize]=200&sort=fecha:desc`)
        const json = await res.json()
        setSesiones(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { sesiones, setSesiones, loading }
}

export async function createSesion(payload: Partial<SesionGymType> & { rutina?: { connect: [{ id: number }] } | null }) {
  const res = await fetch(`${BASE}/api/sesion-gyms`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function updateSesion(documentId: string, payload: Partial<SesionGymType>) {
  const res = await fetch(`${BASE}/api/sesion-gyms/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteSesion(documentId: string) {
  await fetch(`${BASE}/api/sesion-gyms/${documentId}`, { method: "DELETE" })
}
