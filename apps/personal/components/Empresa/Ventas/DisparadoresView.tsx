"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bell, RefreshCw, MessageCircle, CheckCircle2, Globe,
  Package, Mail, Loader2, Inbox,
} from "lucide-react"
import { Lead } from "@/types/lead"
import { VentaEmpresa } from "@/types/ventaEmpresa"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { Suscriptor } from "@/types/suscriptor"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// ── helpers ─────────────────────────────────────────────────────────────────

function daysSince(iso: string | null): number {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function daysUntilBirthday(fechaNacimiento: string): number {
  const bday = new Date(fechaNacimiento)
  const hoy  = new Date()
  let thisYear = new Date(hoy.getFullYear(), bday.getMonth(), bday.getDate())
  if (thisYear < hoy) thisYear = new Date(hoy.getFullYear() + 1, bday.getMonth(), bday.getDate())
  return Math.floor((thisYear.getTime() - hoy.getTime()) / 86_400_000)
}

function waUrl(telefono: string | null, texto: string): string | null {
  if (!telefono) return null
  const digits = telefono.replace(/\D/g, "")
  const num    = digits.length === 10 ? `52${digits}` : digits
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

function fmtDias(n: number): string {
  if (n === 0) return "hoy"
  if (n === 1) return "ayer"
  if (n < 7)   return `hace ${n} días`
  if (n < 31)  return `hace ${Math.round(n / 7)} sem`
  return `hace ${Math.round(n / 30)} meses`
}

function getAtendidosHoy(): Set<string> {
  try {
    const hoy = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(`disparadores_atendidos_${hoy}`)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function marcarAtendido(id: string) {
  try {
    const hoy = new Date().toISOString().slice(0, 10)
    const key = `disparadores_atendidos_${hoy}`
    const set = getAtendidosHoy()
    set.add(id)
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {}
}

// ── tipos ────────────────────────────────────────────────────────────────────

type Urgencia = "alta" | "media" | "baja"

interface Tarjeta {
  id:          string
  urgencia:    Urgencia
  nombre:      string
  telefono:    string | null
  descripcion: string
  tiempoTexto: string
  waTexto:     string
}

interface Seccion {
  clave:        string
  titulo:       string
  icon:         React.ReactNode
  tarjetas:     Tarjeta[]
  placeholder?: string
}

// ── sub-componentes ──────────────────────────────────────────────────────────

const urgenciaBorder: Record<Urgencia, string> = {
  alta:  "border-l-red-500",
  media: "border-l-violet-500",
  baja:  "border-l-slate-300 dark:border-l-slate-600",
}

function TarjetaAccion({ t, onAtendido }: { t: Tarjeta; onAtendido: (id: string) => void }) {
  const wa = waUrl(t.telefono, t.waTexto)
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-2 ${urgenciaBorder[t.urgencia]} shadow-sm`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{t.nombre}</span>
          {t.urgencia === "alta" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">urgente</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t.descripcion}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">{t.tiempoTexto}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium transition">
            <MessageCircle size={12} /> WA
          </a>
        )}
        <button type="button" onClick={() => onAtendido(t.id)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Marcar como atendido">
          <CheckCircle2 size={14} />
        </button>
      </div>
    </div>
  )
}

function SeccionPanel({ s, atendidos, onAtendido }: { s: Seccion; atendidos: Set<string>; onAtendido: (id: string) => void }) {
  const visibles = s.tarjetas.filter(t => !atendidos.has(t.id))
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400 dark:text-slate-500">{s.icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{s.titulo}</h2>
        {visibles.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
            {visibles.length}
          </span>
        )}
      </div>
      {s.placeholder && visibles.length === 0 ? (
        <p className="text-[12px] text-slate-400 dark:text-slate-600 italic px-1">{s.placeholder}</p>
      ) : visibles.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <span className="text-[12px] text-slate-500 dark:text-slate-600">Sin acciones pendientes</span>
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map(t => <TarjetaAccion key={t.id} t={t} onAtendido={onAtendido} />)}
        </div>
      )}
    </div>
  )
}

// ── vista principal ──────────────────────────────────────────────────────────

type VentaResumen = { clienteDocumentId: string; clienteNombre: string; clienteTelefono: string | null; fecha: string }

export function DisparadoresView() {
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [ventas,       setVentas]       = useState<VentaEmpresa[]>([])
  const [clientes,     setClientes]     = useState<Pick<ClienteEmpresa, "id" | "documentId" | "nombre" | "telefono" | "fechaNacimiento">[]>([])
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([])
  const [ventasAll,    setVentasAll]    = useState<VentaResumen[]>([])
  const [loading,      setLoading]      = useState(true)
  const [atendidos,    setAtendidos]    = useState<Set<string>>(new Set())

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const POP_CLI = "populate[cliente][fields][0]=nombre&populate[cliente][fields][1]=telefono&populate[cliente][fields][2]=documentId"

      const [rLeads, rVentasCiclo, rClientes, rSusc, rVentasAll] = await Promise.all([
        fetch(`${BASE}/api/leads?${POP_CLI}&filters[Funnel][$eq]=Lead&pagination[pageSize]=500&sort=createdAt:desc`),
        fetch(`${BASE}/api/ventas?${POP_CLI}&filters[estado][$in][0]=Enviado&filters[estado][$in][1]=Entregado&pagination[pageSize]=200&sort=fecha:desc`),
        fetch(`${BASE}/api/clientes?fields[0]=nombre&fields[1]=telefono&fields[2]=documentId&fields[3]=fechaNacimiento&filters[fechaNacimiento][$notNull]=true&pagination[pageSize]=500`),
        fetch(`${BASE}/api/suscriptores?pagination[pageSize]=200&sort=createdAt:desc`),
        fetch(`${BASE}/api/ventas?${POP_CLI}&fields[0]=fecha&filters[estado][$in][0]=Pagado&filters[estado][$in][1]=Preparando&filters[estado][$in][2]=Enviado&filters[estado][$in][3]=Entregado&pagination[pageSize]=500&sort=fecha:desc`),
      ])

      const [jLeads, jVentasCiclo, jClientes, jSusc, jVentasAll] = await Promise.all([
        rLeads.json(), rVentasCiclo.json(), rClientes.json(), rSusc.json(), rVentasAll.json(),
      ])

      setLeads(jLeads.data ?? [])
      setVentas(jVentasCiclo.data ?? [])
      setClientes(jClientes.data ?? [])
      setSuscriptores(jSusc.data ?? [])
      setVentasAll(
        (jVentasAll.data ?? [])
          .filter((v: any) => v.cliente?.documentId)
          .map((v: any) => ({
            clienteDocumentId: v.cliente.documentId,
            clienteNombre:     v.cliente.nombre ?? "Cliente",
            clienteTelefono:   v.cliente.telefono ?? null,
            fecha:             v.fecha,
          }))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setAtendidos(getAtendidosHoy()) }, [])

  const handleAtendido = (id: string) => {
    marcarAtendido(id)
    setAtendidos(prev => new Set([...prev, id]))
  }

  // ── cálculo de triggers ────────────────────────────────────────────────────

  const tarjetasNewsletter: Tarjeta[] = suscriptores
    .filter(s => !s.bienvenidaEnviada && daysSince(s.createdAt) <= 30)
    .map(s => ({
      id:          `suscriptor_${s.documentId}`,
      urgencia:    daysSince(s.createdAt) <= 1 ? "alta" : "media" as Urgencia,
      nombre:      s.nombre ?? s.email,
      telefono:    null,
      descripcion: `Nuevo suscriptor al newsletter — ${s.origen ?? "tienda"}`,
      tiempoTexto: fmtDias(daysSince(s.createdAt)),
      waTexto:     "",
    }))

  const tarjetasLeadWeb: Tarjeta[] = leads
    .filter(l => l.origenApp === "tienda" && daysSince(l.createdAt) <= 3)
    .map(l => ({
      id:          `lead_web_${l.documentId}`,
      urgencia:    "alta" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Llegó por formulario web · ${l.campanaOrigen ? `interés: ${l.campanaOrigen}` : "sin interés especificado"}`,
      tiempoTexto: fmtDias(daysSince(l.createdAt)),
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, vi que nos escribiste desde nuestra página web 🙏 ¿En qué podemos ayudarte?`,
    }))

  const tarjetasLeadFrio: Tarjeta[] = leads
    .filter(l =>
      l.Funnel === "Lead" &&
      !l.fechaOferta && !l.fechaPedido && !l.fechaEntrega && !l.fechaRechazada &&
      daysSince(l.fechaLead ?? l.createdAt) > 7 &&
      daysSince(l.fechaLead ?? l.createdAt) <= 30
    )
    .map(l => ({
      id:          `lead_frio_${l.documentId}`,
      urgencia:    "media" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Sin avanzar desde hace ${fmtDias(daysSince(l.fechaLead ?? l.createdAt))}`,
      tiempoTexto: `${fmtDias(daysSince(l.fechaLead ?? l.createdAt))} en Lead`,
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, ¿seguimos en contacto? Queremos saber si podemos ayudarte con algo especial en joyería 💍`,
    }))

  const tarjetasLeadMuyFrio: Tarjeta[] = leads
    .filter(l =>
      l.Funnel === "Lead" &&
      !l.fechaOferta && !l.fechaPedido && !l.fechaEntrega && !l.fechaRechazada &&
      daysSince(l.fechaLead ?? l.createdAt) > 30
    )
    .map(l => ({
      id:          `lead_muyfrio_${l.documentId}`,
      urgencia:    "baja" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Más de un mes sin actividad`,
      tiempoTexto: `${fmtDias(daysSince(l.fechaLead ?? l.createdAt))} en Lead`,
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, hace tiempo que no sabemos de ti. ¿Podemos ofrecerte algo especial? 💛`,
    }))

  const tarjetasPedidoEnviado: Tarjeta[] = ventas
    .filter(v => v.estado === "Enviado")
    .map(v => ({
      id:          `enviado_${v.documentId}`,
      urgencia:    "alta" as Urgencia,
      nombre:      v.cliente?.nombre ?? "Sin nombre",
      telefono:    v.cliente?.telefono ?? null,
      descripcion: `Pedido ${v.numero ?? "#"} en camino — notificar al cliente`,
      tiempoTexto: v.fecha,
      waTexto:     `Hola ${v.cliente?.nombre?.split(" ")[0] ?? ""} 🎉 Tu pedido ya está en camino. Pronto lo recibirás. Ante cualquier duda, aquí estamos.`,
    }))

  const tarjetasPedidoEntregado: Tarjeta[] = ventas
    .filter(v => v.estado === "Entregado")
    .map(v => ({
      id:          `entregado_${v.documentId}`,
      urgencia:    "media" as Urgencia,
      nombre:      v.cliente?.nombre ?? "Sin nombre",
      telefono:    v.cliente?.telefono ?? null,
      descripcion: `Pedido ${v.numero ?? "#"} entregado — enviar encuesta de satisfacción`,
      tiempoTexto: v.fecha,
      waTexto:     `Hola ${v.cliente?.nombre?.split(" ")[0] ?? ""} 💍 ¿Ya te llegó tu joya? Nos encantaría saber qué te pareció.`,
    }))

  const tarjetasCumpleanos: Tarjeta[] = clientes
    .filter(c => c.fechaNacimiento)
    .map(c => ({ c, dias: daysUntilBirthday(c.fechaNacimiento!) }))
    .filter(({ dias }) => dias >= 0 && dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .map(({ c, dias }) => ({
      id:          `cumple_${c.documentId}`,
      urgencia:    dias <= 7 ? "alta" : dias <= 14 ? "media" : "baja" as Urgencia,
      nombre:      c.nombre,
      telefono:    c.telefono ?? null,
      descripcion: dias === 0 ? "¡Hoy es su cumpleaños! 🎂" : `Cumpleaños en ${dias} día${dias !== 1 ? "s" : ""}`,
      tiempoTexto: dias === 0 ? "HOY" : `en ${dias} días`,
      waTexto:     dias === 0
        ? `Hola ${c.nombre.split(" ")[0]} 🎂 ¡Hoy es tu cumpleaños! Todo el equipo de Medallita de Oro te desea un día increíble. ¡Tenemos algo especial para ti!`
        : `Hola ${c.nombre.split(" ")[0]} 💫 ¡Se acerca tu cumpleaños! Queremos celebrarlo contigo con algo especial.`,
    }))

  // Para "sin compra" usamos ventasAll que ya tiene nombre y teléfono del cliente
  const ultimaVentaPorCliente = new Map<string, VentaResumen>()
  for (const v of ventasAll) {
    const prev = ultimaVentaPorCliente.get(v.clienteDocumentId)
    if (!prev || v.fecha > prev.fecha) ultimaVentaPorCliente.set(v.clienteDocumentId, v)
  }
  const tarjetasSinCompra: Tarjeta[] = [...ultimaVentaPorCliente.values()]
    .filter(v => daysSince(v.fecha) > 180)
    .map(v => ({
      id:          `sin_compra_${v.clienteDocumentId}`,
      urgencia:    "baja" as Urgencia,
      nombre:      v.clienteNombre,
      telefono:    v.clienteTelefono,
      descripcion: `Sin compra en ${fmtDias(daysSince(v.fecha))}`,
      tiempoTexto: fmtDias(daysSince(v.fecha)),
      waTexto:     `Hola ${v.clienteNombre.split(" ")[0]} 💛 Hace tiempo que no sabemos de ti. ¿Hay algo en lo que podamos ayudarte? Tenemos piezas nuevas que te pueden interesar.`,
    }))

  // ── secciones ──────────────────────────────────────────────────────────────

  const secciones: Seccion[] = [
    {
      clave:       "newsletter",
      titulo:      "Newsletter",
      icon:        <Mail size={14} />,
      tarjetas:    tarjetasNewsletter,
      placeholder: "Sin suscriptores pendientes de bienvenida",
    },
    {
      clave:    "prospectos",
      titulo:   "Prospectos",
      icon:     <Globe size={14} />,
      tarjetas: [...tarjetasLeadWeb, ...tarjetasLeadFrio, ...tarjetasLeadMuyFrio],
    },
    {
      clave:    "pedidos",
      titulo:   "Ciclo de Pedido",
      icon:     <Package size={14} />,
      tarjetas: [...tarjetasPedidoEnviado, ...tarjetasPedidoEntregado],
    },
    {
      clave:    "retencion",
      titulo:   "Retención",
      icon:     <Bell size={14} />,
      tarjetas: [...tarjetasCumpleanos, ...tarjetasSinCompra],
    },
  ]

  const totalVisible = secciones.reduce(
    (acc, s) => acc + s.tarjetas.filter(t => !atendidos.has(t.id)).length, 0
  )

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell size={15} className="text-violet-500 dark:text-violet-400" />
            Acciones Pendientes
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
            {loading
              ? "Calculando…"
              : totalVisible === 0
              ? "Sin acciones pendientes hoy"
              : `${totalVisible} acción${totalVisible !== 1 ? "es" : ""} por atender`}
          </p>
        </div>
        <button type="button" onClick={cargar} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg transition disabled:opacity-40">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40 gap-2 text-slate-400 dark:text-slate-600">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Calculando disparadores…</span>
        </div>
      ) : totalVisible === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <Inbox size={34} strokeWidth={1.2} className="text-slate-300 dark:text-slate-700" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-500">Todo atendido</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">Sin acciones pendientes en este momento</p>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-7">
          {secciones.map(s => (
            <SeccionPanel key={s.clave} s={s} atendidos={atendidos} onAtendido={handleAtendido} />
          ))}
        </div>
      )}
    </div>
  )
}
