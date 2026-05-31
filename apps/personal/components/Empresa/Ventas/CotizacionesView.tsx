"use client"

import { useState, useMemo } from "react"
import {
  FileText, Search, X, Check, ArrowRight, Loader2,
  User, Pencil, Trash2, Plus,
} from "lucide-react"
import { toast } from "sonner"
import { useGetAllCotizaciones, deleteCotizacion } from "@/api/cotizacion/getCotizaciones"
import { createVenta } from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import {
  Cotizacion, EstadoCotizacion, ESTADOS_COT, ESTADO_COT_COLOR,
} from "@/types/cotizacion"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { CotizacionModal } from "./CotizacionModal"

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const fmtDt = (iso: string | null | undefined) => {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

// ─── Modal convertir a pedido ─────────────────────────────────────────────────
function ConvertirPedidoModal({ cotizacion, onClose, onConverted }: {
  cotizacion: Cotizacion
  onClose: () => void
  onConverted: () => void
}) {
  const clienteNombre = cotizacion.cliente?.nombre ?? ""
  const clienteId     = cotizacion.cliente?.documentId ?? null

  const concepto = cotizacion.items?.length
    ? cotizacion.items.map(i => `${i.descripcion} ×${i.cantidad}`).join(", ")
    : cotizacion.numero ?? "Pedido desde cotización"

  const [form, setForm] = useState({
    concepto,
    monto: cotizacion.total,
    fecha: new Date().toISOString().split("T")[0],
    estado: "Pagado" as const,
    notas: cotizacion.notas ?? "",
  })
  const [saving, setSaving] = useState(false)

  const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"

  const handleConvert = async () => {
    setSaving(true)
    try {
      await createVenta({
        concepto:  form.concepto,
        monto:     form.monto,
        fecha:     form.fecha,
        estado:    form.estado,
        notas:     form.notas || null,
        cantidad:  1,
        cliente:   clienteId,
      })
      toast.success("Pedido creado desde cotización")
      onConverted()
      onClose()
    } catch {
      toast.error("Error al crear el pedido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Convertir a Pedido</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Cotización {cotizacion.numero}</p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {clienteNombre && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700">
              <User size={13} className="text-slate-500" />
              <span className="text-sm text-slate-300">{clienteNombre}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto</label>
            <input value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($)</label>
              <input type="number" value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className={inp} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado inicial</label>
            <select value={form.estado} title="Estado"
              onChange={e => setForm(f => ({ ...f, estado: e.target.value as typeof form.estado }))}
              className={inp + " cursor-pointer"}>
              <option value="Pagado">Pagado</option>
              <option value="Preparando">Preparando</option>
              <option value="Cotizado">Cotizado</option>
            </select>
          </div>

          {form.notas !== undefined && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
              <textarea value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={2}
                className={inp + " resize-none h-auto py-2"} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} disabled={saving}
            className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
          <button type="button" onClick={handleConvert} disabled={saving}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {saving ? "Creando…" : "Crear pedido"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CotizacionesView ─────────────────────────────────────────────────────────
export function CotizacionesView() {
  const { cotizaciones, setCotizaciones, loading } = useGetAllCotizaciones()
  const { clientes } = useGetClientes()

  const [search,          setSearch]          = useState("")
  const [filtroEstado,    setFiltroEstado]     = useState<EstadoCotizacion | "">("")
  const [convertiendo,    setConvertiendo]     = useState<Cotizacion | null>(null)
  const [editando,        setEditando]         = useState<Cotizacion | null>(null)
  const [clienteParaEdit, setClienteParaEdit]  = useState<ClienteEmpresa | null>(null)
  const [delId,           setDelId]            = useState<string | null>(null)

  const cotizacionesFiltradas = useMemo(() => {
    return cotizaciones.filter(c => {
      const matchSearch = !search ||
        (c.numero ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.cliente?.nombre ?? "").toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filtroEstado || c.estado === filtroEstado
      return matchSearch && matchEstado
    })
  }, [cotizaciones, search, filtroEstado])

  const stats = useMemo(() => ({
    total:    cotizaciones.length,
    borrador: cotizaciones.filter(c => c.estado === "Borrador").length,
    enviada:  cotizaciones.filter(c => c.estado === "Enviada").length,
    aceptada: cotizaciones.filter(c => c.estado === "Aceptada").length,
    rechazada: cotizaciones.filter(c => c.estado === "Rechazada").length,
    totalValor: cotizaciones
      .filter(c => c.estado === "Aceptada")
      .reduce((s, c) => s + c.total, 0),
  }), [cotizaciones])

  const handleEditarCotizacion = (cot: Cotizacion) => {
    const cliente = cot.cliente?.documentId
      ? clientes.find(cl => cl.documentId === cot.cliente!.documentId) ?? null
      : null
    setClienteParaEdit(cliente)
    setEditando(cot)
  }

  const handleCotizacionSaved = (saved: Cotizacion) => {
    setCotizaciones(prev => {
      const exists = prev.find(c => c.documentId === saved.documentId)
      return exists
        ? prev.map(c => c.documentId === saved.documentId ? saved : c)
        : [saved, ...prev]
    })
    setEditando(null)
    setClienteParaEdit(null)
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deleteCotizacion(documentId)
      setCotizaciones(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Cotización eliminada")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FileText size={18} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-100">Cotizaciones</h1>
          </div>
          <p className="text-sm text-slate-500">
            {stats.aceptada} aceptadas · {fmt(stats.totalValor)} en valor aceptado
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",     value: stats.total,    color: "text-slate-200" },
          { label: "Enviadas",  value: stats.enviada,  color: "text-amber-400" },
          { label: "Aceptadas", value: stats.aceptada, color: "text-emerald-400" },
          { label: "Rechazadas", value: stats.rechazada, color: "text-red-400" },
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
          <input type="text" placeholder="Buscar por número o cliente…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setFiltroEstado("")}
            className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
              !filtroEstado ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            Todas
          </button>
          {ESTADOS_COT.map(e => (
            <button key={e} type="button" onClick={() => setFiltroEstado(prev => prev === e ? "" : e)}
              className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
                filtroEstado === e ? ESTADO_COT_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["#", "Cliente", "Items", "Total", "Estado", "Fecha", ""].map(h => (
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
              {!loading && cotizacionesFiltradas.map(cot => (
                <tr key={cot.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold font-mono text-slate-300">{cot.numero ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {cot.cliente ? (
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-slate-600 shrink-0" />
                        <span className="text-slate-300 text-[12px]">{cot.cliente.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {cot.items?.length ? (
                      <p className="text-[11px] text-slate-500 max-w-[160px] truncate">
                        {cot.items.map(i => i.descripcion).filter(Boolean).join(", ")}
                      </p>
                    ) : <span className="text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400 font-semibold">{fmt(cot.total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[cot.estado]}`}>
                      {cot.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {fmtDt(cot.fecha ?? cot.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {delId === cot.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleDelete(cot.documentId)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(cot.estado === "Aceptada" || cot.estado === "Enviada") && (
                          <button type="button"
                            onClick={() => setConvertiendo(cot)}
                            title="Convertir a pedido"
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-500/10 transition">
                            <ArrowRight size={11} /> Pedido
                          </button>
                        )}
                        {cot.cliente && (
                          <button type="button"
                            onClick={() => handleEditarCotizacion(cot)}
                            title="Editar"
                            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                            <Pencil size={13} />
                          </button>
                        )}
                        <button type="button"
                          onClick={() => setDelId(cot.documentId)}
                          title="Eliminar"
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
          {!loading && cotizacionesFiltradas.length === 0 && (
            <div className="py-14 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-600 text-sm">
                {search || filtroEstado ? "Sin cotizaciones para los filtros aplicados." : "No hay cotizaciones registradas."}
              </p>
              <p className="text-[11px] text-slate-700 mt-1">Crea cotizaciones desde el módulo de Clientes o Leads.</p>
            </div>
          )}
        </div>
      </div>

      {convertiendo && (
        <ConvertirPedidoModal
          cotizacion={convertiendo}
          onClose={() => setConvertiendo(null)}
          onConverted={() => setConvertiendo(null)}
        />
      )}

      {editando && clienteParaEdit && (
        <CotizacionModal
          cliente={clienteParaEdit}
          cotizacion={editando}
          totalCotizaciones={cotizaciones.filter(c => c.cliente?.documentId === clienteParaEdit.documentId).length}
          onClose={() => { setEditando(null); setClienteParaEdit(null) }}
          onSaved={handleCotizacionSaved}
        />
      )}
    </div>
  )
}
