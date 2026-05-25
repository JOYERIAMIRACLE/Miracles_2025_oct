import { useEffect, useState } from "react"
import { AnuncioType, AnuncioPayload } from "@/types/anuncio"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/anuncios?pagination[pageSize]=200&sort=createdAt:desc`

export function useGetAnuncios() {
  const [anuncios, setAnuncios] = useState<AnuncioType[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(URL)
        const json = await res.json()
        setAnuncios(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { anuncios, setAnuncios, loading }
}

export async function createAnuncio(payload: AnuncioPayload): Promise<AnuncioType> {
  const res = await fetch(`${BASE}/api/anuncios`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updateAnuncio(documentId: string, payload: Partial<AnuncioPayload>): Promise<AnuncioType> {
  const res = await fetch(`${BASE}/api/anuncios/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function deleteAnuncio(documentId: string) {
  await fetch(`${BASE}/api/anuncios/${documentId}`, { method: "DELETE" })
}
