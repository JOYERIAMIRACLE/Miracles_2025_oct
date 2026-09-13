import { getClienteToken } from "@/lib/tiendaAuth"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { VentaEmpresa } from "@/types/ventaEmpresa"
import { Cotizacion } from "@/types/cotizacion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function tiendaHeaders(): HeadersInit {
  const token = getClienteToken()
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

// Todos los endpoints /api/tienda/* verifican el JWT del cliente internamente
// y devuelven solo sus propios datos — sin exponer permisos de find global.
export async function buscarClientePorEmail(_email: string): Promise<ClienteEmpresa | null> {
  const res = await fetch(`${BASE}/api/tienda/mis-datos`, { headers: tiendaHeaders() })
  const json = await res.json()
  return json.data ?? null
}

export async function fetchMisVentas(_clienteDocumentId: string): Promise<VentaEmpresa[]> {
  const res = await fetch(`${BASE}/api/tienda/mis-pedidos`, { headers: tiendaHeaders() })
  const json = await res.json()
  return json.data ?? []
}

export async function fetchMisCotizaciones(_clienteDocumentId: string): Promise<Cotizacion[]> {
  const res = await fetch(`${BASE}/api/tienda/mis-cotizaciones`, { headers: tiendaHeaders() })
  const json = await res.json()
  return json.data ?? []
}

export async function actualizarMiCliente(documentId: string, payload: Partial<{
  nombre: string; telefono: string | null; direccion: string | null
}>): Promise<ClienteEmpresa> {
  const res = await fetch(`${BASE}/api/clientes/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  const json = await res.json()
  if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? "Error al guardar")
  return json.data
}
