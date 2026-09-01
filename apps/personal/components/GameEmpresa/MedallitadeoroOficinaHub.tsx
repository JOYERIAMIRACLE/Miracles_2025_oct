"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Home, Landmark, Layers, Building2, GitBranch, ShoppingBag,
  Flag, Users, Globe, DollarSign, ArrowRight, Waypoints,
  ListChecks, Megaphone, Contact, Boxes, FileText, Palette, Link2,
} from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"
import { MedallitadeoroDataMap } from "@/components/GameEmpresa/MedallitadeoroDataMap"

const PORTAL_BASE = "/portal-medallitadeoro"

/* Espejo del sidebar real de portal-medallitadeoro
   (components/Empresa/PortalMDO/PortalMDOSidebar.tsx, const GRUPOS) —
   5 grupos reales, verificados contra el archivo fuente (19-ago-2026:
   ya no existe el grupo "Departamentos" ni las secciones rh/cadena/
   comercial/marketing/administracion — se reorganizó en Operación/
   Recursos/Servicios y apps). */
const SIDEBAR_REAL = [
  {
    titulo: "Inicio",
    items: [
      { label: "Portal home", href: `${PORTAL_BASE}#portal`, icon: Home },
    ],
  },
  {
    titulo: "Conoce a Medallita de oro",
    items: [
      { label: "¿Quiénes somos?", href: `${PORTAL_BASE}#conoce/quienes-somos`, icon: Building2 },
      { label: "Misión",          href: `${PORTAL_BASE}#mision`,               icon: Flag       },
      { label: "Organigrama",     href: `${PORTAL_BASE}#conoce/organigrama`,   icon: GitBranch  },
      { label: "Directorio",      href: `${PORTAL_BASE}#conoce/directorio`,    icon: Users      },
    ],
  },
  {
    titulo: "Operación",
    items: [
      { label: "Tareas",     href: `${PORTAL_BASE}#tareas`,     icon: ListChecks },
      { label: "Campañas",   href: `${PORTAL_BASE}#campanas`,   icon: Megaphone  },
      { label: "Contactos",  href: `${PORTAL_BASE}#contactos`,  icon: Contact    },
      { label: "Ventas",     href: `${PORTAL_BASE}#ventas`,     icon: ShoppingBag },
      { label: "Inventario", href: `${PORTAL_BASE}#inventario`, icon: Boxes      },
      { label: "Finanzas",   href: `${PORTAL_BASE}#finanzas`,   icon: DollarSign },
      { label: "Sitio web",  href: `${PORTAL_BASE}#sitio-web`,  icon: Globe      },
    ],
  },
  {
    titulo: "Recursos",
    items: [
      { label: "Documentos",       href: `${PORTAL_BASE}#documentos`, icon: FileText },
      { label: "Gestión de marca", href: `${PORTAL_BASE}#marca`,      icon: Palette  },
    ],
  },
  {
    titulo: "Servicios y apps",
    items: [
      { label: "Enlaces", href: `${PORTAL_BASE}#enlaces`, icon: Link2 },
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
