"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
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

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const ESTADOS: EstadoPago[]      = ["pendiente", "pagado", "cancelado"]
const FRECUENCIAS: FrecuenciaPago[] = ["mensual", "trimestral", "anual", "unico"]

type Form = {
  concepto: string; tipo: string; monto: string; fecha: string
  estado: string; recurrente: boolean; frecuencia: string; categoria: string; notas: string
}

const emptyForm = (fecha?: string): Form => ({
  concepto: "", tipo: "pago", monto: "", fecha: fecha ?? new Date().toISOString().split("T")[0],
  estado: "pendiente", recurrente: false, frecuencia: "unico", categoria: "", notas: "",
})

const fmt = (n: number | null | undefined) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

function diasRestantes(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + "T12:00:00")
  return Math.ceil((f.getTime() - hoy.getTime()) / 86400000)
}

export function CalendarioPagosView() {
  const { pagos, setPagos, loading } = useGetPagosProgramados()

  const [mesActual,    setMesActual]    = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState<PagoProgramadoType | null>(null)
  const [form,         setForm]         = useState<Form>(emptyForm())
  const [saving,       setSaving]       = useState(false)
  const [delId,        setDelId]        = useState<string | null>(null)
  const [filtroTipo,   setFiltroTipo]   = useState<TipoPago | "todos">("todos")
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago | "todos">("todos")

  const diasDelMes  = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) })
  const primerDia   = getDay(startOfMonth(mesActual))

  const pagosDelDia = (dia: Date) =>
    pagos.filter(p => p.fecha && isSameDay(new Date(p.fecha + "T12:00:00"), dia))

  const stats = useMemo(() => {
    const pendientes = pagos.filter(p => p.estado === "pendiente")
    const pagosPend  = pendientes.filter(p => p.tipo === "pago").reduce((s, p) => s + (p.monto ?? 0), 0)
    const cobrosPend = pendientes.filter(p => p.tipo === "cobro").reduce((s, p) => s + (p.monto ?? 0), 0)
    const proximos   = pendientes.filter(p => { const d = diasRestantes(p.fecha); return d !== null && d >= 0 && d <= 7 }).length
    return { pagosPend, cobrosPend, neto: cobrosPend - pagosPend, proximos }
  }, [pagos])

  // Totales del mes visible en el calendario
  const mesKey = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, "0")}`
  const pagosMes = pagos.filter(p => p.fecha?.slice(0, 7) === mesKey)
  const totalPagosMes  = pagosMes.filter(p => p.tipo === "pago").reduce((s, p) => s + (p.monto ?? 0), 0)
  const totalCobrosMes = pagosMes.filter(p => p.tipo === "cobro").reduce((s, p) => s + (p.monto ?? 0), 0)

  const filtrados = useMemo(() =>
    pagos.filter(p => {
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false
      if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false
      return true
    }), [pagos, filtroTipo, filtroEstado])

  function openNuevo(fecha?: string) { setEditing(null); setForm(emptyForm(fecha)); setModalOpen(true) }
  function openEditar(p: PagoProgramadoType) {
    setEditing(p)
    setForm({ concepto: p.concepto, tipo: p.tipo, monto: p.monto != null ? String(p.monto) : "", fecha: p.fecha ?? new Date().toISOString().split("T")[0], estado: p.estado, recurrente: p.recurrente ?? false, frecuencia: p.frecuencia ?? "unico", categoria: p.categoria ?? "", notas: p.notas ?? "" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    setSaving(true)
    try {
      const payload = { concepto: form.concepto, tipo: form.tipo, monto: form.monto ? Number(form.monto) : null, fecha: form.fecha || null, estado: form.estado, recurrente: form.recurrente, frecuencia: form.recurrente ? form.frecuencia : null, categoria: form.categoria || null, notas: form.notas || null }
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Calendario + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Calendario mensual */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" title="Mes anterior" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-slate-100 capitalize">
                {format(mesActual, "MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fmt(totalCobrosMes)} cobros · {fmt(totalPagosMes)} pagos
              </p>
            </div>
            <button type="button" title="Mes siguiente" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Encabezados de días */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[11px] text-slate-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: primerDia }).map((_, i) => <div key={`e-${i}`} />)}
            {diasDelMes.map(dia => {
              const evs = pagosDelDia(dia)
              const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)
              const tieneVencidos = evs.some(p => p.estado === "pendiente" && (diasRestantes(p.fecha) ?? 0) < 0)
              const tieneProximos = evs.some(p => p.estado === "pendiente" && (diasRestantes(p.fecha) ?? 99) >= 0 && (diasRestantes(p.fecha) ?? 99) <= 3)

              return (
                <button key={dia.toISOString()} type="button"
                  title={format(dia, "d 'de' MMMM", { locale: es })}
                  onClick={() => setDiaSeleccionado(prev => prev && isSameDay(prev, dia) ? null : dia)}
                  className={cn(
                    "relative min-h-[52px] p-1 rounded-lg text-left transition-all border",
                    seleccionado ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:bg-slate-800/50",
                    tieneVencidos && !seleccionado ? "bg-red-500/5 border-red-500/15" : "",
                    tieneProximos && !seleccionado && !tieneVencidos ? "bg-amber-500/5 border-amber-500/15" : "",
                  )}>
                  <span className={cn(
                    "text-xs inline-flex items-center justify-center w-5 h-5",
                    isToday(dia) ? "bg-blue-600 text-white rounded-full font-bold" : "text-slate-400"
                  )}>
                    {format(dia, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {evs.slice(0, 2).map(p => (
                      <div key={p.documentId} className={cn(
                        "text-[9px] rounded px-1 truncate leading-tight",
                        p.tipo === "cobro"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : p.estado === "pagado"
                          ? "bg-slate-700/60 text-slate-500 line-through"
                          : "bg-red-500/20 text-red-300"
                      )}>
                        {p.concepto}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <span className="text-[9px] text-slate-600">+{evs.length - 2}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
          {diaSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100 capitalize">
                  {format(diaSeleccionado, "d 'de' MMMM", { locale: es })}
                </h3>
                <button type="button"
                  onClick={() => openNuevo(format(diaSeleccionado, "yyyy-MM-dd"))}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition">
                  <Plus size={12} /> Agregar
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {pagosDelDia(diaSeleccionado).length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-6">Sin pagos este día</p>
                )}
                {pagosDelDia(diaSeleccionado).map(p => {
                  const dias = diasRestantes(p.fecha)
                  const esVencido = dias !== null && dias < 0 && p.estado === "pendiente"
                  return (
                    <div key={p.documentId} className={cn(
                      "group rounded-lg border px-3 py-2.5 transition-colors",
                      esVencido ? "bg-red-500/5 border-red-500/20" : "bg-slate-800/40 border-slate-700/40 hover:border-slate-700"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                              p.tipo === "cobro" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-red-500/15 text-red-300 border-red-500/20"
                            )}>
                              {p.tipo === "cobro" ? "Cobro" : "Pago"}
                            </span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", ESTADO_PAGO_COLORS[p.estado])}>
                              {ESTADO_PAGO_LABELS[p.estado]}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-200 truncate">{p.concepto}</p>
                          {p.categoria && <p className="text-[11px] text-slate-600">{p.categoria}</p>}
                        </div>
                        {p.monto != null && (
                          <p className={cn("text-sm font-bold shrink-0", p.tipo === "cobro" ? "text-emerald-400" : "text-red-400")}>
                            {fmt(p.monto)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.estado === "pendiente" && (
                          <button type="button" title="Marcar como pagado" onClick={() => handleMarkPaid(p)}
                            className="p-1 text-slate-600 hover:text-emerald-400 hover:bg-slate-700 rounded transition">
                            <Check size={12} />
                          </button>
                        )}
                        <button type="button" title="Editar" onClick={() => openEditar(p)}
                          className="p-1 text-slate-600 hover:text-slate-300 hover:bg-slate-700 rounded transition">
                          <Pencil size={12} />
                        </button>
                        {delId === p.documentId ? (
                          <div className="flex items-center gap-1 px-1">
                            <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 font-medium">Sí</button>
                            <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                          </div>
                        ) : (
                          <button type="button" title="Eliminar" onClick={() => setDelId(p.documentId)}
                            className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-700 rounded transition">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <CalendarDays size={28} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-600">Selecciona un día para ver o agregar pagos</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de próximos pagos */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {/* Toolbar filtros */}
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-slate-800">
          <div className="flex gap-1">
            {([["todos", "Todos"], ["pago", "Pagos"], ["cobro", "Cobros"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFiltroTipo(v as any)}
                className={cn("h-7 px-3 text-xs rounded-lg border transition-colors",
                  filtroTipo === v ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
                )}>{l}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setFiltroEstado("todos")}
              className={cn("h-7 px-3 text-xs rounded-lg border transition-colors",
                filtroEstado === "todos" ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>Todos</button>
            {ESTADOS.map(e => (
              <button key={e} type="button" onClick={() => setFiltroEstado(e)}
                className={cn("h-7 px-3 text-xs rounded-lg border capitalize transition-colors",
                  filtroEstado === e ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
                )}>{ESTADO_PAGO_LABELS[e]}</button>
            ))}
          </div>
          <button type="button" onClick={() => openNuevo()}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors ml-auto">
            <Plus size={13} /> Nuevo pago
          </button>
        </div>

        {/* Lista */}
        <div className="divide-y divide-slate-800/50 max-h-80 overflow-y-auto">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 px-4 flex items-center">
              <div className="h-3 rounded bg-slate-800 animate-pulse w-full" />
            </div>
          ))}
          {!loading && filtrados.length === 0 && (
            <div className="py-10 text-center text-slate-600">
              <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin pagos programados.</p>
            </div>
          )}
          {!loading && filtrados.map(p => {
            const dias = diasRestantes(p.fecha)
            const esVencido = dias !== null && dias < 0 && p.estado === "pendiente"
            const esProximo = dias !== null && dias >= 0 && dias <= 7 && p.estado === "pendiente"
            return (
              <div key={p.documentId}
                className={cn("group flex items-center gap-3 px-4 py-3 transition-colors",
                  esVencido ? "bg-red-500/5" : esProximo ? "bg-amber-500/5" : "hover:bg-slate-800/30"
                )}>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                  p.tipo === "cobro" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-red-500/15 text-red-300 border-red-500/20"
                )}>
                  {p.tipo === "cobro" ? "Cobro" : "Pago"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{p.concepto}</p>
                  <div className="flex items-center gap-3">
                    {p.fecha && (
                      <span className={cn("text-[11px]", esVencido ? "text-red-400" : esProximo ? "text-amber-400" : "text-slate-500")}>
                        {p.fecha}
                        {dias !== null && p.estado === "pendiente" && (
                          <span className="ml-1">
                            {dias === 0 ? "(hoy)" : dias < 0 ? `(${Math.abs(dias)}d vencido)` : `(en ${dias}d)`}
                          </span>
                        )}
                      </span>
                    )}
                    <span className={cn("text-[10px] px-1 py-0.5 rounded border shrink-0", ESTADO_PAGO_COLORS[p.estado])}>
                      {ESTADO_PAGO_LABELS[p.estado]}
                    </span>
                    {p.recurrente && (
                      <span className="text-[10px] px-1 py-0.5 rounded border bg-indigo-500/15 text-indigo-400 border-indigo-500/20 shrink-0">{p.frecuencia}</span>
                    )}
                  </div>
                </div>
                {p.monto != null && (
                  <p className={cn("text-sm font-bold shrink-0", p.tipo === "cobro" ? "text-emerald-400" : "text-red-400")}>
                    {fmt(p.monto)}
                  </p>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {p.estado === "pendiente" && (
                    <button type="button" title="Marcar como pagado" onClick={() => handleMarkPaid(p)}
                      className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-slate-800 rounded transition">
                      <Check size={13} />
                    </button>
                  )}
                  <button type="button" title="Editar" onClick={() => openEditar(p)}
                    className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                    <Pencil size={13} />
                  </button>
                  {delId === p.documentId ? (
                    <div className="flex items-center gap-1 px-1">
                      <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 font-medium">Sí</button>
                      <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                    </div>
                  ) : (
                    <button type="button" title="Eliminar" onClick={() => setDelId(p.documentId)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar" : "Nuevo pago programado"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
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
                  <select title="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp + " cursor-pointer"}>
                    <option value="pago">Pago (salida)</option>
                    <option value="cobro">Cobro (entrada)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select title="Estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={inp + " cursor-pointer"}>
                    {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_PAGO_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($)</label>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" title="Fecha" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
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
                  <select title="Frecuencia" value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} className={inp + " cursor-pointer"}>
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
