"use client"

import { useState, useMemo } from "react"
import { Plus, X, Check, Phone, Mail, MessageCircle, ChevronRight, ChevronLeft, Pencil, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import { useGetVentasByCliente, createVenta } from "@/api/ventaEmpresa/getVentas"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ETAPAS, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa, SEGMENTOS,
} from "@/types/clienteEmpresa"
import { VentaEmpresa, VentaPayload, ESTADOS_VENTA, ESTADO_VENTA_COLOR } from "@/types/ventaEmpresa"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtFecha = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })

function emptyCliente(): ClientePayload {
  return { nombre: "", email: null, telefono: null, direccion: null, segmento: null, Funnel: "Lead", canalContacto: null, origenContacto: null, Estado: "Activo", notas: null }
}

// ─── Canal icon ───────────────────────────────────────────────────────────────
function CanalIcon({ canal }: { canal: string | null }) {
  if (!canal) return null
  const c = canal.toLowerCase()
  if (c.includes("whatsapp") || c.includes("wa"))  return <MessageCircle size={11} className="text-emerald-400" />
  if (c.includes("instagram") || c.includes("ig")) return <span className="text-[9px] font-bold text-pink-400">IG</span>
  if (c.includes("email") || c.includes("correo")) return <Mail size={11} className="text-blue-400" />
  if (c.includes("llamada") || c.includes("tel"))  return <Phone size={11} className="text-amber-400" />
  return <span className="text-[9px] text-slate-500">{canal.slice(0, 2).toUpperCase()}</span>
}

