import { useEffect, useState } from "react"
import { PlanEjercicioType, PlanEjercicioPayload } from "@/types/planEjercicio"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetPlanEjercicioSemana(semanaInicio: string) {
  const [planEjercicios, setPlanEjercicios] = useState<PlanEjercicioType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!semanaInicio) return
    setLoading(true)
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "filters[semanaInicio][$eq]": semanaInicio,
          "populate":                   "ejercicio",
          "pagination[pageSize]":       "100",
        })
        const res  = await fetch(`${BASE}/api/plan-ejercicios?${params}`)
        const json = await res.json()
        setPlanEjercicios(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [semanaInicio])

  return { planEjercicios, setPlanEjercicios, loading }
}

export async function createPlanEjercicio(payload: PlanEjercicioPayload): Promise<PlanEjercicioType> {
  const res  = await fetch(`${BASE}/api/plan-ejercicios`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  return json.data
}

export async function deletePlanEjercicio(documentId: string) {
  await fetch(`${BASE}/api/plan-ejercicios/${documentId}`, { method: "DELETE" })
}
