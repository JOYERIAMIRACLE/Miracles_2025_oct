"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { GRUPOS, DEPT_ICONS } from "./PortalMDOSidebar"
import { HeroCarusel } from "./HeroCarusel"
import { PortalGlobe } from "./PortalGlobe"
import { ActiveUsersCard } from "./ActiveUsersCard"
import { GestionAvisosModal } from "./GestionAvisosModal"
import { useGetAvisos } from "@/api/aviso/getAvisos"

const ACCESOS_KEY = "mdo_portal_accesos"
const ACCESOS_CONFIGURED_KEY = "mdo_portal_accesos_configured"
const DEFAULT_ACCESOS = ["quienes-somos", "crm", "ventas", "finanzas"]

// Datos de ejemplo — mismo mockup decorativo que trae SDI Portal (no está
// conectado a ventas/proyectos reales de medallitadeoro todavía).
const CHART_BARS = [
  { mes:"Feb",real:12, budget:20 },{ mes:"Mar",real:18, budget:20 },
  { mes:"Abr",real:15, budget:20 },{ mes:"May",real:24, budget:20 },
  { mes:"Jun",real:19, budget:20 },{ mes:"Jul",real:22, budget:20 },
  { mes:"Ago",real:17, budget:20 },
]
const MAX_BAR = 30

interface Acceso { id: string; label: string; icon: typeof DEPT_ICONS[string]; onClick: () => void }

function useStaticAccesos(onNavigate: (id: string, tab?: string) => void): { grupo: string; items: Acceso[] }[] {
  const conoce     = GRUPOS.find(g => g.id === "conoce")!
  const operacion  = GRUPOS.find(g => g.id === "operacion")!
  const recursos   = GRUPOS.find(g => g.id === "recursos")!
  const servicios  = GRUPOS.find(g => g.id === "servicios")!
  return [
    {
      grupo: conoce.label,
      items: conoce.items.map(it => ({
        id: it.id, label: it.label, icon: it.icon,
        onClick: () => (it.ownSection ?? conoce.itemsAreOwnSection) ? onNavigate(it.id) : onNavigate("conoce", it.id),
      })),
    },
    {
      grupo: operacion.label,
      items: operacion.items.map(it => ({ id: it.id, label: it.label, icon: it.icon, onClick: () => onNavigate(it.id) })),
    },
    {
      grupo: recursos.label,
      items: recursos.items.map(it => ({ id: it.id, label: it.label, icon: it.icon, onClick: () => onNavigate(it.id) })),
    },
    {
      grupo: servicios.label,
      items: servicios.items.map(it => ({ id: it.id, label: it.label, icon: it.icon, onClick: () => onNavigate(it.id) })),
    },
  ]
}

