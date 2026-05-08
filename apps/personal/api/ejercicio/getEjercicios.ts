import { useEffect, useState } from "react"
import { EjercicioType } from "@/types/salud"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetEjercicios() {
  const [ejercicios, setEjercicios] = useState<EjercicioType[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/ejercicios?pagination[pageSize]=200&sort=nombre:asc`)
        const json = await res.json()
        setEjercicios(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { ejercicios, setEjercicios, loading }
}

export async function createEjercicio(payload: Partial<EjercicioType>) {
  const res = await fetch(`${BASE}/api/ejercicios`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return res.json()
}

export async function deleteEjercicio(documentId: string) {
  await fetch(`${BASE}/api/ejercicios/${documentId}`, { method: "DELETE" })
}
