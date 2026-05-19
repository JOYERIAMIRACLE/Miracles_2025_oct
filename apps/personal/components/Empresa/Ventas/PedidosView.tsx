"use client"

import { useState, useMemo } from "react"
import { Search, Plus, X, Loader2, Package, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useGetVentas, createVenta, updateVenta, deleteVenta } from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import {
  VentaEmpresa, VentaPayload,
  ESTADOS_VENTA, EstadoVenta, ESTADO_VENTA_COLOR,
  METODOS_PAGO, MetodoPago,
} from "@/types/ventaEmpresa"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtFecha = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })

const ACTIVE_ESTADOS: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]

function emptyForm(): VentaPayload {
  return {
    concepto: "",
    monto: 0,
    fecha: new Date().toISOString().split("T")[0],
    estado: "Cotizado",
    metodoPago: null,
    notas: null,
    cantidad: 1,
    cliente: null,
    inventario: null,
  }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"

export function PedidosView() {
  const { ventas: raw, setVentas, loading } = useGetVentas()
  const { clientes } = useGetClientes()

  const [search,    setSearch]    = useState("")
  const [filtroEst, setFiltroEst] = useState<EstadoVenta | "">("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<VentaEmpresa | null>(null)
  const [form,      setForm]      = useState<VentaPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const ventas = useMemo(() => {
    return raw
      .filter(v => {
        const matchSearch = !search ||
          v.concepto.toLowerCase().includes(search.toLowerCase()) ||
          (v.cliente?.nombre ?? "").toLowerCase().includes(search.toLowerCase())
        const matchEst = !filtroEst || v.estado === filtroEst
        return matchSearch && matchEst
      })
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
  }, [raw, search, filtroEst])

  const totales = useMemo(() => {
    const todos = raw
    const activos = todos.filter(v => ACTIVE_ESTADOS.includes(v.estado as EstadoVenta))
    return {
      total: todos.length,
      activos: activos.length,
      montoActivos: activos.reduce((s, v) => s + (v.monto ?? 0), 0),
      entregados: todos.filter(v => v.estado === "Entregado").length,
    }
  }, [raw])

  function openNuevo() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEditar(v: VentaEmpresa) {
    setEditing(v)
    setForm({
      concepto:   v.concepto,
      monto:      v.monto,
      fecha:      v.fecha,
      estado:     v.estado ?? "Cotizado",
      metodoPago: v.metodoPago,
      notas:      v.notas,
      cantidad:   v.cantidad,
      cliente:    v.cliente?.documentId ?? null,
      inventario: v.inventario?.documentId ?? null,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.monto)           { toast.error("El monto es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateVenta(editing.documentId, form)
        setVentas(prev => prev.map(v => v.documentId === updated.documentId ? updated : v))
        toast.success("Pedido actualizado")
      } else {
        const nueva = await createVenta(form)
        setVentas(prev => [nueva, ...prev])
        toast.success("Pedido registrado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Ocurrió un error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteVenta(documentId)
      setVentas(prev => prev.filter(v => v.documentId !== documentId))
      toast.success("Pedido eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total pedidos",  value: totales.total,                 color: "text-slate-200" },
          { label: "En proceso",     value: totales.activos,               color: "text-amber-400" },
          { label: "Monto activo",   value: fmt(totales.montoActivos),     color: "text-emerald-400" },
          { label: "Entregados",     value: totales.entregados,            color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text" placeholder="Buscar por concepto o cliente…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setFiltroEst("")}
            className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
              !filtroEst ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}>
            Todos
          </button>
          {ESTADOS_VENTA.map(e => (
            <button type="button" key={e} onClick={() => setFiltroEst(prev => prev === e ? "" : e)}
              className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
                filtroEst === e ? `${ESTADO_VENTA_COLOR[e]} shadow-sm` : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}>
              {e}
            </button>
          ))}
        </div>

        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo pedido
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Concepto", "Cliente", "Fecha", "Método pago", "Estado", "Monto", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && ventas.map(v => (
                <tr key={v.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200 leading-snug">{v.concepto}</p>
                    {v.inventario && (
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Package size={10} /> {v.inventario.nombreProducto} ×{v.cantidad}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{v.cliente?.nombre ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.fecha ? fmtFecha(v.fecha) : <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3">
                    {v.metodoPago
                      ? <span className="text-xs text-slate-400">{v.metodoPago}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {v.estado
                      ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>{v.estado}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(v.monto)}</td>
                  <td className="px-4 py-3">
                    {delId === v.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleDelete(v.documentId)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEditar(v)} title="Editar"
                          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => setDelId(v.documentId)} title="Eliminar"
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ventas.length === 0 && (
            <div className="py-14 text-center text-slate-600 text-sm">
              {search || filtroEst ? "Sin resultados para los filtros aplicados." : "No hay pedidos registrados."}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar pedido" : "Nuevo pedido"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Anillo compromiso oro 14k" value={form.concepto}
                  onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($) <span className="text-red-400">*</span></label>
                  <input type="number" placeholder="0" value={form.monto || ""}
                    onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) || 0 }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cantidad</label>
                  <input type="number" min={1} value={form.cantidad ?? 1}
                    onChange={e => setForm(f => ({ ...f, cantidad: Number(e.target.value) || 1 }))} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={form.fecha ?? ""}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select title="Estado" value={form.estado ?? ""}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoVenta }))} className={inp + " cursor-pointer"}>
                    {ESTADOS_VENTA.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Método de pago</label>
                  <select title="Método de pago" value={form.metodoPago ?? ""}
                    onChange={e => setForm(f => ({ ...f, metodoPago: (e.target.value || null) as MetodoPago | null }))} className={inp + " cursor-pointer"}>
                    <option value="">— Sin especificar —</option>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cliente</label>
                  <select title="Cliente" value={form.cliente ?? ""}
                    onChange={e => setForm(f => ({ ...f, cliente: e.target.value || null }))} className={inp + " cursor-pointer"}>
                    <option value="">— Sin cliente —</option>
                    {clientes.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <textarea placeholder="Observaciones, detalles del pedido…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  rows={2} className={inp + " resize-none h-auto py-2"} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar cambios" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
