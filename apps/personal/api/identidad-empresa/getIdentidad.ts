import { useEffect, useState } from "react"
import { IdentidadEmpresa } from "@/types/identidad-empresa"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/identidad-empresas?pagination[pageSize]=1`

export function useGetIdentidad() {
  const [identidad, setIdentidad] = useState<IdentidadEmpresa | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(URL)
        const json = await res.json()
        setIdentidad(json.data?.[0] ?? null)
      } finally { setLoading(false) }
    })()
  }, [])

  return { identidad, setIdentidad, loading }
}

export async function saveIdentidad(
  documentId: string | null,
  payload: Record<string, unknown>
): Promise<IdentidadEmpresa> {
  const url    = documentId ? `${BASE}/api/identidad-empresas/${documentId}` : `${BASE}/api/identidad-empresas`
  const method = documentId ? "PUT" : "POST"
  const res    = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al guardar identidad")
  }
  return (await res.json()).data
}
