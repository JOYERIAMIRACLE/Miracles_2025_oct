import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

/** Lee visitas únicas (por sesión) entre dos fechas — requiere JWT */
export function useVisitasRango(df: string, dt: string) {
  const [total, setTotal]   = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!df || !dt) return
    ;(async () => {
      setLoading(true)
      try {
        const token = getToken()
        const params = new URLSearchParams({
          "filters[fecha][$gte]": df,
          "filters[fecha][$lte]": dt,
          "pagination[pageSize]": "1000",
          "fields[0]": "sesion",
        })
        const res  = await fetch(`${BASE}/api/visitas?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        // Contar sesiones únicas
        const sesiones = new Set<string>((json.data ?? []).map((v: {sesion:string}) => v.sesion))
        setTotal(sesiones.size)
      } catch {
        setTotal(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [df, dt])

  return { total, loading }
}

/**
 * Registra una visita anónima al sitio público.
 * Llamar desde el sitio web de la joyería (no desde el admin portal).
 * No registra IP ni dato personal — solo fecha, página y UUID de sesión.
 */
export async function registrarVisita(pagina: string) {
  if (typeof window === "undefined") return
  try {
    // UUID por sesión de pestaña — se borra al cerrar el tab
    let sid = sessionStorage.getItem("_vsid")
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem("_vsid", sid)
    }

    // No enviar si ya registramos esta página en esta sesión
    const keyReg = `_vr_${pagina}`
    if (sessionStorage.getItem(keyReg)) return
    sessionStorage.setItem(keyReg, "1")

    const fuente = detectarFuente()
    await fetch(`${BASE}/api/visitas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          fecha:  new Date().toISOString().slice(0, 10),
          pagina,
          sesion: sid,
          fuente,
        },
      }),
    })
  } catch {
    // Silencioso — no interrumpir la experiencia del usuario
  }
}

function detectarFuente(): string {
  try {
    const ref = document.referrer
    if (!ref) return "directo"
    const host = new URL(ref).hostname.replace("www.", "")
    if (["google.com","bing.com","yahoo.com","duckduckgo.com"].some(d => host.includes(d))) return "busqueda"
    if (["instagram.com","facebook.com","tiktok.com","twitter.com","x.com"].some(d => host.includes(d))) return "social"
    if (["mailchimp.com","sendgrid.com"].some(d => host.includes(d))) return "email"
    return "referido"
  } catch {
    return "otro"
  }
}
