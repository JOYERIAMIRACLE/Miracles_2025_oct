"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutGrid, X,
  User, Building2, ShoppingBag, Briefcase, FileText, Dumbbell,
} from "lucide-react"

type AppStatus = "active" | "coming"

interface AppEntry {
  name: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  status: AppStatus
}

const APPS: AppEntry[] = [
  {
    name: "Personal",
    description: "Finanzas · Salud · Metas",
    icon: User,
    href: "/gestion-personal",
    color: "cyan",
    status: "active",
  },
  {
    name: "Empresa",
    description: "Admin · Ventas · Finanzas",
    icon: Building2,
    href: "/gestion-empresa",
    color: "violet",
    status: "active",
  },
  {
    name: "Tienda",
    description: "Joyería Miracles",
    icon: ShoppingBag,
    href: "/",
    color: "amber",
    status: "active",
  },
  {
    name: "Trabajo",
    description: "Tareas · Clientes · Proyectos",
    icon: Briefcase,
    href: "/trabajo",
    color: "blue",
    status: "active",
  },
  {
    name: "Gym & Salud",
    description: "Rutinas · Métricas · Progreso",
    icon: Dumbbell,
    href: "/gestion-personal/salud/gym",
    color: "green",
    status: "active",
  },
  {
    name: "Blog",
    description: "Artículos y contenido",
    icon: FileText,
    href: "#",
    color: "pink",
    status: "coming",
  },
]

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string; glow: string }> = {
  cyan:   { icon: "text-cyan-400",    bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   glow: "shadow-cyan-500/20"   },
  violet: { icon: "text-violet-400",  bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "shadow-violet-500/20" },
  amber:  { icon: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/30",  glow: "shadow-amber-500/20"  },
  blue:   { icon: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/30",   glow: "shadow-blue-500/20"   },
  green:  { icon: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/30",glow: "shadow-emerald-500/20"},
  pink:   { icon: "text-pink-400",    bg: "bg-pink-500/10",   border: "border-pink-500/30",   glow: "shadow-pink-500/20"   },
}

function AppCard({ app, onClose }: { app: AppEntry; onClose: () => void }) {
  const c = COLOR_MAP[app.color]
  const isActive = app.status === "active"

  const inner = (
    <motion.div
      whileHover={isActive ? { scale: 1.04 } : {}}
      whileTap={isActive ? { scale: 0.97 } : {}}
      className={[
        "flex flex-col items-center gap-3 p-5 rounded-2xl border backdrop-blur-sm transition-all duration-200",
        "bg-slate-900/70",
        isActive
          ? `${c.border} cursor-pointer hover:bg-slate-800/80 hover:shadow-lg hover:${c.glow}`
          : "border-slate-800/50 opacity-40 cursor-not-allowed",
      ].join(" ")}
    >
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${c.bg} ${c.border}`}>
        <app.icon className={`h-7 w-7 ${c.icon}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-100">{app.name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{app.description}</p>
        {!isActive && (
          <span className="inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
            Próximamente
          </span>
        )}
      </div>
    </motion.div>
  )

  if (!isActive) return inner

  return (
    <Link href={app.href} onClick={onClose}>
      {inner}
    </Link>
  )
}

export function AppLauncher() {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, close])

  return (
    <>
      <button
        type="button"
        aria-label="Abrir lanzador de apps"
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-18 left-1/2 -translate-x-1/2 z-101 w-full max-w-lg px-4"
            >
              <div className="rounded-2xl bg-slate-950/95 border border-slate-700/60 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Apps</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={close}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Grid */}
                <div className="p-5 grid grid-cols-3 gap-3">
                  {APPS.map((app) => (
                    <AppCard key={app.name} app={app} onClose={close} />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
