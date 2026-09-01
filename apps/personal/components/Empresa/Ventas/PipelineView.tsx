"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import {
  Plus, X, Check, Phone, Mail, MessageCircle, ArrowLeft,
  ChevronRight, ChevronLeft, Pencil, Trash2, User, ArrowRight, CheckCircle2, FileText, XCircle, RotateCcw,
  DollarSign, ShoppingBag, Clock, AlertTriangle, ArrowRightCircle, Paperclip, Tag,
} from "lucide-react"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_ALL, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS, ESTADOS_CIVILES,
} from "@/types/clienteEmpresa"
import { updateCliente } from "@/api/clienteEmpresa/getClientes"
import { Cotizacion, ItemCotizacion, ESTADO_COT_COLOR } from "@/types/cotizacion"
import { useGetCotizaciones, updateCotizacion } from "@/api/cotizacion/getCotizaciones"
import { useGetInventario } from "@/api/inventarioEmpresa/getInventario"
import { ProductType } from "@/types/product"
import { CotizacionModal } from "./CotizacionModal"
import { useGetTransaccionesByVenta } from "@/api/transaccion/getTransacciones"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { TransaccionType, METODOS_PAGO, MetodoPagoTransaccion } from "@/types/transaccion"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { createVenta, updateVenta } from "@/api/ventaEmpresa/getVentas"
import { createVentaLinea } from "@/api/venta-linea/mutateVentaLinea"
import {
  VentaEmpresa, VentaPayload, EstadoVenta, ESTADOS_VENTA, ESTADO_VENTA_COLOR,
  MetodoPago as MetodoPagoVenta, METODOS_PAGO as METODOS_PAGO_VENTA,
} from "@/types/ventaEmpresa"
import { uploadMedia } from "@/lib/upload"
import { useClientesPipeline } from "./useClientesPipeline"

const METODO_COLOR: Record<MetodoPagoTransaccion, string> = {
  "Efectivo":      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Transferencia": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Tarjeta":       "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Otro":          "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

export const fmtMoney = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

// Días sin movimiento antes de mostrar alerta de estancado
const DIAS_ESTANCADO_AVISO = 14
const DIAS_ESTANCADO_ALERTA = 30

const TOOLTIP_STYLE = {
  background: "#0f172a", border: "1px solid #334155",
  borderRadius: "8px", fontSize: "12px", color: "#e2e8f0",
}

// ─── Metadatos por etapa ──────────────────────────────────────────────────────

export const STAGE_META: Record<FunnelEtapa, {
  prefix: string; desc: string; numColor: string; dot: string
  fechaKey: keyof ClienteEmpresa; nextLabel?: string
}> = {
  Lead:      { prefix: "L",   desc: "Contacto que llegó por algún medio",      fechaKey: "fechaLead",      nextLabel: "Enviar oferta",      numColor: "text-slate-400 bg-slate-800 border-slate-700",              dot: "bg-slate-400" },
  Oferta:    { prefix: "OF",  desc: "Oferta de venta enviada al cliente",       fechaKey: "fechaOferta",    nextLabel: "Confirmar pedido",   numColor: "text-violet-400 bg-violet-950/40 border-violet-800/50",        dot: "bg-violet-400" },
  Pedido:    { prefix: "PED", desc: "Pedido confirmado, pendiente de entrega",  fechaKey: "fechaPedido",    nextLabel: "Registrar entrega",  numColor: "text-violet-400 bg-violet-950/40 border-violet-800/50",  dot: "bg-violet-400" },
  Entrega:   { prefix: "ENT", desc: "Pedido entregado al cliente",              fechaKey: "fechaEntrega",                                    numColor: "text-violet-400 bg-violet-950/40 border-violet-800/50",    dot: "bg-violet-400" },
  Rechazada: { prefix: "REJ", desc: "Oportunidad perdida o rechazada",          fechaKey: "fechaRechazada",                                  numColor: "text-red-400 bg-red-950/40 border-red-800/50",             dot: "bg-red-400" },
}

export const CANALES = ["WhatsApp", "Instagram", "Facebook", "Llamada", "Email", "Referido", "Visita", "Otro"]

export function numDisplay(etapa: FunnelEtapa, idx: number) {
  return `${STAGE_META[etapa].prefix}-${String(idx + 1).padStart(3, "0")}`
}

export const fmtDt = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

// Días desde la última fecha de etapa — null si no aplica (Entrega/Rechazada son terminales)
export function diasSinMovimiento(c: ClienteEmpresa, etapa: FunnelEtapa): number | null {
  if (etapa === "Entrega" || etapa === "Rechazada") return null
  const fecha = c[STAGE_META[etapa].fechaKey] as string | null
  if (!fecha) return null
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
}

// Cuántos días pasó el cliente EN una etapa ya superada (diferencia contra la
// fecha de la siguiente etapa), o cuántos lleva ahí si es la etapa actual.
function duracionEtapaDias(cliente: ClienteEmpresa, etapa: FunnelEtapa): number | null {
  const fecha = cliente[STAGE_META[etapa].fechaKey] as string | null
  if (!fecha) return null
  const idx = FUNNEL_ETAPAS.indexOf(etapa)
  if (idx === -1 || idx === FUNNEL_ETAPAS.length - 1) return null
  const siguiente = FUNNEL_ETAPAS[idx + 1]
  const fechaSiguiente = cliente[STAGE_META[siguiente].fechaKey] as string | null
  if (fechaSiguiente) {
    return Math.max(0, Math.round((new Date(fechaSiguiente).getTime() - new Date(fecha).getTime()) / 86400000))
  }
  if (etapa === (cliente.Funnel ?? "Lead")) {
    return Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 86400000))
  }
  return null
}

// ─── Canal icon ───────────────────────────────────────────────────────────────
export function CanalIcon({ canal }: { canal: string | null }) {
  if (!canal) return null
  const c = canal.toLowerCase()
  if (c.includes("whatsapp"))  return <MessageCircle size={11} className="text-violet-400 shrink-0" />
  if (c.includes("instagram")) return <span className="text-[9px] font-bold text-violet-400 shrink-0">IG</span>
  if (c.includes("facebook"))  return <span className="text-[9px] font-bold text-violet-400 shrink-0">FB</span>
  if (c.includes("email"))     return <Mail size={11} className="text-violet-400 shrink-0" />
  if (c.includes("llamada"))   return <Phone size={11} className="text-violet-400 shrink-0" />
  return <span className="text-[9px] text-slate-500 shrink-0">{canal.slice(0, 2).toUpperCase()}</span>
}

