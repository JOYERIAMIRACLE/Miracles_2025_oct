"use client"

import { useState, useMemo } from "react"
import {
  Plus, X, Check, Phone, Mail, MessageCircle,
  ChevronRight, ChevronLeft, Pencil, Trash2, User, ArrowRight, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS,
} from "@/types/clienteEmpresa"

// ─── Metadatos por etapa ──────────────────────────────────────────────────────

const STAGE_META: Record<FunnelEtapa, {
  prefix: string; desc: string; numColor: string; dot: string
  fechaKey: keyof ClienteEmpresa; nextLabel?: string
}> = {
  Lead:    { prefix: "L",   desc: "Contacto que llegó por algún medio",      fechaKey: "fechaLead",    nextLabel: "Enviar oferta",      numColor: "text-slate-400 bg-slate-800 border-slate-700",              dot: "bg-slate-400" },
  Oferta:  { prefix: "OF",  desc: "Oferta de venta enviada al cliente",       fechaKey: "fechaOferta",  nextLabel: "Confirmar pedido",   numColor: "text-amber-400 bg-amber-950/40 border-amber-800/50",        dot: "bg-amber-400" },
  Pedido:  { prefix: "PED", desc: "Pedido confirmado, pendiente de entrega",  fechaKey: "fechaPedido",  nextLabel: "Registrar entrega",  numColor: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",  dot: "bg-emerald-400" },
  Entrega: { prefix: "ENT", desc: "Pedido entregado al cliente",              fechaKey: "fechaEntrega",                                  numColor: "text-violet-400 bg-violet-950/40 border-violet-800/50",    dot: "bg-violet-400" },
}

const FECHA_FIELD: Record<FunnelEtapa, keyof ClientePayload> = {
  Lead:    "fechaLead",
  Oferta:  "fechaOferta",
  Pedido:  "fechaPedido",
  Entrega: "fechaEntrega",
}

const CANALES = ["WhatsApp", "Instagram", "Facebook", "Llamada", "Email", "Referido", "Visita", "Otro"]

function numDisplay(etapa: FunnelEtapa, idx: number) {
  return `${STAGE_META[etapa].prefix}-${String(idx + 1).padStart(3, "0")}`
}

const fmtDt = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
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

// ─── Timeline ────────────────────────────────────────────────────────────────
function Timeline({ cliente }: { cliente: ClienteEmpresa }) {
  const etapaActual = cliente.Funnel ?? "Lead"
  const idxActual   = FUNNEL_ETAPAS.indexOf(etapaActual)

  return (
    <div className="px-4 py-3 border-b border-slate-800">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Recorrido</p>
      <div className="space-y-2">
        {/* Lead + calificado como sub-paso */}
        {(() => {
          const etapa    = "Lead" as FunnelEtapa
          const meta     = STAGE_META[etapa]
          const pasada   = idxActual > 0
          const actual   = idxActual === 0
          return (
            <div key="lead-block" className="flex items-start gap-2.5">
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-2.5 w-2.5 rounded-full border-2 mt-0.5 ${
                  pasada ? `${meta.dot} border-transparent` :
                  actual ? `bg-transparent ${meta.dot.replace("bg-", "border-")}` :
                           "bg-transparent border-slate-700"
                }`} />
                <div className={`w-px min-h-[28px] mt-0.5 ${pasada || actual ? "bg-slate-600" : "bg-slate-800"}`} />
              </div>
              <div className="pb-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${actual ? "text-slate-300" : pasada ? "text-slate-400" : "text-slate-700"}`}>
                    Lead
                  </span>
                  {actual && <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold ${FUNNEL_COLOR.Lead}`}>actual</span>}
                </div>
                {cliente.fechaLead && <p className="text-[10px] text-slate-500">{fmtDt(cliente.fechaLead)}</p>}
                {/* Sub-paso: calificado */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${cliente.calificado ? "bg-blue-400" : "bg-slate-700"}`} />
                  <span className={`text-[10px] ${cliente.calificado ? "text-blue-400" : "text-slate-700"}`}>
                    {cliente.calificado ? "Calificado" : "Sin calificar"}
                  </span>
                  {cliente.calificado && cliente.fechaCalificado && (
                    <span className="text-[10px] text-slate-600">{fmtDt(cliente.fechaCalificado)}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {FUNNEL_ETAPAS.slice(1).map((etapa, i) => {
          const meta      = STAGE_META[etapa]
          const idx       = i + 1
          const pasada    = idx < idxActual
          const actual    = idx === idxActual
          const pendiente = idx > idxActual
          const fecha     = cliente[meta.fechaKey] as string | null
          const isLast    = idx === FUNNEL_ETAPAS.length - 1

          return (
            <div key={etapa} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-2.5 w-2.5 rounded-full border-2 mt-0.5 ${
                  pasada   ? `${meta.dot} border-transparent` :
                  actual   ? `bg-transparent ${meta.dot.replace("bg-", "border-")}` :
                             "bg-transparent border-slate-700"
                }`} />
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[16px] mt-0.5 ${pasada || actual ? "bg-slate-600" : "bg-slate-800"}`} />
                )}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${
                    actual ? FUNNEL_COLOR[etapa].split(" ")[1] : pasada ? "text-slate-400" : "text-slate-700"
                  }`}>{FUNNEL_LABEL[etapa]}</span>
                  {actual && <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold ${FUNNEL_COLOR[etapa]}`}>actual</span>}
                </div>
                {fecha
                  ? <p className="text-[10px] text-slate-500">{fmtDt(fecha)}</p>
                  : pendiente && <p className="text-[10px] text-slate-700">—</p>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ClienteCard({ c, num, etapa, onEdit, onDelete, onSelect, onAvanzar, onCalificar }: {
  c: ClienteEmpresa; num: string; etapa: FunnelEtapa
  onEdit: () => void; onDelete: () => void; onSelect: () => void
  onAvanzar?: () => void; onCalificar?: () => void
}) {
  const meta = STAGE_META[etapa]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onSelect}>

      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${meta.numColor}`}>
          #{num}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={onEdit} title="Editar"
            className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition"><Pencil size={11} /></button>
          <button type="button" onClick={onDelete} title="Eliminar"
            className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition"><Trash2 size={11} /></button>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-100 leading-snug">{c.nombre}</p>

      <div className="space-y-1">
        {etapa === "Lead" && <>
          {c.canalContacto && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <CanalIcon canal={c.canalContacto} />{c.canalContacto}
            </span>
          )}
          {c.origenContacto && <p className="text-[10px] text-slate-600">Origen: {c.origenContacto}</p>}
          {c.telefono && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} />{c.telefono}</p>}
          {c.notas && <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{c.notas}"</p>}
        </>}
        {etapa !== "Lead" && <>
          {c.notas && <p className="text-[10px] text-slate-400 line-clamp-2">{c.notas}</p>}
          {c.telefono && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} />{c.telefono}</p>}
        </>}
        {(c[meta.fechaKey] as string | null) && (
          <p className="text-[9px] text-slate-700">{fmtDt(c[meta.fechaKey] as string)}</p>
        )}
      </div>

      {/* Badge calificado (solo en Lead) */}
      {etapa === "Lead" && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onCalificar?.() }}
          className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
            c.calificado
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
              : "bg-slate-800/60 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
          }`}>
          <CheckCircle2 size={11} className={c.calificado ? "text-blue-400" : "text-slate-600"} />
          {c.calificado ? "Calificado" : "Calificar"}
        </button>
      )}

      {/* Avanzar */}
      {onAvanzar && meta.nextLabel && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onAvanzar() }}
          className="flex items-center justify-center gap-1 w-full mt-0.5 py-1 text-[10px] text-slate-600 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-600 rounded-lg transition">
          <ArrowRight size={10} /> {meta.nextLabel}
        </button>
      )}
    </div>
  )
}

