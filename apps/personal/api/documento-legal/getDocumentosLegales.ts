import { useEffect, useState } from "react"
import { DocumentoLegalType } from "@/types/documento-legal"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetDocumentosLegales() {
  const [documentos, setDocumentos] = useState<DocumentoLegalType[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`${BASE}/api/documentos-legales?filters[activo][$eq]=true&sort=orden:asc&populate=archivos&pagination[pageSize]=50`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => setDocumentos(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [tick])

  return { documentos, loading, reload: () => setTick(t => t + 1) }
}
