"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, ChevronRight, ChevronLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { GRUPOS, DEPT_ICONS } from "./PortalMDOSidebar"
import { HeroCarusel } from "./HeroCarusel"
import { DashboardCard } from "./DashboardCard"
import { HistorialCambiosCard } from "./HistorialCambiosCard"
import { HistorialTickerCard } from "./HistorialTickerCard"
import { CalendarioPendientesCard } from "./CalendarioPendientesCard"
import { GestionAvisosModal } from "./GestionAvisosModal"
import { GestionEventosModal } from "./GestionEventosModal"
import { CalendarioEventosHome } from "./CalendarioEventosHome"
import { DirectorioHome } from "./DirectorioHome"
import { IndicadoresRapidos } from "./IndicadoresRapidos"
import { useGetAvisos } from "@/api/aviso/getAvisos"
import { useGetEventosEmpresa } from "@/api/evento-empresa/getEventosEmpresa"
import { useGetColaboradores, cumpleaniosDelMes, aniversariosDelMes } from "@/api/colaborador/getColaboradores"
import { FONDO_PORTAL, Card, AvatarColab, ColumnHeading } from "./shared"

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

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
  const [eventosGestionOpen, setEventosGestionOpen] = useState(false)
  const [eventosGestionFecha, setEventosGestionFecha] = useState<string | undefined>(undefined)
  const [cumpleMes, setCumpleMes] = useState(new Date().getMonth())
  const [anivMes,   setAnivMes]   = useState(new Date().getMonth())

  const { avisos, loading: loadingAvisos, reload: reloadAvisos } = useGetAvisos()
  const { eventos, loading: loadingEventos, reload: reloadEventos } = useGetEventosEmpresa()
  const { colaboradores, loading: loadingColabs } = useGetColaboradores()
  const cumpleanos    = cumpleaniosDelMes(colaboradores, cumpleMes)
  const aniversarios  = aniversariosDelMes(colaboradores, anivMes)

  function abrirGestionEventos(fechaYmd?: string) {
    setEventosGestionFecha(fechaYmd)
    setEventosGestionOpen(true)
  }

  // Curado a mano (no viene de un content-type) -- 4 accesos frecuentes de
  // "Recursos"/"Servicios y apps", mismo patrón que staticAccesos pero fijo
  // para todos, sin personalización. Portado de sdi-portal (recursosItems en
  // SeccionPortalHome.tsx), adaptado a los destinos reales de MDO.
  const recursosItems = [
    { id: "documentos",     label: "Documentos",       icon: DEPT_ICONS.documentos,        onClick: () => onNavigate("documentos") },
    { id: "marca",          label: "Gestión de marca", icon: DEPT_ICONS.marca,              onClick: () => onNavigate("marca") },
    { id: "enlaces",        label: "Enlaces",          icon: DEPT_ICONS.enlaces,            onClick: () => onNavigate("enlaces") },
    { id: "segundo-cerebro", label: "Second Brain",    icon: DEPT_ICONS["segundo-cerebro"], onClick: () => window.open("/segundo-cerebro", "_blank", "noopener,noreferrer") },
  ]

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
          la versión grande. Sin z-index numérico: el div boxed de page.tsx que
          envuelve esta sección ya es `relative z-10` (misma regla para todas
          las secciones) y eso ya resuelve la pelea contra el hero — ponerle un
          número propio aquí es justo lo que nos mordió la última vez, en cuanto
          se agregó una capa nueva de por medio. max-w-6xl más angosto que el
          hero para que el fondo oscuro se asome a los lados. ─── */}
      <div className="-mt-6 sm:-mt-28 max-w-6xl mx-auto relative pointer-events-none">
        {/* pointer-events-none arriba + pointer-events-auto en la vitrina real:
            este contenedor se sube con margen negativo sobre el hero (ver nota
            de arriba) — el cálculo en píxeles de cuánto overlap es "seguro" es
            frágil (depende del alto real del header, de si hay tarjeta de
            tráfico, etc.). Con pointer-events-none aquí, el mouse atraviesa esa
            franja vacía y le llega al globo de todos modos, sin depender de que
            el margen esté calculado exacto. */}
        {/* Vitrina — UNA sola pieza (antes eran dos cajas sueltas: la de avisos
            y el grid de dashboard, cada una con su propio fondo). Mismo fondo
            compartido (FONDO_PORTAL) que usa el resto del portal + brillo
            interno propio, igual receta que SeccionVitrina/Tareas — el brillo
            SIEMPRE va dentro de la caja de la vitrina, nunca a nivel de
            <main>, para que no vuelva a pelearse con el mural. */}
        <div className={`pointer-events-auto relative ${FONDO_PORTAL} p-4 sm:p-6 rounded-sm rounded-tr-3xl shadow-lg`}>
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(139,92,246,0.1) 0%, transparent 55%)" }} />
          <div className="relative space-y-5">
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
                {/* pt-2 en la fila (no solo en la <section> de afuera): overflow-x-auto
                    hace que overflow-y se calcule como auto también (no visible), así
                    que el levantamiento del hover (-translate-y-0.5) se recorta contra
                    el borde superior de ESTA caja — el padding de la sección, al estar
                    afuera de la caja que recorta, no da espacio para esa animación. */}
                <div ref={filaAccesosRef} onScroll={chequearDesplazamiento}
                  className="flex items-start justify-center gap-4 overflow-x-auto pt-2 pb-2 -mx-1 px-1">
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

            {/* ─── Recursos · Calendario de eventos · Cumpleaños del mes ───
                Portado de sdi-portal/components/Trabajo/portal/SeccionPortalHome.tsx
                (fila "TOP RESOURCES / CALENDAR / KUDOS"), acentos en violeta
                en vez de naranja/multicolor (regla de un solo acento de MDO). */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div>
                <div className="mb-3"><ColumnHeading>Recursos</ColumnHeading></div>
                <div className="grid grid-cols-2 gap-2">
                  {recursosItems.map(item => {
                    const Icon = item.icon
                    return (
                      <button key={item.id} type="button" onClick={item.onClick}
                        className="flex flex-col items-start justify-between gap-3 rounded-2xl p-2.5 min-h-19 text-left bg-violet-600 hover:brightness-110 hover:-translate-y-0.5 transition-all">
                        <Icon className="h-5 w-5 text-white/90" />
                        <span className="text-sm font-bold text-white leading-tight line-clamp-2">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <CalendarioEventosHome eventos={eventos} loadingEventos={loadingEventos} colaboradores={colaboradores}
                puedeGestionar onGestionar={abrirGestionEventos} onNavigateSeccion={onNavigate} />

              <div className="flex flex-col">
                <div className="mb-3"><ColumnHeading>Cumpleaños</ColumnHeading></div>
                <Card className="p-4! flex-1 flex flex-col">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button type="button" onClick={() => setCumpleMes(m => (m + 11) % 12)}
                      className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200 w-28 text-center capitalize">{MESES[cumpleMes]}</span>
                    <button type="button" onClick={() => setCumpleMes(m => (m + 1) % 12)}
                      className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {loadingColabs
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24 rounded" />
                            <Skeleton className="h-2.5 w-16 rounded" />
                          </div>
                          <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                      ))
                    : cumpleanos.length === 0
                      ? <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Sin cumpleaños en {MESES[cumpleMes]}</p>
                      : cumpleanos.map(c => {
                          const fecha = new Date(c.fecha_nacimiento! + "T12:00:00")
                          const hoyD  = new Date()
                          const esHoy = cumpleMes === hoyD.getMonth() && fecha.getDate() === hoyD.getDate()
                          const fechaDisplay = new Date(hoyD.getFullYear(), fecha.getMonth(), fecha.getDate())
                          const label = esHoy ? "Hoy" : fechaDisplay.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
                          return (
                            <div key={c.documentId} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <AvatarColab colaborador={c} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.nombre}</p>
                                {c.area && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{c.area}</p>}
                                {c.puesto && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{c.puesto}</p>}
                              </div>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${esHoy ? "bg-violet-100 text-violet-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                                {label} {esHoy ? "🎉" : ""}
                              </span>
                            </div>
                          )
                        })
                  }
                </Card>
              </div>
            </div>

            {/* ─── Directorio (ancho) + Aniversarios del mes (angosto) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div className="xl:col-span-2">
                <DirectorioHome colaboradores={colaboradores} loading={loadingColabs} />
              </div>
              <div>
                <div className="mb-3"><ColumnHeading>Aniversarios</ColumnHeading></div>
                <Card className="p-4!">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button type="button" onClick={() => setAnivMes(m => (m + 11) % 12)}
                      className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200 w-28 text-center capitalize">{MESES[anivMes]}</span>
                    <button type="button" onClick={() => setAnivMes(m => (m + 1) % 12)}
                      className="h-6 w-6 rounded text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {loadingColabs
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24 rounded" />
                            <Skeleton className="h-2.5 w-12 rounded" />
                          </div>
                          <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                      ))
                    : aniversarios.length === 0
                      ? <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Sin aniversarios en {MESES[anivMes]}</p>
                      : aniversarios.map(c => {
                          const fecha = new Date(c.fecha_ingreso! + "T12:00:00")
                          const hoyD  = new Date()
                          const esHoy = anivMes === hoyD.getMonth() && fecha.getDate() === hoyD.getDate()
                          const fechaDisplay = new Date(hoyD.getFullYear(), fecha.getMonth(), fecha.getDate())
                          const label = esHoy ? "Hoy" : fechaDisplay.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
                          return (
                            <div key={c.documentId} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <AvatarColab colaborador={c} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.nombre}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{c.anos} {c.anos === 1 ? "año" : "años"}</p>
                              </div>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${esHoy ? "bg-violet-100 text-violet-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                                {label} {esHoy ? "🎉" : ""}
                              </span>
                            </div>
                          )
                        })
                  }
                </Card>
              </div>
            </div>

            <IndicadoresRapidos />

            {/* ─── Piezas propias de MDO, sin equivalente en sdi-portal —
                se conservan tal cual, al final. ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              <div className="flex flex-col gap-5">
                <DashboardCard />
                <HistorialTickerCard onOpen={() => setHistorialOpen(true)} />
              </div>

              <CalendarioPendientesCard />
            </div>
          </div>
        </div>

        {gestionOpen && (
          <div className="pointer-events-auto">
            <GestionAvisosModal onClose={() => setGestionOpen(false)} onUpdated={reloadAvisos} />
          </div>
        )}

        {eventosGestionOpen && (
          <div className="pointer-events-auto">
            <GestionEventosModal onClose={() => setEventosGestionOpen(false)} onUpdated={reloadEventos} fechaInicial={eventosGestionFecha} />
          </div>
        )}
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
