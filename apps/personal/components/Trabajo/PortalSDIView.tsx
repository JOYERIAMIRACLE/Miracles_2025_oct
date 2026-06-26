"use client"

import { useState } from "react"
import {
  Home, Building2, Users, Monitor, Shield, ShoppingBag,
  Megaphone, Wallet, ChevronDown, Bell, Search,
  Calendar, Headphones, Folder, Menu,
  AlertCircle, Info, CheckCircle, ArrowRight, Phone, Mail,
} from "lucide-react"

type SectionId = "inicio" | "conoce-sdi" | "rh" | "ti" | "seguridad" | "comercial" | "marketing" | "admin"
type TipoAviso = "info" | "alerta" | "exito" | "urgente"

// ---- DATA (hardcoded, se reemplaza con Strapi después) ----

const COMUNICADOS: { id: number; tipo: TipoAviso; titulo: string; fecha: string; area: string; desc: string }[] = [
  { id: 1, tipo: "info",   titulo: "Actualización de políticas de home office",      fecha: "24 jun 2026", area: "RH",        desc: "Se actualizaron las políticas de trabajo remoto. Todos los colaboradores deben firmar el nuevo acuerdo antes del 30 de junio." },
  { id: 2, tipo: "alerta", titulo: "Mantenimiento Odoo — Domingo 28 jun 12–18 hrs", fecha: "22 jun 2026", area: "TI",        desc: "El sistema estará fuera de línea para mantenimiento programado. Planifica tus actividades con anticipación." },
  { id: 3, tipo: "exito",  titulo: "¡SDI superó meta de ventas Q2 al 115%!",        fecha: "20 jun 2026", area: "Comercial", desc: "Gracias al esfuerzo de todos cerramos el trimestre por encima de la meta. ¡Felicitaciones a todo el equipo!" },
  { id: 4, tipo: "info",   titulo: "Nuevo protocolo de seguridad para visitantes",  fecha: "18 jun 2026", area: "Seguridad", desc: "A partir del 1 de julio todos los visitantes deberán registrarse en recepción con identificación oficial." },
]

const CUMPLEANOS = [
  { nombre: "Ana García",    area: "Marketing", dia: "28 jun" },
  { nombre: "Carlos Méndez", area: "TI",        dia: "2 jul"  },
  { nombre: "Laura Ortiz",   area: "RH",        dia: "5 jul"  },
]

const EVENTOS = [
  { titulo: "Junta directiva mensual",            fecha: "30 jun",   hora: "10:00", lugar: "Sala Ejecutiva"    },
  { titulo: "Capacitación: Nuevas políticas",     fecha: "1 jul",    hora: "09:00", lugar: "Sala Capacitación" },
  { titulo: "Evaluaciones semestrales",           fecha: "7–11 jul", hora: "—",     lugar: "RH"                },
]

