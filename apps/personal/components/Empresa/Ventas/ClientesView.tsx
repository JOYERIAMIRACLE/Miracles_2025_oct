"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, X, Check, Phone, Mail, Pencil, Trash2, User, UserCheck,
  ArrowRight, FileText, ChevronRight, ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS,
} from "@/types/clienteEmpresa"
import { Cotizacion, ESTADO_COT_COLOR } from "@/types/cotizacion"
import { useGetCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { CotizacionModal } from "./CotizacionModal"

const fmtDt = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

const ETAPAS_CLIENTE: FunnelEtapa[] = ["Oferta", "Pedido", "Entrega"]

const FECHA_FIELD: Record<FunnelEtapa, keyof ClientePayload> = {
  Lead:    "fechaLead",
  Oferta:  "fechaOferta",
  Pedido:  "fechaPedido",
  Entrega: "fechaEntrega",
}

function emptyCliente(etapa: FunnelEtapa = "Oferta"): ClientePayload {
  return {
    nombre: "", email: null, telefono: null, direccion: null,
    segmento: null, Funnel: etapa, calificado: true,
    canalContacto: null, origenContacto: null, Estado: "Activo", notas: null,
    fechaLead: null, fechaCalificado: null, fechaOferta: null, fechaPedido: null, fechaEntrega: null,
  }
}

// ─── Panel del cliente ────────────────────────────────────────────────────────
function ClientePanel({ cliente, cotizacionesAll, onClose, onUpdate, onEdit }: {
  cliente: ClienteEmpresa
  cotizacionesAll: Cotizacion[]
  onClose: () => void
  onUpdate: (u: ClienteEmpresa) => void
  onEdit: () => void
}) {
  const etapa = cliente.Funnel ?? "Oferta"
  const [cotModalState, setCotModalState] = useState<null | "nueva" | Cotizacion>(null)
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
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{cliente.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>
                    {FUNNEL_LABEL[etapa]}
                  </span>
                  {cliente.segmento && (
                    <span className="text-[9px] text-slate-500">{cliente.segmento}</span>
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
          {cliente.telefono && <p className="text-xs text-slate-300 flex items-center gap-2"><Phone size={11} className="text-slate-600" />{cliente.telefono}</p>}
          {cliente.email    && <p className="text-xs text-slate-300 flex items-center gap-2"><Mail size={11} className="text-slate-600" />{cliente.email}</p>}
          {cliente.notas    && <p className="text-xs text-slate-400 mt-1">{cliente.notas}</p>}
        </div>

        {/* Cotizaciones */}
        <div className="px-4 py-3 border-b border-slate-800">
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
            <button type="button" onClick={() => setCotModalState("nueva")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] text-slate-700 hover:text-amber-400 border border-dashed border-slate-800 hover:border-amber-800/50 rounded-lg transition">
              <FileText size={11} /> Crear primera cotización
            </button>
          ) : (
            <div className="space-y-0.5">
              {cotizaciones.map(c => (
                <button key={c.documentId} type="button" onClick={() => setCotModalState(c)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 transition text-left">
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

        {/* Mover funnel */}
        <div className="px-4 py-3 border-b border-slate-800 flex gap-2">
          {etapa !== "Oferta" && (
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

      {cotModalState && (
        <CotizacionModal
          cliente={cliente}
          cotizacion={cotModalState === "nueva" ? null : cotModalState}
          totalCotizaciones={cotizacionesAll.filter(c => c.cliente?.documentId === cliente.documentId).length}
          onClose={() => setCotModalState(null)}
          onSaved={handleCotizacionSaved}
        />
      )}
    </div>
  )
}

// ─── Modal editar cliente ─────────────────────────────────────────────────────
function ClienteModal({ editando, form, setForm, onGuardar, onCerrar, guardando }: {
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
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar contacto" : "Nuevo contacto"}</h2>
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
            <label className={lbl}>Email</label>
            <input type="email" value={form.email ?? ""}
              onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
              placeholder="correo@email.com" className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Etapa en el funnel</label>
          <div className="flex gap-1.5 flex-wrap">
            {ETAPAS_CLIENTE.map(e => (
              <button key={e} type="button"
                onClick={() => setForm(f => ({ ...f, Funnel: e }))}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition ${
                  form.Funnel === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {FUNNEL_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>Segmento</label>
          <select value={form.segmento ?? ""} title="Segmento"
            onChange={e => setForm(f => ({ ...f, segmento: (e.target.value || null) as typeof f.segmento }))}
            className={inp}>
            <option value="">— Sin segmento —</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea value={form.notas ?? ""}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
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

// ─── ClientesView ─────────────────────────────────────────────────────────────
export function ClientesView() {
  const { clientes, setClientes, loading: cloading } = useGetClientes()
  const { cotizaciones: todasCot, loading: cotLoading } = useGetAllCotizaciones()

  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente())
  const [guardando,       setGuardando]       = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)
  const [filtroEtapa,     setFiltroEtapa]     = useState<FunnelEtapa | "todos">("todos")

  const loading = cloading || cotLoading

  const clientesActivos = useMemo(() =>
    clientes.filter(c => c.Funnel !== "Lead" && c.Funnel !== "Rechazada" && c.Funnel != null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [clientes]
  )

  const clientesFiltrados = useMemo(() => {
    if (filtroEtapa === "todos") return clientesActivos
    return clientesActivos.filter(c => c.Funnel === filtroEtapa)
  }, [clientesActivos, filtroEtapa])

  const cotPorCliente = useMemo(() => {
    const m = new Map<string, number>()
    for (const cot of todasCot) {
      if (cot.cliente?.documentId) {
        m.set(cot.cliente.documentId, (m.get(cot.cliente.documentId) ?? 0) + 1)
      }
    }
    return m
  }, [todasCot])

  const stats = useMemo(() => {
    const all = clientesActivos
    return {
      total:   all.length,
      oferta:  all.filter(c => c.Funnel === "Oferta").length,
      pedido:  all.filter(c => c.Funnel === "Pedido").length,
      entrega: all.filter(c => c.Funnel === "Entrega").length,
    }
  }, [clientesActivos])

  const abrirCrear  = () => { setEditando(null); setForm(emptyCliente()); setModalOpen(true) }
  const abrirEditar = (c: ClienteEmpresa) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: c.Funnel ?? "Oferta", calificado: c.calificado,
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
        toast.success("Contacto creado")
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

  const handleUpdate = (updated: ClienteEmpresa) => {
    setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    setSelectedCliente(updated)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <UserCheck size={18} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Contactos</h1>
          </div>
          <p className="text-sm text-slate-500">
            Prospectos con oferta · Cliente = quien llegó a Pedido
          </p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo contacto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,   color: "text-slate-200" },
          { label: "En oferta", value: stats.oferta,  color: "text-amber-400" },
          { label: "Pedido",   value: stats.pedido,  color: "text-emerald-400" },
          { label: "Entregado", value: stats.entrega, color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => setFiltroEtapa("todos")}
          className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
            filtroEtapa === "todos" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
          }`}>
          Todos
        </button>
        {ETAPAS_CLIENTE.map(e => (
          <button key={e} type="button" onClick={() => setFiltroEtapa(e)}
            className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
              filtroEtapa === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {FUNNEL_LABEL[e]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Cliente", "Etapa", "Cotizaciones", "Contacto", "Notas", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && clientesFiltrados.map(c => {
                const numCot = cotPorCliente.get(c.documentId) ?? 0
                const etapa  = c.Funnel ?? "Oferta"
                return (
                  <tr key={c.documentId}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCliente(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <User size={12} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{c.nombre}</p>
                          {c.segmento && <p className="text-[10px] text-slate-600">{c.segmento}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa as FunnelEtapa]}`}>
                        {FUNNEL_LABEL[etapa as FunnelEtapa]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {numCot > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <FileText size={11} />{numCot}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {c.telefono && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} className="text-slate-600" />{c.telefono}</p>}
                        {c.email    && <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} className="text-slate-600" />{c.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {c.notas ? <p className="text-[11px] text-slate-500 truncate">{c.notas}</p> : <span className="text-slate-700 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => abrirEditar(c)}
                          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                        <button type="button" onClick={() => borrar(c)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && clientesFiltrados.length === 0 && (
            <div className="py-14 text-center">
              <UserCheck size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-600 text-sm">
                {filtroEtapa === "todos" ? "No hay contactos activos. Los leads se muestran en el módulo Leads." : `Sin contactos en etapa ${FUNNEL_LABEL[filtroEtapa as FunnelEtapa]}.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {selectedCliente && (
        <ClientePanel
          cliente={selectedCliente}
          cotizacionesAll={todasCot}
          onClose={() => setSelectedCliente(null)}
          onUpdate={handleUpdate}
          onEdit={() => { abrirEditar(selectedCliente); setSelectedCliente(null) }}
        />
      )}
    </div>
  )
}
