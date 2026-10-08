import { useEffect, useState } from "react"
import { ClienteEmpresa, ClientePayload } from "@/types/clienteEmpresa"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/clientes`

export function useGetClientes() {
  const [clientes, setClientes] = useState<ClienteEmpresa[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await authFetch(`${URL}?pagination[pageSize]=500&sort=nombre:asc`)
        const json = await res.json()
        setClientes(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { clientes, setClientes, loading }
}

export async function createCliente(payload: ClientePayload): Promise<ClienteEmpresa> {
  const res  = await authFetch(URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al crear el contacto")
  return json.data
}

export async function updateCliente(documentId: string, payload: Partial<ClientePayload>): Promise<ClienteEmpresa> {
  const res  = await authFetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al actualizar el contacto")
  return json.data
}

export async function deleteCliente(documentId: string) {
  await authFetch(`${URL}/${documentId}`, { method: "DELETE" })
}

/** Une un prospecto con un contacto que ya existía (misma persona): sus leads,
    cotizaciones y pedidos pasan al contacto y el prospecto se borra. */
export async function fusionarProspecto(prospectoDocumentId: string, contactoDocumentId: string): Promise<ClienteEmpresa> {
  const res = await authFetch(`${BASE}/api/portal/clientes/fusionar`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prospecto: prospectoDocumentId, contacto: contactoDocumentId }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "No se pudo usar ese contacto")
  return json.data
}
