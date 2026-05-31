"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, X, Check, Phone, Mail, MessageCircle,
  Pencil, Trash2, User, ArrowRight, CheckCircle2, FileText, UserSearch,
} from "lucide-react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import {
  ClienteEmpresa, ClientePayload, FUNNEL_COLOR, FUNNEL_LABEL,
} from "@/types/clienteEmpresa"
import { Cotizacion } from "@/types/cotizacion"
import { useGetCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { CotizacionModal } from "./CotizacionModal"

const CANALES = ["WhatsApp", "Instagram", "Facebook", "Llamada", "Email", "Referido", "Visita", "Otro"]

const fmtDt = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

function CanalIcon({ canal }: { canal: string | null }) {
  if (!canal) return null
  const c = canal.toLowerCase()
  if (c.includes("whatsapp"))  return <MessageCircle size={11} className="text-emerald-400 shrink-0" />
  if (c.includes("instagram")) return <span className="text-[9px] font-bold text-pink-400 shrink-0">IG</span>
  if (c.includes("facebook"))  return <span className="text-[9px] font-bold text-blue-400 shrink-0">FB</span>
  if (c.includes("email"))     return <Mail size={11} className="text-blue-400 shrink-0" />
  if (c.includes("llamada"))   return <Phone size={11} className="text-amber-400 shrink-0" />
  return <span className="text-[9px] text-slate-500 shrink-0">{canal.slice(0, 2).toUpperCase()}</span>
}

function emptyLead(): ClientePayload {
  return {
    nombre: "", email: null, telefono: null, direccion: null,
    segmento: null, Funnel: "Lead", calificado: false,
    canalContacto: null, origenContacto: null, Estado: "Activo", notas: null,
    fechaLead: new Date().toISOString(), fechaCalificado: null,
    fechaOferta: null, fechaPedido: null, fechaEntrega: null,
  }
}

// ─── Panel de lead ────────────────────────────────────────────────────────────
function LeadPanel({ lead, num, onClose, onUpdate, onEdit }: {
  lead: ClienteEmpresa; num: string
  onClose: () => void; onUpdate: (u: ClienteEmpresa) => void; onEdit: () => void
}) {
  const [cotModalState, setCotModalState] = useState<null | "nueva" | Cotizacion>(null)
  const { cotizaciones, setCotizaciones, loading: cotLoading } = useGetCotizaciones(lead.documentId)

  const handleCotizacionSaved = useCallback((saved: Cotizacion) => {
    setCotizaciones(prev => {
      const exists = prev.find(c => c.documentId === saved.documentId)
      return exists
        ? prev.map(c => c.documentId === saved.documentId ? saved : c)
        : [...prev, saved]
    })
    setCotModalState(null)
  }, [setCotizaciones])

  const avanzarAOferta = async () => {
    try {
      const extra = !lead.fechaOferta ? { fechaOferta: new Date().toISOString() } : {}
      const updated = await updateCliente(lead.documentId, { Funnel: "Oferta", ...extra })
      onUpdate(updated)
      toast.success("→ Oferta")
      onClose()
    } catch { toast.error("Error al avanzar") }
  }

  const toggleCalificado = async () => {
    const nuevoValor = !lead.calificado
    const extra = nuevoValor && !lead.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(lead.documentId, { calificado: nuevoValor, ...extra })
      onUpdate(updated)
      toast.success(nuevoValor ? "Lead calificado ✓" : "Calificación removida")
    } catch { toast.error("Error al actualizar") }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xs bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{lead.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border text-slate-400 bg-slate-800 border-slate-700">#{num}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR.Lead}`}>Lead</span>
                  {lead.calificado && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold bg-blue-500/15 text-blue-300 border-blue-500/30">Calificado</span>
                  )}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Contacto</p>
          {lead.telefono       && <p className="text-xs text-slate-300 flex items-center gap-2"><Phone size={11} className="text-slate-600" />{lead.telefono}</p>}
          {lead.email          && <p className="text-xs text-slate-300 flex items-center gap-2"><Mail size={11} className="text-slate-600" />{lead.email}</p>}
          {lead.canalContacto  && <p className="text-xs text-slate-300 flex items-center gap-2"><CanalIcon canal={lead.canalContacto} />{lead.canalContacto}</p>}
          {lead.origenContacto && <p className="text-[11px] text-slate-500">Origen: {lead.origenContacto}</p>}
          {lead.fechaLead      && <p className="text-[11px] text-slate-600">Entrada: {fmtDt(lead.fechaLead)}</p>}
          {lead.notas          && <p className="text-xs text-slate-400 italic mt-1">"{lead.notas}"</p>}
        </div>

        {/* Acciones rápidas */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Acciones</p>
          <button type="button" onClick={toggleCalificado}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
              lead.calificado
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}>
            <CheckCircle2 size={14} className={lead.calificado ? "text-blue-400" : "text-slate-600"} />
            {lead.calificado ? "Calificado ✓" : "Marcar como calificado"}
          </button>
          <button type="button" onClick={() => setCotModalState("nueva")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-800/50 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition">
            <FileText size={14} /> Nueva cotización
          </button>
          <button type="button" onClick={avanzarAOferta}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-800/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition">
            <ArrowRight size={14} /> Avanzar a Oferta
          </button>
        </div>

        {/* Cotizaciones */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">Cotizaciones</p>
            <button type="button" onClick={() => setCotModalState("nueva")}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition">
              <Plus size={10} /> Nueva
            </button>
          </div>
          {cotLoading ? (
            <p className="text-[10px] text-slate-700">Cargando...</p>
          ) : cotizaciones.length === 0 ? (
            <p className="text-[10px] text-slate-700 py-1">Sin cotizaciones aún.</p>
          ) : (
            <div className="space-y-0.5">
              {cotizaciones.map(c => (
                <button key={c.documentId} type="button" onClick={() => setCotModalState(c)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 transition text-left">
                  <div>
                    <p className="text-[11px] font-bold font-mono text-slate-300">{c.numero}</p>
                    <p className="text-[9px] text-slate-600">{fmtDt(c.fecha ?? c.createdAt)}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">
                    {c.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button type="button" onClick={onEdit}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-400">
            <Pencil size={12} /> Editar datos
          </button>
        </div>
      </div>

      {cotModalState && (
        <CotizacionModal
          cliente={lead}
          cotizacion={cotModalState === "nueva" ? null : cotModalState}
          totalCotizaciones={cotizaciones.length}
          onClose={() => setCotModalState(null)}
          onSaved={handleCotizacionSaved}
        />
      )}
    </div>
  )
}

// ─── Modal nuevo/editar lead ──────────────────────────────────────────────────
function LeadModal({ editando, form, setForm, onGuardar, onCerrar, guardando }: {
  editando: ClienteEmpresa | null; form: ClientePayload
  setForm: React.Dispatch<React.SetStateAction<ClientePayload>>
  onGuardar: () => void; onCerrar: () => void; guardando: boolean
}) {
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl = "block text-[11px] text-slate-500 mb-1"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar lead" : "Nuevo lead"}</h2>
          <button type="button" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        <div>
          <label className={lbl}>Nombre *</label>
          <input autoFocus value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre completo" className={inp} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Teléfono</label>
            <input value={form.telefono ?? ""}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value || null }))}
              placeholder="55 0000 0000" className={inp} />
          </div>
          <div>
            <label className={lbl}>Canal de contacto</label>
            <select value={form.canalContacto ?? ""} title="Canal"
              onChange={e => setForm(f => ({ ...f, canalContacto: e.target.value || null }))}
              className={inp}>
              <option value="">— Seleccionar —</option>
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={form.email ?? ""}
            onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
            placeholder="correo@email.com" className={inp} />
        </div>

        <div>
          <label className={lbl}>Origen del contacto</label>
          <input value={form.origenContacto ?? ""}
            onChange={e => setForm(f => ({ ...f, origenContacto: e.target.value || null }))}
            placeholder="Campaña, referido, visita espontánea…" className={inp} />
        </div>

        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setForm(f => ({ ...f, calificado: !f.calificado }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
              form.calificado
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            <CheckCircle2 size={15} className={form.calificado ? "text-blue-400" : "text-slate-600"} />
            {form.calificado ? "Calificado" : "Marcar como calificado"}
          </button>
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea value={form.notas ?? ""}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
            placeholder="Lo que comentó, qué le interesa…"
            rows={3} className={`${inp} resize-none h-auto py-2`} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={onGuardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} /> {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── LeadsView ────────────────────────────────────────────────────────────────
export function LeadsView() {
  const { clientes, setClientes, loading } = useGetClientes()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<ClienteEmpresa | null>(null)
  const [form,         setForm]         = useState<ClientePayload>(emptyLead())
  const [guardando,    setGuardando]    = useState(false)
  const [selectedLead, setSelectedLead] = useState<ClienteEmpresa | null>(null)
  const [filtro,       setFiltro]       = useState<"todos" | "calificado" | "sin_calificar">("todos")

  const leads = useMemo(() => {
    const all = clientes
      .filter(c => (c.Funnel ?? "Lead") === "Lead")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filtro === "calificado")    return all.filter(c => c.calificado)
    if (filtro === "sin_calificar") return all.filter(c => !c.calificado)
    return all
  }, [clientes, filtro])

  const numMap = useMemo(() => {
    const all = clientes
      .filter(c => (c.Funnel ?? "Lead") === "Lead")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const m = new Map<string, string>()
    all.forEach((c, i) => m.set(c.documentId, `L-${String(i + 1).padStart(3, "0")}`))
    return m
  }, [clientes])

  const stats = useMemo(() => ({
    total:       clientes.filter(c => (c.Funnel ?? "Lead") === "Lead").length,
    calificados: clientes.filter(c => (c.Funnel ?? "Lead") === "Lead" && c.calificado).length,
  }), [clientes])

  const abrirCrear  = () => { setEditando(null); setForm(emptyLead()); setModalOpen(true) }
  const abrirEditar = (c: ClienteEmpresa) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: "Lead", calificado: c.calificado,
      canalContacto: c.canalContacto, origenContacto: c.origenContacto, Estado: c.Estado, notas: c.notas,
      fechaLead: c.fechaLead, fechaCalificado: c.fechaCalificado,
      fechaOferta: c.fechaOferta, fechaPedido: c.fechaPedido, fechaEntrega: c.fechaEntrega,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCliente(editando.documentId, form)
        setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        if (selectedLead?.documentId === updated.documentId) setSelectedLead(updated)
        toast.success("Actualizado")
      } else {
        const nuevo = await createCliente(form)
        setClientes(prev => [...prev, nuevo])
        toast.success("Lead registrado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const borrar = async (c: ClienteEmpresa) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      if (selectedLead?.documentId === c.documentId) setSelectedLead(null)
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  const toggleCalificado = async (c: ClienteEmpresa) => {
    const nuevoValor = !c.calificado
    const extra = nuevoValor && !c.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { calificado: nuevoValor, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      if (selectedLead?.documentId === updated.documentId) setSelectedLead(updated)
      toast.success(nuevoValor ? "Lead calificado ✓" : "Calificación removida")
    } catch { toast.error("Error al actualizar") }
  }

  const handleUpdate = (updated: ClienteEmpresa) => {
    setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    setSelectedLead(updated)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <UserSearch size={18} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Leads</h1>
          </div>
          <p className="text-sm text-slate-500">
            {stats.total} leads · {stats.calificados} calificados
          </p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Total leads</p>
          <p className="text-xl font-bold text-slate-200">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Calificados</p>
          <p className="text-xl font-bold text-blue-400">{stats.calificados}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Sin calificar</p>
          <p className="text-xl font-bold text-slate-500">{stats.total - stats.calificados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5">
        {(["todos", "calificado", "sin_calificar"] as const).map(f => (
          <button key={f} type="button"
            onClick={() => setFiltro(f)}
            className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
              filtro === f
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {f === "todos" ? "Todos" : f === "calificado" ? "Calificados" : "Sin calificar"}
          </button>
        ))}
      </div>

      {/* Grid de leads */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center">
          <UserSearch size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-slate-600 text-sm">
            {filtro === "todos" ? "No hay leads registrados." : "No hay leads con este filtro."}
          </p>
          {filtro === "todos" && (
            <button type="button" onClick={abrirCrear}
              className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-500/10 transition mx-auto">
              <Plus size={14} /> Registrar primer lead
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {leads.map(c => (
            <div key={c.documentId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => setSelectedLead(c)}>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-slate-400 bg-slate-800 border-slate-700">
                  #{numMap.get(c.documentId) ?? "—"}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => abrirEditar(c)}
                    className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition"><Pencil size={11} /></button>
                  <button type="button" onClick={() => borrar(c)}
                    className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition"><Trash2 size={11} /></button>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-100 leading-snug">{c.nombre}</p>

              <div className="space-y-1">
                {c.canalContacto && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CanalIcon canal={c.canalContacto} />{c.canalContacto}
                  </span>
                )}
                {c.telefono && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} />{c.telefono}</p>}
                {c.notas && <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{c.notas}"</p>}
                {c.fechaLead && <p className="text-[9px] text-slate-700">{fmtDt(c.fechaLead)}</p>}
              </div>

              <button type="button"
                onClick={e => { e.stopPropagation(); toggleCalificado(c) }}
                className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                  c.calificado
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                    : "bg-slate-800/60 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
                }`}>
                <CheckCircle2 size={11} className={c.calificado ? "text-blue-400" : "text-slate-600"} />
                {c.calificado ? "Calificado" : "Calificar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <LeadModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          num={numMap.get(selectedLead.documentId) ?? "—"}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdate}
          onEdit={() => { abrirEditar(selectedLead); setSelectedLead(null) }}
        />
      )}
    </div>
  )
}