// ─── Timeline ────────────────────────────────────────────────────────────────
// Reservado para mostrarse dentro del flujo de una cotización/lead/pedido
// puntual (no en la ficha del cliente, que ahora muestra actividad agregada).
export function Timeline({ cliente }: { cliente: ClienteEmpresa }) {
  const etapaActual = cliente.Funnel ?? "Lead"
  const idxActual   = FUNNEL_ETAPAS.indexOf(etapaActual)

  const DuracionTag = ({ etapa }: { etapa: FunnelEtapa }) => {
    const dias = duracionEtapaDias(cliente, etapa)
    if (dias == null) return null
    const esActual = etapa === etapaActual
    return (
      <span className={`text-[9px] ${esActual ? "text-violet-500" : "text-slate-600"}`}>
        {esActual ? `lleva ${dias}d aquí` : `${dias}d en esta etapa`}
      </span>
    )
  }

  return (
    <div className="px-4 py-3">
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
                <div className="flex items-center gap-1.5">
                  {cliente.fechaLead && <p className="text-[10px] text-slate-500">{fmtDt(cliente.fechaLead)}</p>}
                  <DuracionTag etapa={etapa} />
                </div>
                {/* Sub-paso: calificado */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${cliente.calificado ? "bg-violet-400" : "bg-slate-700"}`} />
                  <span className={`text-[10px] ${cliente.calificado ? "text-violet-400" : "text-slate-700"}`}>
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
                <div className="flex items-center gap-1.5">
                  {fecha
                    ? <p className="text-[10px] text-slate-500">{fmtDt(fecha)}</p>
                    : pendiente && <p className="text-[10px] text-slate-700">—</p>
                  }
                  <DuracionTag etapa={etapa} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ClienteCard({ c, num, etapa, valor, dias, sinPedidoReal, onEdit, onDelete, onSelect, onAvanzar, onCalificar, onRechazar, onRecuperar }: {
  c: ClienteEmpresa; num: string; etapa: FunnelEtapa
  valor: number | null; dias: number | null; sinPedidoReal: boolean
  onEdit: () => void; onDelete: () => void; onSelect: () => void
  onAvanzar?: () => void; onCalificar?: () => void
  onRechazar?: () => void; onRecuperar?: () => void
}) {
  const meta = STAGE_META[etapa]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onSelect}>

      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${meta.numColor}`}>
          #{num}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <button type="button" onClick={onEdit} title="Editar"
            className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition"><Pencil size={11} /></button>
          <button type="button" onClick={onDelete} title="Eliminar"
            className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition"><Trash2 size={11} /></button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-100 leading-snug">{c.nombre}</p>
        {valor != null && (
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-violet-400 font-mono shrink-0">
            <DollarSign size={10} />{valor.toLocaleString("es-MX")}
          </span>
        )}
      </div>

      {/* Alertas: estancado / sin pedido real */}
      {(dias != null && dias >= DIAS_ESTANCADO_AVISO) || sinPedidoReal ? (
        <div className="flex flex-wrap gap-1">
          {dias != null && dias >= DIAS_ESTANCADO_AVISO && (
            <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
              dias >= DIAS_ESTANCADO_ALERTA
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-violet-500/10 text-violet-400 border-violet-500/30"
            }`}>
              <Clock size={9} /> {dias}d sin movimiento
            </span>
          )}
          {sinPedidoReal && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-medium"
              title="Está en esta etapa pero no tiene ningún pedido real conectado">
              <AlertTriangle size={9} /> sin pedido real
            </span>
          )}
        </div>
      ) : null}

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
          onClick={e => { e.stopPropagation(); onCalificar?.() }} onPointerDown={e => e.stopPropagation()}
          className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
            c.calificado
              ? "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20"
              : "bg-slate-800/60 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
          }`}>
          <CheckCircle2 size={11} className={c.calificado ? "text-violet-400" : "text-slate-600"} />
          {c.calificado ? "Calificado" : "Calificar"}
        </button>
      )}

      {/* Recuperar (solo en Rechazada) */}
      {onRecuperar && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onRecuperar() }} onPointerDown={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 w-full mt-0.5 py-1 text-[10px] text-violet-500 hover:text-violet-300 border border-dashed border-violet-900/50 hover:border-violet-700 rounded-lg transition">
          <RotateCcw size={10} /> Recuperar
        </button>
      )}

      {/* Avanzar */}
      {onAvanzar && meta.nextLabel && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onAvanzar() }} onPointerDown={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 w-full mt-0.5 py-1 text-[10px] text-slate-600 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-600 rounded-lg transition">
          <ArrowRight size={10} /> {meta.nextLabel}
        </button>
      )}

      {/* Rechazar */}
      {onRechazar && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onRechazar() }} onPointerDown={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 w-full py-1 text-[10px] text-red-700 hover:text-red-400 border border-dashed border-red-900/30 hover:border-red-800/50 rounded-lg transition">
          <XCircle size={10} /> Rechazar
        </button>
      )}
    </div>
  )
}

// Envuelve ClienteCard para hacerla arrastrable entre columnas del Pipeline.
// La distancia mínima de activación (ver useSensor en el tablero) evita que
// un clic normal se interprete como arrastre.
function DraggableClienteCard(props: Parameters<typeof ClienteCard>[0]) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: props.c.documentId })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10, opacity: isDragging ? 0.6 : 1 }
    : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ClienteCard {...props} />
    </div>
  )
}

