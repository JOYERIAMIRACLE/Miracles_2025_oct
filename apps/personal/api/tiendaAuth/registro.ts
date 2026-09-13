const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export type RegistroPayload = {
  nombre:    string
  email:     string
  password:  string
  telefono?: string | null
}

export type LoginResult = { jwt: string; user: { id: number; username: string; email: string } }

// El endpoint /api/tienda/registro crea el usuario Y el registro CRM
// (cliente + lead) en el mismo request server-side — sin exponer permisos.
export async function registrarCliente(payload: RegistroPayload): Promise<LoginResult> {
  const res = await fetch(`${BASE}/api/tienda/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: payload.nombre, email: payload.email, password: payload.password }),
  })
  const json = await res.json()
  if (!res.ok || !json.jwt) {
    throw new Error(json?.error?.message || "No se pudo crear la cuenta")
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
