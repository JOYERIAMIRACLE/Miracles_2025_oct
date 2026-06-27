"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown, Bell, Search, Menu, Megaphone, ArrowRight,
  FileText, BarChart2, Zap, Users, GitBranch, UserCheck,
  ShoppingBag, DollarSign, Shield, Monitor, Calendar,
  ClipboardList, MessageSquare, Ticket, Database, Globe,
  Building2, Flag, Download, ExternalLink,
} from "lucide-react"

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SectionId =
  | "comunicados" | "indicadores" | "accesos-rapidos"
  | "quienes-somos" | "organigrama" | "onboarding"
  | "mision" | "rh" | "cadena" | "comercial" | "marketing" | "administracion" | "seguridad" | "ti"
  | "vacaciones" | "evaluaciones" | "encuestas" | "tickets" | "odoo" | "intranet" | "repositorios"

type NavItem  = { id: SectionId; label: string; icon: React.ElementType }
type NavGroup = { id: string; label: string; items: NavItem[] }

const GRUPOS: NavGroup[] = [
  {
    id: "portal", label: "Portal principal",
    items: [
      { id: "comunicados",    label: "Comunicados",     icon: Bell        },
      { id: "indicadores",    label: "Indicadores",     icon: BarChart2   },
      { id: "accesos-rapidos",label: "Accesos rápidos", icon: Zap         },
    ],
  },
  {
    id: "conoce", label: "Conoce a SDI",
    items: [
      { id: "quienes-somos", label: "¿Quiénes somos?", icon: Building2 },
      { id: "organigrama",   label: "Organigrama",      icon: GitBranch },
      { id: "onboarding",    label: "Onboarding",       icon: UserCheck },
    ],
  },
  {
    id: "departamentos", label: "Departamentos",
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
    id: "servicios", label: "Servicios y aplicaciones",
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

// ─── COMUNICADOS ──────────────────────────────────────────────────────────────
const AVISOS = [
  { color: "border-l-orange-500 bg-orange-50",   chip: "bg-orange-100 text-orange-700", emoji: "📋", area: "TI · Comunicado",        titulo: "Migración SAP → Odoo: activación módulos compras y logística", desc: "El 15 de junio se activan los nuevos módulos. Capacitaciones disponibles en TI y Soporte.", meta: "Cruz · Vigente hasta 30 jun 2026" },
  { color: "border-l-emerald-500 bg-emerald-50", chip: "bg-emerald-100 text-emerald-700",emoji: "🗓️",area: "Habilitamiento · Evento",  titulo: "Convivencia Q2 — 20 de junio",                                  desc: "Confirma asistencia antes del 10 de junio. Formulario disponible en Habilitamiento.",     meta: "Yaz · Vigente hasta 20 jun 2026" },
  { color: "border-l-blue-500 bg-blue-50",       chip: "bg-blue-100 text-blue-700",     emoji: "🛡️",area: "Seguridad · Normativa",    titulo: "Protocolos de seguridad industrial actualizados — mayo 2026",   desc: "Lectura obligatoria para personal de operaciones y planta.",                            meta: "Elias Arias · Vigente hasta 1 jul 2026" },
  { color: "border-l-orange-500 bg-orange-50",   chip: "bg-orange-100 text-orange-700", emoji: "💻", area: "TI · Actualización",       titulo: "Nuevo acceso a Power BI para área Comercial",                   desc: "Credenciales disponibles a través del formulario de solicitudes de TI.",                meta: "Cruz · Vigente hasta 15 jul 2026" },
]

function SeccionComunicados() {
  return (
    <div className="space-y-4">
      <PageHeader title="Comunicados" />
      <p className="text-sm text-slate-500">Avisos vigentes para todos los colaboradores SDI. Actualización semanal · Dueño: Habilitamiento</p>
      <div className="space-y-3">
        {AVISOS.map((a, i) => (
          <div key={i} className={`flex gap-4 p-4 rounded-xl border-l-4 border border-slate-200 ${a.color}`}>
            <span className="text-2xl shrink-0">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${a.chip}`}>{a.area}</span>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{a.titulo}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
              <p className="text-[10px] text-slate-400 mt-1.5">{a.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INDICADORES ─────────────────────────────────────────────────────────────
function SeccionIndicadores() {
  return (
    <div className="space-y-4">
      <PageHeader title="Indicadores" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { v: "157",  l: "Colaboradores",        t: "orange" },
          { v: "+19",  l: "Años de experiencia",  t: "blue"   },
          { v: "+35",  l: "Proyectos ejecutados", t: "emerald"},
          { v: "3",    l: "Unidades de negocio",  t: "violet" },
        ].map(s => (
          <Card key={s.l} className="text-center p-5!">
            <div className={`text-3xl font-bold text-${s.t}-600`}>{s.v}</div>
            <div className="text-xs text-slate-500 mt-1">{s.l}</div>
          </Card>
        ))}
      </div>
      <Pending owner="Cruz · TI" desc="Dashboards de Power BI se integrarán aquí. Cruz configura el embed al lanzamiento." />
    </div>
  )
}

// ─── ACCESOS RÁPIDOS ─────────────────────────────────────────────────────────
const ACCESOS = [
  { emoji: "📄", label: "Política de equipos", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { emoji: "📊", label: "Power BI",            bg: "bg-blue-50 border-blue-200 hover:bg-blue-100"     },
  { emoji: "🔗", label: "Odoo ERP",            bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { emoji: "👥", label: "Directorio",          bg: "bg-violet-50 border-violet-200 hover:bg-violet-100"   },
  { emoji: "🏢", label: "Organigrama",         bg: "bg-amber-50 border-amber-200 hover:bg-amber-100"      },
  { emoji: "🛠️", label: "Soporte TI",         bg: "bg-orange-50 border-orange-200 hover:bg-orange-100"   },
  { emoji: "📝", label: "Hoja membretada",     bg: "bg-blue-50 border-blue-200 hover:bg-blue-100"         },
  { emoji: "🗂️", label: "Formatos RH",        bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"},
]

function SeccionAccesosRapidos() {
  return (
    <div className="space-y-4">
      <PageHeader title="Accesos rápidos" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACCESOS.map(a => (
          <button type="button" key={a.label} className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:shadow-sm ${a.bg}`}>
            <span className="text-3xl">{a.emoji}</span>
            <span className="text-xs font-medium text-slate-700 text-center">{a.label}</span>
          </button>
        ))}
      </div>
      <Card className="text-center py-3!">
        <p className="text-xs text-slate-400">¿Falta algo? Solicita a TI agregar un acceso directo.</p>
      </Card>
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

// ─── DEPT GENÉRICO CON TABS ──────────────────────────────────────────────────
const DEPT_CONFIG: Partial<Record<SectionId, { titulo: string; tabs: string[]; owner: string }>> = {
  cadena:    { titulo: "Cadena de Suministros",  tabs: ["Importación","Proveedores","Compras","Logística","Inventario"], owner: "Carolina" },
  comercial: { titulo: "Comercial",              tabs: ["Visión general","Producto (Store)","Servicios Industriales","Proyectos (MHS)"], owner: "Sergio · Rogelio" },
  marketing: { titulo: "Marketing",             tabs: ["Identidad de marca","Plantillas","Galería multimedia","Materiales comerciales"], owner: "Ricardo · Nancy" },
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
export function PortalSDIView() {
  const [seccion, setSeccion]       = useState<SectionId>("comunicados")
  const [gruposOpen, setGruposOpen] = useState<Set<string>>(new Set(["portal","conoce","departamentos","servicios"]))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [busqueda, setBusqueda]     = useState("")

  function toggleGrupo(id: string) {
    setGruposOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function renderContent() {
    switch (seccion) {
      case "comunicados":    return <SeccionComunicados />
      case "indicadores":    return <SeccionIndicadores />
      case "accesos-rapidos":return <SeccionAccesosRapidos />
      case "quienes-somos":  return <SeccionConoceSDI initialTab="quienes"    />
      case "organigrama":    return <SeccionConoceSDI initialTab="organigrama" />
      case "onboarding":     return <SeccionConoceSDI initialTab="onboarding"  />
      case "mision":         return <SeccionMision />
      case "rh":             return <SeccionRH />
      case "administracion": return <SeccionAdministracion />
      case "ti":             return <SeccionTI />
      case "cadena":
      case "comercial":
      case "marketing":
      case "seguridad":      return <SeccionDeptGenerico id={seccion} />
      default:               return <SeccionServicio id={seccion} />
    }
  }

  const itemActual = GRUPOS.flatMap(g => g.items).find(i => i.id === seccion)

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
              return (
                <div key={grupo.id} className="mb-1">
                  <button type="button" onClick={() => toggleGrupo(grupo.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-900 hover:text-orange-600 transition-colors">
                    <span>{grupo.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="pb-1">
                      {grupo.items.map(item => {
                        const Icon = item.icon
                        const active = seccion === item.id
                        return (
                          <button key={item.id} type="button" onClick={() => setSeccion(item.id)}
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
            {itemActual && <><span className="text-slate-300">/</span><span className="text-slate-600 font-medium">{itemActual.label}</span></>}
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
        <div className="flex-1 p-6 max-w-4xl">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
