const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// Endpoints nativos de Strapi (plugin users-permissions) — no distinguen
// rol, así que sirven igual para el Portal (staff) y la Tienda (clientes).
export async function solicitarResetPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.error?.message || "No se pudo enviar el correo")
  }
}

export type ResetResult = { jwt: string; user: { id: number; username: string; email: string } }

export async function confirmarResetPassword(
  code: string,
  password: string,
  passwordConfirmation: string,
): Promise<ResetResult> {
  const res = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, password, passwordConfirmation }),
  })
  const json = await res.json()
  if (!res.ok || !json.jwt) {
    throw new Error(json?.error?.message || "No se pudo restablecer la contraseña")
  }
  return json as ResetResult
}
