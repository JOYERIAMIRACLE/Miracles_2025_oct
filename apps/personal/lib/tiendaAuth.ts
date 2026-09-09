// Sesión de cliente de la Tienda — deliberadamente separada del token del
// Portal (miracles_jwt/lib/auth.ts), aunque ambos sean el mismo backend
// Strapi. Si compartieran la misma llave, un cliente que se registra en la
// Tienda quedaría "logueado" también en el Portal interno (y viceversa),
// activando por accidente cosas como el widget de Notas de mejora.
const KEY = "medalla_cliente_jwt"

export function getClienteToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEY)
}

export function setClienteToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, token)
}

export function removeClienteToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}

export function isClienteTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