export function SeccionPortalHome({ onNavigate }: { onNavigate: (id: string, tab?: string) => void }) {
  const staticAccesos = useStaticAccesos(onNavigate)
  const [seleccion,    setSeleccion]    = useState<Set<string>>(new Set(DEFAULT_ACCESOS))
  const [isConfigured, setIsConfigured] = useState(false)
  const [ready,        setReady]        = useState(false)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [tempSel,      setTempSel]      = useState<Set<string>>(new Set())
  const [gestionOpen,  setGestionOpen]  = useState(false)
  const [dashTab,      setDashTab]      = useState("todo")

  const { avisos, loading: loadingAvisos, reload: reloadAvisos } = useGetAvisos()

  useEffect(() => {
    const saved = localStorage.getItem(ACCESOS_KEY)
    if (saved) try { setSeleccion(new Set(JSON.parse(saved))) } catch {}
    setIsConfigured(!!localStorage.getItem(ACCESOS_CONFIGURED_KEY))
    setReady(true)
  }, [])

  const accesosMostrados = staticAccesos.map(g => ({
    grupo: g.grupo,
    items: g.items.filter(a => seleccion.has(a.id)),
  })).filter(g => g.items.length > 0)

  function abrirModal() {
    setTempSel(new Set(seleccion))
    setModalOpen(true)
  }
  function guardar() {
    setSeleccion(new Set(tempSel))
    localStorage.setItem(ACCESOS_KEY, JSON.stringify([...tempSel]))
    localStorage.setItem(ACCESOS_CONFIGURED_KEY, "1")
    setIsConfigured(true)
    setModalOpen(false)
  }
  function toggleTempSel(id: string) {
    setTempSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
        <HeroCarusel avisos={avisos} loading={loadingAvisos} isAdmin onGestionar={() => setGestionOpen(true)} />
        <div className="hidden xl:block relative min-h-[480px] overflow-hidden rounded-2xl">
          <PortalGlobe />
        </div>
      </div>

      <ActiveUsersCard />

      {gestionOpen && (
        <GestionAvisosModal onClose={() => setGestionOpen(false)} onUpdated={reloadAvisos} />
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Accesos rápidos</h2>
          <button type="button" onClick={abrirModal}
            className={`text-xs font-semibold transition-colors text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 ${!isConfigured ? "animate-pulse" : ""}`}>
            Personalizar
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {!ready
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)
            : accesosMostrados.flatMap(({ items }) => items).map(a => {
                const Icon = a.icon
                return (
                  <button key={a.id} type="button" onClick={a.onClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-left">
                    <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
                  </button>
                )
              })
          }
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personalizar accesos</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Elige qué accesos mostrar en tu inicio</p>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {staticAccesos.map(({ grupo, items }) => (
                <div key={grupo}>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{grupo}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map(a => {
                      const sel = tempSel.has(a.id)
                      const MIcon = a.icon
                      return (
                        <button key={a.id} type="button" onClick={() => toggleTempSel(a.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${sel ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300"}`}>
                          <MIcon className={`h-4 w-4 shrink-0 ${sel ? "text-violet-500" : "text-slate-400"}`} />
                          <span className={`text-xs font-semibold flex-1 min-w-0 truncate ${sel ? "text-violet-700 dark:text-violet-400" : "text-slate-600 dark:text-slate-300"}`}>{a.label}</span>
                          <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${sel ? "border-violet-500 bg-violet-500" : "border-slate-300 dark:border-slate-600"}`}>
                            {sel && <span className="text-white text-[8px] font-black">✓</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setTempSel(new Set(staticAccesos.flatMap(g => g.items.map(a => a.id))))}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline underline-offset-2">
                Seleccionar todos
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={guardar}
                  className="px-4 py-2 text-sm rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DASHBOARD — visual de ejemplo, sin conectar a datos reales todavía ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">Datos de ejemplo</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-300 dark:border-slate-700">
            {[["todo","Seleccionar todo"],["productos","Productos"],["proyectos","Proyectos"],["servicios","Servicios"]].map(([id,lbl]) => (
              <button key={id} type="button" onClick={() => setDashTab(id)}
                className={["px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap", dashTab === id ? "border-b-2 border-violet-500 text-violet-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"].join(" ")}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(dashTab === "todo" || dashTab === "productos")  && <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Piezas vendidas</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">—</p></div>}
              {(dashTab === "todo" || dashTab === "proyectos") && <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pedidos activos</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">—</p></div>}
              {(dashTab === "todo" || dashTab === "servicios") && <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ingresos</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">—</p></div>}
            </div>
            <div className="flex gap-5 items-end">
              <div className="flex-1">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Real vs Presupuesto (ejemplo)</div>
                <div className="flex items-end gap-1 h-28">
                  {CHART_BARS.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end gap-0.5" style={{ height: "96px" }}>
                        <div className="flex-1 bg-violet-400 rounded-t-sm" style={{ height: `${(b.real / MAX_BAR) * 96}px` }} />
                        <div className="flex-1 border-t-2 border-violet-400 bg-violet-100/30 dark:bg-violet-900/20" style={{ height: `${(b.budget / MAX_BAR) * 96}px` }} />
                      </div>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 truncate">{b.mes}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400 shrink-0" />Real</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400 shrink-0" />Presupuesto</span>
                </div>
              </div>
              <div className="shrink-0 text-center w-36">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">VS Objetivo</div>
                <div className="relative inline-flex items-center justify-center">
                  <svg viewBox="0 0 100 60" className="w-32 h-20">
                    <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-slate-200 dark:text-slate-700" />
                    <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray="125.6" strokeDashoffset={`${125.6 * (1 - 0.5)}`} />
                  </svg>
                  <div className="absolute bottom-0 inset-x-0 text-center">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">—</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">—</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Sin datos todavía</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
