"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, CalendarDays, Check } from "lucide-react"
import { toast } from "sonner"
import {
  useGetPagosProgramados, createPagoProgramado, updatePagoProgramado, deletePagoProgramado,
} from "@/api/pago-programado/getPagosProgramados"
import {
  PagoProgramadoType, TipoPago, EstadoPago, FrecuenciaPago,
  ESTADO_PAGO_LABELS, ESTADO_PAGO_COLORS,
} from "@/types/pago-programado"
import { cn } from "@/lib/utils"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-all"

const ESTADOS: EstadoPago[]     = ["pendiente", "pagado", "cancelado"]
const FRECUENCIAS: FrecuenciaPago[] = ["mensual", "trimestral", "anual", "unico"]

type Form = {
  concepto: string; tipo: string; monto: string; fecha: string
  estado: string; recurrente: boolean; frecuencia: string; categoria: string; notas: string
}

function emptyForm(): Form {
  return {
    concepto: "", tipo: "pago", monto: "", fecha: new Date().toISOString().split("T")[0],
    estado: "pendiente", recurrente: false, frecuencia: "unico", categoria: "", notas: "",
  }
}

const fmt = (n: number | null | undefined) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

function diasRestantes(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + "T12:00:00")
  return Math.ceil((f.getTime() - hoy.getTime()) / 86400000)
}

