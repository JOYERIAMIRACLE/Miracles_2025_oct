import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { VentaEmpresa } from "@/types/ventaEmpresa"
import { Cotizacion } from "@/types/cotizacion"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// El login de la Tienda (Strapi users-permissions) y el Contacto/Cliente del
// CRM son dos registros distintos que solo se conectan por email — no hay
// una relación real en el schema todavía. Mientras tanto, este es el punto
// de unión: a partir del email de la cuenta logueada, encuentra su Cliente
// (creado al registrarse, ver api/tiendaAuth/registro.ts) y trae lo suyo.
export async function buscarClientePorEmail(email: string): Promise<ClienteEmpresa | null> {
  const res = await fetch(`${BASE}/api/clientes?filters[email][$eq]=${encodeURIComponent(email)}&pagination[pageSize]=1`)
  const json = await res.json()
  return json.data?.[0] ?? null
}

export async function fetchMisVentas(clienteDocumentId: string): Promise<VentaEmpresa[]> {
  const params = new URLSearchParams({
    "filters[cliente][documentId][$eq]": clienteDocumentId,
    "populate[lineas][populate][0]": "producto",
    "populate[envios]": "true",
    "populate[comprobantePago]": "true",
    "populate[cliente]": "true",
    "sort": "fecha:desc",
    "pagination[pageSize]": "100",
  })
  const res = await fetch(`${BASE}/api/ventas?${params}`)
  const json = await res.json()
  return json.data ?? []
}

export async function fetchMisCotizaciones(clienteDocumentId: string): Promise<Cotizacion[]> {
  const params = new URLSearchParams({
    "filters[cliente][documentId][$eq]": clienteDocumentId,
    "populate[cliente]": "true",
    "populate[ventaGenerada]": "true",
    "sort": "createdAt:desc",
    "pagination[pageSize]": "100",
  })
  const res = await fetch(`${BASE}/api/cotizaciones?${params}`)
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