const ACCESOS = [
  { label: "Soporte TI",  icon: Headphones, color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    desc: "Levantar un ticket"    },
  { label: "Vacaciones",  icon: Calendar,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Solicitar días"        },
  { label: "Directorio",  icon: Users,      color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  desc: "Contactos internos"    },
  { label: "Documentos",  icon: Folder,     color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   desc: "Plantillas y formatos" },
  { label: "Odoo",        icon: Monitor,    color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    desc: "Sistema ERP"           },
  { label: "Comunicados", icon: Bell,       color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  desc: "Avisos internos"       },
]

const DIRECTORIO = [
  { nombre: "Ricardo Rodríguez", cargo: "Director General",      area: "Dirección",  ext: "101", email: "rrodriguez@sdi.com" },
  { nombre: "Ana García",        cargo: "Coordinadora Marketing", area: "Marketing",  ext: "215", email: "agarcia@sdi.com"    },
  { nombre: "Carlos Méndez",     cargo: "Administrador de TI",   area: "TI",         ext: "330", email: "cmendez@sdi.com"    },
  { nombre: "Laura Ortiz",       cargo: "Jefa de RH",            area: "RH",         ext: "412", email: "lortiz@sdi.com"     },
  { nombre: "Marco Jiménez",     cargo: "Gerente Comercial",     area: "Comercial",  ext: "520", email: "mjimenez@sdi.com"   },
  { nombre: "Sofía Torres",      cargo: "Contadora",             area: "Finanzas",   ext: "611", email: "storres@sdi.com"    },
]

const NAV: { id: SectionId; label: string; icon: React.ElementType; children: string[] }[] = [
  { id: "inicio",     label: "Inicio",           icon: Home,       children: [] },
  { id: "conoce-sdi", label: "Conoce SDI",       icon: Building2,  children: ["¿Quiénes somos?", "Organigrama", "Directorio"] },
  { id: "rh",         label: "Recursos Humanos", icon: Users,      children: ["Prestaciones", "Vacaciones", "Onboarding", "Reglamento"] },
  { id: "ti",         label: "TI & Soporte",     icon: Monitor,    children: ["Solicitar soporte", "Políticas TI", "FAQ Odoo", "Accesos"] },
  { id: "seguridad",  label: "Seguridad",        icon: Shield,     children: ["Políticas", "Protocolos de emergencia", "Accesos físicos"] },
  { id: "comercial",  label: "Comercial",        icon: ShoppingBag,children: ["Guías de venta", "Catálogos", "Clientes clave"] },
  { id: "marketing",  label: "Marketing",        icon: Megaphone,  children: ["Brand guidelines", "Materiales", "Calendarios"] },
  { id: "admin",      label: "Administración",   icon: Wallet,     children: ["Políticas financieras", "Comprobantes", "Presupuestos"] },
]

// ---- SECCIÓN INICIO ----

function SeccionInicio() {
  const tipoBadge: Record<TipoAviso, { cls: string; Icon: React.ElementType }> = {
    info:    { cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20",        Icon: Info        },
    alerta:  { cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",     Icon: AlertCircle },
    exito:   { cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", Icon: CheckCircle },
    urgente: { cls: "bg-red-500/10 text-red-400 border border-red-500/20",           Icon: AlertCircle },
  }

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#0d1b2e] via-[#112240] to-[#0d2040] border border-[#1e3a5f] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-orange-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Bienvenido al</p>
            <h1 className="text-xl font-bold text-white">Portal SDI</h1>
            <p className="text-slate-400 text-xs mt-1">Tu espacio de información y recursos internos</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-slate-500 text-[10px]">Jueves</p>
            <p className="text-white text-base font-bold">26 jun 2026</p>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {ACCESOS.map(({ label, icon: Icon, color, bg, border, desc }) => (
            <button key={label} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${bg} ${border} hover:scale-[1.03] hover:brightness-110 transition-all cursor-pointer`}>
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-[11px] font-medium text-slate-200">{label}</span>
              <span className="text-[9px] text-slate-500 text-center leading-tight hidden sm:block">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2 columnas: comunicados + sidebar derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Comunicados */}
        <div className="lg:col-span-2 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Comunicados recientes</h2>
            <button className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {COMUNICADOS.map(c => {
              const { cls, Icon } = tipoBadge[c.tipo]
              return (
                <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-[#0b1426] border border-[#1a3050] hover:border-[#2a4a70] transition-colors cursor-pointer">
                  <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-200 leading-tight">{c.titulo}</p>
                      <span className="text-[10px] text-slate-600 shrink-0 whitespace-nowrap">{c.fecha}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{c.desc}</p>
                    <span className="inline-block mt-1.5 text-[10px] text-slate-500 bg-[#112240] px-2 py-0.5 rounded">{c.area}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">

          {/* Próximos eventos */}
          <div className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Próximos eventos</h2>
            <div className="space-y-3">
              {EVENTOS.map((e, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 text-center w-14">
                    <p className="text-[10px] text-orange-400 font-bold">{e.fecha}</p>
                    {e.hora !== "—" && <p className="text-[10px] text-slate-500">{e.hora}</p>}
                  </div>
                  <div className="flex-1 min-w-0 border-l border-[#1e3a5f] pl-3">
                    <p className="text-xs font-medium text-slate-200 leading-tight">{e.titulo}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{e.lugar}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cumpleaños */}
          <div className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">🎂 Cumpleaños</h2>
            <div className="space-y-2.5">
              {CUMPLEANOS.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-orange-400">{c.nombre[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200">{c.nombre}</p>
                    <p className="text-[10px] text-slate-500">{c.area}</p>
                  </div>
                  <span className="text-[10px] text-orange-400 font-semibold shrink-0">{c.dia}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- SECCIÓN DIRECTORIO ----

function SeccionDirectorio() {
  const [busq, setBusq] = useState("")
  const filtrados = DIRECTORIO.filter(d =>
    d.nombre.toLowerCase().includes(busq.toLowerCase()) ||
    d.area.toLowerCase().includes(busq.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-white">Directorio interno</h1>
        <div className="flex items-center gap-2 bg-[#0b1426] border border-[#1e3a5f] rounded-lg px-3 py-1.5">
          <Search className="h-3 w-3 text-slate-600" />
          <input
            value={busq}
            onChange={e => setBusq(e.target.value)}
            placeholder="Buscar persona o área…"
            className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-40"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(d => (
          <div key={d.email} className="rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-orange-400">{d.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{d.nombre}</p>
                <p className="text-[10px] text-slate-500 truncate">{d.cargo}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 bg-[#112240] px-2 py-0.5 rounded">{d.area}</span>
                <span className="text-[10px] text-slate-500">Ext. {d.ext}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Mail className="h-3 w-3" />
                <span className="truncate">{d.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Phone className="h-3 w-3" />
                <span>+52 (55) 0000-0000 ext. {d.ext}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- SECCIÓN GENÉRICA (placeholder) ----

function SeccionPlaceholder({ id, label }: { id: SectionId; label: string }) {
  const item = NAV.find(n => n.id === id)
  const Icon = item?.icon ?? Building2

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-[#1e3a5f]">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">{label}</h1>
          <p className="text-xs text-slate-500">Sección en construcción</p>
        </div>
      </div>

      {item?.children && item.children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {item.children.map(child => (
            <button key={child} className="flex items-center gap-3 p-4 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f] hover:border-orange-500/30 hover:bg-[#112240] transition-all text-left group">
              <div className="h-8 w-8 rounded-lg bg-[#112240] border border-[#1e3a5f] flex items-center justify-center group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all shrink-0">
                <Folder className="h-3.5 w-3.5 text-slate-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{child}</p>
                <p className="text-[10px] text-slate-600">Próximamente</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-orange-400 ml-auto transition-colors" />
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-[#0d1b2e] border border-dashed border-[#1e3a5f] p-8 text-center">
        <Icon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">El contenido de esta sección estará disponible pronto</p>
        <p className="text-slate-600 text-xs mt-1">Por ahora puedes explorar la estructura de navegación</p>
      </div>
    </div>
  )
}

// ---- COMPONENTE PRINCIPAL ----

export function PortalSDIView() {
  const [seccion, setSeccion]       = useState<SectionId>("inicio")
  const [expandidos, setExpandidos] = useState<Set<SectionId>>(new Set(["conoce-sdi"]))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [busqueda, setBusqueda]     = useState("")

  function toggleExpand(id: SectionId) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function navegar(id: SectionId) {
    setSeccion(id)
    if (NAV.find(n => n.id === id)?.children.length) {
      setExpandidos(prev => new Set([...prev, id]))
    }
  }

  const seccionActual = NAV.find(n => n.id === seccion)

  function renderContent() {
    if (seccion === "inicio") return <SeccionInicio />
    if (seccion === "conoce-sdi") return <SeccionDirectorio />
    return <SeccionPlaceholder id={seccion} label={seccionActual?.label ?? ""} />
  }

  return (
    <div
      className="flex rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#0b1426]"
      style={{ minHeight: "calc(100vh - 7rem)" }}
    >
      {/* ---- Sidebar ---- */}
      {sidebarOpen && (
        <aside className="w-52 shrink-0 bg-[#0d1b2e] border-r border-[#1e3a5f] flex flex-col">
          {/* Logo */}
          <div className="h-11 flex items-center gap-2.5 px-4 border-b border-[#1e3a5f] shrink-0">
            <div className="h-6 w-6 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Portal SDI</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2">
            {NAV.map(item => {
              const Icon = item.icon
              const active   = seccion === item.id
              const expanded = expandidos.has(item.id)
              const hasChildren = item.children.length > 0

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      navegar(item.id)
                      if (hasChildren) toggleExpand(item.id)
                    }}
                    className={[
                      "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all",
                      active
                        ? "bg-orange-500/10 text-orange-400 border-r-2 border-orange-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#112240]",
                    ].join(" ")}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {hasChildren && (
                      <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    )}
                  </button>

                  {hasChildren && expanded && (
                    <div className="ml-4 border-l border-[#1e3a5f] pl-3 pb-1">
                      {item.children.map(child => (
                        <button
                          key={child}
                          className="w-full text-left px-2 py-1.5 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-[#112240] rounded transition-colors truncate block"
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer sidebar */}
          <div className="px-3 py-3 border-t border-[#1e3a5f]">
            <p className="text-[10px] text-slate-600 text-center">SDI · Portal interno v1.0</p>
          </div>
        </aside>
      )}

      {/* ---- Main ---- */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="h-11 bg-[#0d1b2e] border-b border-[#1e3a5f] flex items-center gap-3 px-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#112240] transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Portal SDI</span>
            {seccionActual && seccionActual.id !== "inicio" && (
              <>
                <span className="text-slate-700">/</span>
                <span className="text-slate-300">{seccionActual.label}</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="ml-auto flex items-center gap-2 bg-[#0b1426] border border-[#1e3a5f] rounded-lg px-3 py-1.5 w-48">
            <Search className="h-3 w-3 text-slate-600 shrink-0" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en el portal…"
              className="bg-transparent text-[11px] text-slate-300 placeholder:text-slate-600 outline-none flex-1 min-w-0"
            />
          </div>

          {/* Notificaciones */}
          <button className="relative h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#112240] transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
          </button>

          {/* Avatar */}
          <div className="h-7 w-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-orange-400">RR</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
