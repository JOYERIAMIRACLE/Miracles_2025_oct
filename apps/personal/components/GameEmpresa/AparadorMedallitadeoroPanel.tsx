"use client"

import Link from "next/link"
import { Store, ArrowRight } from "lucide-react"

export function AparadorMedallitadeoroPanel() {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Store size={16} className="text-violet-400" />
        <p className="text-xs text-slate-500">
          Lo que ve el cliente — la tienda pública real, no una vista previa.
        </p>
      </div>

      <Link
        href="/tienda"
        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
      >
        Ir a la tienda <ArrowRight size={14} />
      </Link>
    </div>
  )
}
