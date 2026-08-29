import { useEffect, useState, useCallback } from "react"
import { NotaMejoraType } from "@/types/nota-mejora"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// A diferencia de aviso/documento-legal (públicos), notas-mejora solo tiene
// permiso de Authenticated -- hay que mandar el token también para leer.
export function useGetNotasMejora() {
  const [notas,   setNotas]   = useState<NotaMejoraType[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const token = getToken()
    if (!token) { setNotas([]); setLoading(false); return }
    try {
      const res  = await fetch(`${BASE}/api/notas-mejora?sort=createdAt:desc&pagination[pageSize]=200`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setNotas(json.data ?? [])
    } catch {
      setNotas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { notas, loading, reload: cargar }
}
