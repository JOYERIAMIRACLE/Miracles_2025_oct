"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, User, ShoppingBag, Heart } from "lucide-react"
import { toast } from "sonner"
import { useClienteAuth } from "@/hooks/useClienteAuth"

export default function CuentaPage() {
  const router = useRouter()
  const { cliente, loading, logout } = useClienteAuth()

  useEffect(() => {
    if (!loading && !cliente) router.replace("/cuenta/login?next=/cuenta")
  }, [loading, cliente, router])

  if (loading || !cliente) return null

  function handleLogout() {
    logout()
    toast.success("Sesión cerrada")
    router.push("/")
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Mi cuenta</span>
      </nav>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{cliente.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cliente.email}</p>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <Link href="/carrito" className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <ShoppingBag size={16} className="text-gray-400 dark:text-gray-600" /> Mi carrito
          </Link>
          <Link href="/productos-favoritos" className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <Heart size={16} className="text-gray-400 dark:text-gray-600" /> Mis favoritos
          </Link>
        </div>

        <button type="button" onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors pt-2 border-t border-gray-100 dark:border-zinc-800 w-full">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
