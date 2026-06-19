"use client"
import { useMemo } from "react"
import { useGetVentas }   from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { EstadoVenta }    from "@/types/ventaEmpresa"

const ACTIVE: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]

const ICON: Record<EstadoVenta, string> = {
  Cotizado: "◈", Pagado: "◆", Preparando: "◉", Enviado: "▶", Entregado: "✓", Cancelado: "✗",
}

const COLOR: Record<EstadoVenta, string> = {
  Cotizado:   "text-slate-500",
  Pagado:     "text-blue-400",
  Preparando: "text-amber-400",
  Enviado:    "text-violet-400",
  Entregado:  "text-emerald-400",
  Cancelado:  "text-red-500",
}

export function QuestLog() {
  const { ventas,   loading: lV } = useGetVentas()
  const { clientes, loading: lC } = useGetClientes()

  const quests = useMemo(() =>
    ventas.filter(v => ACTIVE.includes(v.estado as EstadoVenta)).slice(0, 8),
  [ventas])

  const prospectos = useMemo(() =>
    clientes.filter(c => c.Funnel === "Lead" || c.Funnel === "Oferta").length,
  [clientes])

  const loading = lV || lC

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(0,212,255,0.06)" }}>
        <span className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-[0.2em]">◈ Quest Log</span>
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <p className="text-[8px] text-slate-700 uppercase tracking-widest mb-1">Prospectos</p>
        <p className="text-[11px] font-mono">
          <span className="text-amber-400 font-bold">{loading ? "…" : prospectos}</span>
          <span className="text-slate-700 ml-1">en funnel</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-[8px] text-slate-700 uppercase tracking-widest mb-2">Pedidos activos</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <p className="text-[10px] text-slate-700 italic">Sin quests activas</p>
        ) : (
          <div className="space-y-2.5">
            {quests.map(v => (
              <div key={v.documentId} className="flex items-start gap-1.5">
                <span className={`text-[10px] mt-0.5 shrink-0 ${COLOR[v.estado as EstadoVenta]}`}>
                  {ICON[v.estado as EstadoVenta]}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-300 leading-snug truncate">{v.concepto}</p>
                  <p className="text-[9px] text-slate-600 truncate">
                    {v.cliente?.nombre ?? "—"} · ${Math.round(v.monto).toLocaleString("es-MX")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
