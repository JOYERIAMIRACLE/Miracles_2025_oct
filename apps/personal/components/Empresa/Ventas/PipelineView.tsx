"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, X, Check, Phone, Mail, MessageCircle, MapPin,
  ChevronRight, ChevronLeft, Pencil, Trash2, User, ArrowRight, CheckCircle2, FileText, XCircle, RotateCcw,
  DollarSign, Banknote, AlertCircle, ShoppingBag, Clock, AlertTriangle, ArrowRightCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_ALL, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS,
} from "@/types/clienteEmpresa"
import { Cotizacion, ESTADO_COT_COLOR } from "@/types/cotizacion"
import { useGetCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { CotizacionModal } from "./CotizacionModal"
import { useGetTransaccionesByCliente } from "@/api/transaccion/getTransacciones"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { TransaccionType, METODOS_PAGO, MetodoPagoTransaccion } from "@/types/transaccion"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { createVenta, updateVenta } from "@/api/ventaEmpresa/getVentas"
import { createVentaLinea } from "@/api/venta-linea/mutateVentaLinea"
import { VentaEmpresa, EstadoVenta, ESTADO_VENTA_COLOR } from "@/types/ventaEmpresa"
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
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
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
          onClick={e => { e.stopPropagation(); onCalificar?.() }}
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
          onClick={e => { e.stopPropagation(); onRecuperar() }}
          className="flex items-center justify-center gap-1 w-full mt-0.5 py-1 text-[10px] text-violet-500 hover:text-violet-300 border border-dashed border-violet-900/50 hover:border-violet-700 rounded-lg transition">
          <RotateCcw size={10} /> Recuperar
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

      {/* Rechazar */}
      {onRechazar && (
        <button type="button"
          onClick={e => { e.stopPropagation(); onRechazar() }}
          className="flex items-center justify-center gap-1 w-full py-1 text-[10px] text-red-700 hover:text-red-400 border border-dashed border-red-900/30 hover:border-red-800/50 rounded-lg transition">
          <XCircle size={10} /> Rechazar
        </button>
      )}
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
}

