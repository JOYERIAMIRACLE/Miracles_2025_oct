import { useEffect, useState } from "react"
import { RHItemType, RHItemTipo } from "@/types/rhItem"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetRHItems(tipo: RHItemTipo) {
  const [items,   setItems]   = useState<RHItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/rh-items?filters[tipo][$eq]=${tipo}&filters[activo][$eq]=true&sort=orden:asc&pagination[pageSize]=50&populate=archivos`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tipo, tick])

  return { items, loading, reload: () => setTick(t => t + 1) }
}

export function useGetAllRHItems(tipo: RHItemTipo) {
  const [items,   setItems]   = useState<RHItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/rh-items?filters[tipo][$eq]=${tipo}&sort=orden:asc&pagination[pageSize]=50&populate=archivos`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tipo, tick])

  return { items, loading, reload: () => setTick(t => t + 1) }
}
