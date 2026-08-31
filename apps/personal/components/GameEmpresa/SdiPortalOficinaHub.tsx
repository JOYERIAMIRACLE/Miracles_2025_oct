"use client"

import {
  KeyRound, Home, Building2, GitBranch, Users, Flag, Globe, FolderOpen,
  Palette, HardHat, Megaphone, Calendar, ClipboardList,
  Ticket, Lock, Database, Monitor, ListTodo, CalendarClock, Receipt,
  BarChart3, ExternalLink, Link2, MessageSquare, Package, BookOpen, Settings2,
} from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"

const SDI_BASE = "https://sdi-portal.pages.dev"

/**
 * Espejo del sidebar real de SDI Portal (components/Trabajo/PortalSDIView.tsx,
 * const GRUPOS) — verificado directo contra el archivo fuente (19-ago-2026):
 * el sidebar se aplanó, ya no hay grupo "Departamentos" con RH/Cadena/
 * Comercial/Marketing/Administración/Seguridad/TI — esos 7 hubs siguen
 * existiendo como componentes (SeccionRH, SeccionComercial, etc.) pero ya
 * no tienen entrada en el nav, solo son alcanzables por hash directo.
 * Los 3 de Servicios marcados "pendiente" abren su página real, que hoy
 * solo muestra un placeholder — no es un link roto, es el estado real.
 */
const SIDEBAR_REAL = [
  {
    titulo: "Inicio",
    items: [
      { label: "Portal home", href: `${SDI_BASE}/portal#portal-home`, icon: Home },
    ],
  },
  {
    titulo: "Conoce a SDI",
    items: [
      { label: "¿Quiénes somos?", href: `${SDI_BASE}/portal#quienes-somos`, icon: Building2 },
      { label: "Misión",          href: `${SDI_BASE}/portal#mision`,        icon: Flag      },
      { label: "Organigrama",     href: `${SDI_BASE}/portal#organigrama`,   icon: GitBranch },
      { label: "Directorio",      href: `${SDI_BASE}/portal#directorio`,    icon: Users     },
    ],
  },
  {
    titulo: "Recursos",
    items: [
      { label: "Documentos",           href: `${SDI_BASE}/portal#documentos`,          icon: FolderOpen },
      { label: "Galería de identidad", href: `${SDI_BASE}/portal#galeria-identidad`,   icon: Palette    },
      { label: "Archivos Ingeniería",  href: `${SDI_BASE}/portal#archivos-ingenieria`, icon: HardHat    },
    ],
  },
  {
    titulo: "Servicios",
    items: [
      { label: "Tickets",      href: `${SDI_BASE}/portal#tickets`,      icon: Ticket,        pendiente: true },
      { label: "Evaluaciones", href: `${SDI_BASE}/portal#evaluaciones`, icon: ClipboardList, pendiente: true },
      { label: "Vacaciones",   href: `${SDI_BASE}/portal#vacaciones`,   icon: Calendar,      pendiente: true },
    ],
  },
  {
    titulo: "Aplicaciones",
    items: [
      { label: "VPN Corporativa",       href: `${SDI_BASE}/portal#vpn`,          icon: Lock     },
      { label: "Odoo",                  href: `${SDI_BASE}/portal#odoo`,         icon: Monitor  },
      { label: "Intranet",              href: `${SDI_BASE}/portal#intranet`,     icon: Globe    },
      { label: "Repositorio de datos",  href: `${SDI_BASE}/portal#repositorios`, icon: Database },
      { label: "Portal de Marketing",   href: `${SDI_BASE}/marketing`,           icon: Megaphone },
    ],
  },
]

/* App aparte de sidebar propio (components/Trabajo/TrabajoSidebar.tsx), en
   /marketing — el módulo con datos reales más maduro de todo sdi-portal.
   Se agregan aquí las rutas confirmadas contra el sidebar real; quedan
   fuera "Roles" (huérfana, sin entrada en el nav) y "Tickets" (colección
   `ticket` con vista hecha pero sin page.tsx — código muerto hoy). */
const TEAM_MARKETING = [
  { label: "Tareas",              href: `${SDI_BASE}/marketing/tareas`,          icon: ListTodo      },
  { label: "Campañas",            href: `${SDI_BASE}/marketing/campanas`,        icon: CalendarClock },
  { label: "Registro de gastos",  href: `${SDI_BASE}/marketing/pagos`,           icon: Receipt       },
  { label: "Sitio web",           href: `${SDI_BASE}/marketing/sitio-web`,       icon: Globe         },
  { label: "Tutorial de procesos",href: `${SDI_BASE}/marketing/mkt/tutoriales`,  icon: BookOpen      },
  { label: "Ecosistema",          href: `${SDI_BASE}/marketing/mkt/ecosistema`,  icon: BarChart3     },
  { label: "Enlaces cortos",      href: `${SDI_BASE}/marketing/enlaces-cortos`,  icon: Link2         },
  { label: "Respuestas rápidas",  href: `${SDI_BASE}/marketing/respuestas`,      icon: MessageSquare },
  { label: "Material físico",     href: `${SDI_BASE}/marketing/inventario`,      icon: Package       },
  { label: "Catálogos",           href: `${SDI_BASE}/marketing/configuracion`,   icon: Settings2     },
]

export function SdiPortalOficinaHub() {
  return (
    <div className="p-5 space-y-6">
      <PortalPurposeHeader
        tipo="oficina"
        icon={Building2}
        titulo="Oficina — SDI Portal"
        descripcion="Espejo del sidebar real de SDI Portal: mismo orden, mismos 5 bloques (Inicio/Conoce a SDI/Recursos/Servicios/Aplicaciones). Otro dominio, otro login — cada acceso abre sdi-portal.pages.dev en pestaña nueva."
      />

      <a
        href={`${SDI_BASE}/login`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-10 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
      >
        <KeyRound size={14} /> Iniciar sesión en SDI Portal
      </a>

      {SIDEBAR_REAL.map(grupo => (
        <div key={grupo.titulo}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2">
            {grupo.titulo}
          </p>
          <div className="space-y-1.5">
            {grupo.items.map(item => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors group"
              >
                <item.icon size={14} className="text-violet-500/70 shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                {"pendiente" in item && item.pendiente && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/25 text-amber-500/70 bg-amber-500/5 shrink-0">
                    pendiente
                  </span>
                )}
                <ExternalLink size={12} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2">
          Team Marketing (aparte del sidebar — el módulo más maduro)
        </p>
        <div className="space-y-1.5">
          {TEAM_MARKETING.map(item => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors group"
            >
              <item.icon size={14} className="text-violet-500/70 shrink-0" />
              <span className="text-sm text-slate-300 flex-1">{item.label}</span>
              <ExternalLink size={12} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
