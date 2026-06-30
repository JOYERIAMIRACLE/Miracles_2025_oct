"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronDown, Bell, Search, Menu, Megaphone, ArrowRight,
  FileText, BarChart2, Zap, Users, GitBranch, UserCheck,
  ShoppingBag, DollarSign, Shield, Monitor, Calendar,
  ClipboardList, MessageSquare, Ticket, Database, Globe,
  Building2, Flag, Download, ExternalLink,
  LayoutDashboard, Info, Briefcase, Layers,
} from "lucide-react"

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SectionId =
  | "portal-home" | "comunicados" | "indicadores" | "accesos-rapidos"
  | "quienes-somos" | "organigrama" | "onboarding"
  | "mision" | "rh" | "cadena" | "comercial" | "marketing" | "administracion" | "seguridad" | "ti"
  | "vacaciones" | "evaluaciones" | "encuestas" | "tickets" | "odoo" | "intranet" | "repositorios"

type NavItem  = { id: SectionId; label: string; icon: React.ElementType }
type NavGroup = { id: string; label: string; icon: React.ElementType; items: NavItem[] }

const GRUPOS: NavGroup[] = [
  {
    id: "portal", label: "Portal principal", icon: LayoutDashboard,
    items: [],
  },
  {
    id: "conoce", label: "Conoce a SDI", icon: Info,
    items: [
      { id: "quienes-somos", label: "¿Quiénes somos?", icon: Building2 },
      { id: "organigrama",   label: "Organigrama",      icon: GitBranch },
      { id: "onboarding",    label: "Onboarding",       icon: UserCheck },
    ],
  },
  {
    id: "departamentos", label: "Departamentos", icon: Briefcase,
    items: [
      { id: "mision",         label: "Misión",                icon: Flag        },
      { id: "rh",             label: "Recursos Humanos",      icon: Users       },
      { id: "cadena",         label: "Cadena de suministros", icon: Globe       },
      { id: "comercial",      label: "Comercial",             icon: ShoppingBag },
      { id: "marketing",      label: "Marketing",             icon: Megaphone   },
      { id: "administracion", label: "Administración",        icon: DollarSign  },
      { id: "seguridad",      label: "Seguridad",             icon: Shield      },
      { id: "ti",             label: "TI y Soporte",          icon: Monitor     },
    ],
  },
  {
    id: "servicios", label: "Servicios y aplicaciones", icon: Layers,
    items: [
      { id: "vacaciones",   label: "Vacaciones",           icon: Calendar      },
      { id: "evaluaciones", label: "Evaluaciones",         icon: ClipboardList },
      { id: "encuestas",    label: "Encuestas",            icon: MessageSquare },
      { id: "tickets",      label: "Tickets",              icon: Ticket        },
      { id: "odoo",         label: "Odoo",                 icon: Monitor       },
      { id: "intranet",     label: "Intranet",             icon: Globe         },
      { id: "repositorios", label: "Repositorios de datos",icon: Database      },
    ],
  },
]

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-orange-500 rounded-xl">
      {tabs.map(t => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)}
          className={["px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
            active === t.id ? "bg-white text-orange-600 shadow" : "text-white hover:bg-orange-400",
          ].join(" ")}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function PageHeader({ date = "Mayo 2026", title }: { date?: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm text-slate-500">{date}</p>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-slate-200 rounded-xl p-6 ${className}`}>{children}</div>
}

function Pending({ owner, desc }: { owner: string; desc: string }) {
  return (
    <Card className="flex gap-4 items-start">
      <span className="text-3xl">📝</span>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contenido pendiente · {owner}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </Card>
  )
}

// ─── PORTAL HOME (comunicados + indicadores + accesos en una sola página) ─────
const AVISOS = [
  { color: "border-l-orange-500 bg-orange-50",   chip: "bg-orange-100 text-orange-700", emoji: "📋", area: "TI · Comunicado",        titulo: "Migración SAP → Odoo: activación módulos compras y logística", desc: "El 15 de junio se activan los nuevos módulos. Capacitaciones disponibles en TI y Soporte.", meta: "Cruz · Vigente hasta 30 jun 2026" },
  { color: "border-l-emerald-500 bg-emerald-50", chip: "bg-emerald-100 text-emerald-700",emoji: "🗓️",area: "Habilitamiento · Evento",  titulo: "Convivencia Q2 — 20 de junio",                                  desc: "Confirma asistencia antes del 10 de junio. Formulario disponible en Habilitamiento.",     meta: "Yaz · Vigente hasta 20 jun 2026" },
  { color: "border-l-blue-500 bg-blue-50",       chip: "bg-blue-100 text-blue-700",     emoji: "🛡️",area: "Seguridad · Normativa",    titulo: "Protocolos de seguridad industrial actualizados — mayo 2026",   desc: "Lectura obligatoria para personal de operaciones y planta.",                            meta: "Elias Arias · Vigente hasta 1 jul 2026" },
  { color: "border-l-orange-500 bg-orange-50",   chip: "bg-orange-100 text-orange-700", emoji: "💻", area: "TI · Actualización",       titulo: "Nuevo acceso a Power BI para área Comercial",                   desc: "Credenciales disponibles a través del formulario de solicitudes de TI.",                meta: "Cruz · Vigente hasta 15 jul 2026" },
]

const ACCESOS = [
  { emoji: "🏢", label: "Organigrama",      color: "text-orange-600",  bg: "bg-orange-50 border-orange-200 hover:bg-orange-100"   },
  { emoji: "🛠️", label: "Soporte TI",      color: "text-blue-600",    bg: "bg-blue-50 border-blue-200 hover:bg-blue-100"         },
  { emoji: "📝", label: "Hoja membretada", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { emoji: "✚",  label: "Personalizar",    color: "text-violet-600",  bg: "bg-violet-50 border-violet-200 hover:bg-violet-100"   },
  { emoji: "📄", label: "Política de equipos", color: "text-slate-600", bg: "bg-slate-50 border-slate-200 hover:bg-slate-100"   },
  { emoji: "📊", label: "Power BI",            color: "text-blue-600",  bg: "bg-blue-50 border-blue-200 hover:bg-blue-100"       },
  { emoji: "🔗", label: "Odoo ERP",            color: "text-orange-600",bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { emoji: "👥", label: "Directorio",          color: "text-violet-600",bg: "bg-violet-50 border-violet-200 hover:bg-violet-100" },
]

const CHART_BARS = [
  { mes:"Jun",real:776, budget:1000 },{ mes:"Jul",real:912, budget:1000 },
  { mes:"Ago",real:885, budget:1000 },{ mes:"Sep",real:1274,budget:1000 },
  { mes:"Oct",real:1886,budget:1000 },{ mes:"Nov",real:885, budget:1000 },
  { mes:"Dic",real:1040,budget:1000 },{ mes:"Ene",real:1001,budget:915  },
  { mes:"Feb",real:853, budget:915  },{ mes:"Mar",real:508, budget:915  },
  { mes:"Abr",real:796, budget:915  },{ mes:"May",real:668, budget:915  },
  { mes:"Jun",real:89,  budget:915  },
]
const MAX_BAR = 1900

const AVISO_BG: Record<number, string> = {
  0: "bg-orange-500",
  1: "bg-emerald-500",
  2: "bg-blue-600",
  3: "bg-orange-500",
}

function HeroCarusel() {
  const [idx, setIdx] = useState(0)
  const total = AVISOS.length

  useEffect(() => {
    const iv = setInterval(() => setIdx(p => (p + 1) % total), 6000)
    return () => clearInterval(iv)
  }, [total])

  const prev = () => setIdx(p => (p - 1 + total) % total)
  const next = () => setIdx(p => (p + 1) % total)
  const a = AVISOS[idx]

  return (
    <section id="comunicados" className="scroll-mt-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 min-h-[220px]">
      {/* Left — aviso content */}
      <div className="bg-white p-8 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${a.chip}`}>{a.area}</span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{a.titulo}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{a.desc}</p>
          <p className="text-[11px] text-slate-400">{a.meta}</p>
        </div>
        {/* Dot navigation */}
        <div className="flex items-center gap-2">
          {AVISOS.map((_, i) => (
            <button key={i} type="button" aria-label={`Ir a slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-orange-500" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
            />
          ))}
        </div>
      </div>
      {/* Right — colored panel */}
      <div className={`${AVISO_BG[idx]} relative flex flex-col items-center justify-center gap-3 p-8 min-h-[180px]`}>
        <span className="text-6xl select-none">{a.emoji}</span>
        <p className="text-white/80 text-[11px] font-semibold tracking-widest uppercase text-center">SDI · Comunicados</p>
        {/* Prev / Next */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <button type="button" aria-label="Anterior" onClick={prev}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors text-lg font-bold">
            ‹
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button type="button" aria-label="Siguiente" onClick={next}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors text-lg font-bold">
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

function SeccionPortalHome({ scrollTo }: { scrollTo?: string }) {
  const [dashTab, setDashTab] = useState("todo")

  useEffect(() => {
    if (!scrollTo) return
    const timer = setTimeout(() => {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
    return () => clearTimeout(timer)
  }, [scrollTo])

  return (
    <div className="space-y-5">
      {/* Header + aviso */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div>
          <p className="text-sm text-slate-500">Mayo 2026</p>
          <h1 className="text-2xl font-bold text-slate-900">Portal SDI</h1>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm max-w-sm">
          <span className="font-bold text-orange-600 shrink-0">Aviso importante</span>
          <span className="text-orange-500 shrink-0">→</span>
          <span className="text-orange-700 text-xs leading-tight">Evaluaciones de colaborador a colaborador activas hasta 30 de jul</span>
        </div>
      </div>

      {/* Hero Carrusel de comunicados */}
      <HeroCarusel />

      {/* Widgets: eventos · cumpleaños · aniversarios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="!p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Eventos próximos</p>
          {[
            { emoji: "🟠", name: "Ohanas",   fecha: "Hoy", hoy: true  },
            { emoji: "🟣", name: "Misa",     fecha: "Jue 5", hoy: false },
          ].map(e => (
            <div key={e.name} className="flex items-center gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-lg">{e.emoji}</span>
              <span className="flex-1 text-sm text-slate-700 font-medium">{e.name}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${e.hoy ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{e.fecha} {e.hoy ? "🎉" : ""}</span>
            </div>
          ))}
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cumpleaños del mes</p>
          {[
            { init: "RG", grad: "from-amber-500 to-orange-500", name: "Rogelio García",  role: "Proyectos · MHS", fecha: "Hoy",   hoy: true  },
            { init: "IS", grad: "from-emerald-500 to-teal-500", name: "Isabel Soto",     role: "Talento · RH",   fecha: "Jue 5", hoy: false },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
              <div className={`h-8 w-8 rounded-full bg-linear-to-br ${p.grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{p.init}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.role}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.hoy ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{p.fecha} {p.hoy ? "🎉" : ""}</span>
            </div>
          ))}
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Aniversarios del mes</p>
          {[
            { init: "RG", grad: "from-amber-500 to-orange-500", name: "Rogelio García",  years: "3 años", fecha: "Hoy",   hoy: true  },
            { init: "IS", grad: "from-emerald-500 to-teal-500", name: "Isabel Soto",     years: "5 años", fecha: "Jue 5", hoy: false },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
              <div className={`h-8 w-8 rounded-full bg-linear-to-br ${p.grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{p.init}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.years}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.hoy ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{p.fecha} {p.hoy ? "🎉" : ""}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── SECCIÓN: ACCESOS RÁPIDOS ── */}
      <section id="accesos-rapidos" className="scroll-mt-14">
        <h2 className="text-base font-bold text-slate-800 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCESOS.map(a => (
            <button type="button" key={a.label} className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all hover:shadow-sm ${a.bg}`}>
              <span className="text-3xl">{a.emoji}</span>
              <span className={`text-xs font-semibold text-center ${a.color}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN: INDICADORES / DASHBOARD ── */}
      <section id="indicadores" className="scroll-mt-14">
        <Card className="!p-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {[["todo","Seleccionar todo"],["productos","Productos"],["proyectos","Proyectos"],["servicios","Servicios"]].map(([id,lbl]) => (
              <button key={id} type="button" onClick={() => setDashTab(id)}
                className={["px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap", dashTab === id ? "border-b-2 border-orange-500 text-orange-600" : "text-slate-500 hover:text-slate-800"].join(" ")}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="p-5">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(dashTab === "todo" || dashTab === "productos")  && <div className="border border-slate-200 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase tracking-wider">Productos</p><p className="text-2xl font-bold text-slate-800 mt-1">438 mil</p></div>}
              {(dashTab === "todo" || dashTab === "proyectos") && <div className="border border-slate-200 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase tracking-wider">Proyectos</p><p className="text-2xl font-bold text-slate-800 mt-1">141 mil</p></div>}
              {(dashTab === "todo" || dashTab === "servicios") && <div className="border border-slate-200 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase tracking-wider">Servicios</p><p className="text-2xl font-bold text-slate-800 mt-1">$90 mil</p></div>}
            </div>
            {/* Chart + Gauge row */}
            <div className="flex gap-5 items-end">
              {/* Bar chart */}
              <div className="flex-1">
                <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">Real vs Presupuesto</div>
                <div className="flex items-end gap-1 h-28">
                  {CHART_BARS.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end gap-0.5" style={{ height: "96px" }}>
                        <div className="flex-1 bg-orange-400 rounded-t-sm" style={{ height: `${(b.real / MAX_BAR) * 96}px` }} />
                        <div className="flex-1 border-t-2 border-blue-400 bg-blue-100/30" style={{ height: `${(b.budget / MAX_BAR) * 96}px` }} />
                      </div>
                      <span className="text-[8px] text-slate-400 truncate">{b.mes}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 shrink-0" />Real</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400 shrink-0" />Presupuesto</span>
                </div>
              </div>
              {/* Gauge */}
              <div className="shrink-0 text-center w-36">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">VS Objetivo</div>
                <div className="relative inline-flex items-center justify-center">
                  <svg viewBox="0 0 100 60" className="w-32 h-20">
                    <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                    <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray="125.6" strokeDashoffset={`${125.6 * (1 - 0.73)}`} />
                  </svg>
                  <div className="absolute bottom-0 inset-x-0 text-center">
                    <p className="text-2xl font-black text-slate-900 leading-none">73%</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">668 mil</p>
                <p className="text-[10px] text-slate-400">de 915 mil objetivo</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

    </div>
  )
}

// ─── CONOCE A SDI ─────────────────────────────────────────────────────────────
const DIR_CARDS = [
  { init: "YH", grad: "from-orange-500 to-amber-500",   name: "Yazmin Hernández",  role: "Habilitamiento",         area: "Habilitamiento" },
  { init: "IS", grad: "from-emerald-500 to-teal-500",   name: "Isabel Soto",       role: "Talento · RH",           area: "RH"             },
  { init: "CR", grad: "from-blue-500 to-indigo-500",    name: "Cruz Reyes",        role: "TI y Soporte",           area: "TI"             },
  { init: "EA", grad: "from-violet-500 to-purple-500",  name: "Elias Arias",       role: "Seguridad Industrial",   area: "Seguridad"      },
  { init: "SG", grad: "from-amber-600 to-orange-700",   name: "Sergio García",     role: "Comercial · Producto",   area: "Comercial"      },
  { init: "RM", grad: "from-slate-700 to-slate-900",    name: "Rogelio Martínez",  role: "Proyectos · MHS",        area: "Comercial"      },
  { init: "RN", grad: "from-pink-500 to-rose-500",      name: "Ricardo · Nancy",   role: "Marketing",              area: "Marketing"      },
]

function SeccionConoceSDI({ initialTab }: { initialTab: string }) {
  const tabs = [
    { id: "quienes",    label: "¿Quiénes somos?" },
    { id: "organigrama",label: "Organigrama"      },
    { id: "directorio", label: "Directorio"       },
    { id: "onboarding", label: "Onboarding"       },
  ]
  const [tab, setTab] = useState(initialTab === "organigrama" ? "organigrama" : initialTab === "onboarding" ? "onboarding" : "quienes")

  return (
    <div className="space-y-4">
      <PageHeader title="Conoce a SDI" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "quienes" && (
        <div className="space-y-4">
          {/* Recursos descargables */}
          <Card>
            <h2 className="text-base font-bold text-slate-800 mb-3">Recursos descargables</h2>
            <div className="flex flex-wrap gap-3">
              {[["📄","Presentación SDI"],["📄","CV SDI"]].map(([e, l]) => (
                <button type="button" key={l} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 font-medium transition-colors">
                  <span>{e}</span>{l}<Download className="h-3.5 w-3.5 text-slate-400 ml-1" />
                </button>
              ))}
            </div>
          </Card>

          {/* ¿Quiénes somos? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <h2 className="text-xl font-bold text-orange-500 mb-3">¿Quiénes somos?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                En <strong>Soporte Dinámico Industrial</strong> somos una empresa mexicana encargada de suministrar soluciones de automatización y servicios integrales. Nos respaldan <strong>más de 19 años de experiencia</strong> en automatización industrial y manejo de materiales, cubriendo toda la república mexicana.
              </p>
            </Card>
            <div className="bg-orange-500 rounded-xl flex items-center justify-center min-h-[160px]">
              <div className="text-center text-white">
                <div className="text-5xl font-bold opacity-30">SDI</div>
                <div className="text-xs mt-2 opacity-60">Foto del equipo · Pendiente</div>
              </div>
            </div>
          </div>

          {/* Misión y Visión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Misión · ¿Por qué existimos?</p>
              <h3 className="text-base font-bold text-slate-800 mb-2">Misión</h3>
              <p className="text-sm text-slate-600 leading-relaxed italic">Damos Gloria a Dios, sirviendo a las personas, desarrollando soluciones que eleven la dignidad de la persona, incrementando la productividad.</p>
            </Card>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Visión · ¿A dónde vamos?</p>
              <h3 className="text-base font-bold text-slate-800 mb-2">Visión</h3>
              <p className="text-sm text-slate-600 leading-relaxed italic">Dar lo mejor, siendo el mejor proveedor de soluciones en automatización en México.</p>
            </Card>
          </div>

          {/* Las 3S */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon:"🎯",t:"Solucionar",d:"Ofrecer a nuestros clientes la mejor solución a sus necesidades a través de los productos y servicios que ofrecemos." },
              { icon:"⚡",t:"Simplificar",d:"Búsqueda continua de formas de simplificar procesos con control, manejo de materiales o servicios integrales." },
              { icon:"🤝",t:"Servir",d:"Seguimiento puntual a las necesidades del cliente brindando atención amable, integral y personalizada." },
            ].map(p => (
              <Card key={p.t}>
                <div className="text-3xl mb-2">{p.icon}</div>
                <h4 className="font-bold text-slate-800 mb-1">{p.t}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{p.d}</p>
              </Card>
            ))}
          </div>

          {/* Contacto */}
          <Card>
            <h3 className="text-sm font-bold text-slate-700 mb-3">Oficinas Centrales</h3>
            <p className="text-sm text-slate-600 mb-3">Zona Poniente No. 510, Chapultepec · San Nicolás de los Garza, N.L. C.P. 66450</p>
            <div className="grid grid-cols-3 gap-3">
              {[["Conmutador","(81) 8100 9100"],["Soporte técnico","(81) 1824 5642"],["Correo","info@sdindustrial.com.mx"]].map(([k,v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{k}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "organigrama" && (
        <Card className="text-center py-12!">
          <div className="text-5xl mb-4">🏗️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Organigrama oficial SDI</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Versión interactiva en desarrollo · Dueño: Yaz</p>
          <button type="button" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
            <Download className="h-4 w-4" /> Descargar organigrama PDF
          </button>
        </Card>
      )}

      {tab === "directorio" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {DIR_CARDS.map(d => (
              <Card key={d.init} className="text-center p-4!">
                <div className={`h-14 w-14 rounded-full bg-linear-to-br ${d.grad} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}>{d.init}</div>
                <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{d.role}</p>
                <span className="inline-block mt-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{d.area}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "onboarding" && (
        <Pending owner="Isabel · RH" desc="Proceso de bienvenida, checklist de primer día, accesos iniciales y formatos de inicio. Isabel entrega el contenido al lanzamiento." />
      )}
    </div>
  )
}

// ─── MISIÓN ──────────────────────────────────────────────────────────────────
function SeccionMision() {
  const tabs = [
    { id: "proposito", label: "Propósito y Valores" },
    { id: "principios",label: "Principios"          },
    { id: "espiritual",label: "Formación Espiritual"},
    { id: "eventos",   label: "Eventos"             },
  ]
  const [tab, setTab] = useState("proposito")
  return (
    <div className="space-y-4">
      <PageHeader title="Misión SDI" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <Pending owner="Armando" desc={`Los valores vivenciales, principios y comportamientos de SDI se publicarán aquí una vez que Armando entregue el contenido de ${tabs.find(t => t.id === tab)?.label}. Este bloque será contenido web, no un archivo descargable.`} />
    </div>
  )
}

// ─── RH ──────────────────────────────────────────────────────────────────────
function SeccionRH() {
  const tabs = [
    { id: "prestaciones",  label: "Prestaciones"      },
    { id: "politicas",     label: "Políticas laborales"},
    { id: "capacitacion",  label: "Capacitación"      },
    { id: "emergencias",   label: "Emergencias"       },
  ]
  const [tab, setTab] = useState("prestaciones")
  const [open, setOpen] = useState<string | null>("sgmm")

  const prestaciones = [
    { id: "sgmm", emoji: "🏥", color: "border-emerald-500", chip: "text-emerald-700 bg-emerald-100",
      titulo: "Seguro Médico Mayor (SGMM)", sub: "Cobertura médica privada para el colaborador y dependientes", desde: "Desde día 1",
      cubre: "Hospitalización, cirugías, médicos especialistas, medicamentos durante hospitalización, urgencias.",
      uso: "Presenta tu número de póliza en el hospital o clínica. Para urgencias llama al número de asistencia 24 hrs.",
      contacto: "Isabel · isabel@sdindustrial.com.mx" },
    { id: "odesa", emoji: "🦷", color: "border-blue-500", chip: "text-blue-700 bg-blue-100",
      titulo: "ODESA — Dental y Visión", sub: "Cobertura dental y oftalmológica para el colaborador", desde: "Desde día 1",
      cubre: "Consultas dentales, limpiezas, endodoncias, examen de vista y descuento en lentes.",
      uso: "Agenda cita con dentista u oftalmólogo de la red ODESA. Presenta tu credencial de afiliación.",
      contacto: "Isabel · Para solicitar credencial o reportar problema." },
    { id: "ahorro", emoji: "💰", color: "border-amber-500", chip: "text-amber-700 bg-amber-100",
      titulo: "Fondo de Ahorro", sub: "Ahorro mensual con aportación de SDI equivalente", desde: "3 meses de antigüedad",
      cubre: "Porcentaje del sueldo descontado de nómina; SDI aporta una cantidad equivalente.",
      uso: "Contacta a Isabel en RH para registrar tu participación. Al cumplir 3 meses puedes activarlo.",
      contacto: "Isabel · Calendario de retiros en diciembre." },
    { id: "imss", emoji: "🏦", color: "border-slate-300", chip: "text-slate-600 bg-slate-100",
      titulo: "IMSS — Seguro Social", sub: "Afiliación formal obligatoria desde el primer día", desde: "Desde día 1",
      cubre: "Consultas, urgencias, incapacidades y pensión a través del IMSS.",
      uso: "Tu NSS se activa desde el primer día. Consultas en clínica asignada por domicilio.",
      contacto: "Isabel · Para aclaraciones de afiliación." },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Recursos Humanos" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "prestaciones" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Como colaborador de <strong>SDI</strong> tienes acceso a las siguientes prestaciones desde tu primer día.</p>
          {prestaciones.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${p.color} overflow-hidden`}>
              <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${p.chip}`}>{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800">{p.titulo}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.sub}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.chip}`}>{p.desde}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open === p.id ? "rotate-180" : ""}`} />
              </button>
              {open === p.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {[["¿Qué cubre?",p.cubre],["¿Cómo usarlo?",p.uso],["Contacto RH",p.contacto]].map(([k,v]) => (
                      <div key={k} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{k}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {tab !== "prestaciones" && (
        <Pending owner="Isabel · RH" desc={`Contenido de "${tabs.find(t => t.id === tab)?.label}" · Isabel entrega al lanzamiento.`} />
      )}
    </div>
  )
}

// ─── ADMINISTRACIÓN ──────────────────────────────────────────────────────────
const DOCS_LEGALES = [
  { name: "Constancia de Situación Fiscal (CSF)",   desc: "RFC y datos fiscales de SDI. Se actualiza al cambiar datos del SAT.",                   freq: "Cuando cambie" },
  { name: "Opinión de Cumplimiento IMSS",            desc: "Acreditación de obligaciones patronales ante el IMSS.",                                   freq: "Mensual"       },
  { name: "Opinión de Cumplimiento Infonavit",       desc: "Acreditación de aportaciones al Infonavit.",                                              freq: "Mensual"       },
  { name: "Acta Constitutiva",                       desc: "Documento legal de constitución de SDI.",                                                 freq: "Cuando cambie" },
  { name: "Comprobante de Domicilio Fiscal",         desc: "Para trámites ante proveedores, clientes y gobierno.",                                    freq: "Cuando cambie" },
  { name: "Carátula Bancaria",                       desc: "Datos bancarios oficiales de SDI para pagos y transferencias.",                            freq: "Cuando cambie" },
  { name: "Carta de confirmación de cuenta",         desc: "Confirmación bancaria para nuevos proveedores.",                                          freq: "Cuando cambie" },
  { name: "REPSE",                                   desc: "Registro obligatorio para empresas que prestan servicios especializados.",                 freq: "Anual"         },
]

function SeccionAdministracion() {
  const tabs = [
    { id: "legales",   label: "Documentos legales" },
    { id: "seguros",   label: "Seguros"            },
    { id: "catalogo",  label: "Catálogo SDI"       },
    { id: "autos",     label: "Autos y activos"    },
  ]
  const [tab, setTab] = useState("legales")

  return (
    <div className="space-y-4">
      <PageHeader title="Administración y Finanzas" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "legales" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Documentos legales y fiscales oficiales de SDI. Los más solicitados por proveedores, clientes y trámites externos.</p>
          <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl p-4">
            <span className="text-xl shrink-0">🔒</span>
            <p className="text-sm text-amber-800"><strong>Acceso controlado:</strong> No compartir externamente sin autorización de Administración o Dirección.</p>
          </div>
          <div className="space-y-2">
            {DOCS_LEGALES.map(d => (
              <div key={d.name} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 mb-1.5">🔄 {d.freq}</p>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
                    <Download className="h-3 w-3" /> Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "seguros" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Pólizas de seguros institucionales de SDI.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon:"🏥",name:"SGMM Colectivo",desc:"Seguro médico mayor para colaboradores. Ver detalle en RH → Prestaciones.",accion:"Ver en RH" },
              { icon:"❤️",name:"Seguros de Vida",desc:"Cobertura de vida para colaboradores. Condiciones y suma asegurada por nivel.",accion:"Ver póliza" },
              { icon:"🚗",name:"Seguros de Autos",desc:"Pólizas de autos empresariales. Ver detalle en Autos y Activos.",accion:"Ver en Autos" },
            ].map(s => (
              <Card key={s.name}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <h4 className="font-bold text-slate-800 mb-1">{s.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{s.desc}</p>
                <button type="button" className="w-full py-2 border border-orange-500 text-orange-600 text-sm rounded-lg hover:bg-orange-50 transition-colors font-medium">
                  {s.accion} →
                </button>
              </Card>
            ))}
          </div>
          <Pending owner="Ale / Chris / Iván" desc="Número de póliza, vigencia, suma asegurada y procedimiento de uso para cada seguro institucional." />
        </div>
      )}

      {tab === "catalogo" && (
        <Pending owner="Ale / Chris / Iván" desc="Catálogo completo de productos y servicios por unidad de negocio, con precios de referencia internos y códigos Odoo." />
      )}

      {tab === "autos" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Control de vehículos empresariales: asignación, pólizas y mantenimientos.</p>
          <Pending owner="Ale / Chris / Iván" desc="Tabla completa de vehículos empresariales con asignación, pólizas y fechas de mantenimiento." />
          <Card>
            <h3 className="text-sm font-bold text-slate-800 mb-3">¿Cómo reportar un incidente con un vehículo empresarial?</h3>
            <div className="space-y-2">
              {[
                "Documentar el incidente con fotos y datos del otro involucrado (si aplica).",
                "Llamar inmediatamente a la aseguradora con el número de póliza.",
                "Notificar a Administración dentro de las siguientes 2 horas.",
                "No realizar reparaciones sin autorización previa de Administración.",
              ].map((s, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── TI Y SOPORTE ─────────────────────────────────────────────────────────────
function SeccionTI() {
  const tabs = [
    { id: "politicas", label: "Políticas"          },
    { id: "sla",       label: "Soporte y SLA"      },
    { id: "herramientas",label:"Herramientas"      },
    { id: "faq",       label: "FAQ"                },
  ]
  const [tab, setTab] = useState("politicas")
  const [openPol, setOpenPol] = useState<string | null>(null)

  const politicas = [
    { id: "computo", emoji: "💻", titulo: "Uso de Equipo de Cómputo",
      aplica: "Todos los colaboradores con equipo asignado",
      ok: ["Uso para actividades laborales de SDI","Instalar software autorizado por TI","Uso de VPN con autorización","Acceso a sistemas corporativos (Odoo, M365, Power BI)"],
      no: ["Instalar software sin autorización de TI","Compartir credenciales con terceros","Desactivar antivirus o herramientas de seguridad","Uso personal que comprometa el equipo"],
      nota: "Cualquier problema debe reportarse a Cruz en las primeras 2 horas. soporte@sdindustrial.com.mx" },
    { id: "celular", emoji: "📱", titulo: "Celulares Corporativos",
      aplica: "Colaboradores con celular asignado",
      ok: ["Llamadas y mensajes de trabajo","Apps corporativas (Teams, Outlook, Odoo móvil)","Uso personal moderado"],
      no: ["Instalar apps sin autorización de TI","Ceder el dispositivo a terceros","Desactivar el PIN o bloqueo"],
      nota: "" },
    { id: "red", emoji: "🌐", titulo: "Red y VPN",
      aplica: "Todos los colaboradores",
      ok: ["Acceso a internet para actividades laborales","Uso de VPN con autorización de TI","Conexión a sistemas internos desde red corporativa"],
      no: ["Conectar dispositivos no autorizados a la red SDI","Compartir contraseña WiFi con externos","Descarga masiva de contenido no laboral"],
      nota: "" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="TI y Soporte" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "politicas" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["📧","soporte@sdindustrial.com.mx"],["💬","Canal #soporte-ti en Teams"],["📞","(81) 1824 5642"],["⏱️","SLA: 4 hrs hábiles (crítico)"]].map(([e,t]) => (
              <Card key={t} className="text-center p-3!">
                <div className="text-2xl mb-1">{e}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{t}</div>
              </Card>
            ))}
          </div>
          <div className="space-y-2">
            {politicas.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => setOpenPol(openPol === p.id ? null : p.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
                  <span className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl shrink-0">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">Política de {p.titulo}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Aplica a: {p.aplica}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${openPol === p.id ? "rotate-180" : ""}`} />
                </button>
                {openPol === p.id && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">✅ Permitido</p>
                        <ul className="space-y-1.5">{p.ok.map(t => <li key={t} className="flex gap-2 text-xs text-slate-600"><span className="text-emerald-500 shrink-0">•</span>{t}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2">🚫 No permitido</p>
                        <ul className="space-y-1.5">{p.no.map(t => <li key={t} className="flex gap-2 text-xs text-slate-600"><span className="text-red-500 shrink-0">•</span>{t}</li>)}</ul>
                      </div>
                    </div>
                    {p.nota && <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800"><strong>Reporte:</strong> {p.nota}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "sla" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { color:"border-t-red-500",   badge:"bg-red-100 text-red-700",    label:"🔴 Crítico",   time:"4 hrs",  desc:"Sistemas caídos que impiden operar: Odoo, correo, red.",   nota:"Contacto directo a Cruz" },
              { color:"border-t-amber-500",  badge:"bg-amber-100 text-amber-700",label:"🟡 Normal",   time:"24 hrs", desc:"Problemas que dificultan pero no impiden el trabajo.",      nota:"Canal Teams #soporte-ti"  },
              { color:"border-t-blue-500",   badge:"bg-blue-100 text-blue-700",  label:"🔵 Solicitud",time:"72 hrs", desc:"Altas/bajas de accesos, nuevos equipos, software autorizado.",nota:"Formulario de solicitud"  },
            ].map(s => (
              <Card key={s.label} className={`border-t-4 ${s.color} text-center`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 inline-block px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</p>
                <div className="text-4xl font-bold text-slate-800 mb-2">{s.time}</div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{s.desc}</p>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${s.badge}`}>{s.nota}</span>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Cómo reportar un problema correctamente</h3>
            <div className="space-y-3">
              {[
                ["¿Qué pasó?",         "Describe el error con exactitud. Ej: Odoo no deja guardar una orden de compra, aparece error 403."],
                ["¿Desde cuándo?",     "Hora y fecha aproximada en que comenzó el problema."],
                ["¿Impacto?",          "¿Solo te afecta a ti o a todo el equipo? ¿Puedes seguir trabajando?"],
                ["Captura de pantalla","Si hay un mensaje de error, adjunta una imagen. Ahorra 2 correos de ida y vuelta."],
              ].map(([t, d], i) => (
                <div key={t} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <span className="h-7 w-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  <div><p className="text-sm font-semibold text-slate-800">{t}</p><p className="text-xs text-slate-500 mt-0.5">{d}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "herramientas" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Accesos directos a los sistemas y herramientas que usas en SDI. Links oficiales — no busques en Google.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji:"🟠",nombre:"Odoo ERP",desc:"Sistema principal de gestión: compras, ventas, inventario, CRM, nómina." },
              { emoji:"📊",nombre:"Power BI",desc:"Dashboards y reportes de negocio. Catálogo completo disponible por área." },
              { emoji:"💬",nombre:"Microsoft Teams",desc:"Comunicación interna, reuniones y canal de soporte TI." },
              { emoji:"📧",nombre:"Outlook",desc:"Correo corporativo. Acceso vía web o aplicación de escritorio." },
              { emoji:"☁️",nombre:"SharePoint",desc:"Repositorio de documentos por área. Acceso con cuenta @sdindustrial.com.mx." },
              { emoji:"🔐",nombre:"VPN Corporativa",desc:"Acceso remoto a sistemas internos. Solicitar credenciales a TI." },
            ].map(s => (
              <Card key={s.nombre} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-3xl mb-3">{s.emoji}</div>
                <h4 className="font-bold text-slate-800 mb-1">{s.nombre}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-500">Abrir sistema <ExternalLink className="h-3 w-3" /></div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "faq" && (
        <Pending owner="Cruz · TI" desc="Preguntas frecuentes de soporte técnico y sus respuestas. Cruz entrega al lanzamiento." />
      )}
    </div>
  )
}

// ─── MARKETING ────────────────────────────────────────────────────────────────
const MKT_TABS = [
  { id: "marca",      label: "Identidad de Marca"    },
  { id: "plantillas", label: "Plantillas"             },
  { id: "galeria",    label: "Galería Multimedia"     },
  { id: "materiales", label: "Materiales Comerciales" },
  { id: "gobernanza", label: "Gobernanza"             },
]

const LOGOS_SDI = [
  { nombre: "Logo SDI",                      url: "#" },
  { nombre: "Logo 3S",                       url: "#" },
  { nombre: "Logo Academia SDI",             url: "#" },
  { nombre: "Logo Directorio de Integradores", url: "#" },
  { nombre: "Logo Ser Lo Que Somos",         url: "#" },
  { nombre: "Logo Simple y Directo",         url: "#" },
  { nombre: "Logo Simplificando Procesos",   url: "#" },
  { nombre: "Logo Webinar Industrial",       url: "#" },
]

const COLORES_SDI = [
  { name: "Naranja SDI", hex: "#ED8000", uso: "Color primario · CTAs · Énfasis" },
  { name: "Gris SDI",    hex: "#4C4E53", uso: "Texto secundario · Íconos · Bordes" },
  { name: "Blanco",      hex: "#FFFFFF", uso: "Fondos · Texto sobre oscuro" },
  { name: "Negro",       hex: "#000000", uso: "Texto principal · Headers · Contrastes" },
]

const PLANTILLAS_MKT = [
  { icon: "📄", name: "Hoja membretada",          fmt: "Word (.docx)",       desc: "Para cartas y comunicados oficiales. No modificar márgenes ni encabezado." },
  { icon: "📧", name: "Firma de correo",           fmt: "HTML",               desc: "Firma corporativa con datos de contacto. Solicitar a Marketing para instalar." },
  { icon: "📊", name: "Presentación corporativa",  fmt: "PowerPoint (.pptx)", desc: "Plantilla para presentaciones a clientes y stakeholders." },
  { icon: "📋", name: "Formato de correo",         fmt: "Word (.docx)",       desc: "Estructura estándar para comunicados internos formales." },
  { icon: "🏷️", name: "Tarjeta de presentación",  fmt: "PDF (para imprimir)",desc: "Solicitar impresión a Marketing con tus datos." },
  { icon: "📑", name: "Propuesta comercial",       fmt: "PowerPoint (.pptx)", desc: "Para cotizaciones y propuestas formales a clientes." },
]

const GALERIA_MKT = [
  "Evento Q1 2026","Company Feb 2026","Instalaciones SDI","Equipo Comercial",
  "Planta CEDEP","Proyectos MHS","Aniversario SDI","Team Building",
]

const MATERIALES_MKT = [
  { name: "Brochure SDI General",              desc: "Presentación de la empresa, unidades de negocio y diferenciadores.",           owner: "Marketing" },
  { name: "Brochure Automatización Industrial",desc: "Productos y soluciones de la unidad de automatización.",                       owner: "Marketing + Sergio" },
  { name: "Brochure MHS — Manejo de Materiales",desc:"Soluciones de manejo de materiales y ergonomía.",                             owner: "Marketing + Rogelio" },
  { name: "Presentación Company SDI",          desc: "Deck corporativo para presentar SDI a clientes y socios.",                     owner: "Marketing" },
  { name: "Casos de éxito",                    desc: "Repositorio de proyectos ejecutados. Dueño: Comercial (Rogelio).",             owner: "Rogelio → Marketing enlaza" },
  { name: "Encuesta de satisfacción",          desc: "Formato de encuesta post-servicio/proyecto.",                                  owner: "Marketing" },
]

function SeccionMarketing() {
  const [tab, setTab] = useState("marca")
  return (
    <div className="space-y-4">
      <PageHeader title="Marketing e Identidad de Marca" />
      <TabBar tabs={MKT_TABS} active={tab} onChange={setTab} />

      {/* ── IDENTIDAD DE MARCA ── */}
      {tab === "marca" && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500 leading-relaxed">La identidad de marca de SDI define cómo nos vemos y comunicamos hacia afuera y hacia adentro. Úsala de forma consistente — cada comunicación refleja quiénes somos.</p>

          {/* Logos — primero */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logos</h3>
              <div className="flex gap-2">
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Download className="h-3 w-3" /> Manual de Marca
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Carpeta Drive
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LOGOS_SDI.map(logo => (
                <a key={logo.nombre} href={logo.url} target="_blank" rel="noreferrer"
                  className="group flex flex-col border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-orange-300 transition-all">
                  {/* Preview area */}
                  <div className="h-20 bg-slate-50 flex items-center justify-center border-b border-slate-200 group-hover:bg-orange-50 transition-colors">
                    <ExternalLink className="h-6 w-6 text-slate-300 group-hover:text-orange-400 transition-colors" />
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white">
                    <p className="text-[11px] text-slate-600 font-medium leading-tight truncate flex-1 mr-2">{logo.nombre}</p>
                    <span className="shrink-0 text-[10px] font-bold text-orange-500 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded tracking-wider">LINK</span>
                  </div>
                </a>
              ))}
            </div>
          </Card>

          {/* Sistema de color + Tipografía al mismo nivel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Sistema de color</h3>
              <div className="grid grid-cols-2 gap-3">
                {COLORES_SDI.map(c => (
                  <div key={c.hex} className="flex flex-col gap-1.5">
                    <div className="w-full h-14 rounded-lg border border-black/10" style={{ background: c.hex }} />
                    <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{c.hex}</p>
                    <p className="text-[11px] text-slate-400 leading-tight">{c.uso}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tipografía</h3>
              <div className="flex flex-col gap-3">
                <div className="border border-slate-200 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Títulos y encabezados</p>
                  <p className="text-2xl font-extrabold text-slate-900 leading-tight mb-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>Open Sans Bold</p>
                  <p className="text-xs text-slate-400">Bold 700/800 · Para encabezados y CTAs principales</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cuerpo de texto</p>
                  <p className="text-xl text-slate-900 leading-tight mb-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>Open Sans Regular</p>
                  <p className="text-xs text-slate-400">Regular 400 · SemiBold 600 para énfasis · 14px base</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── PLANTILLAS ── */}
      {tab === "plantillas" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 leading-relaxed">Plantillas oficiales de SDI. Úsalas siempre — no crees versiones propias. Cualquier modificación debe coordinarse con Marketing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLANTILLAS_MKT.map(p => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-[11px] font-semibold text-orange-500 mt-0.5">{p.fmt}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{p.desc}</p>
                <button type="button" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold rounded-lg hover:bg-orange-100 transition-colors">
                  <Download className="h-3 w-3" /> Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GALERÍA ── */}
      {tab === "galeria" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 leading-relaxed">Repositorio de fotografías corporativas, eventos e instalaciones. Uso exclusivo para comunicaciones oficiales de SDI.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GALERIA_MKT.map((nombre, i) => (
              <div key={i} className={`aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${["bg-slate-800","bg-slate-900","bg-slate-700","bg-slate-800"][i % 4]}`}>
                <span className="text-2xl">📷</span>
                <p className="text-[10px] text-white/50 text-center px-2 leading-tight">{nombre}</p>
              </div>
            ))}
          </div>
          <Pending owner="Ricardo / Nancy" desc="Galería completa de fotografías de colaboradores, eventos y conferencias. Marketing organiza y sube al repositorio antes del lanzamiento." />
        </div>
      )}

      {/* ── MATERIALES COMERCIALES ── */}
      {tab === "materiales" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 leading-relaxed">Materiales de ventas y comunicación comercial. Para uso de los equipos de Comercial y Proyectos.</p>
          {MATERIALES_MKT.map(m => (
            <div key={m.name} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl shrink-0">📊</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 mb-1.5">Dueño: {m.owner}</p>
                <button type="button" className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-semibold rounded-lg hover:bg-orange-100 transition-colors">
                  <Download className="h-3 w-3" /> Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── GOBERNANZA ── */}
      {tab === "gobernanza" && (
        <Card>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {[
                ["Dueño",          "Ricardo / Nancy — Marketing"],
                ["Respaldo",       "Pendiente definir"],
                ["Frecuencia",     "Cuando cambie (marca, logos) · Trimestral (brochures) · Al evento (galería)"],
                ["Casos de éxito", "Dueño: Comercial (Rogelio). Marketing enlaza — no duplica ni crea su propia versión."],
              ].map(([k, v]) => (
                <tr key={k} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-semibold text-slate-700 align-top w-40 text-xs uppercase tracking-wide">{k}</td>
                  <td className="py-3 text-slate-600 text-xs leading-relaxed">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex gap-3 items-start bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <span className="text-lg shrink-0">✅</span>
            <div>
              <p className="text-xs font-bold text-emerald-800 mb-0.5">Plantillas listas para MVP</p>
              <p className="text-xs text-emerald-700 leading-relaxed">Hoja membretada, firma digital, logos y presentación corporativa ya existen. Marketing solo necesita subirlos. Cero tiempo de creación.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── DEPT GENÉRICO CON TABS ──────────────────────────────────────────────────
const DEPT_CONFIG: Partial<Record<SectionId, { titulo: string; tabs: string[]; owner: string }>> = {
  cadena:    { titulo: "Cadena de Suministros",  tabs: ["Importación","Proveedores","Compras","Logística","Inventario"], owner: "Carolina" },
  comercial: { titulo: "Comercial",              tabs: ["Visión general","Producto (Store)","Servicios Industriales","Proyectos (MHS)"], owner: "Sergio · Rogelio" },
  seguridad: { titulo: "Seguridad Industrial",  tabs: ["Protocolos HSE","Normativas y certs.","Layouts de planta","Formatos de mejora"], owner: "Elias Arias" },
}

const SERVICIOS_CONFIG: Partial<Record<SectionId, { titulo: string; emoji: string; owner: string; desc: string }>> = {
  vacaciones:   { titulo:"Vacaciones",           emoji:"🏖️",owner:"Isabel · RH",         desc:"Política de vacaciones, días disponibles, formato de solicitud y calendario de aprobación." },
  evaluaciones: { titulo:"Evaluaciones",         emoji:"📋",owner:"Isabel · RH",         desc:"Evaluaciones semestrales de desempeño, criterios de calificación y proceso de retroalimentación." },
  encuestas:    { titulo:"Encuestas",            emoji:"📊",owner:"Habilitamiento · Yaz", desc:"Encuestas de clima laboral, satisfacción y retroalimentación organizacional." },
  tickets:      { titulo:"Tickets",             emoji:"🎫",owner:"Cruz · TI",            desc:"Sistema de tickets para solicitudes internas. Se integrará con Odoo al lanzamiento." },
  odoo:         { titulo:"Odoo ERP",            emoji:"🟠",owner:"Cruz · TI",            desc:"Guías de uso del sistema Odoo por módulo: compras, ventas, inventario, CRM y facturación." },
  intranet:     { titulo:"Intranet",            emoji:"🌐",owner:"Cruz · TI",            desc:"Recursos de la intranet SDI, repositorios internos y accesos a sistemas legados." },
  repositorios: { titulo:"Repositorios de datos",emoji:"🗂️",owner:"Cruz · TI",          desc:"Repositorios de documentos, formatos y archivos internos de SDI organizados por área." },
}

function SeccionDeptGenerico({ id }: { id: SectionId }) {
  const cfg = DEPT_CONFIG[id]
  if (!cfg) return null
  const tabs = cfg.tabs.map(l => ({ id: l.toLowerCase().replace(/\s+/g,"_"), label: l }))
  const [tab, setTab] = useState(tabs[0].id)
  return (
    <div className="space-y-4">
      <PageHeader title={cfg.titulo} />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <Pending owner={cfg.owner} desc={`Contenido de "${tabs.find(t=>t.id===tab)?.label}" · ${cfg.owner} entrega al lanzamiento.`} />
    </div>
  )
}

function SeccionServicio({ id }: { id: SectionId }) {
  const cfg = SERVICIOS_CONFIG[id]
  if (!cfg) return null
  return (
    <div className="space-y-4">
      <PageHeader title={cfg.titulo} />
      <Card className="text-center py-12!">
        <div className="text-5xl mb-4">{cfg.emoji}</div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">{cfg.titulo}</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">{cfg.desc}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-lg">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-xs text-amber-700 font-medium">Contenido pendiente · {cfg.owner}</span>
        </div>
      </Card>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const PORTAL_HOME_IDS: SectionId[] = ["portal-home","comunicados","indicadores","accesos-rapidos"]

export function PortalSDIView() {
  const [seccion, setSeccion]         = useState<SectionId>("portal-home")
  const [gruposOpen, setGruposOpen]   = useState<Set<string>>(new Set(["portal","conoce","departamentos","servicios"]))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [busqueda, setBusqueda]       = useState("")

  function toggleGrupo(id: string) {
    setGruposOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function navigate(id: SectionId) {
    setSeccion(id)
    // Scroll to top of content area when switching between main pages
    if (!PORTAL_HOME_IDS.includes(id)) {
      window.scrollTo({ top: 0 })
    }
  }

  function renderContent() {
    // Portal principal group → single scrollable home page, anchor controls scroll position
    if (PORTAL_HOME_IDS.includes(seccion)) {
      const anchor = seccion === "portal-home" ? undefined : seccion
      return <SeccionPortalHome scrollTo={anchor} />
    }
    switch (seccion) {
      case "quienes-somos":  return <SeccionConoceSDI key="quienes"    initialTab="quienes"    />
      case "organigrama":    return <SeccionConoceSDI key="organigrama" initialTab="organigrama" />
      case "onboarding":     return <SeccionConoceSDI key="onboarding"  initialTab="onboarding"  />
      case "mision":         return <SeccionMision />
      case "rh":             return <SeccionRH />
      case "administracion": return <SeccionAdministracion />
      case "ti":             return <SeccionTI />
      case "marketing":      return <SeccionMarketing />
      case "cadena":
      case "comercial":
      case "seguridad":      return <SeccionDeptGenerico id={seccion} />
      default:               return <SeccionServicio id={seccion} />
    }
  }

  const isPortalHome = PORTAL_HOME_IDS.includes(seccion)
  const itemActual   = GRUPOS.flatMap(g => g.items).find(i => i.id === seccion)

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-40">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-200 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Portal SDI</div>
              <div className="text-[9px] text-slate-400 leading-none">Intranet organizacional</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2">
            {GRUPOS.map(grupo => {
              const isOpen = gruposOpen.has(grupo.id)
              // "portal" group header navigates to portal-home
              const headerActive = grupo.id === "portal" && isPortalHome
              return (
                <div key={grupo.id} className="mb-1">
                  {/* Group header: label is clickable for navigation, arrow is separate toggle */}
                  <div className={`flex items-center pr-2 rounded-r-lg ${headerActive ? "bg-orange-50" : ""}`}>
                    <button
                      type="button"
                      onClick={() => { navigate(grupo.id === "portal" ? "portal-home" : grupo.items[0].id) }}
                      className={[
                        "flex-1 flex items-center gap-2 text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                        headerActive ? "text-orange-600" : "text-slate-900 hover:text-orange-600",
                      ].join(" ")}
                    >
                      {(() => { const GIcon = grupo.icon; return <GIcon className="h-3.5 w-3.5 shrink-0" /> })()}
                      {grupo.label}
                    </button>
                    {grupo.items.length > 0 && (
                      <button
                        type="button"
                        aria-label={isOpen ? "Colapsar" : "Expandir"}
                        onClick={() => toggleGrupo(grupo.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {grupo.items.length > 0 && isOpen && (
                    <div className="pb-1">
                      {grupo.items.map(item => {
                        const Icon = item.icon
                        const active = seccion === item.id
                        return (
                          <button key={item.id} type="button" onClick={() => navigate(item.id)}
                            className={["w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-all",
                              active ? "text-orange-600 bg-orange-50 border-r-2 border-orange-500" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                            ].join(" ")}>
                            <Icon className="h-3.5 w-3.5 shrink-0" />
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

          {/* Footer */}
          <div className="border-t border-slate-200 p-2">
            <Link href="/trabajo"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-all group">
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="flex-1">Team Marketing</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
            </Link>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarOpen ? "ml-52" : ""}`}>

        {/* Topbar */}
        <div className="h-12 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-30 shadow-sm">
          <button type="button" title="Menú" onClick={() => setSidebarOpen(o => !o)}
            className="h-8 w-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span>Portal SDI</span>
            {!isPortalHome && itemActual && (
              <><span className="text-slate-300">/</span><span className="text-slate-600 font-medium">{itemActual.label}</span></>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-48">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar…"
                className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none flex-1" />
            </div>
            <button type="button" aria-label="Notificaciones" className="relative h-8 w-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </button>
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">RR</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
