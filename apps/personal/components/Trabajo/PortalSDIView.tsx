"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown, Bell, Search, Menu, Megaphone, ArrowRight,
  FileText, BarChart2, Zap, Users, GitBranch, UserCheck,
  ShoppingBag, DollarSign, Shield, Monitor, Calendar,
  ClipboardList, MessageSquare, Ticket, Database, Globe, Building2, Flag,
} from "lucide-react"

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SectionId =
  | "comunicados" | "indicadores" | "accesos-rapidos"
  | "quienes-somos" | "organigrama" | "onboarding"
  | "mision" | "rh" | "cadena" | "comercial" | "marketing" | "administracion" | "seguridad" | "ti"
  | "vacaciones" | "evaluaciones" | "encuestas" | "tickets" | "odoo" | "intranet" | "repositorios"

type NavItem  = { id: SectionId; label: string; icon: React.ElementType }
type NavGroup = { id: string; label: string; items: NavItem[] }

// ─── NAV ──────────────────────────────────────────────────────────────────────
const GRUPOS: NavGroup[] = [
  {
    id: "portal", label: "Portal principal",
    items: [
      { id: "comunicados",    label: "Comunicados",    icon: Bell         },
      { id: "indicadores",    label: "Indicadores",    icon: BarChart2    },
      { id: "accesos-rapidos",label: "Accesos rápidos",icon: Zap          },
    ],
  },
  {
    id: "conoce", label: "Conoce a SDI",
    items: [
      { id: "quienes-somos", label: "¿Quiénes somos?",      icon: Building2  },
      { id: "organigrama",   label: "Organigrama",           icon: GitBranch  },
      { id: "onboarding",    label: "Onboarding",            icon: UserCheck  },
    ],
  },
  {
    id: "departamentos", label: "Departamentos",
    items: [
      { id: "mision",         label: "Misión",                icon: Flag         },
      { id: "rh",             label: "Recursos Humanos",      icon: Users        },
      { id: "cadena",         label: "Cadena de suministros", icon: Globe        },
      { id: "comercial",      label: "Comercial",             icon: ShoppingBag  },
      { id: "marketing",      label: "Marketing",             icon: Megaphone    },
      { id: "administracion", label: "Administración",        icon: DollarSign   },
      { id: "seguridad",      label: "Seguridad",             icon: Shield       },
      { id: "ti",             label: "TI y Soporte",          icon: Monitor      },
    ],
  },
  {
    id: "servicios", label: "Servicios y aplicaciones",
    items: [
      { id: "vacaciones",   label: "Vacaciones",          icon: Calendar       },
      { id: "evaluaciones", label: "Evaluaciones",        icon: ClipboardList  },
      { id: "encuestas",    label: "Encuestas",           icon: MessageSquare  },
      { id: "tickets",      label: "Tickets",             icon: Ticket         },
      { id: "odoo",         label: "Odoo",                icon: Monitor        },
      { id: "intranet",     label: "Intranet",            icon: Globe          },
      { id: "repositorios", label: "Repositorios de datos",icon: Database      },
    ],
  },
]

// ─── SECTION: COMUNICADOS ─────────────────────────────────────────────────────
const AVISOS = [
  { tipo: "orange", emoji: "📋", area: "TI · Comunicado",       titulo: "Migración SAP → Odoo: activación módulos compras y logística", desc: "El 15 de junio se activan los nuevos módulos. Capacitaciones disponibles en la sección TI y Soporte.", meta: "Cruz · Vigente hasta 30 jun 2026" },
  { tipo: "green",  emoji: "🗓️", area: "Habilitamiento · Evento", titulo: "Convivencia Q2 — 20 de junio",                                  desc: "Confirma asistencia antes del 10 de junio. Formulario disponible en Habilitamiento.",              meta: "Yaz · Vigente hasta 20 jun 2026" },
  { tipo: "blue",   emoji: "🛡️", area: "Seguridad · Normativa",   titulo: "Protocolos de seguridad industrial actualizados — mayo 2026",   desc: "Lectura obligatoria para personal de operaciones y planta.",                                      meta: "Elias Arias · Vigente hasta 1 jul 2026" },
  { tipo: "orange", emoji: "💻", area: "TI · Actualización",      titulo: "Nuevo acceso a Power BI para área Comercial",                   desc: "Credenciales disponibles a través del formulario de solicitudes de TI.",                          meta: "Cruz · Vigente hasta 15 jul 2026" },
]

