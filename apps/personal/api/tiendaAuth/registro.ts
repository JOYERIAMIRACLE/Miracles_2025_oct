import { createCliente } from "@/api/clienteEmpresa/getClientes"
import { createLead } from "@/api/lead/getLead"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export type RegistroPayload = {
  nombre:   string
  email:    string
  password: string
  telefono?: string | null
}

export type LoginResult = { jwt: string; user: { id: number; username: string; email: string } }

async function buscarClientePorEmail(email: string): Promise<{ documentId: string } | null> {
  try {
    const res = await fetch(`${BASE}/api/clientes?filters[email][$eq]=${encodeURIComponent(email)}&fields[0]=documentId&pagination[pageSize]=1`)
    const json = await res.json()
    return json.data?.[0] ?? null
  } catch { return null }
}

// Registro completo: crea el usuario de login en Strapi y, aparte, lo
// conecta con el CRM de Ventas (Contactos/Leads) — así un alta desde la
// Tienda aparece de inmediato en Leads con origenApp "tienda", igual que
// si alguien del equipo lo hubiera capturado a mano. Si esta segunda parte
// falla, no debe tumbar el registro: la cuenta de login ya es válida.
export async function registrarCliente(payload: RegistroPayload): Promise<LoginResult> {
  // Endpoint propio (no el /api/auth/local/register de Strapi) — asigna a
  // mano el rol "cliente_tienda" en vez del "authenticated" por default,
  // para que una cuenta de la Tienda nunca pueda entrar al Portal interno
  // (ver comentario junto a crearRolClienteTienda en el backend).
  const res = await fetch(`${BASE}/api/tienda/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: payload.nombre, email: payload.email, password: payload.password }),
  })
  const json = await res.json()
  if (!res.ok || !json.jwt) {
    throw new Error(json?.error?.message || "No se pudo crear la cuenta")
  }

  try {
    const existente = await buscarClientePorEmail(payload.email)
    const clienteDocId = existente
      ? existente.documentId
      : (await createCliente({
          nombre: payload.nombre, email: payload.email, telefono: payload.telefono || null,
          canalContacto: "Web", origenContacto: "Registro en tienda",
          Funnel: "Lead", calificado: false, Estado: "Activo",
          fechaLead: new Date().toISOString(),
        })).documentId
    await createLead({
      cliente: clienteDocId, Funnel: "Lead", origenApp: "tienda",
      canal: "Web", origen: "Formulario web",
      fechaLead: new Date().toISOString(),
    })
  } catch {
    // No bloquea el registro — la cuenta de login ya se creó bien.
  }

  return json as LoginResult
}

export async function iniciarSesionCliente(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  })
  const json = await res.json()
  if (!res.ok || !json.jwt) {
    throw new Error("Email o contraseña incorrectos")
  }
  return json as LoginResult
}
