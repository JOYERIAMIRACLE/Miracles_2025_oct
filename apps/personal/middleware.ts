import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que NO requieren sesión
const PUBLIC_PREFIXES = [
  "/login",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Dejar pasar activos estáticos y login
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
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
