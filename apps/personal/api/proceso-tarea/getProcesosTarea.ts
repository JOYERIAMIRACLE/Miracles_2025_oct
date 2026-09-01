import { useEffect, useState } from "react"
import { AmbitoTarea } from "@/types/tarea"
import { ProcesoTarea } from "@/types/proceso-tarea"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetProcesosTarea(ambito: AmbitoTarea) {
  const [procesos, setProcesos] = useState<ProcesoTarea[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let vigente = true
    fetch(`${BASE}/api/proceso-tareas?filters[ambito][$eq]=${ambito}&sort=orden:asc&pagination[pageSize]=100`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => { if (vigente) setProcesos(json.data ?? []) })
      .catch(() => {})
    return () => { vigente = false; controller.abort() }
  }, [ambito, tick])

  return { procesos, reload: () => setTick(t => t + 1) }
}
