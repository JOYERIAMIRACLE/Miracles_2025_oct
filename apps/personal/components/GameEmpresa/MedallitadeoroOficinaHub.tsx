"use client"

import Link from "next/link"
import { useState } from "react"
import {
  BarChart3, Activity, Globe2, Target, CheckSquare, HardDrive, Globe,
  Megaphone, BookOpen, Tv, Palette, Users, UserSearch, UserCheck, FileText,
  ShoppingBag, History, LayoutList, Package, ShoppingCart, Store, Truck,
  TrendingUp, Receipt, PieChart, CreditCard, CalendarDays, UserCog,
  ShieldCheck, ArrowRight, Gamepad2, Building2, Waypoints,
} from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"
import { MedallitadeoroDataMap } from "@/components/GameEmpresa/MedallitadeoroDataMap"

/**
 * Espejo del sidebar real de gestión-empresa (components/Empresa/EmpresaSidebar.tsx)
 * — mismo orden, mismas 7 salas, mismos íconos. Administración está marcada
 * "pendiente": son escritorios vacíos de verdad ("En desarrollo"), no un link roto.
 */
const SIDEBAR_REAL = [
  {
    titulo: "Indicadores",
    items: [
      { label: "Financieros", href: "/gestion-empresa/indicadores/financieros", icon: BarChart3 },
      { label: "Operativos",  href: "/gestion-empresa/indicadores/operativos",  icon: Activity   },
      { label: "Ecosistema",  href: "/gestion-empresa/indicadores/ecosistema",  icon: Globe2     },
    ],
  },
  {
    titulo: "Gestión General",
    items: [
      { label: "Identidad",        href: "/gestion-empresa/general/identidad",       icon: Target     },
      { label: "Tareas",           href: "/gestion-empresa/general/tareas",          icon: CheckSquare },
      { label: "Material digital", href: "/gestion-empresa/general/material-digital",icon: HardDrive  },
    ],
  },
  {
    titulo: "Marketing",
    items: [
      { label: "Sitio web",     href: "/gestion-empresa/marketing/sitio-web",    icon: Globe     },
      { label: "Campañas SEO",  href: "/gestion-empresa/marketing/campanas",     icon: Megaphone },
      { label: "Blog",          href: "/gestion-empresa/marketing/blog",         icon: BookOpen  },
      { label: "Anuncios",      href: "/gestion-empresa/marketing/anuncios",     icon: Tv        },
      { label: "Merch",         href: "/gestion-empresa/marketing/promocionales",icon: Palette   },
    ],
  },
  {
    titulo: "Ventas",
    items: [
      { label: "Pipeline",     href: "/gestion-empresa/ventas/pipeline",     icon: Users      },
      { label: "Leads",        href: "/gestion-empresa/ventas/leads",        icon: UserSearch },
      { label: "Contactos",    href: "/gestion-empresa/ventas/clientes",     icon: UserCheck  },
      { label: "Cotizaciones", href: "/gestion-empresa/ventas/cotizaciones", icon: FileText   },
      { label: "Pedidos",      href: "/gestion-empresa/ventas/pedidos",      icon: ShoppingBag },
      { label: "Historial",    href: "/gestion-empresa/ventas/historial",    icon: History    },
    ],
  },
  {
    titulo: "Suministro",
    items: [
      { label: "Catálogo de productos", href: "/gestion-empresa/suministro/catalogo",    icon: LayoutList   },
      { label: "Inventario",            href: "/gestion-empresa/almacen/inventario",     icon: Package      },
      { label: "Compras",               href: "/gestion-empresa/suministro/compras",     icon: ShoppingCart },
      { label: "Proveedores",           href: "/gestion-empresa/suministro/proveedores", icon: Store        },
      { label: "Envíos",                href: "/gestion-empresa/suministro/envios",      icon: Truck        },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { label: "Resumen",            href: "/gestion-empresa/finanzas",             icon: BarChart3   },
      { label: "Ingresos",           href: "/gestion-empresa/finanzas/ingresos",     icon: TrendingUp  },
      { label: "Gastos",             href: "/gestion-empresa/finanzas/gastos",       icon: Receipt     },
      { label: "Presupuestos",       href: "/gestion-empresa/finanzas/presupuestos",icon: PieChart    },
      { label: "Cuentas",            href: "/gestion-empresa/finanzas/cuentas",      icon: CreditCard  },
      { label: "Calendario de pagos",href: "/gestion-empresa/finanzas/calendario",   icon: CalendarDays },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { label: "Personas", href: "/gestion-empresa/admin/personas", icon: UserCog,      pendiente: true },
      { label: "Roles",    href: "/gestion-empresa/admin/roles",    icon: ShieldCheck,  pendiente: true },
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
        icon={Building2}
        titulo="Oficina — Medallitadeoro"
        descripcion="Espejo del sidebar real de gestión-empresa: mismo orden, mismas 7 salas. Cada acceso te lleva a la página de verdad — sales del mapa al entrar."
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
                {"pendiente" in item && item.pendiente && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/25 text-amber-500/70 bg-amber-500/5 shrink-0">
                    pendiente
                  </span>
                )}
                <ArrowRight size={13} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <Link
        href="/empresa-rpg"
        className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-violet-400 hover:border-violet-500/40 text-xs font-medium transition-colors"
      >
        <Gamepad2 size={14} /> Ver el mapa jugable detallado (estilo Miracles)
      </Link>
      </>
      )}
    </div>
  )
}