// Columna del Pipeline como zona donde soltar una tarjeta arrastrada.
function DroppableColumn({ etapa, children }: { etapa: FunnelEtapa; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-2 min-h-[40px] rounded-xl transition-colors ${isOver ? "bg-violet-500/5 ring-2 ring-violet-500/30" : ""}`}>
      {children}
    </div>
  )
}

// ─── Modal Registrar Pago ─────────────────────────────────────────────────────
type PagoForm = {
  monto:      string
  fecha:      string
  metodoPago: MetodoPagoTransaccion
  categoria:  string
  cuentaId:   string
  concepto:   string
  notas:      string
  ventaId:    string
}

function PagoModal({ clienteNombre, clienteDocumentId, pedidosDelCliente, onClose, onSaved }: {
  clienteNombre:     string
  clienteDocumentId: string
  pedidosDelCliente: VentaEmpresa[]
  onClose:           () => void
  onSaved:           (i: TransaccionType) => void
}) {
  const hoy = new Date().toISOString().split("T")[0]
  const { categorias } = useGetCategorias("empresa")
  const { cuentas } = useGetCuentas("empresa")
  const categoriasIngreso = categorias.filter(c => c.tipo === "ingreso" && c.activa)
  const cuentasDisponibles = cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito")
  // Si solo hay un pedido, se preselecciona — el pago casi siempre es para
  // ese; con varios, se deja en blanco para forzar la elección consciente.
  const [form, setForm] = useState<PagoForm>({
    monto:      "",
    fecha:      hoy,
    metodoPago: "Transferencia",
    categoria:  "Venta de joyería",
    cuentaId:   "",
    concepto:   `Pago — ${clienteNombre}`,
    notas:      "",
    ventaId:    pedidosDelCliente.length === 1 ? pedidosDelCliente[0].documentId : "",
  })
  const [guardando, setGuardando] = useState(false)
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl = "block text-[11px] text-slate-500 mb-1"

  const guardar = async () => {
    const monto = parseFloat(form.monto)
    if (!form.monto || isNaN(monto) || monto <= 0) { toast.error("Monto inválido"); return }
    if (!form.fecha)   { toast.error("Fecha requerida"); return }
    if (!form.concepto.trim()) { toast.error("Concepto requerido"); return }
    if (!form.cuentaId) { toast.error("Selecciona la cuenta destino"); return }
    if (pedidosDelCliente.length > 0 && !form.ventaId) { toast.error("Selecciona a qué pedido corresponde este pago"); return }
    setGuardando(true)
    try {
      const saved = await createTransaccion({
        descripcion:       form.concepto.trim(),
        tipo:              "ingreso",
        monto,
        fecha:             `${form.fecha}T12:00:00`,
        metodoPago:        form.metodoPago,
        categoria:         form.categoria,
        cuentaDestino:     form.cuentaId,
        notas:             form.notas || null,
        referencia:        clienteNombre,
        clienteDocumentId,
        cliente:           clienteDocumentId,
        ventaOrigen:       form.ventaId || null,
        ambito:            "empresa",
      })
      onSaved(saved)
      toast.success("Pago registrado")
    } catch { toast.error("Error al registrar pago") } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Registrar pago</h3>
            <p className="text-[11px] text-slate-500">{clienteNombre}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={15} /></button>
        </div>

        <div>
          <label className={lbl}>Concepto</label>
          <input value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
            placeholder="Pago total, Anticipo 50%…" className={inp} />
        </div>

        <div>
          <label className={lbl}>Pedido al que corresponde{pedidosDelCliente.length > 0 ? " *" : ""}</label>
          {pedidosDelCliente.length > 0 ? (
            <select value={form.ventaId} title="Pedido"
              onChange={e => setForm(f => ({ ...f, ventaId: e.target.value }))}
              className={inp}>
              <option value="">— Seleccionar —</option>
              {pedidosDelCliente.map(v => (
                <option key={v.documentId} value={v.documentId}>
                  {v.numero ? `${v.numero} — ` : ""}{v.concepto} ({fmtMoney(v.monto)})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[11px] text-slate-600 px-1">Este cliente todavía no tiene pedidos reales — el pago quedará sin ligar a uno.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Monto *</label>
            <input type="number" min="0" step="0.01" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
              placeholder="0.00" className={inp} />
          </div>
          <div>
            <label className={lbl}>Fecha *</label>
            <input type="date" title="Fecha del pago" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Método de pago</label>
          <div className="flex flex-wrap gap-1.5">
            {METODOS_PAGO.map(m => (
              <button key={m} type="button"
                onClick={() => setForm(f => ({ ...f, metodoPago: m }))}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition ${
                  form.metodoPago === m ? METODO_COLOR[m] : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>Categoría</label>
          <select value={form.categoria} title="Categoría"
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
            className={inp}>
            {categoriasIngreso.map(c => <option key={c.documentId} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Cuenta destino *</label>
          <select value={form.cuentaId} title="Cuenta destino"
            onChange={e => setForm(f => ({ ...f, cuentaId: e.target.value }))}
            className={inp}>
            <option value="">— Seleccionar —</option>
            {cuentasDisponibles.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            placeholder="Anticipo para pedido especial…" className={inp} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: ver/editar un pedido real existente (abierto desde su fila en la
// ficha de cliente) — las líneas de producto se muestran de solo lectura aquí;
// para reordenarlas/agregar productos se usa el editor completo en Ventas · Pedidos.
export function PedidoModal({ venta, onClose, onSaved }: {
  venta:   VentaEmpresa
  onClose: () => void
  onSaved: (v: VentaEmpresa) => void
}) {
  const [form, setForm] = useState({
    concepto:   venta.concepto,
    monto:      venta.monto,
    fecha:      venta.fecha,
    estado:     (venta.estado ?? "Cotizado") as EstadoVenta,
    metodoPago: venta.metodoPago,
    notas:      venta.notas ?? "",
  })
  const [comprobante, setComprobante] = useState<File | null>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)
  const [guardando, setGuardando] = useState(false)
  const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
  const lbl = "text-[11px] font-medium text-slate-400 mb-1.5 block"

  // Pagos — viven aquí (dentro del pedido), no en la ficha del cliente, ya
  // que un pedido puede recibir varios (anticipo, liquidación).
  const { transacciones: pagos, setTransacciones: setPagos, loading: pagosLoading } = useGetTransaccionesByVenta(venta.documentId)
  const [pagoModalOpen, setPagoModalOpen] = useState(false)
  const totalPagado = pagos.reduce((s, p) => s + (p.monto ?? 0), 0)
  const saldo = venta.monto - totalPagado

  const eliminarPago = async (documentId: string) => {
    if (!confirm("¿Eliminar este pago?")) return
    try {
      await deleteTransaccion(documentId)
      setPagos(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Pago eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  const guardar = async () => {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.monto) { toast.error("El monto es obligatorio"); return }
    setGuardando(true)
    try {
      const comprobanteId = comprobante ? (await uploadMedia(comprobante)).id : undefined
      const updated = await updateVenta(venta.documentId, {
        concepto: form.concepto, monto: form.monto, fecha: form.fecha,
        estado: form.estado, metodoPago: form.metodoPago, notas: form.notas || null,
        ...(comprobanteId !== undefined ? { comprobantePago: comprobanteId } : {}),
      })
      toast.success("Pedido actualizado")
      onSaved(updated)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  return (
    <>
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{venta.numero ?? "Pedido"}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{venta.cliente?.nombre ?? "Sin cliente"}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {venta.lineas?.length > 0 && (
            <div>
              <label className={lbl}>Productos del pedido</label>
              <div className="border border-slate-700 rounded-lg divide-y divide-slate-800 overflow-hidden">
                {venta.lineas.map(l => (
                  <div key={l.documentId} className="flex items-center justify-between px-3 py-2 text-[12px]">
                    <span className="text-slate-300">{l.descripcion} ×{l.cantidad}</span>
                    <span className="text-slate-400 font-mono">{fmtMoney(l.subtotal ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Concepto *</label>
            <input value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Monto *</label>
              <input type="number" min="0" step="0.01" value={form.monto || ""}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) || 0 }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Fecha</label>
              <input type="date" value={form.fecha ?? ""}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Estado</label>
              <select title="Estado" value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoVenta }))} className={inp + " cursor-pointer"}>
                {ESTADOS_VENTA.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Método de pago</label>
              <select title="Método de pago" value={form.metodoPago ?? ""}
                onChange={e => setForm(f => ({ ...f, metodoPago: (e.target.value || null) as MetodoPagoVenta | null }))} className={inp + " cursor-pointer"}>
                <option value="">— Sin especificar —</option>
                {METODOS_PAGO_VENTA.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Evidencia de pago (opcional)</label>
            <input ref={comprobanteRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => setComprobante(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => comprobanteRef.current?.click()}
              className="w-full flex items-center gap-2 h-9 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 px-3 text-sm text-slate-400 hover:border-violet-500/50 hover:text-slate-200 transition-all">
              <Paperclip size={13} className="shrink-0" />
              <span className="truncate">
                {comprobante ? comprobante.name : venta.comprobantePago ? `Ya adjunto: ${venta.comprobantePago.name} — elegir otro archivo` : "Adjuntar foto o archivo del comprobante…"}
              </span>
            </button>
          </div>

          <div>
            <label className={lbl}>Notas</label>
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2} className={inp + " resize-none h-auto py-2"} />
          </div>

          {/* Pagos de este pedido — anticipo, liquidación, etc. */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={lbl + " mb-0"}>Pagos</label>
              {venta.cliente && (
                <button type="button" onClick={() => setPagoModalOpen(true)}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                  <Plus size={10} /> Registrar
                </button>
              )}
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="flex gap-3 px-3 py-2 bg-slate-950/50 text-[11px]">
                <span className="text-slate-500">Pagado: <span className="text-violet-400 font-mono font-semibold">{fmtMoney(totalPagado)}</span></span>
                <span className={saldo > 0 ? "text-violet-400" : "text-slate-500"}>
                  Saldo: <span className="font-mono font-semibold">{fmtMoney(Math.max(saldo, 0))}</span>
                </span>
              </div>
              <div className="divide-y divide-slate-800">
                {pagosLoading ? (
                  <p className="text-[11px] text-slate-600 px-3 py-3">Cargando...</p>
                ) : pagos.length === 0 ? (
                  <p className="text-[11px] text-slate-600 px-3 py-3">Sin pagos registrados todavía.</p>
                ) : (
                  pagos.map(p => (
                    <div key={p.documentId} className="flex items-center justify-between px-3 py-2 group">
                      <div className="min-w-0">
                        <p className="text-[12px] text-slate-200 truncate">{p.descripcion}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-600">{fmtDt(p.fecha)}</span>
                          {p.metodoPago && <span className="text-[9px] text-slate-500">{p.metodoPago}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[12px] font-semibold text-violet-400 font-mono">{fmtMoney(p.monto)}</span>
                        <button type="button" onClick={() => eliminarPago(p.documentId)} title="Eliminar pago"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 rounded transition">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
          <button type="button" onClick={onClose} disabled={guardando}
            className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>

    {pagoModalOpen && venta.cliente && (
      <PagoModal
        clienteNombre={venta.cliente.nombre}
        clienteDocumentId={venta.cliente.documentId}
        pedidosDelCliente={[venta]}
        onClose={() => setPagoModalOpen(false)}
        onSaved={p => {
          setPagos(prev => [...prev, p])
          setPagoModalOpen(false)
        }}
      />
    )}
    </>
  )
}

// ─── Modal: vincular pedido real (gate de Oferta → Pedido) ────────────────────
// Nivel 2: checkpoint de disponibilidad antes de pasar a Pedido — no bloquea
// (a veces sí se vende sobre pedido/personalizado), pero avisa con números
// reales para que la decisión de continuar sea consciente, no accidental.
function calcularFaltantes(items: ItemCotizacion[], productos: ProductType[]) {
  const faltantes: { nombre: string; pedido: number; disponible: number }[] = []
  for (const item of items) {
    if (!item.productoId) continue
    const producto = productos.find(p => p.documentId === item.productoId)
    if (!producto) continue
    const disponible = producto.stock ?? 0
    if ((item.cantidad || 0) > disponible) {
      faltantes.push({ nombre: producto.nombreProducto, pedido: item.cantidad, disponible })
    }
  }
  return faltantes
}

export function NuevoPedidoGateModal({ cliente, cotizacionesAceptadas, totalVentas, onClose, onCreated }: {
  cliente: ClienteEmpresa
  cotizacionesAceptadas: Cotizacion[]
  totalVentas: number
  onClose: () => void
  onCreated: (v: VentaEmpresa) => void
}) {
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)
  const [modoRapido, setModoRapido] = useState(cotizacionesAceptadas.length === 0)
  const { items: productos } = useGetInventario()
  const [comprobante, setComprobante] = useState<File | null>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)
  const hoy = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    concepto: `Pedido — ${cliente.nombre}`,
    monto: "",
    fecha: hoy,
    estado: "Pagado" as EstadoVenta,
    metodoPago: "Transferencia" as MetodoPagoTransaccion,
  })
  const [guardando, setGuardando] = useState(false)
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl = "block text-[11px] text-slate-500 mb-1"

  async function convertirCotizacion(cot: Cotizacion) {
    const faltantes = calcularFaltantes(cot.items ?? [], productos)
    if (faltantes.length > 0) {
      const detalle = faltantes.map(f => `• ${f.nombre}: pides ${f.pedido}, disponible ${f.disponible}`).join("\n")
      if (!confirm(`Stock insuficiente para:\n\n${detalle}\n\n¿Continuar de todas formas?`)) return
    }
    setConvirtiendo(cot.documentId)
    try {
      const creada = await createVenta({
        numero: `PED-${String(totalVentas + 1).padStart(3, "0")}`,
        concepto: cot.numero ?? `Pedido — ${cliente.nombre}`,
        monto: cot.total, fecha: hoy, estado: "Cotizado",
        notas: cot.notas || null, cantidad: 1, cliente: cliente.documentId,
      })
      for (const item of cot.items ?? []) {
        if (!item.descripcion.trim()) continue
        await createVentaLinea({
          venta: creada.documentId, producto: item.productoId || null,
          descripcion: item.descripcion.trim(), cantidad: item.cantidad || 1,
          precioUnitario: item.precio || 0, subtotal: item.subtotal,
        })
      }
      const patch: Partial<VentaPayload> = { estado: "Pagado" }
      if (comprobante) patch.comprobantePago = (await uploadMedia(comprobante)).id
      const confirmada = await updateVenta(creada.documentId, patch)
      // Igual que en CotizacionesView: marcar la cotización como Convertida
      // y ligarla al pedido real — este era el segundo camino de conversión
      // (desde el gate del Funnel) que se había quedado sin esta trazabilidad.
      await updateCotizacion(cot.documentId, {
        estado: "Convertida",
        ventaGenerada: { connect: [{ id: confirmada.id }] },
      })
      toast.success(`Pedido creado desde ${cot.numero}`)
      onCreated(confirmada)
    } catch { toast.error("Error al convertir la cotización"); setConvirtiendo(null) }
  }

  async function crearRapido() {
    const monto = parseFloat(form.monto)
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.monto || isNaN(monto) || monto <= 0) { toast.error("Monto inválido"); return }
    setGuardando(true)
    try {
      const creada = await createVenta({
        numero: `PED-${String(totalVentas + 1).padStart(3, "0")}`,
        concepto: form.concepto.trim(), monto, fecha: form.fecha,
        estado: form.estado, metodoPago: form.metodoPago,
        cantidad: 1, cliente: cliente.documentId,
      })
      toast.success("Pedido creado")
      onCreated(creada)
    } catch { toast.error("Error al crear el pedido") } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-violet-400" /> Vincular pedido real
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{cliente.nombre}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={15} /></button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Para pasar a "Pedido" necesita un pedido real conectado — así el stock y las finanzas se actualizan solos.
        </p>

        {cotizacionesAceptadas.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Cotizaciones aceptadas</p>

            <input ref={comprobanteRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => setComprobante(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => comprobanteRef.current?.click()}
              className="w-full flex items-center gap-2 h-8 mb-2 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 px-3 text-[11px] text-slate-400 hover:border-violet-500/50 hover:text-slate-200 transition-all">
              <Paperclip size={12} className="shrink-0" />
              <span className="truncate">{comprobante ? comprobante.name : "Adjuntar evidencia de pago (opcional)"}</span>
            </button>

            <div className="space-y-1.5">
              {cotizacionesAceptadas.map(cot => (
                <button key={cot.documentId} type="button" disabled={convirtiendo === cot.documentId}
                  onClick={() => convertirCotizacion(cot)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700 hover:border-violet-600 bg-slate-800/60 hover:bg-violet-500/5 transition text-left disabled:opacity-50">
                  <div>
                    <p className="text-[11px] font-bold font-mono text-slate-300">{cot.numero}</p>
                    <p className="text-[11px] font-semibold text-violet-400">{fmtMoney(cot.total)}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    {convirtiendo === cot.documentId ? "Creando..." : <>Convertir <ArrowRightCircle size={12} /></>}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setModoRapido(m => !m)}
              className="text-[10px] text-slate-600 hover:text-slate-400 mt-2 transition">
              {modoRapido ? "Ocultar" : "O crear un pedido nuevo sin cotización"}
            </button>
          </div>
        )}

        {modoRapido && (
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div>
              <label className={lbl}>Concepto</label>
              <input value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Monto *</label>
                <input type="number" min="0" step="0.01" value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00" className={inp} />
              </div>
              <div>
                <label className={lbl}>Fecha</label>
                <input type="date" title="Fecha" value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
              </div>
            </div>
            <button type="button" onClick={crearRapido} disabled={guardando}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
              <Check size={14} />{guardando ? "Creando..." : "Crear pedido y avanzar"}
            </button>
          </div>
        )}

        <button type="button" onClick={onClose}
          className="w-full text-center text-[11px] text-slate-600 hover:text-slate-400 transition pt-1">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Panel de cliente (compartido por Pipeline, Leads y Contactos) ────────────
export function ClientePanel({ cliente, num, ventasDelCliente, onClose, onUpdate, onEdit, onAvanzar, onRetroceder, onRechazar, onRecuperar, onNuevoPedido, onVentaActualizada, backLabel = "Volver", mostrarAccionesEtapa = true }: {
  cliente: ClienteEmpresa; num: string; ventasDelCliente: VentaEmpresa[]
  onClose: () => void; onUpdate: (u: ClienteEmpresa) => void; onEdit: () => void
  onAvanzar:    (c: ClienteEmpresa) => void
  onRetroceder: (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
  onRechazar:   (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
  onRecuperar:  (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
  onNuevoPedido: (c: ClienteEmpresa) => void
  onVentaActualizada: (v: VentaEmpresa) => void
  backLabel?: string
  // Avanzar/Rechazar/Retroceder etapa solo tiene sentido cuando el cliente
  // se está gestionando activamente en el embudo (Leads/Pipeline) — en el
  // directorio de Contactos se oculta, ahí solo aplica ver/editar datos.
  mostrarAccionesEtapa?: boolean
}) {
  const etapa = cliente.Funnel ?? "Lead"
  const [cotModalState, setCotModalState] = useState<null | "nueva" | Cotizacion>(null)
  const [tab, setTab] = useState<"general" | "ventas">("ventas")
  const [pedidoAbierto, setPedidoAbierto] = useState<VentaEmpresa | null>(null)

  // Edición rápida en línea por tarjeta — evita meter todos los campos en
  // el modal grande de alta/edición (ese se queda corto y enfocado al
  // registrar un contacto nuevo).
  const [editandoContacto, setEditandoContacto] = useState(false)
  const [contactoForm, setContactoForm]         = useState<ClientePayload | null>(null)
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [editandoNotas, setEditandoNotas]       = useState(false)
  const [notasForm, setNotasForm]               = useState("")
  const [guardandoNotas, setGuardandoNotas]     = useState(false)

  const abrirEditarContacto = () => {
    setContactoForm({
      nombre: cliente.nombre,
      direccion: cliente.direccion, canalContacto: cliente.canalContacto,
      tallaAnillo: cliente.tallaAnillo, ocasionFrecuente: cliente.ocasionFrecuente,
      estadoCivil: cliente.estadoCivil, redesSociales: cliente.redesSociales,
      origenContacto: cliente.origenContacto, segmento: cliente.segmento,
    })
    setEditandoContacto(true)
  }
  const guardarContacto = async () => {
    if (!contactoForm) return
    setGuardandoContacto(true)
    try {
      const updated = await updateCliente(cliente.documentId, contactoForm)
      onUpdate(updated)
      toast.success("Datos actualizados")
      setEditandoContacto(false)
    } catch { toast.error("Error al guardar") } finally { setGuardandoContacto(false) }
  }

  const abrirEditarNotas = () => { setNotasForm(cliente.notas ?? ""); setEditandoNotas(true) }
  const guardarNotas = async () => {
    setGuardandoNotas(true)
    try {
      const updated = await updateCliente(cliente.documentId, { notas: notasForm || null })
      onUpdate(updated)
      toast.success("Notas actualizadas")
      setEditandoNotas(false)
    } catch { toast.error("Error al guardar") } finally { setGuardandoNotas(false) }
  }
  const { cotizaciones, setCotizaciones, loading: cotLoading } = useGetCotizaciones(cliente.documentId)

  const handleCotizacionSaved = useCallback((saved: Cotizacion) => {
    setCotizaciones(prev => {
      const exists = prev.find(c => c.documentId === saved.documentId)
      return exists
        ? prev.map(c => c.documentId === saved.documentId ? saved : c)
        : [...prev, saved]
    })
    setCotModalState(null)
  }, [setCotizaciones])

  // Resumen de valor de vida del cliente — mismos datos que ya se cargan
  // arriba (ventasDelCliente/cotizaciones), solo agregados distinto.
  const ventasReales   = ventasDelCliente.filter(v => v.estado !== "Cancelado")
  const totalGastado   = ventasReales.reduce((s, v) => s + (v.monto ?? 0), 0)
  const ticketPromedio = ventasReales.length > 0 ? totalGastado / ventasReales.length : 0
  const cotAceptadas   = cotizaciones.filter(c => c.estado === "Aceptada").length
  // Clasificación de primer intento por # de compras reales — ajustable si
  // luego se quiere basar en frecuencia/monto en vez de conteo simple.
  const clasificacion =
    ventasReales.length === 0 ? "Sin compras" :
    ventasReales.length === 1 ? "Nuevo" :
    ventasReales.length <= 3  ? "Ocasional" : "Frecuente"
  const antiguedadDias = Math.floor((Date.now() - new Date(cliente.createdAt).getTime()) / 86400000)
  const antiguedadTexto =
    antiguedadDias < 30  ? `${antiguedadDias}d` :
    antiguedadDias < 365 ? `${Math.round(antiguedadDias / 30)} meses` :
    `${(antiguedadDias / 365).toFixed(1)} años`
  const clienteDesdeTexto = new Date(cliente.createdAt).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
  const ultimaVenta = ventasReales.length > 0
    ? ventasReales.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null
  const diasUltimaCompra = ultimaVenta ? Math.floor((Date.now() - new Date(ultimaVenta.fecha).getTime()) / 86400000) : null
  const pctConversion = cotizaciones.length > 0 ? Math.round((cotAceptadas / cotizaciones.length) * 100) : null
  const CLASIFICACION_CAPTION: Record<string, string> = {
    "Sin compras": "sin pedidos registrados",
    "Nuevo":       "1 pedido registrado",
    "Ocasional":   "2-3 pedidos registrados",
    "Frecuente":   "4+ pedidos registrados",
  }
  const tituloCotizacion = (items: ItemCotizacion[]) =>
    items.length === 0 ? "Sin artículos" :
    items.length === 1 ? items[0].descripcion :
    `${items[0].descripcion} +${items.length - 1} más`

  // Actividad de cotizaciones/pedidos agrupada por mes, para la gráfica
  const actividadPorMes = useMemo(() => {
    const map = new Map<string, { cotizaciones: number; pedidos: number }>()
    cotizaciones.forEach(c => {
      const fecha = c.fecha ?? c.createdAt
      if (!fecha) return
      const key = fecha.slice(0, 7)
      const row = map.get(key) ?? { cotizaciones: 0, pedidos: 0 }
      row.cotizaciones += 1
      map.set(key, row)
    })
    ventasReales.forEach(v => {
      if (!v.fecha) return
      const key = v.fecha.slice(0, 7)
      const row = map.get(key) ?? { cotizaciones: 0, pedidos: 0 }
      row.pedidos += 1
      map.set(key, row)
    })
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => {
        const [y, m] = mes.split("-")
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
        return { mes: label, ...v }
      })
  }, [cotizaciones, ventasReales])

  const iniciales = cliente.nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("")

  const cardCls = "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
  const cardHeadCls = "flex items-center justify-between px-4 py-3 border-b border-slate-800"
  const cardTitleCls = "text-xs font-bold text-slate-200"
  const editLblCls = "text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1 block"
  const editInpCls = "w-full px-2.5 py-1.5 text-[13px] rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-violet-500"
  const editCancelCls = "px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg transition"
  const editSaveCls = "flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition disabled:opacity-50"
  const cardEditBtnCls = "flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition"

  return (
    <div className="space-y-5">
      <button type="button" onClick={onClose}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition">
        <ArrowLeft size={14} /> {backLabel}
      </button>

      {/* Identidad */}
      <div className={`${cardCls} p-5 space-y-4`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-white font-bold text-base shrink-0">
              {iniciales || <User size={18} />}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">{cliente.nombre}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cliente desde {clienteDesdeTexto}
                {diasUltimaCompra != null ? ` · Última compra hace ${diasUltimaCompra}d` : " · Sin compras todavía"}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${STAGE_META[etapa].numColor}`}>#{num}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>{FUNNEL_LABEL[etapa]}</span>
                {etapa === "Lead" && cliente.calificado && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold bg-violet-500/15 text-violet-300 border-violet-500/30">Calificado</span>
                )}
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold bg-violet-500/10 text-violet-400 border-violet-500/20">
                  <Tag size={9} />{clasificacion}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-400">
              <Pencil size={12} /> Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Teléfono</p>
            {cliente.telefono ? (
              <a href={`tel:${cliente.telefono}`} className="text-xs font-medium text-slate-300 hover:text-violet-400 transition flex items-center gap-1.5">
                <Phone size={11} className="text-slate-600 shrink-0" />{cliente.telefono}
              </a>
            ) : <p className="text-xs text-slate-700">—</p>}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Correo</p>
            {cliente.email ? (
              <a href={`mailto:${cliente.email}`} className="text-xs font-medium text-slate-300 hover:text-violet-400 transition flex items-center gap-1.5 truncate">
                <Mail size={11} className="text-slate-600 shrink-0" />{cliente.email}
              </a>
            ) : <p className="text-xs text-slate-700">—</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Canal de origen</p>
            <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              {cliente.canalContacto ? <CanalIcon canal={cliente.canalContacto} /> : null}
              {cliente.origenContacto || cliente.canalContacto || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Clasificación</p>
            <p className="text-xs font-medium text-slate-300">
              {clasificacion} <span className="text-slate-600 font-normal">— {CLASIFICACION_CAPTION[clasificacion]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de valor de vida del cliente */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Total histórico</p>
          <p className="text-2xl font-bold text-violet-400 font-mono tracking-tight">{fmtMoney(totalGastado)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{ventasReales.length} pedido{ventasReales.length === 1 ? "" : "s"} registrado{ventasReales.length === 1 ? "" : "s"}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Ticket promedio</p>
          <p className="text-2xl font-bold text-slate-200 font-mono tracking-tight">{ventasReales.length > 0 ? fmtMoney(ticketPromedio) : "—"}</p>
          <p className="text-[11px] text-slate-500 mt-1">por pedido</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Cotiz. aceptadas</p>
          <p className="text-2xl font-bold text-slate-200 font-mono tracking-tight">{cotAceptadas}<span className="text-slate-600 font-normal text-base"> / {cotizaciones.length}</span></p>
          <p className="text-[11px] text-slate-500 mt-1">{pctConversion != null ? `${pctConversion}% de conversión` : "sin cotizaciones"}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Antigüedad</p>
          <p className="text-2xl font-bold text-slate-200 font-mono tracking-tight">{antiguedadTexto}</p>
          <p className="text-[11px] text-slate-500 mt-1">como cliente</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        {[
          { id: "general" as const, label: "General", count: null as number | null },
          { id: "ventas" as const,  label: "Ventas",  count: cotizaciones.length + ventasDelCliente.length },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-3 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id ? "text-slate-100 border-violet-500" : "text-slate-500 border-transparent hover:text-slate-300"
            }`}>
            {t.label}
            {t.count != null && (
              <span className={`ml-1.5 text-[10px] font-mono ${tab === t.id ? "text-violet-400" : "text-slate-600"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className={cardCls}>
            <div className={cardHeadCls}>
              <h3 className={cardTitleCls}>Contacto y dirección</h3>
              {!editandoContacto && (
                <button type="button" onClick={abrirEditarContacto} className={cardEditBtnCls}>
                  <Pencil size={10} /> Editar
                </button>
              )}
            </div>
            {editandoContacto && contactoForm ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <label className={editLblCls}>Dirección</label>
                  <input value={contactoForm.direccion ?? ""}
                    onChange={e => setContactoForm(f => f && ({ ...f, direccion: e.target.value || null }))}
                    className={editInpCls} />
                </div>
                <div>
                  <label className={editLblCls}>Canal preferido</label>
                  <select value={contactoForm.canalContacto ?? ""} title="Canal preferido"
                    onChange={e => setContactoForm(f => f && ({ ...f, canalContacto: e.target.value || null }))}
                    className={editInpCls}>
                    <option value="">— Sin especificar —</option>
                    {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={editLblCls}>Talla de anillo</label>
                  <input value={contactoForm.tallaAnillo ?? ""}
                    onChange={e => setContactoForm(f => f && ({ ...f, tallaAnillo: e.target.value || null }))}
                    placeholder="6.5 MX" className={editInpCls} />
                </div>
                <div>
                  <label className={editLblCls}>Ocasión frecuente</label>
                  <input value={contactoForm.ocasionFrecuente ?? ""}
                    onChange={e => setContactoForm(f => f && ({ ...f, ocasionFrecuente: e.target.value || null }))}
                    placeholder="Regalos de aniversario…" className={editInpCls} />
                </div>
                <div>
                  <label className={editLblCls}>Estado civil</label>
                  <select value={contactoForm.estadoCivil ?? ""} title="Estado civil"
                    onChange={e => setContactoForm(f => f && ({ ...f, estadoCivil: (e.target.value || null) as typeof f.estadoCivil }))}
                    className={editInpCls}>
                    <option value="">— Sin especificar —</option>
                    {ESTADOS_CIVILES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className={editLblCls}>Redes sociales</label>
                  <input value={contactoForm.redesSociales ?? ""}
                    onChange={e => setContactoForm(f => f && ({ ...f, redesSociales: e.target.value || null }))}
                    placeholder="@usuario_instagram" className={editInpCls} />
                </div>
                <div>
                  <label className={editLblCls}>Origen del contacto</label>
                  <input value={contactoForm.origenContacto ?? ""}
                    onChange={e => setContactoForm(f => f && ({ ...f, origenContacto: e.target.value || null }))}
                    className={editInpCls} />
                </div>
                <div>
                  <label className={editLblCls}>Segmento</label>
                  <select value={contactoForm.segmento ?? ""} title="Segmento"
                    onChange={e => setContactoForm(f => f && ({ ...f, segmento: (e.target.value || null) as typeof f.segmento }))}
                    className={editInpCls}>
                    <option value="">— Sin segmento —</option>
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setEditandoContacto(false)} className={editCancelCls}>Cancelar</button>
                  <button type="button" onClick={guardarContacto} disabled={guardandoContacto} className={editSaveCls}>
                    <Check size={12} /> {guardandoContacto ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Dirección</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.direccion || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Canal preferido</p>
                  <p className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
                    {cliente.canalContacto && <CanalIcon canal={cliente.canalContacto} />}
                    {cliente.canalContacto || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Talla de anillo</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.tallaAnillo || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Ocasión frecuente</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.ocasionFrecuente || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Estado civil</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.estadoCivil || "—"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Redes sociales</p>
                  <p className="text-[13px] font-medium text-slate-200 truncate">{cliente.redesSociales || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Origen del contacto</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.origenContacto || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Segmento</p>
                  <p className="text-[13px] font-medium text-slate-200">{cliente.segmento || "—"}</p>
                </div>
              </div>
            )}
          </div>
          <div className={cardCls}>
            <div className={cardHeadCls}>
              <h3 className={cardTitleCls}>Notas</h3>
              {!editandoNotas && (
                <button type="button" onClick={abrirEditarNotas} className={cardEditBtnCls}>
                  <Pencil size={10} /> Editar
                </button>
              )}
            </div>
            <div className="p-4">
              {editandoNotas ? (
                <div className="space-y-2">
                  <textarea value={notasForm} onChange={e => setNotasForm(e.target.value)} rows={4}
                    placeholder="Preferencias, ocasiones, detalles a recordar…"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500 resize-none" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditandoNotas(false)} className={editCancelCls}>Cancelar</button>
                    <button type="button" onClick={guardarNotas} disabled={guardandoNotas} className={editSaveCls}>
                      <Check size={12} /> {guardandoNotas ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : cliente.notas ? (
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 rounded-lg px-3 py-2.5">{cliente.notas}</p>
              ) : (
                <p className="text-[11px] text-slate-700">Sin notas todavía.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "ventas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

            {/* Cotizaciones */}
            <div className={cardCls}>
              <div className={cardHeadCls}>
                <h3 className={cardTitleCls}>Cotizaciones</h3>
                <button type="button"
                  onClick={() => setCotModalState("nueva")}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                  <Plus size={10} /> Nueva
                </button>
              </div>
              <div className="p-2">
                {cotLoading ? (
                  <p className="text-[11px] text-slate-700 py-3 px-2">Cargando...</p>
                ) : cotizaciones.length === 0 ? (
                  <button type="button"
                    onClick={() => setCotModalState("nueva")}
                    className="w-full flex items-center justify-center gap-1.5 py-6 text-[11px] text-slate-700 hover:text-violet-400 transition">
                    <FileText size={11} /> Crear primera cotización
                  </button>
                ) : (
                  <div className="space-y-0.5">
                    {cotizaciones.map(c => (
                      <button key={c.documentId} type="button"
                        onClick={() => setCotModalState(c)}
                        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-800/60 transition text-left">
                        <span className="text-[11px] font-bold font-mono text-violet-400 w-16 shrink-0">{c.numero}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-slate-200 truncate">{tituloCotizacion(c.items)}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{c.estado} · {fmtDt(c.fecha ?? c.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[c.estado]}`}>
                            {c.estado}
                          </span>
                          <span className="text-[13px] font-semibold text-slate-200 font-mono">{fmtMoney(c.total)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos reales */}
            <div className={cardCls}>
              <div className={cardHeadCls}>
                <h3 className={cardTitleCls}>Pedidos</h3>
                <button type="button"
                  onClick={() => onNuevoPedido(cliente)}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                  <Plus size={10} /> Nuevo
                </button>
              </div>
              <div className="p-2">
                {ventasDelCliente.length === 0 ? (
                  <p className="text-[11px] text-slate-700 py-6 px-2 text-center">Sin pedidos reales conectados todavía.</p>
                ) : (
                  <div className="space-y-0.5">
                    {ventasDelCliente.map(v => (
                      <button key={v.documentId} type="button"
                        onClick={() => setPedidoAbierto(v)}
                        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-800/60 transition text-left">
                        <span className="text-[11px] font-bold font-mono text-violet-400 w-16 shrink-0">{v.numero ?? "—"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-slate-200 truncate">{v.concepto}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{v.estado ?? "Sin estado"} · {v.fecha ? fmtDt(v.fecha) : "—"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {v.estado && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>{v.estado}</span>
                          )}
                          <span className="text-[13px] font-semibold text-violet-400 font-mono">{fmtMoney(v.monto)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actividad por mes — cotizaciones y pedidos, a lo ancho */}
      <div className={cardCls}>
        <div className={cardHeadCls}><h3 className={cardTitleCls}>Actividad por mes</h3></div>
        <div className="p-4">
          {actividadPorMes.length === 0 ? (
            <p className="text-[11px] text-slate-700 py-6 text-center">Todavía no hay cotizaciones ni pedidos para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actividadPorMes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Bar dataKey="cotizaciones" name="Cotizaciones" fill="#c4b5fd" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="pedidos" name="Pedidos" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Acciones de etapa — solo si se está gestionando el embudo (Leads/Pipeline) */}
      {mostrarAccionesEtapa && (
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {etapa === "Rechazada" ? (
          <button type="button"
            onClick={async () => { const u = await onRecuperar(cliente); if (u) onUpdate(u) }}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border border-violet-800/50 hover:border-violet-600 text-violet-500 hover:text-violet-300 rounded-lg transition">
            <RotateCcw size={12} /> Recuperar (volver a Lead)
          </button>
        ) : (
          <>
            {etapa !== "Entrega" && (
              <button type="button"
                onClick={async () => { const u = await onRechazar(cliente); if (u) onUpdate(u) }}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border border-red-900/40 hover:border-red-700 text-red-700 hover:text-red-400 rounded-lg transition">
                <XCircle size={12} /> Rechazar
              </button>
            )}
            {etapa !== "Lead" && (
              <button type="button"
                onClick={async () => { const u = await onRetroceder(cliente); if (u) onUpdate(u) }}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-500">
                <ChevronLeft size={12} />{FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) - 1]]}
              </button>
            )}
            {etapa !== "Entrega" && (
              <button type="button" onClick={() => onAvanzar(cliente)}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border border-violet-600/60 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-500 text-violet-300 rounded-lg transition">
                {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(etapa) + 1]]}<ChevronRight size={12} />
              </button>
            )}
          </>
        )}
      </div>
      )}

      {cotModalState && (
        <CotizacionModal
          cliente={cliente}
          cotizacion={cotModalState === "nueva" ? null : cotModalState}
          totalCotizaciones={cotizaciones.length}
          onClose={() => setCotModalState(null)}
          onSaved={handleCotizacionSaved}
        />
      )}

      {pedidoAbierto && (
        <PedidoModal
          venta={pedidoAbierto}
          onClose={() => setPedidoAbierto(null)}
          onSaved={updated => {
            onVentaActualizada(updated)
            setPedidoAbierto(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Modal alta/edición de cliente (compartido) ───────────────────────────────
export function ClienteModal({ editando, form, setForm, onGuardar, onCerrar, guardando }: {
  editando: ClienteEmpresa | null; form: ClientePayload
  setForm: React.Dispatch<React.SetStateAction<ClientePayload>>
  onGuardar: () => void; onCerrar: () => void; guardando: boolean
}) {
  const etapa = form.Funnel ?? "Lead"
  const inp   = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl   = "block text-[11px] text-slate-500 mb-1"

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border ${FUNNEL_COLOR[etapa]}`}>
              {FUNNEL_LABEL[etapa]}
            </span>
            {editando && (
              <span className="text-[10px] text-slate-600">
                Para cambiar de etapa usa los botones de avanzar/rechazar del pipeline — así siempre queda un pedido real conectado antes de pasar a "Pedido".
              </span>
            )}
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

        <div>
          <label className={lbl}>Dirección</label>
          <input value={form.direccion ?? ""}
            onChange={e => setForm(f => ({ ...f, direccion: e.target.value || null }))}
            placeholder="Calle, número, colonia, ciudad…" className={inp} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Talla de anillo</label>
            <input value={form.tallaAnillo ?? ""}
              onChange={e => setForm(f => ({ ...f, tallaAnillo: e.target.value || null }))}
              placeholder="6.5 MX" className={inp} />
          </div>
          <div>
            <label className={lbl}>Estado civil</label>
            <select value={form.estadoCivil ?? ""} title="Estado civil"
              onChange={e => setForm(f => ({ ...f, estadoCivil: (e.target.value || null) as typeof f.estadoCivil }))}
              className={inp}>
              <option value="">— Sin especificar —</option>
              {ESTADOS_CIVILES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Ocasión frecuente</label>
          <input value={form.ocasionFrecuente ?? ""}
            onChange={e => setForm(f => ({ ...f, ocasionFrecuente: e.target.value || null }))}
            placeholder="Regalos de aniversario, cumpleaños…" className={inp} />
        </div>

        <div>
          <label className={lbl}>Redes sociales</label>
          <input value={form.redesSociales ?? ""}
            onChange={e => setForm(f => ({ ...f, redesSociales: e.target.value || null }))}
            placeholder="@usuario_instagram" className={inp} />
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
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                    : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                <CheckCircle2 size={15} className={form.calificado ? "text-violet-400" : "text-slate-600"} />
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} /> {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline View ────────────────────────────────────────────────────────────
export function emptyCliente(etapa: FunnelEtapa = "Lead"): ClientePayload {
  return {
    nombre: "", email: null, telefono: null, direccion: null,
    segmento: null, Funnel: etapa, calificado: false,
    canalContacto: null, origenContacto: null, Estado: "Activo", notas: null,
    tallaAnillo: null, ocasionFrecuente: null, estadoCivil: null, redesSociales: null,
    fechaLead: etapa === "Lead" ? new Date().toISOString() : null,
    fechaCalificado: null, fechaOferta: null, fechaPedido: null, fechaEntrega: null,
  }
}

export function PipelineView() {
  const {
    clientes, loading,
    totalVentas,
    ventasPorCliente, ventasActivasPorCliente, cotizacionesPorCliente, valorPorCliente,
    actualizarVenta, actualizarCotizacion,
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
  } = useClientesPipeline()

  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente())
  const [guardando,       setGuardando]       = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)
  const [cotizacionAbierta, setCotizacionAbierta] = useState<{ cliente: ClienteEmpresa; cotizacion: Cotizacion } | null>(null)
  const [pedidoAbiertoBoard, setPedidoAbiertoBoard] = useState<VentaEmpresa | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const porFunnel = useMemo(() => {
    const map = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ALL.forEach(e => map.set(e, []))
    clientes
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(c => map.get(c.Funnel ?? "Lead")?.push(c))
    return map
  }, [clientes])

  const numMap = useMemo(() => {
    const m = new Map<string, string>()
    FUNNEL_ALL.forEach(etapa => {
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
      tallaAnillo: c.tallaAnillo, ocasionFrecuente: c.ocasionFrecuente, estadoCivil: c.estadoCivil, redesSociales: c.redesSociales,
      fechaLead: c.fechaLead, fechaCalificado: c.fechaCalificado,
      fechaOferta: c.fechaOferta, fechaPedido: c.fechaPedido, fechaEntrega: c.fechaEntrega,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      const saved = await guardarCliente(editando, form)
      if (selectedCliente?.documentId === saved.documentId) setSelectedCliente(saved)
      toast.success(editando ? "Actualizado" : "Creado")
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const handleAvanzar = async (c: ClienteEmpresa) => {
    const u = await avanzar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
  }
  const handleRechazar = async (c: ClienteEmpresa) => {
    const u = await rechazar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
    return u
  }
  const handleRecuperar = async (c: ClienteEmpresa) => {
    const u = await recuperar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
    return u
  }
  const handleCalificar = async (c: ClienteEmpresa) => {
    const u = await toggleCalificado(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
  }
  const handleBorrar = async (c: ClienteEmpresa) => {
    const ok = await borrar(c)
    if (ok && selectedCliente?.documentId === c.documentId) setSelectedCliente(null)
  }
  const onPedidoCreado = async (v: VentaEmpresa) => {
    const u = await handlePedidoCreado(v)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
  }

  // Al abrir una tarjeta, se va directo a lo que representa esa etapa —
  // Oferta abre su cotización real, Pedido/Entrega abren su pedido real; si
  // todavía no hay nada conectado, cae a la ficha completa del contacto.
  const abrirTarjeta = (c: ClienteEmpresa) => {
    const etapa = c.Funnel ?? "Lead"
    if (etapa === "Oferta") {
      const cots = (cotizacionesPorCliente.get(c.documentId) ?? [])
        .slice()
        .sort((a, b) => new Date(b.fecha ?? b.createdAt).getTime() - new Date(a.fecha ?? a.createdAt).getTime())
      const activa = cots.find(ct => ct.estado !== "Rechazada") ?? cots[0]
      if (activa) { setCotizacionAbierta({ cliente: c, cotizacion: activa }); return }
    }
    if (etapa === "Pedido" || etapa === "Entrega") {
      const ventas = (ventasPorCliente.get(c.documentId) ?? [])
        .filter(v => v.estado !== "Cancelado")
        .slice()
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      if (ventas[0]) { setPedidoAbiertoBoard(ventas[0]); return }
    }
    setSelectedCliente(c)
  }

  // Arrastrar una tarjeta reusa exactamente las mismas funciones que ya usan
  // los botones (avanzar/retroceder/rechazar/recuperar) — mismo poka-yoke de
  // siempre (ej. no se puede avanzar a Pedido sin un pedido real conectado),
  // solo un gesto distinto para dispararlo. Solo se permite moverse a la
  // etapa adyacente, igual que con los botones (nunca saltos de más de una).
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const cliente = clientes.find(c => c.documentId === active.id)
    if (!cliente) return
    const etapaOrigen  = cliente.Funnel ?? "Lead"
    const etapaDestino = over.id as FunnelEtapa
    if (etapaOrigen === etapaDestino) return

    if (etapaDestino === "Rechazada") { handleRechazar(cliente); return }
    if (etapaOrigen === "Rechazada") {
      if (etapaDestino === "Lead") handleRecuperar(cliente)
      else toast.error("Primero recupérala a Lead antes de moverla a otra etapa")
      return
    }

    const idxOrigen  = FUNNEL_ETAPAS.indexOf(etapaOrigen)
    const idxDestino = FUNNEL_ETAPAS.indexOf(etapaDestino)
    if (idxDestino === idxOrigen + 1) { handleAvanzar(cliente); return }
    if (idxDestino === idxOrigen - 1) { retroceder(cliente); return }
    toast.error("Solo puedes mover una etapa a la vez")
  }

  const leadsCalificados = clientes.filter(c => c.Funnel === "Lead" && c.calificado).length
  const rechazados       = clientes.filter(c => c.Funnel === "Rechazada").length

  if (selectedCliente) {
    return (
      <div className="p-6">
        <ClientePanel
          cliente={selectedCliente}
          num={numMap.get(selectedCliente.documentId) ?? "—"}
          ventasDelCliente={ventasPorCliente.get(selectedCliente.documentId) ?? []}
          onClose={() => setSelectedCliente(null)}
          onUpdate={setSelectedCliente}
          onEdit={() => { abrirEditar(selectedCliente); setSelectedCliente(null) }}
          onAvanzar={handleAvanzar}
          onRetroceder={retroceder}
          onRechazar={handleRechazar}
          onRecuperar={handleRecuperar}
          onNuevoPedido={setPedidoGateFor}
          onVentaActualizada={actualizarVenta}
          backLabel="Volver al Pipeline"
        />

        {modalOpen && (
          <ClienteModal editando={editando} form={form} setForm={setForm}
            onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
        )}

        {pedidoGateFor && (
          <NuevoPedidoGateModal
            cliente={pedidoGateFor}
            cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
            totalVentas={totalVentas}
            onClose={() => setPedidoGateFor(null)}
            onCreated={onPedidoCreado}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline de ventas</h1>
          <p className="text-sm text-slate-500">
            {clientes.filter(c => c.Funnel !== "Entrega" && c.Funnel !== "Rechazada").length} en proceso ·{" "}
            {leadsCalificados} calificados ·{" "}
            {clientes.filter(c => c.Funnel === "Entrega").length} entregas ·{" "}
            <span className="text-red-600">{rechazados} rechazadas</span>
          </p>
        </div>
        <button type="button" onClick={() => abrirCrear("Lead")}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1100px]">
            {FUNNEL_ALL.map(etapa => {
              const items = porFunnel.get(etapa) ?? []
              const calificadosEnCol = etapa === "Lead" ? items.filter(c => c.calificado).length : null
              const esRechazada = etapa === "Rechazada"
              return (
                <div key={etapa} className={`flex flex-col gap-2 ${esRechazada ? "min-w-[180px] w-[180px]" : "flex-1 min-w-[190px]"}`}>
                  <div className={`px-3 py-2.5 rounded-xl border ${FUNNEL_COLOR[etapa]} ${esRechazada ? "opacity-70" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{FUNNEL_LABEL[etapa]}</span>
                      <div className="flex items-center gap-1">
                        {calificadosEnCol !== null && calificadosEnCol > 0 && (
                          <span className="text-[9px] font-semibold bg-violet-500/20 text-violet-300 px-1 py-0.5 rounded-full">
                            {calificadosEnCol} cal.
                          </span>
                        )}
                        <span className="text-[10px] font-bold opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{items.length}</span>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-60 mt-0.5 leading-snug">{STAGE_META[etapa].desc}</p>
                  </div>

                  <DroppableColumn etapa={etapa}>
                    {items.map((c, i) => (
                      <DraggableClienteCard key={c.documentId} c={c}
                        num={numDisplay(etapa, i)} etapa={etapa}
                        valor={valorPorCliente.get(c.documentId) ?? null}
                        dias={diasSinMovimiento(c, etapa)}
                        sinPedidoReal={(etapa === "Pedido" || etapa === "Entrega") && (ventasActivasPorCliente.get(c.documentId)?.length ?? 0) === 0}
                        onEdit={() => abrirEditar(c)}
                        onDelete={() => handleBorrar(c)}
                        onSelect={() => abrirTarjeta(c)}
                        onAvanzar={!esRechazada && etapa !== "Entrega" ? () => handleAvanzar(c) : undefined}
                        onCalificar={etapa === "Lead" ? () => handleCalificar(c) : undefined}
                        onRechazar={!esRechazada && etapa !== "Entrega" ? () => handleRechazar(c) : undefined}
                        onRecuperar={esRechazada ? () => handleRecuperar(c) : undefined}
                      />
                    ))}
                  </DroppableColumn>

                  {/* Solo se puede dar de alta directo en Lead/Oferta — Pedido/Entrega
                      solo se alcanzan avanzando con un pedido real conectado (poka-yoke) */}
                  {(etapa === "Lead" || etapa === "Oferta") && (
                    <button type="button" onClick={() => abrirCrear(etapa)}
                      className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition mt-1">
                      <Plus size={10} /> Agregar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        </DndContext>
      )}

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {pedidoGateFor && (
        <NuevoPedidoGateModal
          cliente={pedidoGateFor}
          cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
          totalVentas={totalVentas}
          onClose={() => setPedidoGateFor(null)}
          onCreated={onPedidoCreado}
        />
      )}

      {cotizacionAbierta && (
        <CotizacionModal
          cliente={cotizacionAbierta.cliente}
          cotizacion={cotizacionAbierta.cotizacion}
          totalCotizaciones={cotizacionesPorCliente.get(cotizacionAbierta.cliente.documentId)?.length ?? 0}
          onClose={() => setCotizacionAbierta(null)}
          onSaved={saved => { actualizarCotizacion(saved); setCotizacionAbierta(null) }}
        />
      )}

      {pedidoAbiertoBoard && (
        <PedidoModal
          venta={pedidoAbiertoBoard}
          onClose={() => setPedidoAbiertoBoard(null)}
          onSaved={updated => { actualizarVenta(updated); setPedidoAbiertoBoard(null) }}
        />
      )}
    </div>
  )
}
