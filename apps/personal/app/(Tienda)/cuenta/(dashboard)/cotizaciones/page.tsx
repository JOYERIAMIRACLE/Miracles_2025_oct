"use client"
import { FileText } from "lucide-react"
import { useClientePortal } from "@/hooks/useClientePortal"
import { formatPrice } from "@/lib/formatprice"
import { ESTADO_COT_TIENDA, fmtDtCorta, cardCls } from "../../cuenta-shared"

export default function CotizacionesPage() {
  const { cotizaciones, loading } = useClientePortal()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis cotizaciones</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Propuestas que te ha preparado nuestro equipo.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-16">Cargando…</p>
      ) : cotizaciones.length === 0 ? (
        <div className={`${cardCls} text-center py-16 px-5`}>
          <FileText size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Todavía no tienes cotizaciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map(c => (
            <div key={c.documentId} className={`${cardCls} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.numero ?? "Cotización"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {fmtDtCorta(c.fecha ?? c.createdAt)}
                    {c.validoHasta && ` · Válida hasta ${fmtDtCorta(c.validoHasta)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_COT_TIENDA[c.estado]}`}>{c.estado}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatPrice(c.total)}</span>
                </div>
              </div>

              {c.items && c.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 space-y-1.5">
                  {c.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm gap-3">
                      <p className="text-gray-700 dark:text-gray-300 truncate">{item.descripcion}</p>
                      <p className="text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">×{item.cantidad} · {formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              )}

              {c.estado === "Convertida" && c.ventaGenerada && (
                <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Ya se convirtió en el pedido {c.ventaGenerada.numero ?? c.ventaGenerada.concepto} — revísalo en &quot;Mis pedidos&quot;.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
