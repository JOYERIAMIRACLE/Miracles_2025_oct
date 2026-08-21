import { useEffect, useState } from "react"
import { ClienteEmpresa, ClientePayload } from "@/types/clienteEmpresa"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const URL  = `${BASE}/api/clientes`

export function useGetClientes() {
  const [clientes, setClientes] = useState<ClienteEmpresa[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${URL}?pagination[pageSize]=500&sort=nombre:asc`)
        const json = await res.json()
        setClientes(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { clientes, setClientes, loading }
}

export async function createCliente(payload: ClientePayload): Promise<ClienteEmpresa> {
  const res  = await fetch(URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al crear el contacto")
  return json.data
}

export async function updateCliente(documentId: string, payload: Partial<ClientePayload>): Promise<ClienteEmpresa> {
  const res  = await fetch(`${URL}/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al actualizar el contacto")
  return json.data
}

export async function deleteCliente(documentId: string) {
  await fetch(`${URL}/${documentId}`, { method: "DELETE" })
}
