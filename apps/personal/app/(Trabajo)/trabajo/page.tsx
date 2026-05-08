"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CheckSquare, FolderKanban, Users, CalendarDays, Wallet,
  TrendingUp, Clock, AlertCircle, ChevronRight,
} from "lucide-react"
import { useGetTareas }        from "@/api/tarea/getTareas"
import { useGetProyectos }     from "@/api/proyecto/getProyectos"
import { useGetClientesTrabajo } from "@/api/cliente-trabajo/getClientesTrabajo"
import { useGetReuniones }     from "@/api/reunion/getReuniones"
import { useGetPagosTrabajo }  from "@/api/pago-trabajo/getPagosTrabajo"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

function StatCard({ label, value, sub, icon: Icon, color, href, delay }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; href: string; delay: number
}) {
  const map: Record<string, { bg: string; icon: string; border: string }> = {
    blue:   { bg: "bg-blue-500/10",   icon: "text-blue-400",   border: "border-blue-500/20"   },
    violet: { bg: "bg-violet-500/10", icon: "text-violet-400", border: "border-violet-500/20" },
    cyan:   { bg: "bg-cyan-500/10",   icon: "text-cyan-400",   border: "border-cyan-500/20"   },
    amber:  { bg: "bg-amber-500/10",  icon: "text-amber-400",  border: "border-amber-500/20"  },
    emerald:{ bg: "bg-emerald-500/10",icon: "text-emerald-400",border: "border-emerald-500/20"},
  }
  const c = map[color] ?? map.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link href={href}>
        <div className={`group p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-slate-600/60 backdrop-blur-sm transition-all cursor-pointer`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
              {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center border shrink-0 ${c.bg} ${c.border}`}>
              <Icon className={`h-4 w-4 ${c.icon}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
            <span>Ver detalle</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function TrabajoDashboard() {
  const { tareas }    = useGetTareas("trabajo")
  const { proyectos } = useGetProyectos()
  const { clientes }  = useGetClientesTrabajo()
  const { reuniones } = useGetReuniones()
  const { pagos }     = useGetPagosTrabajo()

  const hoy = new Date().toISOString().slice(0, 10)

  const stats = useMemo(() => {
    const tareasPendientes  = tareas.filter(t => t.estado === "pendiente").length
    const tareasEnProgreso  = tareas.filter(t => t.estado === "en_progreso").length
    const proyectosActivos  = proyectos.filter(p => p.estado === "activo").length
    const clientesActivos   = clientes.filter(c => c.activo).length
    const reunionesProximas = reuniones.filter(r => r.fecha.slice(0, 10) >= hoy).length
    const cobroPendiente    = pagos.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0)
    const cobradoMes        = pagos
      .filter(p => p.estado === "pagado" && p.fecha?.slice(0, 7) === hoy.slice(0, 7))
      .reduce((s, p) => s + p.monto, 0)
    const vencidas = tareas.filter(t =>
      t.estado !== "completada" && t.fechaVencimiento && t.fechaVencimiento < hoy
    ).length

    return { tareasPendientes, tareasEnProgreso, proyectosActivos, clientesActivos, reunionesProximas, cobroPendiente, cobradoMes, vencidas }
  }, [tareas, proyectos, clientes, reuniones, pagos, hoy])

  const tareasUrgentes = tareas
    .filter(t => t.estado !== "completada" && (t.prioridad === "urgente" || t.prioridad === "alta"))
    .slice(0, 5)

  const reunionesProximas = reuniones
    .filter(r => r.fecha.slice(0, 10) >= hoy)
    .slice(0, 3)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-linear-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-700/50 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
            RR
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Espacio de Trabajo</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.tareasEnProgreso} en progreso · {stats.vencidas > 0 ? `${stats.vencidas} vencidas` : "sin vencidas"}
            </p>
          </div>
          {stats.vencidas > 0 && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">{stats.vencidas} vencidas</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Tareas pendientes"   value={stats.tareasPendientes}                    sub={`${stats.tareasEnProgreso} en progreso`} icon={CheckSquare}  color="blue"    href="/trabajo/tareas"    delay={0.05} />
        <StatCard label="Proyectos activos"   value={stats.proyectosActivos}                    sub={`de ${proyectos.length} totales`}        icon={FolderKanban} color="violet"  href="/trabajo/proyectos" delay={0.1}  />
        <StatCard label="Clientes activos"    value={stats.clientesActivos}                                                                   icon={Users}        color="cyan"    href="/trabajo/clientes"  delay={0.15} />
        <StatCard label="Reuniones próximas"  value={stats.reunionesProximas}                                                                 icon={CalendarDays} color="amber"   href="/trabajo/reuniones" delay={0.2}  />
        <StatCard label="Cobro pendiente"     value={fmt(stats.cobroPendiente)}                 sub="por cobrar"                              icon={AlertCircle}  color="amber"   href="/trabajo/pagos"     delay={0.25} />
        <StatCard label="Cobrado este mes"    value={fmt(stats.cobradoMes)}                                                                   icon={TrendingUp}   color="emerald" href="/trabajo/pagos"     delay={0.3}  />
      </div>

      {/* Tareas urgentes + Reuniones próximas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tareas alta prioridad */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alta Prioridad</h2>
            <Link href="/trabajo/tareas" className="text-[10px] text-blue-500 hover:text-blue-400">Ver todas</Link>
          </div>
          {tareasUrgentes.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">Sin tareas urgentes</p>
          ) : (
            <div className="space-y-2">
              {tareasUrgentes.map(t => (
                <div key={t.documentId} className="flex items-start gap-3 py-2 border-b border-slate-800/40 last:border-0">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${t.prioridad === "urgente" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{t.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.proyecto && <span className="text-[10px] text-slate-500">{t.proyecto.nombre}</span>}
                      {t.fechaVencimiento && (
                        <span className={`text-[10px] ${t.fechaVencimiento < hoy ? "text-red-400" : "text-slate-600"}`}>
                          {t.fechaVencimiento < hoy ? "Vencida" : t.fechaVencimiento}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    t.estado === "en_progreso" ? "bg-blue-500/15 text-blue-400" : "bg-slate-800 text-slate-500"
                  }`}>
                    {t.estado === "en_progreso" ? "En progreso" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Próximas reuniones */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Próximas Reuniones</h2>
            <Link href="/trabajo/reuniones" className="text-[10px] text-blue-500 hover:text-blue-400">Ver todas</Link>
          </div>
          {reunionesProximas.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">Sin reuniones próximas</p>
          ) : (
            <div className="space-y-3">
              {reunionesProximas.map(r => {
                const fecha = new Date(r.fecha)
                return (
                  <div key={r.documentId} className="flex items-start gap-3 py-2 border-b border-slate-800/40 last:border-0">
                    <div className="shrink-0 text-center w-10">
                      <p className="text-[10px] text-slate-500 uppercase">{fecha.toLocaleDateString("es-MX", { month: "short" })}</p>
                      <p className="text-base font-bold text-blue-400 leading-none">{fecha.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{r.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {r.clienteTrabajo && <span className="text-[10px] text-slate-500">{r.clienteTrabajo.nombre}</span>}
                        {r.proyecto && <span className="text-[10px] text-slate-600">· {r.proyecto.nombre}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Módulos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Tareas",    icon: CheckSquare,  href: "/trabajo/tareas",    color: "text-blue-400"   },
            { label: "Proyectos", icon: FolderKanban, href: "/trabajo/proyectos", color: "text-violet-400" },
            { label: "Clientes",  icon: Users,        href: "/trabajo/clientes",  color: "text-cyan-400"   },
            { label: "Reuniones", icon: CalendarDays, href: "/trabajo/reuniones", color: "text-amber-400"  },
            { label: "Pagos",     icon: Wallet,       href: "/trabajo/pagos",     color: "text-emerald-400"},
          ].map(({ label, icon: Icon, href, color }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/60 transition-all cursor-pointer">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
