"use client"
import { CreditCard, ShieldCheck } from "lucide-react"
import { cardCls } from "../../cuenta-shared"

export default function PagosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Métodos de pago</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tarjetas guardadas para pagar más rápido.</p>
      </div>

      <div className={`${cardCls} text-center py-16 px-6`}>
        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-violet-100 to-violet-200/60 dark:from-violet-500/20 dark:to-violet-600/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard size={20} className="text-violet-700 dark:text-violet-400" />
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
