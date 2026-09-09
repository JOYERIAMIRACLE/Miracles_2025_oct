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
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Mi cuenta</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-60 shrink-0 space-y-3">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                <User className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{usuario.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{usuario.email}</p>
              </div>
            </div>
          </div>

          <nav className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2">
            <div className="space-y-0.5">
              {NAV.map(({ label, href, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}>
                    <Icon size={16} className={active ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-600"} />
                    {label}
                  </Link>
                )
              })}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-100 dark:border-zinc-800">
              <button type="button" onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
