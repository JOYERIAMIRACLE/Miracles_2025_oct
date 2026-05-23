"use client"

import { useState, useMemo } from "react"
import {
  Plus, X, Check, Phone, Mail, MessageCircle,
  ChevronRight, ChevronLeft, Pencil, Trash2, User,
  Hash, ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS,
} from "@/types/clienteEmpresa"

// ─── Metadatos por etapa ──────────────────────────────────────────────────────

const STAGE_META: Record<FunnelEtapa, { prefix: string; desc: string; nextLabel?: string }> = {
  Lead:       { prefix: "L",   desc: "Contacto que te buscó por algún medio",           nextLabel: "Calificar como prospecto" },
  Prospecto:  { prefix: "P",   desc: "Contacto calificado como potencial cliente",       nextLabel: "Enviar cotización" },
  Cotizacion: { prefix: "C",   desc: "Prospecto con oferta de venta enviada",            nextLabel: "Convertir a pedido" },
  Pedido:     { prefix: "PED", desc: "Cotización convertida en venta confirmada" },
}

const NUM_COLOR: Record<FunnelEtapa, string> = {
  Lead:       "text-slate-400 bg-slate-800 border-slate-700",
  Prospecto:  "text-blue-400 bg-blue-950/40 border-blue-800/50",
  Cotizacion: "text-amber-400 bg-amber-950/40 border-amber-800/50",
  Pedido:     "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
}

const CANALES = ["WhatsApp", "Instagram", "Facebook", "Llamada", "Email", "Referido", "Visita", "Otro"]

function numDisplay(etapa: FunnelEtapa, idx: number) {
  return `${STAGE_META[etapa].prefix}-${String(idx + 1).padStart(3, "0")}`
}

// ─── Canal icon ───────────────────────────────────────────────────────────────
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

