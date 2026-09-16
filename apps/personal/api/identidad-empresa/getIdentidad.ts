import { useEffect, useState } from "react"
import { IdentidadEmpresa } from "@/types/identidad-empresa"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const API_URL = `${BASE}/api/identidad-empresas?pagination[pageSize]=1&populate=*`

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken()
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }
}

export function useGetIdentidad() {
  const [identidad, setIdentidad] = useState<IdentidadEmpresa | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [tick,      setTick]      = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        // Sin Authorization a propósito: este GET es público (lo usan tanto
        // visitantes anónimos de la Tienda como el Portal), y Strapi rechaza
        // con 401 cualquier request que traiga un Bearer inválido/vencido —
        // NO cae de regreso a acceso público solo porque el token esté mal.
        // Adjuntar el token de todos modos (como hacía antes) rompía el logo
        // y demás datos de identidad para cualquiera cuyo token ya no fuera
        // válido contra este backend (ej. sesión vieja, u otro entorno),
        // aunque el dato en sí nunca necesitó login para leerse.
        const res  = await fetch(API_URL)
        const json = await res.json()
        setIdentidad(json.data?.[0] ?? null)
      } finally { setLoading(false) }
    })()
  }, [tick])

  return { identidad, setIdentidad, loading, reload: () => setTick(t => t + 1) }
}

export async function saveIdentidad(
  documentId: string | null,
  payload: Record<string, unknown>
): Promise<IdentidadEmpresa> {
  const url    = documentId ? `${BASE}/api/identidad-empresas/${documentId}` : `${BASE}/api/identidad-empresas`
  const method = documentId ? "PUT" : "POST"
  console.log("[saveIdentidad]", method, url, payload)
  const res    = await fetch(url, {
    method,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  console.log("[saveIdentidad] response", res.status, json)
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
  }
  return json.data
}
