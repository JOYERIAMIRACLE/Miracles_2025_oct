import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export type Trafico = {
  desde: string
  hasta: string
  truncado: boolean
  visitantes: number
  sesiones: number
  paginasVistas: number
  embudo: { sesiones: number; vieronProducto: number; agregaronCarrito: number; iniciaronCheckout: number; contactaron: number }
  porFuente: { fuente: string; sesiones: number }[]
  porCanal: { fuente: string; canal: string; sesiones: number }[]
  paginas: { pagina: string; vistas: number; sesiones: number }[]
  productos: { producto: string; vistas: number; carritos: number }[]
  campanas: { campana: string; sesiones: number }[]
  busquedas: { q: string; veces: number }[]
  contactos: { canal: string; clics: number }[]
  porDia: { fecha: string; sesiones: number }[]
}

/**
 * Resumen del tráfico de la Tienda entre dos fechas (AAAA-MM-DD), calculado en el
 * backend — solo staff. Con fechas vacías no consulta (modo demo).
 */
export function useTrafico(desde: string, hasta: string) {
  const [data, setData]       = useState<Trafico | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!desde || !hasta) { setData(null); setError(null); setLoading(false); return }
    let vigente = true
    setLoading(true)
    setError(null)
    authFetch(`${BASE}/api/portal/trafico?desde=${desde}&hasta=${hasta}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
        if (vigente) setData(json.data as Trafico)
      })
      .catch((e: Error) => { if (vigente) { setData(null); setError(e.message) } })
      .finally(() => { if (vigente) setLoading(false) })
    return () => { vigente = false }
  }, [desde, hasta])

  return { data, loading, error }
}

/** Sesiones únicas del sitio público entre dos fechas. */
export function useVisitasRango(df: string, dt: string) {
  const { data, loading } = useTrafico(df, dt)
  return { total: data ? data.sesiones : null, loading }
}
