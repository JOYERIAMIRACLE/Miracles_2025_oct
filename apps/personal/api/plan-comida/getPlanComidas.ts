import { useEffect, useState } from "react"
import { PlanComidaType, PlanComidaPayload } from "@/types/planComida"
import { RecetaType } from "@/types/recetario"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

const normalizeReceta = (r: RecetaType): RecetaType => ({ ...r, categorias: r.categorias ?? [] })

const normalizePlan = (p: PlanComidaType): PlanComidaType => ({
  ...p,
  receta: p.receta ? normalizeReceta(p.receta) : p.receta,
})

export function useGetPlanSemana(semanaInicio: string) {
  const [planComidas, setPlanComidas] = useState<PlanComidaType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!semanaInicio) return
    setLoading(true)
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "filters[semanaInicio][$eq]": semanaInicio,
          "populate":                   "receta",
          "pagination[pageSize]":       "100",
        })
        const res  = await fetch(`${BASE}/api/plan-comidas?${params}`)
        const json = await res.json()
        setPlanComidas((json.data ?? []).map(normalizePlan))
      } finally { setLoading(false) }
    })()
  }, [semanaInicio])

  return { planComidas, setPlanComidas, loading }
}

export async function createPlanComida(payload: PlanComidaPayload): Promise<PlanComidaType> {
  const res  = await fetch(`${BASE}/api/plan-comidas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  return normalizePlan(json.data)
}

export async function deletePlanComida(documentId: string) {
  await fetch(`${BASE}/api/plan-comidas/${documentId}`, { method: "DELETE" })
}
