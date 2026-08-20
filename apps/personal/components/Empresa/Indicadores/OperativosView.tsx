"use client"

import { useMemo } from "react"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { useGetTareas } from "@/api/tarea/getTareas"
import { FUNNEL_ETAPAS, FUNNEL_COLOR, FunnelEtapa } from "@/types/clienteEmpresa"
import { cn } from "@/lib/utils"
import { Users, CheckSquare, Clock, AlertCircle, ArrowRight } from "lucide-react"

export function OperativosView() {
  const { clientes, loading: lc } = useGetClientes()
  const { tareas,   loading: lt } = useGetTareas("empresa")

  const pipeline = useMemo(() => {
    const activos = clientes.filter(c => c.Estado !== "Inactivo")
    const conteo: Record<FunnelEtapa, number> = { Lead: 0, Oferta: 0, Pedido: 0, Entrega: 0, Rechazada: 0 }
    for (const c of activos) {
      if (c.Funnel) conteo[c.Funnel] = (conteo[c.Funnel] ?? 0) + 1
    }
    const total    = activos.length
    const cerrados = conteo["Entrega"]
    const tasa     = total > 0 ? Math.round((cerrados / total) * 100) : 0
    return { conteo, total, cerrados, tasa }
  }, [clientes])

  const tareaStats = useMemo(() => {
    const pendientes  = tareas.filter(t => t.estado === "sin_iniciar" || t.estado === "en_pausa").length
    const enProgreso  = tareas.filter(t => t.estado === "en_progreso").length
    const completadas = tareas.filter(t => t.estado === "completada").length
    const urgentes    = tareas.filter(t => t.prioridad === "urgente" && t.estado !== "completada").length
    return { pendientes, enProgreso, completadas, urgentes, total: tareas.length }
  }, [tareas])

  const loading = lc || lt

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Indicadores Operativos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pipeline de ventas y estado de tareas</p>
      </div>

      {/* Pipeline funnel */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Pipeline de clientes
          </h2>
          <span className="text-xs text-slate-500">{pipeline.total} activos</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-600 text-center py-4">Cargando…</p>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {FUNNEL_ETAPAS.map((etapa, i) => {
                const count  = pipeline.conteo[etapa]
                const pct    = pipeline.total > 0 ? Math.round((count / pipeline.total) * 100) : 0
                return (
                  <div key={etapa} className="flex items-center gap-1 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "rounded-lg border px-3 py-3 text-center",
                        FUNNEL_COLOR[etapa]
                      )}>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[10px] font-medium truncate">{etapa}</p>
                        <p className="text-[10px] opacity-60">{pct}%</p>
                      </div>
                    </div>
                    {i < FUNNEL_ETAPAS.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{pipeline.tasa}%</p>
                <p className="text-[11px] text-slate-600">Tasa de conversión</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <p className="text-xs text-slate-500">
                {pipeline.cerrados} clientes llegaron a Entrega de {pipeline.total} activos en el pipeline
              </p>
            </div>
          </>
        )}
      </section>

      {/* Tareas */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-sky-400" />
          Tareas empresa
        </h2>

        {loading ? (
          <p className="text-xs text-slate-600 text-center py-4">Cargando…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TareaKpi label="Pendientes"   value={tareaStats.pendientes}  color="slate" icon={Clock} />
            <TareaKpi label="En progreso"  value={tareaStats.enProgreso}  color="amber" icon={Clock} />
            <TareaKpi label="Completadas"  value={tareaStats.completadas} color="emerald" icon={CheckSquare} />
            <TareaKpi label="Urgentes"     value={tareaStats.urgentes}    color="rose" icon={AlertCircle} />
          </div>
        )}

        {!loading && tareaStats.total === 0 && (
          <p className="text-xs text-slate-600 text-center py-2">
            No hay tareas de empresa registradas
          </p>
        )}
      </section>

      {/* Clientes recientes */}
      {!loading && clientes.length > 0 && (
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Clientes recientes en pipeline</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {clientes
              .filter(c => c.Estado !== "Inactivo")
              .slice(0, 6)
              .map(c => (
                <div key={c.documentId} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{c.nombre}</p>
                    <p className="text-[11px] text-slate-600">{c.segmento ?? "Sin segmento"}</p>
                  </div>
                  {c.Funnel && (
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      FUNNEL_COLOR[c.Funnel]
                    )}>
                      {c.Funnel}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TareaKpi({
  label, value, color, icon: Icon,
}: {
  label: string; value: number; color: string; icon: typeof Clock
}) {
  const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    slate:   { bg: "bg-slate-500/10",   text: "text-slate-300",   border: "border-slate-500/20",   icon: "text-slate-400" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-300",   border: "border-amber-500/20",   icon: "text-amber-400" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", icon: "text-emerald-400" },
    rose:    { bg: "bg-rose-500/10",    text: "text-rose-300",    border: "border-rose-500/20",    icon: "text-rose-400" },
  }
  const c = colors[color] ?? colors.slate

  return (
    <div className={cn("rounded-xl border p-3 space-y-1.5", c.bg, c.border)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", c.icon)} />
      </div>
      <p className={cn("text-2xl font-bold", c.text)}>{value}</p>
    </div>
  )
}
