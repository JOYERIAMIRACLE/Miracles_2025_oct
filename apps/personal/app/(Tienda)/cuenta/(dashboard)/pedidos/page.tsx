"use client"
import { useState } from "react"
import { Package, ChevronDown, Truck, Receipt } from "lucide-react"
import { useClientePortal } from "@/hooks/useClientePortal"
import { formatPrice } from "@/lib/formatprice"
import { ESTADO_TIENDA, fmtDtCorta, cardCls } from "../../cuenta-shared"
import { ESTADO_ENVIO_LABELS, ESTADO_ENVIO_COLORS, PAQUETERIA_LABELS, EstadoEnvio, PaqueteriaEnvio } from "@/types/envio"

export default function PedidosPage() {
  const { ventas, loading } = useClientePortal()
  const [abierto, setAbierto] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis pedidos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">El historial y seguimiento de todo lo que has comprado.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-16">Cargando…</p>
      ) : ventas.length === 0 ? (
        <div className={`${cardCls} text-center py-16 px-5`}>
          <Package size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Todavía no tienes pedidos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventas.map(v => {
            const open = abierto === v.documentId
            const envio = v.envios?.[0]
            return (
              <div key={v.documentId} className={`${cardCls} overflow-hidden`}>
                <button type="button" onClick={() => setAbierto(open ? null : v.documentId)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{v.numero ?? v.concepto}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmtDtCorta(v.fecha)} · {v.lineas?.length ?? 0} artículo{(v.lineas?.length ?? 0) === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_TIENDA[v.estado ?? "Cotizado"]}`}>{v.estado ?? "—"}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatPrice(v.monto)}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-gray-100 dark:border-white/10 px-5 py-4 space-y-4">
                    {/* Artículos */}
                    {v.lineas && v.lineas.length > 0 && (
                      <div className="space-y-2">
                        {v.lineas.map(l => (
                          <div key={l.documentId} className="flex items-center justify-between text-sm gap-3">
                            <div className="min-w-0">
                              <p className="text-gray-800 dark:text-gray-200 truncate">{l.producto?.nombreProducto ?? l.descripcion}</p>
                              {l.producto?.sku && <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">{l.producto.sku}</p>}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">×{l.cantidad} · {formatPrice(l.subtotal ?? l.cantidad * l.precioUnitario)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Envío / seguimiento */}
                    {envio && (
                      <div className="flex items-start gap-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl p-3">
                        <Truck size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_ENVIO_COLORS[envio.estado as EstadoEnvio]}`}>
                              {ESTADO_ENVIO_LABELS[envio.estado as EstadoEnvio]}
                            </span>
                            {envio.paqueteria && <span className="text-xs text-gray-500 dark:text-gray-400">{PAQUETERIA_LABELS[envio.paqueteria as PaqueteriaEnvio]}</span>}
                          </div>
                          {envio.numero_guia && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">Guía: {envio.numero_guia}</p>}
                        </div>
                      </div>
                    )}

                    {/* Comprobante */}
                    {v.comprobantePago && (
                      <a href={v.comprobantePago.url.startsWith("http") ? v.comprobantePago.url : `${process.env.NEXT_PUBLIC_BACKEND_URL}${v.comprobantePago.url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                        <Receipt size={13} /> Ver comprobante de pago
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
