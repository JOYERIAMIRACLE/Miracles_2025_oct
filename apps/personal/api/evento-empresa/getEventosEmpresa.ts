import { useEffect, useState } from "react"
import { EventoEmpresaType } from "@/types/evento-empresa"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetEventosEmpresa() {
  const [eventos, setEventos] = useState<EventoEmpresaType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const hoy = new Date().toISOString().split("T")[0]
    setLoading(true)
    fetch(`${BASE}/api/evento-empresas?filters[activo][$eq]=true&filters[fecha][$gte]=${hoy}&sort=fecha:asc&pagination[pageSize]=20`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setEventos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { eventos, loading, reload: () => setTick(t => t + 1) }
}

/** Para el modal de gestión — todos los eventos (pasados/futuros, activos o no). */
export function useGetAllEventosEmpresa() {
  const [eventos, setEventos] = useState<EventoEmpresaType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/evento-empresas?sort=fecha:desc&pagination[pageSize]=100`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setEventos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { eventos, loading, reload: () => setTick(t => t + 1) }
}
