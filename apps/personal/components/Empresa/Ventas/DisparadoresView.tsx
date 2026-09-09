"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bell, RefreshCw, MessageCircle, CheckCircle2, Globe,
  Package, Truck, Cake, Clock, UserX, Mail, Loader2,
  ChevronRight, Inbox,
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

function daysUntilBirthday(fechaNacimiento: string): number | null {
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
    const hoy  = new Date().toISOString().slice(0, 10)
    const raw  = localStorage.getItem(`disparadores_atendidos_${hoy}`)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function marcarAtendido(id: string) {
  try {
    const hoy  = new Date().toISOString().slice(0, 10)
    const key  = `disparadores_atendidos_${hoy}`
    const set  = getAtendidosHoy()
    set.add(id)
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {}
}

// ── tipos ────────────────────────────────────────────────────────────────────

type Urgencia = "alta" | "media" | "baja"

interface Tarjeta {
  id:             string
  tipo:           string
  urgencia:       Urgencia
  nombre:         string
  telefono:       string | null
  descripcion:    string
  tiempoTexto:    string
  waTexto:        string
  href?:          string
}

interface Seccion {
  clave:    string
  titulo:   string
  icon:     React.ReactNode
  tarjetas: Tarjeta[]
  placeholder?: string
}

// ── sub-componentes ──────────────────────────────────────────────────────────

const urgenciaCls: Record<Urgencia, string> = {
  alta:  "border-l-red-500",
  media: "border-l-violet-500",
  baja:  "border-l-slate-600",
}

function TarjetaAccion({
  t, onAtendido,
}: { t: Tarjeta; onAtendido: (id: string) => void }) {
  const wa = waUrl(t.telefono, t.waTexto)
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 border-l-2 ${urgenciaCls[t.urgencia]}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-100 truncate">{t.nombre}</span>
          {t.urgencia === "alta" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">urgente</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.descripcion}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{t.tiempoTexto}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium transition">
            <MessageCircle size={12} /> WA
          </a>
        )}
        <button type="button" onClick={() => onAtendido(t.id)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition" title="Marcar como atendido">
          <CheckCircle2 size={14} />
        </button>
      </div>
    </div>
  )
}

function SeccionPanel({
  s, atendidos, onAtendido,
}: { s: Seccion; atendidos: Set<string>; onAtendido: (id: string) => void }) {
  const visibles = s.tarjetas.filter(t => !atendidos.has(t.id))
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-500">{s.icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.titulo}</h2>
        {visibles.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
            {visibles.length}
          </span>
        )}
      </div>
      {s.placeholder && visibles.length === 0 ? (
        <p className="text-[12px] text-slate-700 italic px-1">{s.placeholder}</p>
      ) : visibles.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <span className="text-[12px] text-slate-600">Sin acciones pendientes</span>
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map(t => (
            <TarjetaAccion key={t.id} t={t} onAtendido={onAtendido} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── vista principal ──────────────────────────────────────────────────────────

export function DisparadoresView() {
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [ventas,       setVentas]       = useState<VentaEmpresa[]>([])
  const [clientes,     setClientes]     = useState<Pick<ClienteEmpresa, "id" | "documentId" | "nombre" | "telefono" | "fechaNacimiento">[]>([])
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([])
  const [ventasAll,    setVentasAll]    = useState<{ clienteDocumentId: string; fecha: string }[]>([])
  const [loading,      setLoading]      = useState(true)
  const [atendidos,    setAtendidos]    = useState<Set<string>>(new Set())

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const POP_LEAD    = "populate[cliente][fields][0]=nombre&populate[cliente][fields][1]=telefono&populate[cliente][fields][2]=documentId"
      const POP_VENTA   = "populate[cliente][fields][0]=nombre&populate[cliente][fields][1]=telefono&populate[cliente][fields][2]=documentId"

      const [rLeads, rVentasCiclo, rClientes, rSusc, rVentasAll] = await Promise.all([
        fetch(`${BASE}/api/leads?${POP_LEAD}&filters[Funnel][$eq]=Lead&pagination[pageSize]=500&sort=createdAt:desc`),
        fetch(`${BASE}/api/ventas?${POP_VENTA}&filters[estado][$in][0]=Enviado&filters[estado][$in][1]=Entregado&pagination[pageSize]=200&sort=fecha:desc`),
        fetch(`${BASE}/api/clientes?fields[0]=nombre&fields[1]=telefono&fields[2]=documentId&fields[3]=fechaNacimiento&filters[fechaNacimiento][$notNull]=true&pagination[pageSize]=500`),
        fetch(`${BASE}/api/suscriptores?pagination[pageSize]=200&sort=createdAt:desc`),
        fetch(`${BASE}/api/ventas?fields[0]=fecha&populate[cliente][fields][0]=documentId&filters[estado][$in][0]=Pagado&filters[estado][$in][1]=Preparando&filters[estado][$in][2]=Enviado&filters[estado][$in][3]=Entregado&pagination[pageSize]=500&sort=fecha:desc`),
      ])

      const [jLeads, jVentasCiclo, jClientes, jSusc, jVentasAll] = await Promise.all([
        rLeads.json(), rVentasCiclo.json(), rClientes.json(), rSusc.json(), rVentasAll.json(),
      ])

      setLeads(jLeads.data ?? [])
      setVentas(jVentasCiclo.data ?? [])
      setClientes(jClientes.data ?? [])
      setSuscriptores(jSusc.data ?? [])
      setVentasAll((jVentasAll.data ?? []).map((v: any) => ({
        clienteDocumentId: v.cliente?.documentId ?? null,
        fecha:             v.fecha,
      })).filter((v: any) => v.clienteDocumentId))
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

  // Newsletter: suscriptores sin bienvenida enviada, últimos 30 días
  const tarjetasNewsletter: Tarjeta[] = suscriptores
    .filter(s => !s.bienvenidaEnviada && daysSince(s.createdAt) <= 30)
    .map(s => ({
      id:          `suscriptor_${s.documentId}`,
      tipo:        "newsletter",
      urgencia:    daysSince(s.createdAt) <= 1 ? "alta" : "media" as Urgencia,
      nombre:      s.nombre ?? s.email,
      telefono:    null,
      descripcion: `Nuevo suscriptor al newsletter — ${s.origen ?? "tienda"}`,
      tiempoTexto: fmtDias(daysSince(s.createdAt)),
      waTexto:     "",
    }))

  // Leads web sin seguimiento (< 72h)
  const tarjetasLeadWeb: Tarjeta[] = leads
    .filter(l => l.origenApp === "tienda" && daysSince(l.createdAt) <= 3)
    .map(l => ({
      id:          `lead_web_${l.documentId}`,
      tipo:        "lead_web",
      urgencia:    "alta" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Llegó por formulario web · interés: ${l.campanaOrigen ?? "sin especificar"}`,
      tiempoTexto: fmtDias(daysSince(l.createdAt)),
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, vi que nos escribiste desde nuestra página web 🙏 ¿En qué podemos ayudarte?`,
    }))

  // Leads fríos (7–30 días en Lead sin avanzar)
  const tarjetasLeadFrio: Tarjeta[] = leads
    .filter(l =>
      l.Funnel === "Lead" &&
      !l.fechaOferta && !l.fechaPedido && !l.fechaEntrega && !l.fechaRechazada &&
      daysSince(l.fechaLead ?? l.createdAt) > 7 &&
      daysSince(l.fechaLead ?? l.createdAt) <= 30
    )
    .map(l => ({
      id:          `lead_frio_${l.documentId}`,
      tipo:        "lead_frio",
      urgencia:    "media" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Lead sin actividad · sigue como Lead sin avanzar`,
      tiempoTexto: `${fmtDias(daysSince(l.fechaLead ?? l.createdAt))} en esta etapa`,
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, ¿seguimos en contacto? Queremos saber si podemos ayudarte con algo especial en joyería 💍`,
    }))

  // Leads muy fríos (> 30 días)
  const tarjetasLeadMuyFrio: Tarjeta[] = leads
    .filter(l =>
      l.Funnel === "Lead" &&
      !l.fechaOferta && !l.fechaPedido && !l.fechaEntrega && !l.fechaRechazada &&
      daysSince(l.fechaLead ?? l.createdAt) > 30
    )
    .map(l => ({
      id:          `lead_muyfrio_${l.documentId}`,
      tipo:        "lead_muyfrio",
      urgencia:    "baja" as Urgencia,
      nombre:      l.cliente?.nombre ?? "Sin nombre",
      telefono:    l.cliente?.telefono ?? null,
      descripcion: `Lead muy frío · más de un mes sin avanzar`,
      tiempoTexto: `${fmtDias(daysSince(l.fechaLead ?? l.createdAt))} en Lead`,
      waTexto:     `Hola ${l.cliente?.nombre?.split(" ")[0] ?? ""}, hace tiempo que no sabemos de ti. ¿Podemos ofrecerte algo especial? 💛`,
    }))

  // Pedidos enviados → notificar al cliente
  const tarjetasPedidoEnviado: Tarjeta[] = ventas
    .filter(v => v.estado === "Enviado")
    .map(v => ({
      id:          `enviado_${v.documentId}`,
      tipo:        "pedido_enviado",
      urgencia:    "alta" as Urgencia,
      nombre:      v.cliente?.nombre ?? "Sin nombre",
      telefono:    v.cliente?.telefono ?? null,
      descripcion: `Pedido ${v.numero ?? v.documentId.slice(0,8)} marcado como Enviado — notificar al cliente`,
      tiempoTexto: v.fecha,
      waTexto:     `Hola ${v.cliente?.nombre?.split(" ")[0] ?? ""} 🎉 Tu pedido ya está en camino. Pronto lo recibirás. Ante cualquier duda, aquí estamos.`,
    }))

  // Pedidos entregados → encuesta (mostrar todos, el equipo decide cuáles atender)
  const tarjetasPedidoEntregado: Tarjeta[] = ventas
    .filter(v => v.estado === "Entregado")
    .map(v => ({
      id:          `entregado_${v.documentId}`,
      tipo:        "pedido_entregado",
      urgencia:    "media" as Urgencia,
      nombre:      v.cliente?.nombre ?? "Sin nombre",
      telefono:    v.cliente?.telefono ?? null,
      descripcion: `Pedido ${v.numero ?? v.documentId.slice(0,8)} entregado — enviar encuesta de satisfacción`,
      tiempoTexto: v.fecha,
      waTexto:     `Hola ${v.cliente?.nombre?.split(" ")[0] ?? ""} 💍 ¿Ya te llegó tu joya? Nos encantaría saber qué te pareció. ¿Hubo algo que pudiéramos mejorar?`,
    }))

  // Cumpleaños próximos (30 días)
  const tarjetasCumpleanos: Tarjeta[] = clientes
    .filter(c => c.fechaNacimiento)
    .map(c => {
      const dias = daysUntilBirthday(c.fechaNacimiento!)!
      return { c, dias }
    })
    .filter(({ dias }) => dias >= 0 && dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .map(({ c, dias }) => ({
      id:          `cumple_${c.documentId}`,
      tipo:        "cumpleanos",
      urgencia:    dias <= 7 ? "alta" : dias <= 14 ? "media" : "baja" as Urgencia,
      nombre:      c.nombre,
      telefono:    c.telefono ?? null,
      descripcion: dias === 0 ? "¡Hoy es su cumpleaños! 🎂" : `Cumpleaños en ${dias} día${dias !== 1 ? "s" : ""}`,
      tiempoTexto: dias === 0 ? "HOY" : `en ${dias} días`,
      waTexto:     dias === 0
        ? `Hola ${c.nombre.split(" ")[0]} 🎂 ¡Hoy es tu cumpleaños! Todo el equipo de Medallita de Oro te desea un día increíble. Tenemos algo especial para ti.`
        : `Hola ${c.nombre.split(" ")[0]} 💫 ¡Se acerca tu cumpleaños! Queremos celebrarlo contigo. Tenemos algo especial que puede ser el regalo perfecto.`,
    }))

  // Sin compra en 6 meses (180 días)
  const ultimaVentaPorCliente = new Map<string, string>()
  for (const v of ventasAll) {
    const prev = ultimaVentaPorCliente.get(v.clienteDocumentId)
    if (!prev || v.fecha > prev) {
      ultimaVentaPorCliente.set(v.clienteDocumentId, v.fecha)
    }
  }
  const tarjetasSinCompra: Tarjeta[] = [...ultimaVentaPorCliente.entries()]
    .filter(([, fecha]) => daysSince(fecha) > 180)
    .map(([docId, fecha]) => {
      const venta  = ventasAll.find(v => v.clienteDocumentId === docId)
      const vFull  = ventas.find(v => v.cliente?.documentId === docId)
      const nombre = vFull?.cliente?.nombre ?? "Cliente"
      const tel    = vFull?.cliente?.telefono ?? null
      return {
        id:          `sin_compra_${docId}`,
        tipo:        "sin_compra",
        urgencia:    "baja" as Urgencia,
        nombre,
        telefono:    tel,
        descripcion: `Sin compra desde hace ${fmtDias(daysSince(fecha))}`,
        tiempoTexto: fmtDias(daysSince(fecha)),
        waTexto:     `Hola ${nombre.split(" ")[0]} 💛 Hace tiempo que no sabemos de ti. ¿Hay algo en lo que podamos ayudarte? Tenemos piezas nuevas que te pueden interesar.`,
      }
    })

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
      clave:   "prospectos",
      titulo:  "Prospectos",
      icon:    <Globe size={14} />,
      tarjetas: [...tarjetasLeadWeb, ...tarjetasLeadFrio, ...tarjetasLeadMuyFrio],
    },
    {
      clave:   "pedidos",
      titulo:  "Ciclo de Pedido",
      icon:    <Package size={14} />,
      tarjetas: [...tarjetasPedidoEnviado, ...tarjetasPedidoEntregado],
    },
    {
      clave:   "retencion",
      titulo:  "Retención",
      icon:    <Bell size={14} />,
      tarjetas: [...tarjetasCumpleanos, ...tarjetasSinCompra],
    },
  ]

  const totalVisible = secciones.reduce(
    (acc, s) => acc + s.tarjetas.filter(t => !atendidos.has(t.id)).length, 0
  )

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bell size={16} className="text-violet-400" />
            Acciones Pendientes
          </h1>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {loading ? "Calculando…" : totalVisible === 0 ? "Sin acciones pendientes hoy" : `${totalVisible} acción${totalVisible !== 1 ? "es" : ""} por atender`}
          </p>
        </div>
        <button type="button" onClick={cargar} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 rounded-lg transition disabled:opacity-40">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Calculando disparadores…</span>
          </div>
        ) : totalVisible === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-700">
            <Inbox size={36} strokeWidth={1.2} />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Todo atendido</p>
              <p className="text-[11px] text-slate-700 mt-0.5">Sin acciones pendientes en este momento</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {secciones.map(s => (
              <SeccionPanel key={s.clave} s={s} atendidos={atendidos} onAtendido={handleAtendido} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
