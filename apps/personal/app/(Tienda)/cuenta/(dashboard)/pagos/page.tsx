"use client"
import { CreditCard, ShieldCheck } from "lucide-react"

export default function PagosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Métodos de pago</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tarjetas guardadas para pagar más rápido.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-center py-16 px-6">
        <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-gray-100">Estamos preparando esta sección</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Muy pronto vas a poder guardar tu tarjeta de forma segura para pagar en un clic. Por ahora, cierra tu compra directamente con nuestro equipo desde tu carrito.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 mt-4">
          <ShieldCheck size={13} /> Cuando esté lista, ni nosotros ni la Tienda vemos el número completo de tu tarjeta.
        </div>
      </div>
    </div>
  )
}
