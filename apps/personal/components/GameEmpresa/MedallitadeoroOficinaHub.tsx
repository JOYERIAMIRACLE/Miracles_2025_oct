"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Home, Landmark, Layers, Building2, GitBranch, ShoppingBag,
  Flag, Users, Globe, DollarSign, ArrowRight, Waypoints,
} from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"
import { MedallitadeoroDataMap } from "@/components/GameEmpresa/MedallitadeoroDataMap"

const PORTAL_BASE = "/portal-medallitadeoro"

/* Espejo del sidebar real de portal-medallitadeoro
   (components/Empresa/PortalMDO/PortalMDOSidebar.tsx, const GRUPOS) —
   reemplaza al viejo mirror de gestión-empresa: ahora este portal (clon
   estructural de SDI Portal) es la puerta de entrada real. */
const SIDEBAR_REAL = [
  {
    titulo: "Inicio",
    items: [
      { label: "Portal home", href: `${PORTAL_BASE}#portal`, icon: Home },
    ],
  },
  {
    titulo: "Conoce a Medallitadeoro",
    items: [
      { label: "¿Quiénes somos?", href: `${PORTAL_BASE}#conoce/quienes-somos`, icon: Building2 },
      { label: "Organigrama",     href: `${PORTAL_BASE}#conoce/organigrama`,   icon: GitBranch },
      { label: "Directorio",      href: `${PORTAL_BASE}#conoce/directorio`,    icon: Users     },
    ],
  },
  {
    titulo: "Departamentos",
    items: [
      { label: "Misión",                    href: `${PORTAL_BASE}#mision`,         icon: Flag        },
      { label: "Recursos Humanos",          href: `${PORTAL_BASE}#rh`,             icon: Users       },
      { label: "Cadena de suministro",      href: `${PORTAL_BASE}#cadena`,         icon: Globe       },
      { label: "Comercial",                 href: `${PORTAL_BASE}#comercial`,      icon: ShoppingBag },
      { label: "Marketing",                 href: `${PORTAL_BASE}#marketing`,      icon: GitBranch   },
      { label: "Administración y Finanzas", href: `${PORTAL_BASE}#administracion`, icon: DollarSign  },
    ],
  },
  {
    titulo: "Servicios y aplicaciones",
    items: [
      { label: "Tareas", href: `${PORTAL_BASE}#tareas`, icon: Layers },
    ],
  },
]

const TABS = [
  { id: "accesos", label: "Accesos" },
  { id: "mapa",    label: "Cómo se conecta todo" },
] as const
type TabId = typeof TABS[number]["id"]

export function MedallitadeoroOficinaHub() {
  const [tab, setTab] = useState<TabId>("accesos")

  return (
    <div className="p-5 space-y-6">
      <PortalPurposeHeader
        tipo="oficina"
        icon={Landmark}
        titulo="Oficina — Medallitadeoro"
        descripcion="Espejo del sidebar real de portal-medallitadeoro (el portal de verdad, clon estructural de SDI Portal — ya no gestión-empresa suelto). Cada acceso te lleva a la página real, sales del mapa."
      />

      <div className="flex gap-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
              tab === t.id
                ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.id === "mapa" && <Waypoints size={12} />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mapa" && <MedallitadeoroDataMap />}

      {tab === "accesos" && (
      <>
      {SIDEBAR_REAL.map(grupo => (
        <div key={grupo.titulo}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2">
            {grupo.titulo}
          </p>
          <div className="space-y-1.5">
            {grupo.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors group"
              >
                <item.icon size={14} className="text-violet-500/70 shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                <ArrowRight size={13} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Comercial (Pipeline, Leads, Cotizaciones, Pedidos, Clientes) ya vive aquí de verdad — no son enlaces a gestión-empresa, es el portal quien renderiza las vistas reales.
        </p>
      </div>
      </>
      )}
    </div>
  )
}
