"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CheckSquare, FolderKanban, Users, CalendarDays, Wallet,
  TrendingUp, AlertCircle, ChevronRight, Archive, Megaphone,
  FileImage, BookOpen, Globe, Building2, Ticket, LayoutGrid,
} from "lucide-react"
import { useGetTareas }          from "@/api/tarea/getTareas"
import { useGetProyectos }       from "@/api/proyecto/getProyectos"
import { useGetClientesTrabajo } from "@/api/cliente-trabajo/getClientesTrabajo"
import { useGetReuniones }       from "@/api/reunion/getReuniones"
import { useGetPagosTrabajo }    from "@/api/pago-trabajo/getPagosTrabajo"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

const MODULOS = [
  {
    seccion: "Operación",
    items: [
      { label: "Tareas",           desc: "Gestiona y prioriza pendientes",    href: "/trabajo/tareas",              icon: CheckSquare,  color: "blue"    },
      { label: "Campañas",         desc: "Seguimiento de campañas activas",   href: "/trabajo/campanas",            icon: Megaphone,    color: "orange"  },
      { label: "Pagos",            desc: "Registro de cobros y gastos",       href: "/trabajo/pagos",               icon: Wallet,       color: "emerald" },
      { label: "Tickets",          desc: "Incidencias y solicitudes",         href: "/trabajo/tickets",             icon: Ticket,       color: "red"     },
    ],
  },
  {
    seccion: "Proyectos y Clientes",
    items: [
      { label: "Proyectos",        desc: "Control de proyectos activos",      href: "/trabajo/proyectos",           icon: FolderKanban, color: "violet"  },
      { label: "Clientes",         desc: "Directorio de clientes",            href: "/trabajo/clientes",            icon: Users,        color: "cyan"    },
      { label: "Reuniones",        desc: "Agenda y minutas",                  href: "/trabajo/reuniones",           icon: CalendarDays, color: "amber"   },
      { label: "Planeador",        desc: "Planificación de campañas",         href: "/trabajo/campanas-planner",    icon: LayoutGrid,   color: "violet"  },
    ],
  },
  {
    seccion: "Indicadores",
    items: [
      { label: "Ecosistema",       desc: "Métricas del ecosistema marketing", href: "/trabajo/mkt/ecosistema",      icon: TrendingUp,   color: "orange"  },
    ],
  },
  {
    seccion: "Inventario",
    items: [
      { label: "Material Físico",  desc: "Control de inventario físico",      href: "/trabajo/inventario",          icon: Archive,      color: "amber"   },
      { label: "Material Digital", desc: "Activos digitales y creativos",     href: "/trabajo/mkt/inventario-digital", icon: FileImage, color: "cyan"    },
    ],
  },
  {
    seccion: "Equipo",
    items: [
      { label: "Roles",            desc: "Estructura y responsabilidades",    href: "/trabajo/mkt/roles",           icon: Users,        color: "violet"  },
      { label: "Tutoriales",       desc: "Guías y procesos del equipo",       href: "/trabajo/mkt/tutoriales",      icon: BookOpen,     color: "blue"    },
    ],
  },
  {
    seccion: "Web y Organización",
    items: [
      { label: "Sitio Web",        desc: "Gestión del sitio web",             href: "/trabajo/sitio-web",           icon: Globe,        color: "emerald" },
      { label: "Portal SDI",       desc: "Intranet y recursos internos",      href: "/trabajo/portal",              icon: Building2,    color: "orange"  },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/10",    icon: "text-blue-400",    border: "border-blue-500/20",    dot: "bg-blue-400"    },
  violet:  { bg: "bg-violet-500/10",  icon: "text-violet-400",  border: "border-violet-500/20",  dot: "bg-violet-400"  },
  cyan:    { bg: "bg-cyan-500/10",    icon: "text-cyan-400",    border: "border-cyan-500/20",    dot: "bg-cyan-400"    },
  amber:   { bg: "bg-amber-500/10",   icon: "text-amber-400",   border: "border-amber-500/20",   dot: "bg-amber-400"   },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  red:     { bg: "bg-red-500/10",     icon: "text-red-400",     border: "border-red-500/20",     dot: "bg-red-400"     },
  orange:  { bg: "bg-orange-500/10",  icon: "text-orange-400",  border: "border-orange-500/20",  dot: "bg-orange-400"  },
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
    const reunionesHoy      = reuniones.filter(r => r.fecha.slice(0, 10) === hoy).length
    const cobroPendiente    = pagos.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0)
    const vencidas          = tareas.filter(t =>
      t.estado !== "completada" && t.fechaVencimiento && t.fechaVencimiento < hoy
    ).length
    return { tareasPendientes, tareasEnProgreso, proyectosActivos, clientesActivos, reunionesHoy, cobroPendiente, vencidas }
  }, [tareas, proyectos, clientes, reuniones, pagos, hoy])

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Banner SDI */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900"
      >
        {/* Decoración naranja */}
        <div className="absolute right-0 top-0 h-full w-64 pointer-events-none bg-[linear-gradient(135deg,transparent_40%,rgba(237,128,0,0.08)_100%)]" />
        <div className="absolute bottom-0 right-8 w-32 h-32 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(237,128,0,0.13)_0%,transparent_70%)]" />

        <div className="relative p-6 flex items-center gap-5">
          <div className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/30 bg-linear-to-br from-[#c46800] to-[#ED8000]">
            <span className="text-white font-black text-lg">SDI</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-100 tracking-tight">Soporte Dinámico Industrial</h1>
            <p className="text-sm text-slate-400 mt-0.5">Hub de gestión · Marketing team</p>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-black text-slate-100">{stats.tareasPendientes}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">pendientes</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-2xl font-black text-slate-100">{stats.proyectosActivos}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">proyectos</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-2xl font-black text-[#ED8000]">{fmt(stats.cobroPendiente)}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">por cobrar</p>
            </div>
          </div>
        </div>

        {/* Alertas rápidas */}
        {(stats.vencidas > 0 || stats.reunionesHoy > 0) && (
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            {stats.vencidas > 0 && (
              <Link href="/trabajo/tareas">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium hover:bg-red-500/15 transition-colors">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {stats.vencidas} tarea{stats.vencidas > 1 ? "s" : ""} vencida{stats.vencidas > 1 ? "s" : ""}
                </span>
              </Link>
            )}
            {stats.reunionesHoy > 0 && (
              <Link href="/trabajo/reuniones">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium hover:bg-amber-500/15 transition-colors">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {stats.reunionesHoy} reunión{stats.reunionesHoy > 1 ? "es" : ""} hoy
                </span>
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* Módulos por sección */}
      <div className="space-y-6">
        {MODULOS.map(({ seccion, items }, si) => (
          <motion.div key={seccion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + si * 0.06 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{seccion}</p>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {items.map(({ label, desc, href, icon: Icon, color }) => {
                const c = COLOR_MAP[color] ?? COLOR_MAP.blue
                return (
                  <Link key={href} href={href}>
                    <div className="group h-full p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-slate-600/60 backdrop-blur-sm transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${c.bg} ${c.border}`}>
                          <Icon className={`h-4 w-4 ${c.icon}`} />
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-500 transition-colors mt-1" />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  )
}