export function CalendarioPagosView() {
  const { pagos, setPagos, loading } = useGetPagosProgramados()
  const [filtroTipo,   setFiltroTipo]   = useState<TipoPago | "todos">("todos")
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago | "todos">("todos")
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState<PagoProgramadoType | null>(null)
  const [form,         setForm]         = useState<Form>(emptyForm())
  const [saving,       setSaving]       = useState(false)
  const [delId,        setDelId]        = useState<string | null>(null)

  const filtrados = useMemo(() => {
    return pagos.filter(p => {
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false
      if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false
      return true
    })
  }, [pagos, filtroTipo, filtroEstado])

  const stats = useMemo(() => {
    const pendientes = pagos.filter(p => p.estado === "pendiente")
    const pagosPend  = pendientes.filter(p => p.tipo === "pago").reduce((s, p) => s + (p.monto ?? 0), 0)
    const cobrosPend = pendientes.filter(p => p.tipo === "cobro").reduce((s, p) => s + (p.monto ?? 0), 0)
    const proximos   = pendientes.filter(p => {
      const dias = diasRestantes(p.fecha)
      return dias !== null && dias >= 0 && dias <= 7
    }).length
    return { pagosPend, cobrosPend, neto: cobrosPend - pagosPend, proximos }
  }, [pagos])

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(p: PagoProgramadoType) {
    setEditing(p)
    setForm({
      concepto:   p.concepto,
      tipo:       p.tipo,
      monto:      p.monto != null ? String(p.monto) : "",
      fecha:      p.fecha ?? new Date().toISOString().split("T")[0],
      estado:     p.estado,
      recurrente: p.recurrente ?? false,
      frecuencia: p.frecuencia ?? "unico",
      categoria:  p.categoria ?? "",
      notas:      p.notas ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        concepto:   form.concepto,
        tipo:       form.tipo,
        monto:      form.monto ? Number(form.monto) : null,
        fecha:      form.fecha || null,
        estado:     form.estado,
        recurrente: form.recurrente,
        frecuencia: form.recurrente ? form.frecuencia : null,
        categoria:  form.categoria || null,
        notas:      form.notas || null,
      }
      if (editing) {
        const updated = await updatePagoProgramado(editing.documentId, payload)
        setPagos(prev => prev.map(p => p.documentId === editing.documentId ? updated : p))
        toast.success("Actualizado")
      } else {
        const nuevo = await createPagoProgramado(payload)
        setPagos(prev => [...prev, nuevo].sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? "")))
        toast.success("Pago programado creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleMarkPaid(p: PagoProgramadoType) {
    try {
      const updated = await updatePagoProgramado(p.documentId, { estado: "pagado" })
      setPagos(prev => prev.map(x => x.documentId === p.documentId ? updated : x))
      toast.success("Marcado como pagado")
    } catch { toast.error("Error al actualizar") }
  }

  async function handleDelete(documentId: string) {
    try {
      await deletePagoProgramado(documentId)
      setPagos(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Por pagar</p>
          <p className="text-xl font-bold text-red-400">{fmt(stats.pagosPend)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Por cobrar</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(stats.cobrosPend)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Neto pendiente</p>
          <p className={`text-xl font-bold ${stats.neto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(stats.neto)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Próximos 7 días</p>
          <p className={`text-xl font-bold ${stats.proximos > 0 ? "text-amber-400" : "text-slate-400"}`}>{stats.proximos}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {([["todos","Todos"],["pago","Pagos"],["cobro","Cobros"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFiltroTipo(v)}
              className={cn("h-8 px-3 text-xs rounded-lg border transition-colors",
                filtroTipo === v ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setFiltroEstado("todos")}
            className={cn("h-8 px-3 text-xs rounded-lg border transition-colors",
              filtroEstado === "todos" ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
            )}>Todos</button>
          {ESTADOS.map(e => (
            <button key={e} type="button" onClick={() => setFiltroEstado(e)}
              className={cn("h-8 px-3 text-xs rounded-lg border capitalize transition-colors",
                filtroEstado === e ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>{ESTADO_PAGO_LABELS[e]}</button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo pago
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
        {!loading && filtrados.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin pagos programados.</p>
          </div>
        )}
        {!loading && filtrados.map(p => {
          const dias = diasRestantes(p.fecha)
          const esVencido = dias !== null && dias < 0 && p.estado === "pendiente"
          const esProximo = dias !== null && dias >= 0 && dias <= 7 && p.estado === "pendiente"
          return (
            <div key={p.documentId}
              className={cn("group flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors",
                esVencido ? "bg-red-500/5 border-red-500/20" :
                esProximo ? "bg-amber-500/5 border-amber-500/20" :
                "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              )}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                    p.tipo === "cobro" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-red-500/15 text-red-300 border-red-500/20"
                  )}>
                    {p.tipo === "cobro" ? "Cobro" : "Pago"}
                  </span>
                  <p className="text-sm font-medium text-slate-200">{p.concepto}</p>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", ESTADO_PAGO_COLORS[p.estado])}>
                    {ESTADO_PAGO_LABELS[p.estado]}
                  </span>
                  {p.recurrente && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-indigo-500/15 text-indigo-400 border-indigo-500/20 shrink-0">
                      {p.frecuencia}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.fecha && (
                    <span className={cn("text-xs", esVencido ? "text-red-400" : esProximo ? "text-amber-400" : "text-slate-500")}>
                      {p.fecha}
                      {dias !== null && p.estado === "pendiente" && (
                        <span className="ml-1">
                          {dias === 0 ? "(hoy)" : dias < 0 ? `(${Math.abs(dias)}d vencido)` : `(en ${dias}d)`}
                        </span>
                      )}
                    </span>
                  )}
                  {p.categoria && <span className="text-xs text-slate-600">{p.categoria}</span>}
                </div>
              </div>
              {p.monto != null && (
                <p className={cn("text-sm font-bold shrink-0", p.tipo === "cobro" ? "text-emerald-400" : "text-red-400")}>
                  {fmt(p.monto)}
                </p>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {p.estado === "pendiente" && (
                  <button type="button" onClick={() => handleMarkPaid(p)} title="Marcar como pagado"
                    className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-slate-800 rounded transition">
                    <Check size={13} />
                  </button>
                )}
                <button type="button" onClick={() => openEditar(p)}
                  className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                  <Pencil size={13} />
                </button>
                {delId === p.documentId ? (
                  <div className="flex items-center gap-1 px-1">
                    <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                    <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setDelId(p.documentId)}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar" : "Nuevo pago programado"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto <span className="text-red-400">*</span></label>
                <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
                  className={inp} placeholder="Ej. Renta local, Factura proveedor…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp + " cursor-pointer"}>
                    <option value="pago">Pago (salida)</option>
                    <option value="cobro">Cobro (entrada)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={inp + " cursor-pointer"}>
                    {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_PAGO_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($)</label>
                  <input type="number" min="0" step="0.01" value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                <input type="text" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className={inp} placeholder="Ej. Servicios, Proveedores…" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurrente" checked={form.recurrente}
                  onChange={e => setForm(f => ({ ...f, recurrente: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800" />
                <label htmlFor="recurrente" className="text-sm text-slate-300">Recurrente</label>
              </div>
              {form.recurrente && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Frecuencia</label>
                  <select value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} className={inp + " cursor-pointer"}>
                    {FRECUENCIAS.map(fr => <option key={fr} value={fr}>{fr.charAt(0).toUpperCase() + fr.slice(1)}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <textarea rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className={area} placeholder="Observaciones…" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
