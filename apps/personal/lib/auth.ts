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
  const extractRaw = (role: Record<string, unknown> | null | undefined): string | null => {
    if (!role) return null
    const raw = (role.type || role.name
      || (role.data as Record<string, unknown>)?.attributes?.type
      || (role.data as Record<string, unknown>)?.attributes?.name) as string | undefined
    return raw ? raw.toLowerCase().replace(/[\s-]/g, "_") : null
  }
  try {
    // Intento 1: con populate
    const res = await fetch(`${baseUrl}/api/users/me?populate=role`, { headers })
    if (res.status === 403) return "proveedor_web"
    if (!res.ok) return null
    const json = await res.json()
    const fromPopulate = extractRaw(json.role)
    if (fromPopulate) return fromPopulate

    // Intento 2: sin populate (Strapi v5 puede incluir role por defecto)
    const res2 = await fetch(`${baseUrl}/api/users/me`, { headers })
    if (!res2.ok) return null
    const json2 = await res2.json()
    return extractRaw(json2.role)
  } catch {
    return null
  }
}