// ─── Cliente Card ─────────────────────────────────────────────────────────────
function ClienteCard({ c, onEdit, onDelete, onSelect }: {
  c: ClienteEmpresa
  onEdit: () => void
  onDelete: () => void
  onSelect: () => void
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-700 transition-colors cursor-pointer"
      onClick={onSelect}>
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold text-slate-100 leading-snug flex-1">{c.nombre}</p>
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
      <div className="flex items-center gap-2 flex-wrap">
        {c.segmento && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {c.segmento}
          </span>
        )}
        {c.canalContacto && (
          <span className="flex items-center gap-0.5 text-[9px] text-slate-500">
            <CanalIcon canal={c.canalContacto} />
            {c.canalContacto}
          </span>
        )}
      </div>
      {c.telefono && (
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <Phone size={9} /> {c.telefono}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1">
        {c.origenContacto && (
          <span className="text-[9px] text-slate-600">{c.origenContacto}</span>
        )}
        <ChevronRight size={12} className="text-slate-700 ml-auto" />
      </div>
    </div>
  )
}

// ─── Panel detalle del cliente ────────────────────────────────────────────────
function ClientePanel({ cliente, onClose, onUpdate }: {
  cliente: ClienteEmpresa
  onClose: () => void
  onUpdate: (updated: ClienteEmpresa) => void
}) {
  const [ventas,        setVentas]        = useState<VentaEmpresa[]>([])
  const [loadingVentas, setLoadingVentas] = useState(true)
  const [nuevaVenta,    setNuevaVenta]    = useState(false)
  const [formVenta,     setFormVenta]     = useState<VentaPayload>({ concepto: "", monto: 0, fecha: new Date().toISOString().split("T")[0], estado: "Cotizado", cliente: cliente.documentId })
  const [guardandoV,    setGuardandoV]    = useState(false)

  useMemo(() => {
    setLoadingVentas(true)
    useGetVentasByCliente(cliente.documentId)
      .then(data => setVentas(data))
      .finally(() => setLoadingVentas(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.documentId])

  const moverFunnel = async (dir: 1 | -1) => {
    const idx     = FUNNEL_ETAPAS.indexOf(cliente.Funnel ?? "Lead")
    const destIdx = Math.max(0, Math.min(FUNNEL_ETAPAS.length - 1, idx + dir))
    if (destIdx === idx) return
    const destino = FUNNEL_ETAPAS[destIdx]
    try {
      const updated = await updateCliente(cliente.documentId, { Funnel: destino })
      onUpdate(updated)
      toast.success(dir === 1 ? `Avanzó a ${FUNNEL_LABEL[destino]}` : `Regresó a ${FUNNEL_LABEL[destino]}`)
    } catch {
      toast.error("Error al actualizar")
    }
  }

  const guardarVenta = async () => {
    if (!formVenta.concepto.trim() || !formVenta.monto) { toast.error("Concepto y monto requeridos"); return }
    setGuardandoV(true)
    try {
      const nueva = await createVenta({ ...formVenta, cliente: cliente.documentId })
      setVentas(prev => [nueva, ...prev])
      setNuevaVenta(false)
      setFormVenta({ concepto: "", monto: 0, fecha: new Date().toISOString().split("T")[0], estado: "Cotizado", cliente: cliente.documentId })
      toast.success("Venta registrada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardandoV(false)
    }
  }

  const totalVentas = ventas.filter(v => v.estado === "Entregado" || v.estado === "Pagado").reduce((s, v) => s + v.monto, 0)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">{cliente.nombre}</h2>
                {cliente.Funnel && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[cliente.Funnel]}`}>
                    {FUNNEL_LABEL[cliente.Funnel]}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 border-b border-slate-800 space-y-1.5">
          {cliente.telefono    && <p className="text-xs text-slate-400 flex items-center gap-2"><Phone size={11} className="text-slate-600" /> {cliente.telefono}</p>}
          {cliente.email       && <p className="text-xs text-slate-400 flex items-center gap-2"><Mail size={11} className="text-slate-600" /> {cliente.email}</p>}
          {cliente.canalContacto && <p className="text-xs text-slate-400 flex items-center gap-2"><CanalIcon canal={cliente.canalContacto} /> {cliente.canalContacto}</p>}
          {cliente.origenContacto && <p className="text-[11px] text-slate-500">Origen: {cliente.origenContacto}</p>}
          {cliente.notas       && <p className="text-[11px] text-slate-500 bg-slate-800/60 rounded p-2 mt-1">{cliente.notas}</p>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-800">
          <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Ventas</p>
            <p className="text-lg font-bold text-slate-100">{ventas.length}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Total</p>
            <p className="text-lg font-bold text-emerald-400">{fmt(totalVentas)}</p>
          </div>
        </div>

        {/* Mover en funnel */}
        {cliente.Funnel && (
          <div className="px-4 py-3 border-b border-slate-800 flex gap-2">
            {cliente.Funnel !== "Lead" && (
              <button type="button" onClick={() => moverFunnel(-1)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border border-slate-700 hover:border-slate-600 hover:text-slate-300 rounded-lg transition text-slate-500">
                <ChevronLeft size={13} />
                {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(cliente.Funnel) - 1]]}
              </button>
            )}
            {cliente.Funnel !== "Pedido" && (
              <button type="button" onClick={() => moverFunnel(1)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border border-slate-700 hover:border-emerald-700 hover:text-emerald-400 rounded-lg transition text-slate-400">
                {FUNNEL_LABEL[FUNNEL_ETAPAS[FUNNEL_ETAPAS.indexOf(cliente.Funnel) + 1]]}
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}

        {/* Ventas */}
        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Historial de ventas</p>
            <button type="button" onClick={() => setNuevaVenta(v => !v)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
              <Plus size={10} /> Nueva
            </button>
          </div>

          {/* Form nueva venta */}
          {nuevaVenta && (
            <div className="bg-slate-800 rounded-xl p-3 space-y-2 mb-3">
              <input value={formVenta.concepto}
                onChange={e => setFormVenta(f => ({ ...f, concepto: e.target.value }))}
                placeholder="Concepto *" autoFocus
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              <div className="flex gap-2">
                <input type="number" value={formVenta.monto || ""}
                  onChange={e => setFormVenta(f => ({ ...f, monto: parseFloat(e.target.value) || 0 }))}
                  placeholder="Monto *"
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
                <input type="date" value={formVenta.fecha}
                  onChange={e => setFormVenta(f => ({ ...f, fecha: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-slate-500" />
              </div>
              <select value={formVenta.estado} onChange={e => setFormVenta(f => ({ ...f, estado: e.target.value as VentaEmpresa["estado"] }))}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none">
                {ESTADOS_VENTA.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNuevaVenta(false)}
                  className="flex-1 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg">Cancelar</button>
                <button type="button" onClick={guardarVenta} disabled={guardandoV}
                  className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1">
                  <Check size={11} /> Guardar
                </button>
              </div>
            </div>
          )}

          {loadingVentas ? (
            <p className="text-xs text-slate-600 text-center py-4">Cargando...</p>
          ) : ventas.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-4">Sin ventas registradas</p>
          ) : ventas.map(v => (
            <div key={v.documentId} className="bg-slate-800/60 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{v.concepto}</p>
                <p className="text-[10px] text-slate-500">{fmtFecha(v.fecha)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-emerald-400">{fmt(v.monto)}</p>
                {v.estado && (
                  <span className={`text-[9px] px-1 py-0.5 rounded-full border font-semibold ${ESTADO_VENTA_COLOR[v.estado]}`}>
                    {v.estado}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline View ────────────────────────────────────────────────────────────
export function PipelineView() {
  const { clientes, setClientes, loading } = useGetClientes()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<ClienteEmpresa | null>(null)
  const [form,         setForm]         = useState<ClientePayload>(emptyCliente())
  const [guardando,    setGuardando]    = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)

  const porFunnel = useMemo(() => {
    const map = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ETAPAS.forEach(e => map.set(e, []))
    clientes.forEach(c => map.get(c.Funnel ?? "Lead")?.push(c))
    return map
  }, [clientes])

  const abrirCrear  = () => { setEditando(null); setForm(emptyCliente()); setModalOpen(true) }
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
        toast.success("Cliente actualizado")
      } else {
        const nuevo = await createCliente(form)
        setClientes(prev => [...prev, nuevo])
        toast.success("Cliente creado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (c: ClienteEmpresa) => {
    if (!confirm(`¿Eliminar a "${c.nombre}"?`)) return
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Cliente eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const handleUpdate = (updated: ClienteEmpresa) => {
    setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    setSelectedCliente(updated)
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline de Clientes</h1>
          <p className="text-sm text-slate-500">{clientes.length} clientes · {clientes.filter(c => c.Funnel === "Lead" || c.Funnel === "Prospecto" || c.Funnel === "Cotizacion").length} en proceso</p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[900px]">
            {FUNNEL_ETAPAS.map(etapa => {
              const items = porFunnel.get(etapa) ?? []
              return (
                <div key={etapa} className="flex-1 min-w-[180px] flex flex-col gap-2">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${FUNNEL_COLOR[etapa]}`}>
                    <span className="text-xs font-bold">{FUNNEL_LABEL[etapa]}</span>
                    <span className="text-[10px] font-semibold opacity-70">{items.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {items.map(c => (
                      <ClienteCard key={c.documentId} c={c}
                        onEdit={() => abrirEditar(c)}
                        onDelete={() => borrar(c)}
                        onSelect={() => setSelectedCliente(c)}
                      />
                    ))}
                  </div>
                  {/* Add to this stage */}
                  <button type="button" onClick={() => { setForm({ ...emptyCliente(), Funnel: etapa }); setEditando(null); setModalOpen(true) }}
                    className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition mt-1">
                    <Plus size={10} /> Agregar
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal crear/editar cliente */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar cliente" : "Nuevo cliente"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">Nombre *</label>
                <input autoFocus value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del cliente"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Teléfono</label>
                <input value={form.telefono ?? ""}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value || null }))}
                  placeholder="555-0000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Email</label>
                <input type="email" value={form.email ?? ""}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
                  placeholder="correo@email.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Etapa del funnel</label>
                <select value={form.Funnel ?? "Lead"} onChange={e => setForm(f => ({ ...f, Funnel: e.target.value as FunnelEtapa }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none">
                  {FUNNEL_ETAPAS.map(e => <option key={e} value={e}>{FUNNEL_LABEL[e]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Segmento</label>
                <select value={form.segmento ?? ""} onChange={e => setForm(f => ({ ...f, segmento: (e.target.value || null) as typeof f.segmento }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none">
                  <option value="">— Sin segmento —</option>
                  {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Canal de contacto</label>
                <input value={form.canalContacto ?? ""}
                  onChange={e => setForm(f => ({ ...f, canalContacto: e.target.value || null }))}
                  placeholder="WhatsApp, Instagram..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Origen</label>
                <input value={form.origenContacto ?? ""}
                  onChange={e => setForm(f => ({ ...f, origenContacto: e.target.value || null }))}
                  placeholder="Campaña, referido..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">Notas</label>
                <textarea value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Lo que busca, preferencias, observaciones..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
                <Check size={14} /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel detalle */}
      {selectedCliente && (
        <ClientePanel
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
