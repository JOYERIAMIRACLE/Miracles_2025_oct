"use client"

import { useMemo } from "react"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { useGetVentas }   from "@/api/ventaEmpresa/getVentas"
import { FUNNEL_ETAPAS, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa } from "@/types/clienteEmpresa"
import { EstadoVenta, ESTADO_VENTA_COLOR } from "@/types/ventaEmpresa"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtFecha = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })

const ACTIVE_ESTADOS: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]

export function DashboardEmpresaView() {
  const { clientes, loading: lC } = useGetClientes()
  const { ventas,   loading: lV } = useGetVentas()

  const hoy    = new Date()
  const mesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const stats = useMemo(() => {
    const ventasMes     = ventas.filter(v => v.fecha?.startsWith(mesStr))
    const montoMes      = ventasMes.reduce((s, v) => s + (v.monto ?? 0), 0)
    const pedidosActivos = ventas.filter(v => ACTIVE_ESTADOS.includes(v.estado as EstadoVenta))
    const montoActivo   = pedidosActivos.reduce((s, v) => s + (v.monto ?? 0), 0)
    const entregados    = ventas.filter(v => v.estado === "Entregado")

    const funnelCounts = FUNNEL_ETAPAS.reduce((acc, e) => {
      acc[e] = clientes.filter(c => c.Funnel === e).length
      return acc
    }, {} as Record<FunnelEtapa, number>)

    const topProductos = Object.entries(
      ventas.reduce((acc, v) => {
        const nombre = v.producto?.nombreProducto ?? "Sin producto"
        acc[nombre] = (acc[nombre] ?? 0) + (v.monto ?? 0)
        return acc
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const recientes = [...ventas]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 8)

    return { ventasMes, montoMes, pedidosActivos, montoActivo, entregados, funnelCounts, topProductos, recientes }
  }, [clientes, ventas, mesStr])

  const loading = lC || lV

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clientes totales",  value: loading ? "…" : clientes.length,                        color: "text-slate-200" },
          { label: "Ventas este mes",   value: loading ? "…" : stats.ventasMes.length,                  color: "text-violet-400" },
          { label: "Monto del mes",     value: loading ? "…" : fmt(stats.montoMes),                     color: "text-violet-400" },
          { label: "Pedidos en proceso",value: loading ? "…" : stats.pedidosActivos.length,             color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Funnel de clientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Pipeline de Clientes</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-slate-800 animate-pulse" />
            ))}</div>
          ) : (
            <div className="space-y-2">
              {FUNNEL_ETAPAS.map(etapa => {
                const count = stats.funnelCounts[etapa]
                const pct   = clientes.length > 0 ? Math.round((count / clientes.length) * 100) : 0
                return (
                  <div key={etapa} className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${FUNNEL_COLOR[etapa]} w-28 text-center shrink-0`}>
                      {FUNNEL_LABEL[etapa]}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-violet-500/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-4 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Productos por Venta</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-slate-800 animate-pulse" />
            ))}</div>
          ) : stats.topProductos.length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {stats.topProductos.map(([nombre, monto], i) => {
                const max = stats.topProductos[0][1]
                const pct = Math.round((monto / max) * 100)
                return (
                  <div key={nombre} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-600 w-4 tabular-nums">{i + 1}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{nombre}</span>
                    <div className="w-20 bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-violet-500/60" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-violet-400 tabular-nums shrink-0">{fmt(monto)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pedidos activos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Pedidos en Proceso</h2>
            <span className="text-xs text-violet-400 font-semibold">{fmt(stats.montoActivo)}</span>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-800 animate-pulse" />
            ))}</div>
          ) : stats.pedidosActivos.length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">Sin pedidos activos</p>
          ) : (
            <div className="space-y-2">
              {stats.pedidosActivos.slice(0, 6).map(v => (
                <div key={v.documentId} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{v.concepto}</p>
                    <p className="text-[10px] text-slate-600">{v.cliente?.nombre ?? "Sin cliente"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.estado && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>
                        {v.estado}
                      </span>
                    )}
                    <span className="text-xs text-violet-400 font-medium tabular-nums">{fmt(v.monto)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas recientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Ventas Recientes</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-800 animate-pulse" />
            ))}</div>
          ) : stats.recientes.length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {stats.recientes.map(v => (
                <div key={v.documentId} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{v.concepto}</p>
                    <p className="text-[10px] text-slate-600">{v.fecha ? fmtFecha(v.fecha) : "—"} · {v.cliente?.nombre ?? "Sin cliente"}</p>
                  </div>
                  <span className="text-xs text-violet-400 font-semibold tabular-nums shrink-0">{fmt(v.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
