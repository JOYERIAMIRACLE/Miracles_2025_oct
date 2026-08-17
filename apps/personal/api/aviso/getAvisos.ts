import { useEffect, useState } from "react"
import { AvisoType } from "@/types/aviso"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetAvisos() {
  const [avisos,  setAvisos]  = useState<AvisoType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/avisos?filters[activo][$eq]=true&sort=orden:asc&pagination[pageSize]=20&populate=imagen`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setAvisos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { avisos, loading, reload: () => setTick(t => t + 1) }
}

export function useGetAllAvisos() {
  const [avisos,  setAvisos]  = useState<AvisoType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/avisos?sort=orden:asc&pagination[pageSize]=50&populate=imagen`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setAvisos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { avisos, loading, reload: () => setTick(t => t + 1) }
}