function PagoModal({ clienteNombre, clienteDocumentId, onClose, onSaved }: {
  clienteNombre:     string
  clienteDocumentId: string
  onClose:           () => void
  onSaved:           (i: TransaccionType) => void
}) {
  const hoy = new Date().toISOString().split("T")[0]
  const { categorias } = useGetCategorias("empresa")
  const { cuentas } = useGetCuentas("empresa")
  const categoriasIngreso = categorias.filter(c => c.tipo === "ingreso" && c.activa)
  const cuentasDisponibles = cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito")
  const [form, setForm] = useState<PagoForm>({
    monto:      "",
    fecha:      hoy,
    metodoPago: "Transferencia",
    categoria:  "Venta de joyería",
    cuentaId:   "",
    concepto:   `Pago — ${clienteNombre}`,
    notas:      "",
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

// ─── Modal: vincular pedido real (gate de Oferta → Pedido) ────────────────────
export function NuevoPedidoGateModal({ cliente, cotizacionesAceptadas, onClose, onCreated }: {
  cliente: ClienteEmpresa
  cotizacionesAceptadas: Cotizacion[]
  onClose: () => void
  onCreated: (v: VentaEmpresa) => void
}) {
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)
  const [modoRapido, setModoRapido] = useState(cotizacionesAceptadas.length === 0)
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
    setConvirtiendo(cot.documentId)
    try {
      const creada = await createVenta({
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
      const confirmada = await updateVenta(creada.documentId, { estado: "Pagado" })
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
export function ClientePanel({ cliente, num, ventasDelCliente, onClose, onUpdate, onEdit, onAvanzar, onRetroceder, onRechazar, onRecuperar }: {
  cliente: ClienteEmpresa; num: string; ventasDelCliente: VentaEmpresa[]
  onClose: () => void; onUpdate: (u: ClienteEmpresa) => void; onEdit: () => void
  onAvanzar:    (c: ClienteEmpresa) => void
  onRetroceder: (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
  onRechazar:   (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
  onRecuperar:  (c: ClienteEmpresa) => Promise<ClienteEmpresa | null>
}) {
  const etapa = cliente.Funnel ?? "Lead"
  const [cotModalState, setCotModalState] = useState<null | "nueva" | Cotizacion>(null)
  const [pagoModalOpen, setPagoModalOpen] = useState(false)
  const { cotizaciones, setCotizaciones, loading: cotLoading } = useGetCotizaciones(cliente.documentId)
  const { transacciones: ingresos, setTransacciones: setIngresos, loading: ingLoading } = useGetTransaccionesByCliente(cliente.documentId)

  const handleCotizacionSaved = useCallback((saved: Cotizacion) => {
    setCotizaciones(prev => {
      const exists = prev.find(c => c.documentId === saved.documentId)
      return exists
        ? prev.map(c => c.documentId === saved.documentId ? saved : c)
        : [...prev, saved]
    })
    setCotModalState(null)
  }, [setCotizaciones])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <User size={18} className="text-slate-400" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-100">{cliente.nombre}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${STAGE_META[etapa].numColor}`}>#{num}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>{FUNNEL_LABEL[etapa]}</span>
                  {etapa === "Lead" && cliente.calificado && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold bg-violet-500/15 text-violet-300 border-violet-500/30">Calificado</span>
                  )}
                </div>
              </div>
            </div>
            <button type="button" title="Cerrar" onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition shrink-0"><X size={18} /></button>
          </div>
        </div>

        {/* Body — 2 columnas en pantallas anchas, apiladas en celular */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

            {/* Columna izquierda: contacto + notas */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Contacto</p>
                {cliente.telefono      && <p className="text-xs text-slate-300 flex items-center gap-2"><Phone size={11} className="text-slate-600" />{cliente.telefono}</p>}
                {cliente.email         && <p className="text-xs text-slate-300 flex items-center gap-2"><Mail size={11} className="text-slate-600" />{cliente.email}</p>}
                {cliente.direccion     && <p className="text-xs text-slate-300 flex items-center gap-2"><MapPin size={11} className="text-slate-600 shrink-0" />{cliente.direccion}</p>}
                {cliente.canalContacto && <p className="text-xs text-slate-300 flex items-center gap-2"><CanalIcon canal={cliente.canalContacto} />{cliente.canalContacto}</p>}
                {cliente.origenContacto && <p className="text-[11px] text-slate-500">Origen: {cliente.origenContacto}</p>}
                {cliente.segmento       && <p className="text-[11px] text-slate-500">Segmento: {cliente.segmento}</p>}
              </div>

              {cliente.notas && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Notas</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 rounded-lg px-3 py-2.5">{cliente.notas}</p>
                </div>
              )}
            </div>

            {/* Columna derecha: pedidos, cotizaciones, pagos */}
            <div className="space-y-5">
              {/* Pedidos reales */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Pedidos</p>
                {ventasDelCliente.length === 0 ? (
                  <p className="text-[11px] text-slate-700 py-1">Sin pedidos reales conectados todavía.</p>
                ) : (
                  <div className="space-y-1">
                    {ventasDelCliente.map(v => (
                      <div key={v.documentId} className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/40">
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-300 truncate">{v.concepto}</p>
                          <p className="text-[9px] text-slate-600">{v.fecha ? fmtDt(v.fecha) : "—"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-semibold text-violet-400 font-mono">{fmtMoney(v.monto)}</span>
                          {v.estado && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>{v.estado}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cotizaciones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Cotizaciones</p>
                  <button type="button"
                    onClick={() => setCotModalState("nueva")}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                    <Plus size={10} /> Nueva
                  </button>
                </div>
                {cotLoading ? (
                  <p className="text-[11px] text-slate-700 py-1">Cargando...</p>
                ) : cotizaciones.length === 0 ? (
                  <button type="button"
                    onClick={() => setCotModalState("nueva")}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-slate-700 hover:text-violet-400 border border-dashed border-slate-800 hover:border-violet-800/50 rounded-lg transition">
                    <FileText size={11} /> Crear primera cotización
                  </button>
                ) : (
                  <div className="space-y-1">
                    {cotizaciones.map(c => (
                      <button key={c.documentId} type="button"
                        onClick={() => setCotModalState(c)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition text-left">
                        <div>
                          <p className="text-[11px] font-bold font-mono text-slate-300">{c.numero}</p>
                          <p className="text-[9px] text-slate-600">{fmtDt(c.fecha ?? c.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-300">
                            {c.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[c.estado]}`}>
                            {c.estado}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Pagos</p>
                  <button type="button"
                    onClick={() => setPagoModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                    <Plus size={10} /> Registrar
                  </button>
                </div>

                {/* Saldo — suma TODAS las cotizaciones aceptadas, no solo la primera */}
                {(() => {
                  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === "Aceptada")
                  const totalAcordado = cotizacionesAceptadas.length > 0
                    ? cotizacionesAceptadas.reduce((s, c) => s + c.total, 0)
                    : null
                  const totalPagado   = ingresos.reduce((s, i) => s + (i.monto ?? 0), 0)
                  const saldo         = totalAcordado !== null ? totalAcordado - totalPagado : null
                  return totalAcordado !== null || totalPagado > 0 ? (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {totalAcordado !== null && (
                        <span className="text-[10px] text-slate-500">
                          Total: <span className="text-slate-300 font-mono">
                            {totalAcordado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                          </span>
                        </span>
                      )}
                      <span className="text-[10px] text-violet-400 font-mono">
                        Pagado: {totalPagado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                      </span>
                      {saldo !== null && saldo > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-violet-400 font-mono">
                          <AlertCircle size={9} /> Saldo: {saldo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                        </span>
                      )}
                      {saldo !== null && saldo <= 0 && (
                        <span className="text-[10px] text-violet-400">✓ Liquidado</span>
                      )}
                    </div>
                  ) : null
                })()}

                {ingLoading ? (
                  <p className="text-[11px] text-slate-700 py-1">Cargando...</p>
                ) : ingresos.length === 0 ? (
                  <button type="button"
                    onClick={() => setPagoModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-slate-700 hover:text-violet-400 border border-dashed border-slate-800 hover:border-violet-800/50 rounded-lg transition">
                    <Banknote size={11} /> Registrar primer pago
                  </button>
                ) : (
                  <div className="space-y-1">
                    {ingresos.map(ing => (
                      <div key={ing.documentId}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/40 group">
                        <div>
                          <p className="text-[11px] font-medium text-slate-200">{ing.descripcion}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {ing.fecha && <span className="text-[9px] text-slate-600">{fmtDt(ing.fecha)}</span>}
                            {ing.metodoPago && (
                              <span className={`text-[8px] px-1 py-0.5 rounded border font-semibold ${METODO_COLOR[ing.metodoPago]}`}>
                                {ing.metodoPago}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-violet-400 font-mono">
                            {(ing.monto ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                          </span>
                          <button type="button"
                            onClick={async () => {
                              if (!confirm("¿Eliminar este pago?")) return
                              try {
                                await deleteTransaccion(ing.documentId)
                                setIngresos(prev => prev.filter(i => i.documentId !== ing.documentId))
                                toast.success("Pago eliminado")
                              } catch { toast.error("Error al eliminar") }
                            }}
                            title="Eliminar pago"
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 rounded transition">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recorrido — a lo ancho, debajo de las 2 columnas */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/20">
            <Timeline cliente={cliente} />
          </div>
        </div>

        {/* Footer — acciones */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-200 rounded-lg transition text-slate-400">
            <Pencil size={12} /> Editar datos
          </button>

          <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </div>

      {cotModalState && (
        <CotizacionModal
          cliente={cliente}
          cotizacion={cotModalState === "nueva" ? null : cotModalState}
          totalCotizaciones={cotizaciones.length}
          onClose={() => setCotModalState(null)}
          onSaved={handleCotizacionSaved}
        />
      )}

      {pagoModalOpen && (
        <PagoModal
          clienteNombre={cliente.nombre}
          clienteDocumentId={cliente.documentId}
          onClose={() => setPagoModalOpen(false)}
          onSaved={ing => {
            setIngresos(prev => [...prev, ing])
            setPagoModalOpen(false)
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
    fechaLead: etapa === "Lead" ? new Date().toISOString() : null,
    fechaCalificado: null, fechaOferta: null, fechaPedido: null, fechaEntrega: null,
  }
}

export function PipelineView() {
  const {
    clientes, loading,
    ventasPorCliente, ventasActivasPorCliente, cotizacionesPorCliente, valorPorCliente,
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
  } = useClientesPipeline()

  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente())
  const [guardando,       setGuardando]       = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)

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

  const leadsCalificados = clientes.filter(c => c.Funnel === "Lead" && c.calificado).length
  const rechazados       = clientes.filter(c => c.Funnel === "Rechazada").length

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

                  <div className="flex flex-col gap-2">
                    {items.map((c, i) => (
                      <ClienteCard key={c.documentId} c={c}
                        num={numDisplay(etapa, i)} etapa={etapa}
                        valor={valorPorCliente.get(c.documentId) ?? null}
                        dias={diasSinMovimiento(c, etapa)}
                        sinPedidoReal={(etapa === "Pedido" || etapa === "Entrega") && (ventasActivasPorCliente.get(c.documentId)?.length ?? 0) === 0}
                        onEdit={() => abrirEditar(c)}
                        onDelete={() => handleBorrar(c)}
                        onSelect={() => setSelectedCliente(c)}
                        onAvanzar={!esRechazada && etapa !== "Entrega" ? () => handleAvanzar(c) : undefined}
                        onCalificar={etapa === "Lead" ? () => handleCalificar(c) : undefined}
                        onRechazar={!esRechazada && etapa !== "Entrega" ? () => handleRechazar(c) : undefined}
                        onRecuperar={esRechazada ? () => handleRecuperar(c) : undefined}
                      />
                    ))}
                  </div>

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
      )}

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {selectedCliente && (
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
        />
      )}

      {pedidoGateFor && (
        <NuevoPedidoGateModal
          cliente={pedidoGateFor}
          cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
          onClose={() => setPedidoGateFor(null)}
          onCreated={onPedidoCreado}
        />
      )}
    </div>
  )
}
