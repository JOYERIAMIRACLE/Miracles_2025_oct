"use client"

import { useState } from "react"
import {
  Home, Landmark, Briefcase, Layers, Building2, GitBranch, ShoppingBag,
  Flag, Users, Globe, DollarSign, Shield, Monitor, ChevronDown, Settings,
} from "lucide-react"
import { PortalMDOConfigModal } from "./PortalMDOConfigModal"

export interface NavGroup {
  id:    string
  label: string
  icon:  typeof Home
  /** Si es true, cada item navega a su PROPIA sección (departamentos/servicios). Si es false, todos los items navegan a `id` (este grupo) con el item como tab. */
  itemsAreOwnSection: boolean
  items: { id: string; label: string; icon: typeof Home }[]
}

export const GRUPOS: NavGroup[] = [
  { id: "portal", label: "Inicio", icon: Home, itemsAreOwnSection: true, items: [] },
  {
    id: "conoce", label: "Conoce a Medallitadeoro", icon: Landmark, itemsAreOwnSection: false,
    items: [
      { id: "quienes-somos", label: "¿Quiénes somos?", icon: Building2 },
      { id: "organigrama",   label: "Organigrama",      icon: GitBranch },
      { id: "directorio",    label: "Directorio",       icon: Users },
    ],
  },
  {
    id: "departamentos", label: "Departamentos", icon: Briefcase, itemsAreOwnSection: true,
    items: [
      { id: "mision",         label: "Misión",                    icon: Flag },
      { id: "rh",              label: "Recursos Humanos",          icon: Users },
      { id: "cadena",          label: "Cadena de suministro",      icon: Globe },
      { id: "comercial",       label: "Comercial",                 icon: ShoppingBag },
      { id: "marketing",       label: "Marketing",                 icon: GitBranch },
      { id: "administracion",  label: "Administración y Finanzas", icon: DollarSign },
      { id: "seguridad",       label: "Seguridad",                 icon: Shield },
      { id: "ti",              label: "TI y Soporte",              icon: Monitor },
    ],
  },
  {
    id: "servicios", label: "Servicios y aplicaciones", icon: Layers, itemsAreOwnSection: true,
    items: [
      { id: "tareas", label: "Tareas", icon: Layers },
    ],
  },
]

export const DEPT_ICONS: Record<string, typeof Home> = {
  mision: Flag, rh: Users, cadena: Globe, comercial: ShoppingBag,
  marketing: GitBranch, administracion: DollarSign, seguridad: Shield, ti: Monitor,
}

interface Props {
  seccion: string
  /** Tab activo dentro de la sección actual (solo relevante para grupos con itemsAreOwnSection=false, ej. "conoce"). */
  tab?: string
  onNavigate: (id: string, tab?: string) => void
}

export function PortalMDOSidebar({ seccion, tab, onNavigate }: Props) {
  const [gruposOpen, setGruposOpen] = useState<Set<string>>(new Set(["departamentos"]))
  const [configOpen, setConfigOpen] = useState(false)

  function toggleGrupo(id: string) {
    setGruposOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
    <aside className="fixed md:sticky left-0 md:left-auto top-14 z-40 w-44 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 shadow-[2px_0_12px_rgba(0,0,0,0.07)] flex flex-col h-[calc(100vh-56px)] self-start overflow-hidden">
      <nav className="flex-1 overflow-y-auto py-1 pt-3 pb-0">
        {GRUPOS.map(grupo => {
          const isOpen       = gruposOpen.has(grupo.id)
          const isPortal     = grupo.id === "portal"
          const isToggleOnly = grupo.id === "departamentos" || grupo.id === "servicios" || grupo.id === "conoce"
          const headerActive = (isPortal && seccion === "portal") || (grupo.id === "conoce" && seccion === "conoce")

          const handleHeaderClick = () => {
            if (isPortal) onNavigate("portal")
            else          toggleGrupo(grupo.id)
          }

          return (
            <div key={grupo.id} className="mb-0.5">
              <div className={`flex items-center pr-2 rounded-r-lg mx-1 ${headerActive ? "bg-violet-50 dark:bg-slate-800" : ""}`}>
                <button type="button" onClick={handleHeaderClick}
                  className={[
                    "flex-1 flex items-center gap-2 text-left px-2.5 py-2 text-xs font-semibold transition-colors rounded-lg",
                    headerActive ? "text-violet-600 dark:text-violet-400" : "text-slate-700 dark:text-slate-300 hover:text-violet-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                  ].join(" ")}>
                  <grupo.icon className="h-4 w-4 shrink-0" />
                  {grupo.label}
                </button>
                {isToggleOnly && (
                  <button type="button" aria-label={isOpen ? "Colapsar" : "Expandir"}
                    onClick={() => toggleGrupo(grupo.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {isToggleOnly && isOpen && (
                <div className="pb-1 mb-1 border-b border-slate-100 dark:border-slate-700 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.06)]">
                  {grupo.items.map(item => {
                    const Icon = item.icon
                    const active = grupo.itemsAreOwnSection ? seccion === item.id : seccion === grupo.id && tab === item.id
                    return (
                      <button key={item.id} type="button"
                        onClick={() => grupo.itemsAreOwnSection ? onNavigate(item.id) : onNavigate(grupo.id, item.id)}
                        className={[
                          "w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all",
                          active
                            ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-slate-800 border-r-2 border-violet-500"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800",
                        ].join(" ")}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={() => setConfigOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">Configuración</span>
        </button>
      </div>
    </aside>
    {configOpen && <PortalMDOConfigModal onClose={() => setConfigOpen(false)} onNavigate={onNavigate} />}
    </>
  )
}