// ─── Card por etapa ───────────────────────────────────────────────────────────
function ClienteCard({ c, num, etapa, onEdit, onDelete, onSelect, onAvanzar }: {
  c: ClienteEmpresa
  num: string
  etapa: FunnelEtapa
  onEdit: () => void
  onDelete: () => void
  onSelect: () => void
  onAvanzar?: () => void
}) {
  const meta = STAGE_META[etapa]

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      {/* Número + acciones */}
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${NUM_COLOR[etapa]}`}>
          #{num}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={onEdit} title="Editar"
            className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={onDelete} title="Eliminar"
            className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Nombre */}
      <p className="text-xs font-semibold text-slate-100 leading-snug">{c.nombre}</p>

      {/* Campos clave según etapa */}
      {etapa === "Lead" && (
        <div className="space-y-1">
          {c.canalContacto && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <CanalIcon canal={c.canalContacto} /> {c.canalContacto}
            </span>
          )}
          {c.origenContacto && (
            <p className="text-[10px] text-slate-600">Origen: {c.origenContacto}</p>
          )}
          {c.telefono && (
            <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} /> {c.telefono}</p>
          )}
        </div>
      )}

      {etapa === "Prospecto" && (
        <div className="space-y-1">
          {c.segmento && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-800/40">
              {c.segmento}
            </span>
          )}
          {c.canalContacto && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <CanalIcon canal={c.canalContacto} /> {c.canalContacto}
            </span>
          )}
          {c.notas && (
            <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{c.notas}"</p>
          )}
        </div>
      )}

      {etapa === "Cotizacion" && (
        <div className="space-y-1">
          {c.notas && (
            <p className="text-[10px] text-slate-400 line-clamp-2">
              {c.notas}
            </p>
          )}
          {c.telefono && (
            <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} /> {c.telefono}</p>
          )}
        </div>
      )}

      {etapa === "Pedido" && (
        <div className="space-y-1">
          {c.notas && (
            <p className="text-[10px] text-slate-400 line-clamp-2">{c.notas}</p>
          )}
          {c.telefono && (
            <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} /> {c.telefono}</p>
          )}
        </div>
      )}

      {/* Botón avanzar etapa */}
      {onAvanzar && meta.nextLabel && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onAvanzar() }}
          className="flex items-center justify-center gap-1 w-full mt-1 py-1 text-[10px] text-slate-600 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-600 rounded-lg transition">
          <ArrowRight size={10} /> {meta.nextLabel}
        </button>
      )}
    </div>
  )
}

// ─── Panel lateral simplificado ───────────────────────────────────────────────
function ClientePanel({ cliente, num, onClose, onUpdate, onEdit }: {
  cliente: ClienteEmpresa
  num: string
  onClose: () => void
  onUpdate: (updated: ClienteEmpresa) => void
  onEdit: () => void
}) {
  const etapa = cliente.Funnel ?? "Lead"

  const moverFunnel = async (dir: 1 | -1) => {
    const idx    = FUNNEL_ETAPAS.indexOf(etapa)
    const newIdx = Math.max(0, Math.min(FUNNEL_ETAPAS.length - 1, idx + dir))
    if (newIdx === idx) return
    const destino = FUNNEL_ETAPAS[newIdx]
    try {
      const updated = await updateCliente(cliente.documentId, { Funnel: destino })
      onUpdate(updated)
      toast.success(dir === 1 ? `Avanzó a ${FUNNEL_LABEL[destino]}` : `Regresó a ${FUNNEL_LABEL[destino]}`)
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xs bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{cliente.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${NUM_COLOR[etapa]}`}>
                    #{num}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>
                    {FUNNEL_LABEL[etapa]}
                  </span>
                </div>
              </div>
            </div>
            <button type="button" title="Cerrar" onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Info de contacto */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Contacto</p>
          {cliente.telefono    && <p className="text-xs text-slate-300 flex items-center gap-2"><Phone size={11} className="text-slate-600" /> {cliente.telefono}</p>}
          {cliente.email       && <p className="text-xs text-slate-300 flex items-center gap-2"><Mail size={11} className="text-slate-600" /> {cliente.email}</p>}
          {cliente.canalContacto && (
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <CanalIcon canal={cliente.canalContacto} /> {cliente.canalContacto}
            </p>
          )}
          {cliente.origenContacto && <p className="text-[11px] text-slate-500">Origen: {cliente.origenContacto}</p>}
          {cliente.segmento       && <p className="text-[11px] text-slate-500">Segmento: {cliente.segmento}</p>}
        </div>

        {/* Descripción etapa */}
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Etapa actual</p>
          <p className="text-xs text-slate-400">{STAGE_META[etapa].desc}</p>
        </div>

        {/* Notas */}
        {cliente.notas && (
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Notas</p>
            <p className="text-xs text-slate-400 leading-relaxed">{cliente.notas}</p>
          </div>
        )}

        {/* Mover en funnel */}
        <div className="px-4 py-3 border-b border-slate-800 flex gap-2">
          {etapa !== "Lead" && (
            <button type="button" onClick={() => moverFunnel(-1)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-500">
              <ChevronLeft size={12} />
              {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) - 1]]}
            </button>
          )}
          {etapa !== "Pedido" && (
            <button type="button" onClick={() => moverFunnel(1)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border border-emerald-800/50 hover:border-emerald-600 hover:text-emerald-300 rounded-lg transition text-emerald-500/70">
              {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) + 1]]}
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Editar */}
        <div className="px-4 py-3">
          <button type="button" onClick={onEdit}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-400">
            <Pencil size={12} /> Editar datos
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────
function ClienteModal({ editando, form, setForm, onGuardar, onCerrar, guardando }: {
  editando: ClienteEmpresa | null
  form: ClientePayload
  setForm: React.Dispatch<React.SetStateAction<ClientePayload>>
  onGuardar: () => void
  onCerrar: () => void
  guardando: boolean
}) {
  const etapa = form.Funnel ?? "Lead"
  const inp   = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl   = "block text-[11px] text-slate-500 mb-1"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar" : "Nuevo"} {FUNNEL_LABEL[etapa]}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{STAGE_META[etapa].desc}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        {/* Etapa */}
        <div>
          <label className={lbl}>Etapa del funnel</label>
          <div className="flex gap-1.5 flex-wrap">
            {FUNNEL_ETAPAS.map(e => (
              <button key={e} type="button"
                onClick={() => setForm(f => ({ ...f, Funnel: e }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  etapa === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {FUNNEL_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className={lbl}>Nombre del contacto *</label>
          <input autoFocus value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder={etapa === "Lead" ? "Quién te contactó" : etapa === "Prospecto" ? "Nombre del prospecto" : etapa === "Cotizacion" ? "Cliente cotizado" : "Nombre del cliente"}
            className={inp} />
        </div>

        {/* Teléfono + canal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Teléfono</label>
            <input value={form.telefono ?? ""}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value || null }))}
              placeholder="55 0000 0000" className={inp} />
          </div>
          <div>
            <label className={lbl}>
              {etapa === "Lead" ? "Canal por el que contactó *" : "Canal"}
            </label>
            <select value={form.canalContacto ?? ""} title="Canal de contacto"
              onChange={e => setForm(f => ({ ...f, canalContacto: e.target.value || null }))}
              className={inp}>
              <option value="">— Seleccionar —</option>
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={form.email ?? ""}
            onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
            placeholder="correo@email.com" className={inp} />
        </div>

        {/* Campos específicos por etapa */}
        {(etapa === "Lead") && (
          <div>
            <label className={lbl}>Origen del contacto</label>
            <input value={form.origenContacto ?? ""}
              onChange={e => setForm(f => ({ ...f, origenContacto: e.target.value || null }))}
              placeholder="Campaña, referido, visita espontánea…" className={inp} />
          </div>
        )}

        {(etapa === "Prospecto" || etapa === "Cotizacion" || etapa === "Pedido") && (
          <div>
            <label className={lbl}>Segmento</label>
            <select value={form.segmento ?? ""} title="Segmento"
              onChange={e => setForm(f => ({ ...f, segmento: (e.target.value || null) as typeof f.segmento }))}
              className={inp}>
              <option value="">— Sin segmento —</option>
              {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Notas con hint según etapa */}
        <div>
          <label className={lbl}>
            {etapa === "Lead"       ? "Notas del contacto inicial" :
             etapa === "Prospecto"  ? "¿Qué busca? / Calificación" :
             etapa === "Cotizacion" ? "Concepto / detalle de la oferta" :
                                     "Detalle del pedido confirmado"}
          </label>
          <textarea value={form.notas ?? ""}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
            placeholder={
              etapa === "Lead"       ? "Lo que comentó, qué le interesa…" :
              etapa === "Prospecto"  ? "Anillo de compromiso, presupuesto aprox., fecha de boda…" :
              etapa === "Cotizacion" ? "Solitario 1ct · $45,000 · Entrega estimada 15/06" :
                                      "Anticipo recibido, fecha de entrega, especificaciones…"
            }
            rows={3}
            className={`${inp} resize-none h-auto py-2`} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={onGuardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} /> {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline View ────────────────────────────────────────────────────────────
function emptyCliente(etapa: FunnelEtapa = "Lead"): ClientePayload {
  return { nombre: "", email: null, telefono: null, direccion: null, segmento: null, Funnel: etapa, canalContacto: null, origenContacto: null, Estado: "Activo", notas: null }
}

export function PipelineView() {
  const { clientes, setClientes, loading } = useGetClientes()
  const [modalOpen,        setModalOpen]        = useState(false)
  const [editando,         setEditando]         = useState<ClienteEmpresa | null>(null)
  const [form,             setForm]             = useState<ClientePayload>(emptyCliente())
  const [guardando,        setGuardando]        = useState(false)
  const [selectedCliente,  setSelectedCliente]  = useState<ClienteEmpresa | null>(null)

  // Índice de numeración por etapa (cronológico)
  const porFunnel = useMemo(() => {
    const map = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ETAPAS.forEach(e => map.set(e, []))
    clientes
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(c => map.get(c.Funnel ?? "Lead")?.push(c))
    return map
  }, [clientes])

  // Mapa rápido documentId → número de display
  const numMap = useMemo(() => {
    const m = new Map<string, string>()
    FUNNEL_ETAPAS.forEach(etapa => {
      porFunnel.get(etapa)?.forEach((c, i) => m.set(c.documentId, numDisplay(etapa, i)))
    })
    return m
  }, [porFunnel])

  const abrirCrear  = (etapa: FunnelEtapa = "Lead") => { setEditando(null); setForm(emptyCliente(etapa)); setModalOpen(true) }
  const abrirEditar = (c: ClienteEmpresa) => {
    setEditando(c)
    setForm({ nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion, segmento: c.segmento, Funnel: c.Funnel ?? "Lead", canalContacto: c.canalContacto, origenContacto: c.origenContacto, Estado: c.Estado, notas: c.notas })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCliente(editando.documentId, form)
        setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        if (selectedCliente?.documentId === updated.documentId) setSelectedCliente(updated)
        toast.success("Actualizado")
      } else {
        const nuevo = await createCliente(form)
        setClientes(prev => [...prev, nuevo])
        toast.success("Creado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (c: ClienteEmpresa) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      if (selectedCliente?.documentId === c.documentId) setSelectedCliente(null)
      toast.success("Eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const avanzar = async (c: ClienteEmpresa) => {
    const idx    = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    const newIdx = Math.min(FUNNEL_ETAPAS.length - 1, idx + 1)
    if (newIdx === idx) return
    try {
      const updated = await updateCliente(c.documentId, { Funnel: FUNNEL_ETAPAS[newIdx] })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      if (selectedCliente?.documentId === updated.documentId) setSelectedCliente(updated)
      toast.success(`Avanzó a ${FUNNEL_LABEL[FUNNEL_ETAPAS[newIdx]]}`)
    } catch {
      toast.error("Error al avanzar")
    }
  }

  const handleUpdate = (updated: ClienteEmpresa) => {
    setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    setSelectedCliente(updated)
  }

  const totalActivos = clientes.filter(c => c.Funnel !== "Pedido").length
  const totalPedidos = clientes.filter(c => c.Funnel === "Pedido").length

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline de ventas</h1>
          <p className="text-sm text-slate-500">
            {totalActivos} en proceso · {totalPedidos} pedidos confirmados
          </p>
        </div>
        <button type="button" onClick={() => abrirCrear("Lead")}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[860px]">
            {FUNNEL_ETAPAS.map(etapa => {
              const items = porFunnel.get(etapa) ?? []
              const meta  = STAGE_META[etapa]
              return (
                <div key={etapa} className="flex-1 min-w-[190px] flex flex-col gap-2">
                  {/* Encabezado columna */}
                  <div className={`px-3 py-2.5 rounded-xl border ${FUNNEL_COLOR[etapa]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{FUNNEL_LABEL[etapa]}</span>
                      <span className="text-[10px] font-bold opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    <p className="text-[10px] opacity-60 mt-0.5 leading-snug">{meta.desc}</p>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {items.map((c, i) => (
                      <ClienteCard key={c.documentId}
                        c={c}
                        num={numDisplay(etapa, i)}
                        etapa={etapa}
                        onEdit={() => abrirEditar(c)}
                        onDelete={() => borrar(c)}
                        onSelect={() => setSelectedCliente(c)}
                        onAvanzar={etapa !== "Pedido" ? () => avanzar(c) : undefined}
                      />
                    ))}
                  </div>

                  {/* Agregar en esta etapa */}
                  <button type="button" onClick={() => abrirCrear(etapa)}
                    className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition mt-1">
                    <Plus size={10} /> Agregar {FUNNEL_LABEL[etapa].toLowerCase()}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ClienteModal
          editando={editando}
          form={form}
          setForm={setForm}
          onGuardar={guardar}
          onCerrar={() => setModalOpen(false)}
          guardando={guardando}
        />
      )}

      {/* Panel lateral */}
      {selectedCliente && (
        <ClientePanel
          cliente={selectedCliente}
          num={numMap.get(selectedCliente.documentId) ?? "—"}
          onClose={() => setSelectedCliente(null)}
          onUpdate={handleUpdate}
          onEdit={() => { abrirEditar(selectedCliente); setSelectedCliente(null) }}
        />
      )}
    </div>
  )
}