// ─── Panel lateral ────────────────────────────────────────────────────────────
function ClientePanel({ cliente, num, onClose, onUpdate, onEdit }: {
  cliente: ClienteEmpresa; num: string
  onClose: () => void; onUpdate: (u: ClienteEmpresa) => void; onEdit: () => void
}) {
  const etapa = cliente.Funnel ?? "Lead"

  const moverFunnel = async (dir: 1 | -1) => {
    const idx    = FUNNEL_ETAPAS.indexOf(etapa)
    const newIdx = Math.max(0, Math.min(FUNNEL_ETAPAS.length - 1, idx + dir))
    if (newIdx === idx) return
    const destino    = FUNNEL_ETAPAS[newIdx]
    const fechaField = FECHA_FIELD[destino]
    const extra      = dir === 1 && !(cliente[fechaField] as string | null)
      ? { [fechaField]: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(cliente.documentId, { Funnel: destino, ...extra })
      onUpdate(updated)
      toast.success(dir === 1 ? `→ ${FUNNEL_LABEL[destino]}` : `← ${FUNNEL_LABEL[destino]}`)
    } catch { toast.error("Error al actualizar") }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xs bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{cliente.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${STAGE_META[etapa].numColor}`}>#{num}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>{FUNNEL_LABEL[etapa]}</span>
                  {etapa === "Lead" && cliente.calificado && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold bg-blue-500/15 text-blue-300 border-blue-500/30">Calificado</span>
                  )}
                </div>
              </div>
            </div>
            <button type="button" title="Cerrar" onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition shrink-0"><X size={16} /></button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Contacto</p>
          {cliente.telefono      && <p className="text-xs text-slate-300 flex items-center gap-2"><Phone size={11} className="text-slate-600" />{cliente.telefono}</p>}
          {cliente.email         && <p className="text-xs text-slate-300 flex items-center gap-2"><Mail size={11} className="text-slate-600" />{cliente.email}</p>}
          {cliente.canalContacto && <p className="text-xs text-slate-300 flex items-center gap-2"><CanalIcon canal={cliente.canalContacto} />{cliente.canalContacto}</p>}
          {cliente.origenContacto && <p className="text-[11px] text-slate-500">Origen: {cliente.origenContacto}</p>}
          {cliente.segmento       && <p className="text-[11px] text-slate-500">Segmento: {cliente.segmento}</p>}
        </div>

        {cliente.notas && (
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Notas</p>
            <p className="text-xs text-slate-400 leading-relaxed">{cliente.notas}</p>
          </div>
        )}

        <Timeline cliente={cliente} />

        <div className="px-4 py-3 border-b border-slate-800 flex gap-2">
          {etapa !== "Lead" && (
            <button type="button" onClick={() => moverFunnel(-1)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-500">
              <ChevronLeft size={12} />{FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) - 1]]}
            </button>
          )}
          {etapa !== "Entrega" && (
            <button type="button" onClick={() => moverFunnel(1)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border border-emerald-800/50 hover:border-emerald-600 hover:text-emerald-300 rounded-lg transition text-emerald-500/70">
              {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) + 1]]}<ChevronRight size={12} />
            </button>
          )}
        </div>

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

// ─── Modal ────────────────────────────────────────────────────────────────────
function ClienteModal({ editando, form, setForm, onGuardar, onCerrar, guardando }: {
  editando: ClienteEmpresa | null; form: ClientePayload
  setForm: React.Dispatch<React.SetStateAction<ClientePayload>>
  onGuardar: () => void; onCerrar: () => void; guardando: boolean
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
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        <div>
          <label className={lbl}>Etapa</label>
          <div className="flex gap-1.5 flex-wrap">
            {FUNNEL_ETAPAS.map(e => (
              <button key={e} type="button"
                onClick={() => setForm(f => ({ ...f, Funnel: e }))}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition ${
                  etapa === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {FUNNEL_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>Nombre del contacto *</label>
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

        {etapa === "Lead" && (
          <>
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
          </>
        )}

        {(etapa === "Oferta" || etapa === "Pedido" || etapa === "Entrega") && (
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

        <div>
          <label className={lbl}>
            {etapa === "Lead"    ? "Notas del contacto" :
             etapa === "Oferta"  ? "Concepto / detalle de la oferta" :
             etapa === "Pedido"  ? "Detalle del pedido confirmado" :
                                  "Detalle de la entrega"}
          </label>
          <textarea value={form.notas ?? ""}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
            placeholder={
              etapa === "Lead"   ? "Lo que comentó, qué le interesa…" :
              etapa === "Oferta" ? "Solitario 1ct · $45,000 · Entrega est. 15/06" :
              etapa === "Pedido" ? "Anticipo recibido, fecha de producción…" :
                                  "Fecha de entrega, quién recibió…"
            }
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

// ─── Pipeline View ────────────────────────────────────────────────────────────
function emptyCliente(etapa: FunnelEtapa = "Lead"): ClientePayload {
  return {
    nombre: "", email: null, telefono: null, direccion: null,
    segmento: null, Funnel: etapa, calificado: false,
    canalContacto: null, origenContacto: null, Estado: "Activo", notas: null,
    fechaLead: etapa === "Lead" ? new Date().toISOString() : null,
    fechaCalificado: null, fechaOferta: null, fechaPedido: null, fechaEntrega: null,
  }
}

export function PipelineView() {
  const { clientes, setClientes, loading } = useGetClientes()
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente())
  const [guardando,       setGuardando]       = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)

  const porFunnel = useMemo(() => {
    const map = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ETAPAS.forEach(e => map.set(e, []))
    clientes
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(c => map.get(c.Funnel ?? "Lead")?.push(c))
    return map
  }, [clientes])

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
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: c.Funnel ?? "Lead", calificado: c.calificado,
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
        if (selectedCliente?.documentId === updated.documentId) setSelectedCliente(updated)
        toast.success("Actualizado")
      } else {
        const nuevo = await createCliente(form)
        setClientes(prev => [...prev, nuevo])
        toast.success("Creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const borrar = async (c: ClienteEmpresa) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      if (selectedCliente?.documentId === c.documentId) setSelectedCliente(null)
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  const avanzar = async (c: ClienteEmpresa) => {
    const idx    = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    const newIdx = Math.min(FUNNEL_ETAPAS.length - 1, idx + 1)
    if (newIdx === idx) return
    const destino    = FUNNEL_ETAPAS[newIdx]
    const fechaField = FECHA_FIELD[destino]
    const extra      = !(c[fechaField] as string | null) ? { [fechaField]: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { Funnel: destino, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      if (selectedCliente?.documentId === updated.documentId) setSelectedCliente(updated)
      toast.success(`→ ${FUNNEL_LABEL[destino]}`)
    } catch { toast.error("Error al avanzar") }
  }

  const toggleCalificado = async (c: ClienteEmpresa) => {
    const nuevoValor = !c.calificado
    const extra      = nuevoValor && !c.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { calificado: nuevoValor, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      if (selectedCliente?.documentId === updated.documentId) setSelectedCliente(updated)
      toast.success(nuevoValor ? "Lead calificado ✓" : "Calificación removida")
    } catch { toast.error("Error al actualizar") }
  }

  const handleUpdate = (updated: ClienteEmpresa) => {
    setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    setSelectedCliente(updated)
  }

  const leadsCalificados = clientes.filter(c => c.Funnel === "Lead" && c.calificado).length

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline de ventas</h1>
          <p className="text-sm text-slate-500">
            {clientes.filter(c => c.Funnel !== "Entrega").length} en proceso ·{" "}
            {leadsCalificados} leads calificados ·{" "}
            {clientes.filter(c => c.Funnel === "Entrega").length} entregas
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
          <div className="flex gap-3 min-w-[860px]">
            {FUNNEL_ETAPAS.map(etapa => {
              const items = porFunnel.get(etapa) ?? []
              const calificadosEnCol = etapa === "Lead" ? items.filter(c => c.calificado).length : null
              return (
                <div key={etapa} className="flex-1 min-w-[190px] flex flex-col gap-2">
                  <div className={`px-3 py-2.5 rounded-xl border ${FUNNEL_COLOR[etapa]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{FUNNEL_LABEL[etapa]}</span>
                      <div className="flex items-center gap-1">
                        {calificadosEnCol !== null && calificadosEnCol > 0 && (
                          <span className="text-[9px] font-semibold bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded-full">
                            {calificadosEnCol} cal.
                          </span>
                        )}
                        <span className="text-[10px] font-bold opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{items.length}</span>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-60 mt-0.5 leading-snug">{STAGE_META[etapa].desc}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {items.map((c, i) => (
                      <ClienteCard key={c.documentId} c={c}
                        num={numDisplay(etapa, i)} etapa={etapa}
                        onEdit={() => abrirEditar(c)}
                        onDelete={() => borrar(c)}
                        onSelect={() => setSelectedCliente(c)}
                        onAvanzar={etapa !== "Entrega" ? () => avanzar(c) : undefined}
                        onCalificar={etapa === "Lead" ? () => toggleCalificado(c) : undefined}
                      />
                    ))}
                  </div>

                  <button type="button" onClick={() => abrirCrear(etapa)}
                    className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition mt-1">
                    <Plus size={10} /> Agregar
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

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
