"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { GRUPOS, DEPT_ICONS } from "./PortalMDOSidebar"
import { HeroCarusel } from "./HeroCarusel"
import { DashboardCard } from "./DashboardCard"
import { HistorialCambiosCard } from "./HistorialCambiosCard"
import { HistorialTickerCard } from "./HistorialTickerCard"
import { CalendarioPendientesCard } from "./CalendarioPendientesCard"
import { GestionAvisosModal } from "./GestionAvisosModal"
import { useGetAvisos } from "@/api/aviso/getAvisos"

const ACCESOS_KEY = "mdo_portal_accesos"
const ACCESOS_CONFIGURED_KEY = "mdo_portal_accesos_configured"
const DEFAULT_ACCESOS = ["quienes-somos", "contactos", "ventas", "finanzas"]

// Un color por grupo (igual que Portal SDI) — rota entre estos 6 según el
// índice del grupo, no por elección manual de cada ítem.
const GRUPO_COLORS = ["orange", "blue", "violet", "emerald", "amber", "red"] as const
type GrupoColor = (typeof GRUPO_COLORS)[number]
const ICON_COLOR_CLS: Record<GrupoColor, string> = {
  orange:  "text-orange-500",
  blue:    "text-blue-500",
  violet:  "text-violet-500",
  emerald: "text-emerald-500",
  amber:   "text-amber-500",
  red:     "text-red-500",
}

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
      items: servicios.items.map(it => ({
        id: it.id, label: it.label, icon: it.icon,
        onClick: it.href ? () => window.open(it.href!, "_blank", "noopener,noreferrer") : () => onNavigate(it.id),
      })),
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
  const [historialOpen, setHistorialOpen] = useState(false)
  const filaAccesosRef = useRef<HTMLDivElement>(null)
  const [puedeDesplazar, setPuedeDesplazar] = useState(false)

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

  function chequearDesplazamiento() {
    const el = filaAccesosRef.current
    if (el) setPuedeDesplazar(el.scrollWidth > el.clientWidth + 4)
  }

  useEffect(() => {
    chequearDesplazamiento()
    window.addEventListener("resize", chequearDesplazamiento)
    return () => window.removeEventListener("resize", chequearDesplazamiento)
  }, [ready, seleccion])

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
    <div>
      {/* ─── Contenido: se monta ENCIMA del hero (vive afuera, en page.tsx, ver
          PortalHomeHero.tsx). -mt-28 (sm+, 112px) = pb-16(64) del hero + py-6(24)
          del boxed container de page.tsx que se interpone + solo 24px de overlap
          real hacia adentro de la caja del globo (600px desde sm, responsivo —
          ver PortalGlobe) — así que sobran ~120px libres abajo antes de tocar la
          vitrina: ni el globo ni las etiquetas quedan tapados. -mt-6 (mobile
          <640px, 24px): ahí la caja del globo es más chica (h-80, no 600px) y
          solo necesita un toque de overlap, no la profundidad calculada para
          la versión grande. relative z-10: el hero es position:relative (por
          su glow absolute) y pinta encima de lo no posicionado sin importar
          el orden del DOM — esto le da al contenido su lugar al frente.
          max-w-6xl más angosto que el hero para que el fondo oscuro se asome
          a los lados. ─── */}
      <div className="-mt-6 sm:-mt-28 max-w-6xl mx-auto space-y-5 relative z-10 pointer-events-none">
        {/* pointer-events-none arriba + pointer-events-auto en cada bloque real:
            este contenedor se sube con margen negativo sobre el hero (ver nota
            de arriba) y con z-10 tapa cualquier franja vacía que le sobre hacia
            adentro de la caja del globo — el cálculo en píxeles de cuánto
            overlap es "seguro" es frágil (depende del alto real del header,
            de si hay tarjeta de tráfico, etc.). Con pointer-events-none aquí,
            el mouse atraviesa esa franja vacía y le llega al globo de todos
            modos, sin depender de que el margen esté calculado exacto. */}
        {/* Wrapper de "aire": mismo color de fondo que el layout (page.tsx),
            así que no se ve como una caja — solo da espacio alrededor de
            comunicados/accesos rápidos sin achicar el contenido de esas cards. */}
        <div className="pointer-events-auto bg-[#f8f9fa] dark:bg-[#08091a] p-4 sm:p-6 rounded-sm rounded-tr-3xl">
          <div className="flex flex-col gap-1.5">
            <HeroCarusel avisos={avisos} loading={loadingAvisos} isAdmin onGestionar={() => setGestionOpen(true)} />
            {/* Accesos rápidos — igual que Portal SDI: fila horizontal de tiles
                cuadrados flotantes (no una lista vertical de botones), un
                color distinto por grupo (rotando GRUPO_COLORS, ver arriba) en
                vez de un solo acento — pedido explícito del usuario, aunque
                contradice la regla general de "un solo color" del resto del
                portal. El tile punteado "Agregar/Quitar" es el único punto de
                entrada al modal de personalizar. */}
            <section className="pt-6">
              <div ref={filaAccesosRef} onScroll={chequearDesplazamiento}
                className="flex items-start justify-center gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                <button type="button" onClick={abrirModal} className="flex flex-col items-center gap-2 shrink-0 w-20 group">
                  <div className={`h-20 w-20 rounded-2xl bg-white dark:bg-[#2a1b3d] border-2 border-dashed border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-400 group-hover:border-violet-400 group-hover:text-violet-500 transition-colors ${!isConfigured ? "animate-pulse" : ""}`}>
                    <Plus className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight group-hover:text-violet-500 transition-colors">Agregar/Quitar</span>
                </button>

                {!ready
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-20">
                        <Skeleton className="h-20 w-20 rounded-2xl" />
                        <Skeleton className="h-3 w-14 rounded" />
                      </div>
                    ))
                  : accesosMostrados.flatMap(({ items }) => items).map((a, i) => {
                      const Icon = a.icon
                      const color = GRUPO_COLORS[i % GRUPO_COLORS.length]
                      return (
                        <button key={a.id} type="button" onClick={a.onClick} className="flex flex-col items-center gap-2 shrink-0 w-20 group">
                          <div className="h-20 w-20 rounded-2xl bg-white dark:bg-[#2a1b3d] shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                            <Icon className={`h-7 w-7 ${ICON_COLOR_CLS[color]}`} />
                          </div>
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2">{a.label}</span>
                        </button>
                      )
                    })
                }

                {puedeDesplazar && (
                  <div className="flex items-center h-20 shrink-0">
                    <button type="button" aria-label="Ver más accesos"
                      onClick={() => filaAccesosRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-white dark:hover:bg-[#2a1b3d] transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {gestionOpen && (
          <div className="pointer-events-auto">
            <GestionAvisosModal onClose={() => setGestionOpen(false)} onUpdated={reloadAvisos} />
          </div>
        )}

        <div className="pointer-events-auto grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5">
          <DashboardCard />

          <HistorialTickerCard onOpen={() => setHistorialOpen(true)} />
          </div>

          <CalendarioPendientesCard />
        </div>
      </div>

      {historialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setHistorialOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <HistorialCambiosCard onClose={() => setHistorialOpen(false)} />
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personalizar accesos</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Elige qué accesos mostrar en tu inicio</p>
              </div>
              <button type="button" onClick={() => setTempSel(new Set(DEFAULT_ACCESOS))}
                className="text-xs font-semibold text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 transition-colors shrink-0">
                Usar predeterminados
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {(() => {
                let itemIdx = 0 // corre entre grupos, no se reinicia — cada ícono su propio color
                return staticAccesos.map(({ grupo, items }) => (
                  <div key={grupo}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{grupo}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {items.map(a => {
                        const sel = tempSel.has(a.id)
                        const MIcon = a.icon
                        const color = GRUPO_COLORS[itemIdx++ % GRUPO_COLORS.length]
                        return (
                          <button key={a.id} type="button" onClick={() => toggleTempSel(a.id)}
                            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${sel ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2a1b3d] hover:border-slate-300 dark:hover:border-slate-600"}`}>
                            <MIcon className={`h-5 w-5 ${ICON_COLOR_CLS[color]}`} />
                            <span className="text-[11px] font-medium text-center leading-tight line-clamp-2 text-slate-600 dark:text-slate-300">{a.label}</span>
                            {sel && (
                              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-violet-500 flex items-center justify-center">
                                <span className="text-white text-[8px] font-black">✓</span>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">{tempSel.size} seleccionados</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a1b3d] transition-colors">
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
    </div>
  )
}
