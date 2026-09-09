"use client"
import Link from "next/link"
import { Package, FileText, Heart, ShoppingBag, ChevronRight } from "lucide-react"
import { useClientePortal } from "@/hooks/useClientePortal"
import { useCart } from "@/hooks/useCart"
import { useFavorites } from "@/hooks/useFavirites"
import { formatPrice } from "@/lib/formatprice"
import { ESTADO_TIENDA, fmtDtCorta } from "../cuenta-shared"

export default function ResumenCuentaPage() {
  const { usuario, ventas, cotizaciones, loading } = useClientePortal()
  const cart = useCart()
  const favorites = useFavorites()

  const ultimosPedidos = ventas.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hola, {usuario?.username?.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Este es el resumen de tu cuenta.</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/cuenta/pedidos" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <Package size={16} className="text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{loading ? "—" : ventas.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pedidos</p>
        </Link>
        <Link href="/cuenta/cotizaciones" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <FileText size={16} className="text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{loading ? "—" : cotizaciones.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Cotizaciones</p>
        </Link>
        <Link href="/productos-favoritos" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <Heart size={16} className="text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{favorites.items.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Favoritos</p>
        </Link>
        <Link href="/carrito" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <ShoppingBag size={16} className="text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cart.items.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">En el carrito</p>
        </Link>
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Últimos pedidos</h2>
          <Link href="/cuenta/pedidos" className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-0.5">
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-10">Cargando…</p>
        ) : ultimosPedidos.length === 0 ? (
          <div className="text-center py-10 px-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Todavía no tienes pedidos.</p>
            <Link href="/tienda" className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mt-1 inline-block">
              Explora el catálogo →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {ultimosPedidos.map(v => (
              <Link key={v.documentId} href="/cuenta/pedidos" className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{v.numero ?? v.concepto}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDtCorta(v.fecha)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_TIENDA[v.estado ?? "Cotizado"]}`}>{v.estado ?? "—"}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(v.monto)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
