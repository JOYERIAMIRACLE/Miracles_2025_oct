import { useEffect, useState } from "react"
import { PaginaArquitecturaType, ReglaArquitecturaType } from "@/types/pagina-arquitectura"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetPaginasArquitectura() {
  const [paginas, setPaginas] = useState<PaginaArquitecturaType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    let vigente = true
    setLoading(true)
    authFetch(`${BASE}/api/paginas-arquitectura?sort=orden:asc&pagination[pageSize]=200`)
      .then(r => r.json())
      .then(json => { if (vigente) setPaginas(json.data ?? []) })
      .catch(() => {})
      .finally(() => { if (vigente) setLoading(false) })
    return () => { vigente = false }
  }, [tick])

  return { paginas, setPaginas, loading, reload: () => setTick(t => t + 1) }
}

export function useGetReglasArquitectura() {
  const [reglas,  setReglas]  = useState<ReglaArquitecturaType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    let vigente = true
    setLoading(true)
    authFetch(`${BASE}/api/reglas-arquitectura?sort=orden:asc&pagination[pageSize]=200`)
      .then(r => r.json())
      .then(json => { if (vigente) setReglas(json.data ?? []) })
      .catch(() => {})
      .finally(() => { if (vigente) setLoading(false) })
    return () => { vigente = false }
  }, [tick])

  return { reglas, setReglas, loading, reload: () => setTick(t => t + 1) }
}