function SeccionComunicados() {
  const border = { orange: "border-l-orange-500", green: "border-l-emerald-500", blue: "border-l-blue-500" }
  const bg     = { orange: "bg-orange-500/10 text-orange-400", green: "bg-emerald-500/10 text-emerald-400", blue: "bg-blue-500/10 text-blue-400" }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-white">Comunicados</h1>
        <p className="text-xs text-slate-500 mt-0.5">Avisos vigentes para todos los colaboradores SDI</p>
      </div>
      <div className="space-y-3">
        {AVISOS.map((a, i) => (
          <div key={i} className={`flex gap-3 p-4 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] border-l-2 ${border[a.tipo as keyof typeof border]} hover:bg-[#112240] transition-colors cursor-pointer`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-lg ${bg[a.tipo as keyof typeof bg]}`}>{a.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{a.area}</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5 leading-tight">{a.titulo}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{a.desc}</p>
              <p className="text-[10px] text-slate-600 mt-2">{a.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SECTION: ACCESOS RÁPIDOS ─────────────────────────────────────────────────
const ACCESOS_DATA = [
  { emoji: "📄", label: "Política de equipos", bg: "bg-orange-500/10 border-orange-500/20" },
  { emoji: "📊", label: "Power BI",            bg: "bg-blue-500/10 border-blue-500/20"    },
  { emoji: "🔗", label: "Odoo ERP",            bg: "bg-emerald-500/10 border-emerald-500/20"},
  { emoji: "👥", label: "Directorio",          bg: "bg-violet-500/10 border-violet-500/20" },
  { emoji: "🏢", label: "Organigrama",         bg: "bg-amber-500/10 border-amber-500/20"  },
  { emoji: "🛠️", label: "Soporte TI",         bg: "bg-orange-500/10 border-orange-500/20" },
  { emoji: "📝", label: "Hoja membretada",     bg: "bg-blue-500/10 border-blue-500/20"    },
  { emoji: "🗂️", label: "Formatos RH",        bg: "bg-emerald-500/10 border-emerald-500/20"},
]

function SeccionAccesosRapidos() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-white">Accesos rápidos</h1>
        <p className="text-xs text-slate-500 mt-0.5">Atajos a las herramientas y recursos más usados</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACCESOS_DATA.map((a) => (
          <button type="button" key={a.label} className={`flex flex-col items-center gap-3 p-5 rounded-xl border ${a.bg} hover:scale-[1.03] hover:brightness-110 transition-all`}>
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-xs font-medium text-slate-300 text-center">{a.label}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-dashed border-[#1e3a5f] p-4 text-center">
        <p className="text-xs text-slate-600">¿Falta algo? Solicita agregar un acceso directo a TI.</p>
      </div>
    </div>
  )
}

// ─── SECTION: INDICADORES ─────────────────────────────────────────────────────
function SeccionIndicadores() {
  const stats = [
    { val: "157", lbl: "Colaboradores",        color: "text-orange-400", bg: "bg-orange-500/10" },
    { val: "+19", lbl: "Años de experiencia",  color: "text-blue-400",   bg: "bg-blue-500/10"   },
    { val: "+35", lbl: "Proyectos ejecutados", color: "text-emerald-400",bg: "bg-emerald-500/10" },
    { val: "3",   lbl: "Unidades de negocio",  color: "text-violet-400", bg: "bg-violet-500/10"  },
  ]
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-white">Indicadores</h1>
        <p className="text-xs text-slate-500 mt-0.5">Métricas clave de Soporte Dinámico Industrial</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.lbl} className={`rounded-xl border border-[#1e3a5f] ${s.bg} p-5 text-center`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-slate-400 mt-1">{s.lbl}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-dashed border-[#1e3a5f] p-8 text-center">
        <BarChart2 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Dashboards de Power BI se integrarán aquí</p>
        <p className="text-slate-600 text-xs mt-1">Pendiente · Cruz · TI</p>
      </div>
    </div>
  )
}

// ─── SECTION: QUIÉNES SOMOS ───────────────────────────────────────────────────
function SeccionQuienesSomos() {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">🏢 Conoce SDI</span>
        <h1 className="text-lg font-bold text-white mt-1">Soporte Dinámico Industrial</h1>
        <p className="text-xs text-slate-500 mt-0.5">Dueño: Habilitamiento · Yaz · Actualización: mensual</p>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        En <strong className="text-white">Soporte Dinámico Industrial</strong> somos una empresa mexicana encargada de suministrar soluciones de automatización y servicios integrales. Nos respaldan <strong className="text-white">más de 19 años de experiencia</strong> en el sector de la automatización industrial y en manejo de materiales, cubriendo toda la república mexicana.
      </p>

      {/* Misión y Visión */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Misión y Visión</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-5 bg-gradient-to-br from-[#1a2e1a] to-[#0d1b0d] border border-emerald-500/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Misión</div>
            <div className="text-sm font-bold text-white mb-2">¿Por qué existimos?</div>
            <p className="text-xs text-slate-300 leading-relaxed">Servir a las personas simplificando procesos a través de soluciones innovadoras y accesibles a todo nivel.</p>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-[#1e2d3d] to-[#243346] border border-blue-500/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Visión</div>
            <div className="text-sm font-bold text-white mb-2">¿A dónde vamos?</div>
            <p className="text-xs text-slate-300 leading-relaxed">Dar lo mejor, siendo el mejor proveedor de soluciones en automatización en México.</p>
          </div>
        </div>
      </div>

      {/* Las 3S */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Nuestra Promesa — Las 3 S</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎯", title: "Solucionar", text: "Ofrecer a nuestros clientes la mejor solución a sus necesidades a través de los productos y servicios que ofrecemos." },
            { icon: "⚡", title: "Simplificar", text: "Búsqueda continua de formas de simplificar procesos, con control, manejo de materiales o servicios integrales." },
            { icon: "🤝", title: "Servir",      text: "Seguimiento puntual a las necesidades del cliente brindando atención amable, integral y personalizada." },
          ].map(p => (
            <div key={p.title} className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4">
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="text-sm font-bold text-white mb-1">{p.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unidades de negocio */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Nuestras Unidades de Negocio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: "01", color: "border-orange-500/40 bg-orange-500/5", badge: "text-orange-400", nombre: "Automatización Industrial", desc: "Suministro de soluciones de automatización: controladores, sensores, comunicaciones, cómputo industrial, motores y visualización." },
            { n: "02", color: "border-slate-500/40 bg-slate-800/30",  badge: "text-slate-400",  nombre: "Manejo de Materiales",      desc: "Ergonomía industrial, transportadores, equipo de empaque y detección de metales. Promovemos el bienestar del trabajador." },
            { n: "03", color: "border-blue-500/40 bg-blue-500/5",     badge: "text-blue-400",   nombre: "Servicios Industriales",    desc: "Diseño e implementación de proyectos llave en mano. Más de 35 proyectos nacionales. Mantenimiento integral." },
          ].map(u => (
            <div key={u.n} className={`rounded-xl border p-4 ${u.color}`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${u.badge}`}>Unidad {u.n}</div>
              <div className="text-sm font-bold text-white mb-2">{u.nombre}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contacto */}
      <div className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Oficinas Centrales</h2>
        <p className="text-sm text-slate-300">Zona Poniente No. 510, Chapultepec · San Nicolás de los Garza, N.L. C.P. 66450</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {[["Conmutador","(81) 8100 9100"],["Soporte técnico","(81) 1824 5642"],["Correo","info@sdindustrial.com.mx"]].map(([k,v]) => (
            <div key={k} className="bg-[#0b1426] rounded-lg p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{k}</div>
              <div className="text-xs font-medium text-slate-300 mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: RH ──────────────────────────────────────────────────────────────
function SeccionRH() {
  const [open, setOpen] = useState<string | null>("sgmm")
  const prestaciones = [
    {
      id: "sgmm", emoji: "🏥", color: "border-emerald-500", badge: "text-emerald-400 bg-emerald-500/10",
      titulo: "Seguro Médico Mayor (SGMM)", sub: "Cobertura médica privada para el colaborador y dependientes", desde: "Incluida desde día 1",
      cubre: "Hospitalización, cirugías, médicos especialistas, medicamentos durante hospitalización, urgencias.",
      uso: "Presenta tu número de póliza en el hospital o clínica. Para urgencias llama al número de asistencia 24 hrs.",
      contacto: "Isabel · isabel@sdindustrial.com.mx",
    },
    {
      id: "odesa", emoji: "🦷", color: "border-blue-500", badge: "text-blue-400 bg-blue-500/10",
      titulo: "ODESA — Seguro Dental y de Visión", sub: "Cobertura dental y oftalmológica para el colaborador", desde: "Incluida desde día 1",
      cubre: "Consultas dentales, limpiezas, endodoncias, examen de vista y descuento en lentes.",
      uso: "Agenda cita con dentista u oftalmólogo de la red ODESA. Presenta tu credencial de afiliación.",
      contacto: "Isabel · Para solicitar credencial o reportar problema.",
    },
    {
      id: "ahorro", emoji: "💰", color: "border-amber-500", badge: "text-amber-400 bg-amber-500/10",
      titulo: "Fondo de Ahorro", sub: "Ahorro mensual descontado de nómina con aportación de SDI", desde: "A partir de 3 meses",
      cubre: "Se descuenta un porcentaje de tu sueldo mensual y SDI aporta una cantidad equivalente.",
      uso: "Contacta a Isabel en RH para registrar tu participación. Al cumplir 3 meses puedes activarlo.",
      contacto: "Isabel · Calendario de retiros en diciembre.",
    },
  ]
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">👥 Recursos Humanos</span>
        <h1 className="text-base font-bold text-white mt-1">Talento SDI</h1>
        <p className="text-xs text-slate-500 mt-0.5">Dueño: Isabel · Talento · Actualización: trimestral</p>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        Como colaborador de <strong className="text-white">SDI</strong> tienes acceso a las siguientes prestaciones. Aquí encontrarás qué cubre cada una, cómo activarla y a quién contactar.
      </p>
      <div className="space-y-3">
        {prestaciones.map(p => (
          <div key={p.id} className={`rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] border-l-2 ${p.color} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setOpen(open === p.id ? null : p.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#112240] transition-colors"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${p.badge}`}>{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-200">{p.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.sub}</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.badge}`}>{p.desde}</span>
              <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${open === p.id ? "rotate-180" : ""}`} />
            </button>
            {open === p.id && (
              <div className="px-4 pb-4 border-t border-[#1e3a5f]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {[["¿Qué cubre?", p.cubre], ["¿Cómo usarlo?", p.uso], ["Contacto RH", p.contacto]].map(([k, v]) => (
                    <div key={k} className="bg-[#0b1426] rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{k}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-dashed border-[#1e3a5f] p-4 text-center">
        <p className="text-xs text-slate-600">Políticas laborales, onboarding y capacitaciones · Pendiente · Isabel</p>
      </div>
    </div>
  )
}

// ─── SECTION: TI ──────────────────────────────────────────────────────────────
function SeccionTI() {
  const [openPol, setOpenPol] = useState<string | null>(null)
  const politicas = [
    {
      id: "computo", emoji: "💻", bg: "bg-orange-500/10", titulo: "Política de Uso de Equipo de Cómputo",
      aplica: "Todos los colaboradores con equipo asignado · Revisión: semestral",
      ok:  ["Uso para actividades laborales de SDI", "Instalar software autorizado por TI", "Uso de VPN para trabajo remoto con autorización", "Acceso a sistemas corporativos (Odoo, M365, Power BI)"],
      no:  ["Instalar software sin autorización de TI", "Compartir credenciales de acceso con terceros", "Desactivar antivirus o herramientas de seguridad", "Uso personal que comprometa el equipo"],
      nota: "Cualquier problema con el equipo (falla, pérdida, robo) debe reportarse a Cruz en TI dentro de las primeras 2 horas. soporte@sdindustrial.com.mx",
    },
    {
      id: "celular", emoji: "📱", bg: "bg-blue-500/10", titulo: "Política de Uso de Celulares Corporativos",
      aplica: "Colaboradores con celular asignado · Revisión: semestral",
      ok:  ["Llamadas y mensajes de trabajo", "Apps corporativas (Teams, Outlook, Odoo móvil)", "Uso personal moderado que no comprometa batería ni datos"],
      no:  ["Instalar apps sin autorización de TI", "Ceder el dispositivo a terceros", "Desactivar el PIN o bloqueo de pantalla"],
      nota: "",
    },
    {
      id: "red", emoji: "🌐", bg: "bg-emerald-500/10", titulo: "Política de Uso de Red y VPN",
      aplica: "Todos · Revisión: semestral",
      ok:  ["Acceso a internet para actividades laborales", "Uso de VPN con autorización previa de TI", "Conexión a sistemas internos desde red corporativa"],
      no:  ["Conectar dispositivos no autorizados a la red SDI", "Compartir contraseña WiFi con externos", "Descarga masiva de contenido no relacionado con trabajo"],
      nota: "",
    },
  ]
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">💻 TI y Soporte</span>
        <h1 className="text-base font-bold text-white mt-1">Tecnologías de Información</h1>
        <p className="text-xs text-slate-500 mt-0.5">Dueño: Cruz · TI — Respaldo: Erick · Actualización: trimestral</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        {[["📧","soporte@sdindustrial.com.mx"],["💬","Canal #soporte-ti en Teams"],["📞","(81) 1824 5642"],["⏱️","SLA: 4 hrs hábiles"]].map(([e, t]) => (
          <div key={t} className="rounded-lg bg-[#0d1b2e] border border-[#1e3a5f] p-3 text-center">
            <div className="text-lg mb-1">{e}</div>
            <div className="text-[10px] text-slate-400 leading-tight">{t}</div>
          </div>
        ))}
      </div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Políticas de uso</h2>
      <p className="text-xs text-slate-500">Aplican a todos los colaboradores desde el primer día.</p>
      <div className="space-y-2">
        {politicas.map(p => (
          <div key={p.id} className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] overflow-hidden">
            <button type="button" onClick={() => setOpenPol(openPol === p.id ? null : p.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#112240] transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xl shrink-0 ${p.bg}`}>{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{p.titulo}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.aplica}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openPol === p.id ? "rotate-180" : ""}`} />
            </button>
            {openPol === p.id && (
              <div className="px-4 pb-4 border-t border-[#1e3a5f]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">✅ Permitido</div>
                    <ul className="space-y-1.5">
                      {p.ok.map(t => <li key={t} className="flex gap-2 text-xs text-slate-300"><span className="text-emerald-400 shrink-0">•</span>{t}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">🚫 No permitido</div>
                    <ul className="space-y-1.5">
                      {p.no.map(t => <li key={t} className="flex gap-2 text-xs text-slate-300"><span className="text-red-400 shrink-0">•</span>{t}</li>)}
                    </ul>
                  </div>
                </div>
                {p.nota && <div className="mt-4 bg-[#0b1426] rounded-lg p-3 text-xs text-slate-400 leading-relaxed"><strong className="text-slate-300">Reporte de incidentes:</strong> {p.nota}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SECTION: ORGANIGRAMA ─────────────────────────────────────────────────────
function SeccionOrganigrama() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-white">Organigrama</h1>
        <p className="text-xs text-slate-500 mt-0.5">Dueño: Habilitamiento · Yaz</p>
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-10 text-center">
        <div className="text-5xl mb-4">🏗️</div>
        <h2 className="text-base font-bold text-white mb-2">Organigrama oficial SDI</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">Versión interactiva en desarrollo · Dueño: Yaz<br /><br />Aquí se publicará el organigrama navegable con nombres, cargos y áreas. Por ahora puedes descargar la versión PDF.</p>
        <button type="button" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm rounded-lg hover:bg-orange-500/20 transition-colors">
          <FileText className="h-3.5 w-3.5" /> Descargar organigrama PDF
        </button>
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4 flex gap-3">
        <div className="text-lg shrink-0">📝</div>
        <div>
          <div className="text-xs font-bold text-slate-400">Pendiente · Yaz · Habilitamiento</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">El organigrama interactivo requiere que Yaz entregue la lista de posiciones y jerarquías actualizada. Una vez recibida, se construye como componente web embebido.</p>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION GENÉRICA (placeholder) ──────────────────────────────────────────
const PENDIENTES: Partial<Record<SectionId, { emoji: string; titulo: string; owner: string; desc: string }>> = {
  "onboarding":     { emoji: "🚀", titulo: "Onboarding",               owner: "Isabel · RH",         desc: "Proceso de bienvenida, checklist de primer día, accesos y formatos de inicio. Isabel entrega el contenido." },
  "mision":         { emoji: "✝",  titulo: "Misión SDI",               owner: "Armando",              desc: "Propósito SDI, valores vivenciales, principios y comportamientos, formación espiritual." },
  "cadena":         { emoji: "🔗", titulo: "Cadena de Suministros",     owner: "Carolina",             desc: "Importación, proveedores, compras, logística e inventario. Carolina entrega el contenido." },
  "comercial":      { emoji: "💼", titulo: "Comercial",                 owner: "Sergio · Rogelio",     desc: "Los tres modelos de negocio: Producto (Store), Servicios Industriales y Proyectos (MHS)." },
  "marketing":      { emoji: "📣", titulo: "Marketing",                 owner: "Ricardo · Nancy",      desc: "Brand guidelines, materiales de campaña, calendarios y proceso de solicitud de materiales." },
  "administracion": { emoji: "💰", titulo: "Administración y Finanzas", owner: "Finanzas",             desc: "Políticas financieras, comprobantes, presupuestos y formatos de gastos." },
  "seguridad":      { emoji: "🦺", titulo: "Seguridad Industrial",      owner: "Elias Arias",          desc: "Protocolos HSE, normativas, certificaciones, layouts de planta y formatos de mejora." },
  "vacaciones":     { emoji: "🏖️", titulo: "Vacaciones",               owner: "Isabel · RH",          desc: "Política de vacaciones, formato de solicitud, días disponibles y calendario." },
  "evaluaciones":   { emoji: "📋", titulo: "Evaluaciones",              owner: "Isabel · RH",          desc: "Evaluaciones semestrales de desempeño, criterios y proceso." },
  "encuestas":      { emoji: "📊", titulo: "Encuestas",                 owner: "Habilitamiento · Yaz", desc: "Encuestas de clima laboral, satisfacción y retroalimentación." },
  "tickets":        { emoji: "🎫", titulo: "Tickets",                   owner: "Cruz · TI",            desc: "Sistema de tickets para solicitudes internas. Se integrará con el módulo de TI." },
  "odoo":           { emoji: "⚙️", titulo: "Odoo ERP",                  owner: "Cruz · TI",            desc: "Acceso al sistema Odoo, guías de uso por módulo y contacto de soporte." },
  "intranet":       { emoji: "🌐", titulo: "Intranet",                  owner: "TI",                   desc: "Recursos de la intranet SDI, repositorios y accesos internos." },
  "repositorios":   { emoji: "🗂️", titulo: "Repositorios de datos",    owner: "TI · Cruz",            desc: "Repositorios de documentos, formatos y archivos internos de SDI." },
}

function SeccionPendiente({ id }: { id: SectionId }) {
  const info = PENDIENTES[id]
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-white">{info?.titulo ?? id}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Dueño: {info?.owner ?? "—"}</p>
      </div>
      <div className="rounded-xl bg-[#0d1b2e] border border-dashed border-[#1e3a5f] p-10 text-center">
        <div className="text-5xl mb-4">{info?.emoji ?? "📁"}</div>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">{info?.desc}</p>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-[#0b1426] border border-[#1e3a5f] rounded-lg">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-[11px] text-slate-500">Contenido pendiente</span>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function PortalSDIView() {
  const [seccion, setSeccion]           = useState<SectionId>("comunicados")
  const [gruposOpen, setGruposOpen]     = useState<Set<string>>(new Set(["portal","conoce","departamentos","servicios"]))
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [busqueda, setBusqueda]         = useState("")

  function toggleGrupo(id: string) {
    setGruposOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function renderContent() {
    switch (seccion) {
      case "comunicados":    return <SeccionComunicados />
      case "indicadores":    return <SeccionIndicadores />
      case "accesos-rapidos":return <SeccionAccesosRapidos />
      case "quienes-somos":  return <SeccionQuienesSomos />
      case "organigrama":    return <SeccionOrganigrama />
      case "rh":             return <SeccionRH />
      case "ti":             return <SeccionTI />
      default:               return <SeccionPendiente id={seccion} />
    }
  }

  const itemActual = GRUPOS.flatMap(g => g.items).find(i => i.id === seccion)

  return (
    <div className="flex min-h-screen bg-[#0b1426]">

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside className="w-56 shrink-0 bg-[#0d1b2e] border-r border-[#1e3a5f] flex flex-col fixed inset-y-0 left-0 z-40">
          {/* Logo */}
          <div className="h-12 flex items-center gap-2.5 px-4 border-b border-[#1e3a5f] shrink-0">
            <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Portal SDI</div>
              <div className="text-[9px] text-slate-500 leading-none">Intranet organizacional</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
            {GRUPOS.map(grupo => {
              const isOpen = gruposOpen.has(grupo.id)
              return (
                <div key={grupo.id} className="mb-1">
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => toggleGrupo(grupo.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    <span>{grupo.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Items */}
                  {isOpen && (
                    <div className="space-y-0.5 pb-1">
                      {grupo.items.map(item => {
                        const Icon   = item.icon
                        const active = seccion === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSeccion(item.id)}
                            className={[
                              "w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-all",
                              active
                                ? "bg-orange-500/10 text-orange-400 border-r-2 border-orange-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-[#112240]",
                            ].join(" ")}
                          >
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
          <div className="border-t border-[#1e3a5f] p-2">
            <Link href="/trabajo" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-orange-300 hover:bg-[#112240] transition-all group">
              <Megaphone className="h-3.5 w-3.5 shrink-0 group-hover:text-orange-400 transition-colors" />
              <span className="flex-1">Team Marketing</span>
              <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-orange-400 transition-colors" />
            </Link>
            <p className="text-[9px] text-slate-700 text-center mt-1.5">SDI · Portal interno v1.0</p>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarOpen ? "ml-56" : ""}`}>

        {/* Topbar */}
        <div className="h-11 bg-[#0d1b2e] border-b border-[#1e3a5f] flex items-center gap-3 px-4 sticky top-0 z-30">
          <button type="button" title="Alternar menú" onClick={() => setSidebarOpen(o => !o)}
            className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#112240] transition-colors">
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Portal SDI</span>
            {itemActual && (
              <><span className="text-slate-700">/</span><span className="text-slate-300">{itemActual.label}</span></>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-[#0b1426] border border-[#1e3a5f] rounded-lg px-3 py-1.5 w-48">
            <Search className="h-3 w-3 text-slate-600 shrink-0" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en el portal…"
              className="bg-transparent text-[11px] text-slate-300 placeholder:text-slate-600 outline-none flex-1 min-w-0" />
          </div>

          <button type="button" title="Notificaciones"
            className="relative h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#112240] transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
          </button>

          <div className="h-7 w-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-orange-400">RR</span>
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
