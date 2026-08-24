"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { GRUPOS, DEPT_ICONS } from "./PortalMDOSidebar"
import { HeroCarusel } from "./HeroCarusel"
import { PortalGlobe } from "./PortalGlobe"
import { ActiveUsersCard } from "./ActiveUsersCard"
import { HistorialCambiosCard } from "./HistorialCambiosCard"
import { CalendarioPendientesCard } from "./CalendarioPendientesCard"
import { GestionAvisosModal } from "./GestionAvisosModal"
import { useGetAvisos } from "@/api/aviso/getAvisos"

const ACCESOS_KEY = "mdo_portal_accesos"
const ACCESOS_CONFIGURED_KEY = "mdo_portal_accesos_configured"
const DEFAULT_ACCESOS = ["quienes-somos", "crm", "ventas", "finanzas"]

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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 items-stretch">
        <div className="flex flex-col gap-1.5">
          <HeroCarusel avisos={avisos} loading={loadingAvisos} isAdmin onGestionar={() => setGestionOpen(true)} />
          <ActiveUsersCard />
        </div>
        <div className="hidden xl:block relative w-full max-w-[640px] mx-auto min-h-[560px] overflow-hidden rounded-2xl">
          <PortalGlobe />
          <a
            href="https://medallitadeoro.com.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 inset-x-0 text-center text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            medallitadeoro.com.mx
          </a>
        </div>
      </div>

      {gestionOpen && (
        <GestionAvisosModal onClose={() => setGestionOpen(false)} onUpdated={reloadAvisos} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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

        <CalendarioPendientesCard />
      </div>

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

      <HistorialCambiosCard />
    </div>
  )
}
