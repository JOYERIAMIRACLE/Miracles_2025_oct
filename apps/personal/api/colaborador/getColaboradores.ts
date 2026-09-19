import { useEffect, useState } from "react"
import { ColaboradorType } from "@/types/colaborador"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetColaboradores() {
  const [colaboradores, setColaboradores] = useState<ColaboradorType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/colaboradores?filters[activo][$eq]=true&sort=orden:asc&populate=foto&pagination[pageSize]=200`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setColaboradores(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { colaboradores, loading, reload: () => setTick(t => t + 1) }
}

export function cumpleaniosDelMes(colaboradores: ColaboradorType[], mes = new Date().getMonth()): ColaboradorType[] {
  return colaboradores
    .filter(c => c.fecha_nacimiento && new Date(c.fecha_nacimiento + "T12:00:00").getMonth() === mes)
    .sort((a, b) => {
      const da = new Date(a.fecha_nacimiento! + "T12:00:00").getDate()
      const db = new Date(b.fecha_nacimiento! + "T12:00:00").getDate()
      return da - db
    })
}

export function aniversariosDelMes(colaboradores: ColaboradorType[], mes = new Date().getMonth()): (ColaboradorType & { anos: number })[] {
  const hoy = new Date()
  return colaboradores
    .filter(c => c.fecha_ingreso && new Date(c.fecha_ingreso + "T12:00:00").getMonth() === mes)
    .map(c => ({
      ...c,
      anos: hoy.getFullYear() - new Date(c.fecha_ingreso! + "T12:00:00").getFullYear(),
    }))
    .filter(c => c.anos > 0)
    .sort((a, b) => {
      const da = new Date(a.fecha_ingreso! + "T12:00:00").getDate()
      const db = new Date(b.fecha_ingreso! + "T12:00:00").getDate()
      return da - db
    })
}
