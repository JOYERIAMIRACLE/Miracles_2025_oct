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
  try {
    const res = await fetch(`${baseUrl}/api/users/me?populate=*`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 403) return "proveedor_web"
    if (!res.ok) return `HTTP_${res.status}`
    const json = await res.json()
    const raw = (json.role?.type || json.role?.name) as string | undefined
    if (!raw) return `NO_ROLE:${JSON.stringify(json.role)}`
    return raw.toLowerCase().replace(/[\s-]/g, "_")
  } catch (e) {
    return `CATCH:${e}`
  }
}
