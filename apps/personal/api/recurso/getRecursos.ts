import { useEffect, useState } from "react"
import { RecursoType, RecursoCategoriaType } from "@/types/recurso"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const PAGE_SIZE = 50

function urlPagina(seccion: string, pagina: number) {
  return `${BASE}/api/recursos?filters[activo][$eq]=true&filters[seccion][$eq]=${encodeURIComponent(seccion)}&sort=orden:asc&populate=archivo&pagination[page]=${pagina}&pagination[pageSize]=${PAGE_SIZE}`
}

export function useGetRecursos(seccion: string) {
  const [recursos, setRecursos]       = useState<RecursoType[]>([])
  const [loading, setLoading]         = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [pagina, setPagina]           = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let vigente = true
    setLoading(true)
    setPagina(1)
    fetch(urlPagina(seccion, 1), { signal: controller.signal })
      .then(r => r.json())
      .then(json => {
        if (!vigente) return
        setRecursos(json.data ?? [])
        setTotalPaginas(json.meta?.pagination?.pageCount ?? 1)
      })
      .catch(() => {})
      .finally(() => { if (vigente) setLoading(false) })
    return () => { vigente = false; controller.abort() }
  }, [seccion, tick])

  async function cargarMas() {
    if (pagina >= totalPaginas || cargandoMas) return
    setCargandoMas(true)
    try {
      const siguiente = pagina + 1
      const res  = await fetch(urlPagina(seccion, siguiente))
      const json = await res.json()
      setRecursos(prev => [...prev, ...(json.data ?? [])])
      setPagina(siguiente)
    } catch {}
    finally { setCargandoMas(false) }
  }

  return {
    recursos, loading, reload: () => setTick(t => t + 1),
    cargarMas, hayMas: pagina < totalPaginas, cargandoMas,
  }
}

export function useGetCategorias(seccion: string, enabled: boolean) {
  const [categorias, setCategorias] = useState<RecursoCategoriaType[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let vigente = true
    fetch(`${BASE}/api/recurso-categorias?filters[seccion][$eq]=${encodeURIComponent(seccion)}&sort=orden:asc&pagination[pageSize]=100`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => { if (vigente) setCategorias(json.data ?? []) })
      .catch(() => {})
    return () => { vigente = false; controller.abort() }
  }, [seccion, enabled, tick])

  return { categorias, reload: () => setTick(t => t + 1) }
}
