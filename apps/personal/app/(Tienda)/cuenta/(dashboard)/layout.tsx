"use client"
import { ReactNode, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, FileText, Heart, MapPin, CreditCard, User, LogOut, Loader2 } from "lucide-react"
import { useClientePortal } from "@/hooks/useClientePortal"

const NAV = [
  { label: "Resumen",          href: "/cuenta",              icon: LayoutDashboard },
  { label: "Mis pedidos",      href: "/cuenta/pedidos",       icon: Package },
  { label: "Mis cotizaciones", href: "/cuenta/cotizaciones",  icon: FileText },
  { label: "Mis favoritos",    href: "/cuenta/favoritos",     icon: Heart },
  { label: "Direcciones",      href: "/cuenta/direcciones",   icon: MapPin },
  { label: "Métodos de pago",  href: "/cuenta/pagos",         icon: CreditCard },
  { label: "Mi perfil",        href: "/cuenta/perfil",        icon: User },
]

export default function CuentaDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario, loading, logout } = useClientePortal()

  useEffect(() => {
    if (!loading && !usuario) router.replace(`/cuenta/login?next=${encodeURIComponent(pathname)}`)
  }, [loading, usuario, router, pathname])

  function handleLogout() {
    logout()
    router.push("/")
  }

  if (loading || !usuario) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    // Fondo propio en vez de heredar el --background casi negro de shadcn:
    // esta zona vive junto a Carrito/Footer, que ya usan zinc-950 — antes se
    // notaba el salto de un negro a otro sin razón al entrar aquí.
    <div className="bg-white dark:bg-zinc-950 min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600">Inicio</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300">Mi cuenta</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-60 shrink-0">
            {/* Perfil + navegación como una sola superficie (antes eran dos
                cajas idénticas apiladas) — un separador interno basta. */}
            <div className="bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-white/10">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-amber-100 to-amber-200/60 dark:from-amber-500/20 dark:to-amber-600/10 flex items-center justify-center shrink-0">
                  <User className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{usuario.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{usuario.email}</p>
                </div>
              </div>

              <nav className="p-2">
                <div className="space-y-0.5">
                  {NAV.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href
                    return (
                      <Link key={href} href={href}
                        className={`relative flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-500/[0.07]"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}>
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.75 rounded-full bg-amber-600 dark:bg-amber-400" />}
                        <Icon size={16} className={active ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"} />
                        {label}
                      </Link>
                    )
                  })}
                </div>
                <div className="mt-1 pt-1 border-t border-gray-100 dark:border-white/10">
                  <button type="button" onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
