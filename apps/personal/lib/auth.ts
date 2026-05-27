const KEY      = "miracles_jwt"
const ROLE_KEY = "miracles_role"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEY)
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token)
}

export function removeToken() {
  localStorage.removeItem(KEY)
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function getUserRole(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ROLE_KEY)
}

export function setUserRole(role: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(ROLE_KEY, role)
}

export function removeUserRole() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ROLE_KEY)
}

export function logout() {
  removeToken()
  removeUserRole()
}

export function isProveedorWeb(): boolean {
  const role = getUserRole()
  return (role?.includes("proveedor") ?? false)
}

export async function fetchUserRole(token: string, baseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 403 = token válido pero el rol no tiene permiso para /users/me
    // Solo ocurre con roles personalizados sin ese permiso → tratar como proveedor_web
    if (res.status === 403) return "proveedor_web"
    if (!res.ok) return null
    const json = await res.json()
    // Strapi v5 puede no incluir `type`; usamos `name` como fallback
    const raw = (json.role?.type || json.role?.name) as string | undefined
    return raw ? raw.toLowerCase().replace(/[\s-]/g, "_") : null
  } catch {
    return null
  }
}
