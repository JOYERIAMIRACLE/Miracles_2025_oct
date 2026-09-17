import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas internas (Portal/Admin) que requieren sesión — el resto del sitio,
// incluida toda la Tienda pública, queda abierto por default.
const PROTECTED_PREFIXES = [
  "/portal-medalladeoro",
  "/gestion-personal",
  "/gestion-empresa",
  "/empresa-rpg",
  "/segundo-cerebro",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo evaluar sesión para las rutas internas protegidas
  if (!PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verificar cookie de sesión
  const session = request.cookies.get("miracles_session")?.value
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    // Guardar destino original para redirigir después del login
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Aplica a todo excepto activos estáticos de Next.js e imágenes
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
