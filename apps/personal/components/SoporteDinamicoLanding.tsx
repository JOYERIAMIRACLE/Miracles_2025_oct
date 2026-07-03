"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  CheckSquare, FolderKanban, Users, CalendarDays, Wallet,
  TrendingUp, Archive, Megaphone, FileImage, BookOpen,
  Globe, Building2, Ticket, LayoutGrid, ArrowRight,
} from "lucide-react"

const MODULOS = [
  {
    seccion: "Operación",
    color: "blue",
    items: [
      { label: "Tareas",     desc: "Pendientes y prioridades",      icon: CheckSquare  },
      { label: "Campañas",   desc: "Seguimiento de campañas",       icon: Megaphone    },
      { label: "Pagos",      desc: "Cobros y registro de gastos",   icon: Wallet       },
      { label: "Tickets",    desc: "Incidencias y solicitudes",     icon: Ticket       },
    ],
  },
  {
    seccion: "Proyectos y Clientes",
    color: "violet",
    items: [
      { label: "Proyectos",  desc: "Control de proyectos activos",  icon: FolderKanban },
      { label: "Clientes",   desc: "Directorio de clientes",        icon: Users        },
      { label: "Reuniones",  desc: "Agenda y minutas",              icon: CalendarDays },
      { label: "Planeador",  desc: "Planificación de campañas",     icon: LayoutGrid   },
    ],
  },
  {
    seccion: "Marketing",
    color: "orange",
    items: [
      { label: "Ecosistema",      desc: "Métricas y KPIs",          icon: TrendingUp  },
      { label: "Inventario Dig.", desc: "Activos y creativos",       icon: FileImage   },
      { label: "Tutoriales",      desc: "Guías de procesos",        icon: BookOpen    },
      { label: "Inventario Fís.", desc: "Material físico",          icon: Archive     },
    ],
  },
  {
    seccion: "Web y Organización",
    color: "emerald",
    items: [
      { label: "Sitio Web",  desc: "Gestión del sitio",             icon: Globe       },
      { label: "Portal SDI", desc: "Intranet de recursos",          icon: Building2   },
    ],
  },
]

const ACCENT: Record<string, { border: string; icon: string; dot: string }> = {
  blue:    { border: "border-blue-500/25",    icon: "text-blue-400",    dot: "bg-blue-500"    },
  violet:  { border: "border-violet-500/25",  icon: "text-violet-400",  dot: "bg-violet-500"  },
  orange:  { border: "border-orange-500/25",  icon: "text-orange-400",  dot: "bg-orange-500"  },
  emerald: { border: "border-emerald-500/25", icon: "text-emerald-400", dot: "bg-emerald-500" },
}

export function SoporteDinamicoLanding() {
  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(237,128,0,0.12),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col sm:flex-row items-center gap-10">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="shrink-0"
          >
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl flex items-center justify-center border border-orange-500/30 bg-linear-to-br from-[#c46800] to-[#ED8000] shadow-2xl shadow-orange-500/20">
              <Image src="/logo-3s.png" alt="SDI" width={96} height={96} className="w-16 h-16 sm:w-24 sm:h-24 object-contain" priority />
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0 text-center sm:text-left"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ED8000] mb-3">Hub de gestión</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4">
              Soporte Dinámico<br />
              <span className="text-[#ED8000]">Industrial</span>
            </h1>
            <p className="text-lg text-white/50 mb-8 max-w-md mx-auto sm:mx-0">
              Servir · Solucionar · Simplificar
            </p>
            <Link href="/marketing/portal">
              <button type="button" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 bg-linear-to-br from-[#c46800] to-[#ED8000]">
                Acceder al portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Módulos */}
      <div className="max-w-6xl mx-auto px-6 py-14 space-y-10">
        {MODULOS.map(({ seccion, color, items }, si) => {
          const c = ACCENT[color] ?? ACCENT.blue
          return (
            <motion.div key={seccion}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + si * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{seccion}</p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map(({ label, desc, icon: Icon }) => (
                  <div key={label}
                    className={`p-4 rounded-xl bg-white/3 border ${c.border} hover:bg-white/6 transition-colors`}>
                    <Icon className={`h-5 w-5 mb-3 ${c.icon}`} />
                    <p className="text-sm font-semibold text-white/90">{label}</p>
                    <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/20">Soporte Dinámico Industrial · Plataforma interna</p>
          <Link href="/marketing/portal">
            <span className="text-xs text-[#ED8000] hover:underline font-medium">Ir al portal →</span>
          </Link>
        </div>
      </div>

    </div>
  )
}
