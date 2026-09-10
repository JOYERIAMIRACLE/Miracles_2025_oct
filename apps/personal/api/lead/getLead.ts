import { useEffect, useState } from "react"
import { Lead, LeadPayload } from "@/types/lead"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/leads`
const POP  = "populate[cliente][fields][0]=nombre&populate[cliente][fields][1]=telefono&populate[cliente][fields][2]=documentId"

export function useGetLeads() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await authFetch(`${URL}?${POP}&pagination[pageSize]=500&sort=createdAt:desc`)
        const json = await res.json()
        setLeads(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { leads, setLeads, loading }
}

export function useGetLeadsByCliente(clienteDocumentId: string | null) {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clienteDocumentId) { setLoading(false); return }
    ;(async () => {
      try {
        const res  = await authFetch(
          `${URL}?${POP}&filters[cliente][documentId][$eq]=${clienteDocumentId}&pagination[pageSize]=200&sort=createdAt:desc`
        )
        const json = await res.json()
        setLeads(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [clienteDocumentId])

  return { leads, setLeads, loading }
}

export async function createLead(payload: LeadPayload): Promise<Lead> {
  const res  = await authFetch(URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al crear el lead")
  // Recargar con populate
  const res2  = await authFetch(`${URL}/${json.data.documentId}?${POP}`)
  const json2 = await res2.json()
  return json2.data ?? json.data
}

export async function updateLead(documentId: string, payload: Partial<LeadPayload>): Promise<Lead> {
  const res  = await authFetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al actualizar el lead")
  const res2  = await authFetch(`${URL}/${json.data.documentId}?${POP}`)
  const json2 = await res2.json()
  return json2.data ?? json.data
}

export async function deleteLead(documentId: string) {
  await authFetch(`${URL}/${documentId}`, { method: "DELETE" })
}

export async function countLeads(): Promise<number> {
  const res  = await authFetch(`${URL}?pagination[pageSize]=1`)
  const json = await res.json()
  return json.meta?.pagination?.total ?? 0
}
