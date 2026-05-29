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

export function isMarketingTeam(): boolean {
  const role = getUserRole()
  return (role?.includes("marketing") ?? false)
}

// Roles que solo tienen acceso a /trabajo (no empresa ni personal)
export function isSoloTrabajo(): boolean {
  return isProveedorWeb() || isMarketingTeam()
}

export async function fetchUserRole(token: string, baseUrl: string): Promise<string | null> {
  const headers = { Authorization: `Bearer ${token}` }
  const normalize = (raw: string) => raw.toLowerCase().replace(/[\s-]/g, "_")
  try {
    // Endpoint custom que devuelve el rol directo desde la DB (sin restricciones de sanitize)
    const res = await fetch(`${baseUrl}/api/my-role`, { headers })
    if (res.ok) {
      const json = await res.json() as { type?: string; name?: string }
      const raw = json.type || json.name
      if (raw) return normalize(raw)
    }

    // Fallback: /api/users/me con populate
    const res2 = await fetch(`${baseUrl}/api/users/me?populate=role`, { headers })
    if (res2.status === 403) return "proveedor_web"
    if (!res2.ok) return null
    const json2 = await res2.json() as { role?: { type?: string; name?: string } }
    const role2 = json2.role
    const raw2 = role2?.type || role2?.name
    return raw2 ? normalize(raw2) : null
  } catch {
    return null
  }
}
