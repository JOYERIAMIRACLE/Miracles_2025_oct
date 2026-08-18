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
  ESTADO_PAGO_LABELS,
} from "@/types/pago-programado"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const ESTADOS: EstadoPago[]      = ["pendiente", "pagado", "cancelado"]
const FRECUENCIAS: FrecuenciaPago[] = ["mensual", "trimestral", "anual", "unico"]

type Form = {
  concepto: string; tipo: string; monto: string; fecha: string
  estado: string; recurrente: boolean; frecuencia: string; categoria: string; notas: string; cuentaId: string
}

function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
function ymdToDate(s: string): Date | null { return s ? new Date(`${s}T00:00:00Z`) : null }

const emptyForm = (fecha?: string): Form => ({
  concepto: "", tipo: "pago", monto: "", fecha: fecha ?? toYMD(new Date()),
  estado: "pendiente", recurrente: false, frecuencia: "unico", categoria: "", notas: "", cuentaId: "",
})

const fmt = (n: number | null | undefined) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

function diasRestantes(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + "T12:00:00")
  return Math.ceil((f.getTime() - hoy.getTime()) / 86400000)
}

const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5"
const pill = (active: boolean) => `h-7 px-3 text-xs rounded-lg border transition-colors ${
  active ? "bg-violet-500 text-white border-violet-500" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
}`
function estadoBadgeCls(estado: EstadoPago): string {
  if (estado === "pagado") return "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30"
  if (estado === "cancelado") return "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through"
  return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
}

// ─── Modal: confirmar cuenta al marcar como pagado (si el pago no tenía una asignada) ──
function ConfirmarCuentaModal({ pago, cuentas, onConfirmar, onCerrar }: {
  pago: PagoProgramadoType; cuentas: { documentId: string; nombre: string }[]
  onConfirmar: (cuentaId: string) => void; onCerrar: () => void
}) {
  const [cuentaId, setCuentaId] = useState("")
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Confirmar {pago.tipo === "cobro" ? "cobro" : "pago"}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{pago.concepto} · {fmt(pago.monto)}</p>
        </div>
        <div>
          <label className={labelCls}>¿De qué cuenta {pago.tipo === "cobro" ? "entra" : "sale"} el dinero? *</label>
          <DropdownPicker label="Cuenta" value={cuentaId} onChange={setCuentaId} placeholder="— Seleccionar —"
            options={cuentas.map(c => ({ value: c.documentId, label: c.nombre }))} />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={() => cuentaId && onConfirmar(cuentaId)} disabled={!cuentaId}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export function CalendarioPagosView() {
  const { pagos, setPagos, loading } = useGetPagosProgramados()
  const { cuentas } = useGetCuentas("empresa")
  const cuentasDisponibles = useMemo(() => cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito"), [cuentas])

  const [mesActual,    setMesActual]    = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState<PagoProgramadoType | null>(null)
  const [form,         setForm]         = useState<Form>(emptyForm())
  const [saving,       setSaving]       = useState(false)
  const [delId,        setDelId]        = useState<string | null>(null)
  const [filtroTipo,   setFiltroTipo]   = useState<TipoPago | "todos">("todos")
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago | "todos">("todos")
  const [confirmarPago, setConfirmarPago] = useState<PagoProgramadoType | null>(null)
  const cerrarSiVacio = useModalBackdropClose(form, () => setModalOpen(false), editing?.documentId)

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
    setForm({ concepto: p.concepto, tipo: p.tipo, monto: p.monto != null ? String(p.monto) : "", fecha: p.fecha ?? toYMD(new Date()), estado: p.estado, recurrente: p.recurrente ?? false, frecuencia: p.frecuencia ?? "unico", categoria: p.categoria ?? "", notas: p.notas ?? "", cuentaId: p.cuenta?.documentId ?? "" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    setSaving(true)
    try {
      const payload = { concepto: form.concepto, tipo: form.tipo, monto: form.monto ? Number(form.monto) : null, fecha: form.fecha || null, estado: form.estado, recurrente: form.recurrente, frecuencia: form.recurrente ? form.frecuencia : null, categoria: form.categoria || null, notas: form.notas || null, cuenta: form.cuentaId || null }
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

  // Marcar como pagado: si ya tiene cuenta asignada, genera la transacción real de una vez;
  // si no, pide la cuenta primero. La transacción mueve el saldo solo (mismo libro de Ingresos/Gastos).
  async function confirmarYPagar(p: PagoProgramadoType, cuentaId: string) {
    try {
      const tx = await createTransaccion({
        descripcion: p.concepto,
        tipo: p.tipo === "cobro" ? "ingreso" : "gasto",
        monto: p.monto ?? 0,
        fecha: `${p.fecha ?? toYMD(new Date())}T12:00:00`,
        categoria: p.categoria || null,
        cuentaOrigen: p.tipo === "pago" ? cuentaId : null,
        cuentaDestino: p.tipo === "cobro" ? cuentaId : null,
        notas: p.notas || null,
        ambito: "empresa",
      })
      const updated = await updatePagoProgramado(p.documentId, { estado: "pagado", cuenta: cuentaId, transaccion: tx.documentId })
      setPagos(prev => prev.map(x => x.documentId === p.documentId ? updated : x))
      toast.success(p.tipo === "cobro" ? "Cobro registrado" : "Pago registrado")
    } catch { toast.error("Error al registrar el movimiento") }
    finally { setConfirmarPago(null) }
  }

  function handleMarkPaid(p: PagoProgramadoType) {
    if (p.cuenta?.documentId) { confirmarYPagar(p, p.cuenta.documentId); return }
    setConfirmarPago(p)
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
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Por pagar</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{fmt(stats.pagosPend)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Por cobrar</p>
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{fmt(stats.cobrosPend)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Neto pendiente</p>
          <p className={`text-xl font-bold ${stats.neto >= 0 ? "text-slate-900 dark:text-slate-100" : "text-red-500 dark:text-red-400"}`}>{fmt(stats.neto)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Próximos 7 días</p>
          <p className={`text-xl font-bold ${stats.proximos > 0 ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`}>{stats.proximos}</p>
        </div>
      </div>

      {/* Calendario + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Calendario mensual */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button type="button" title="Mes anterior" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                {format(mesActual, "MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {fmt(totalCobrosMes)} cobros · {fmt(totalPagosMes)} pagos
              </p>
            </div>
            <button type="button" title="Mes siguiente" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: primerDia }).map((_, i) => <div key={`e-${i}`} />)}
            {diasDelMes.map(dia => {
              const evs = pagosDelDia(dia)
              const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)
              const tieneVencidos = evs.some(p => p.estado === "pendiente" && (diasRestantes(p.fecha) ?? 0) < 0)

              return (
                <button key={dia.toISOString()} type="button"
                  title={format(dia, "d 'de' MMMM", { locale: es })}
                  onClick={() => setDiaSeleccionado(prev => prev && isSameDay(prev, dia) ? null : dia)}
                  className={`relative min-h-[52px] p-1 rounded-lg text-left transition-all border ${
                    seleccionado ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10"
                    : tieneVencidos ? "border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}>
                  <span className={`text-xs inline-flex items-center justify-center w-5 h-5 ${
                    isToday(dia) ? "bg-violet-500 text-white rounded-full font-bold" : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {format(dia, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {evs.slice(0, 2).map(p => (
                      <div key={p.documentId} className={`text-[9px] rounded px-1 truncate leading-tight ${
                        p.estado === "pagado" ? "bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 line-through"
                        : "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                      }`}>
                        {p.concepto}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">+{evs.length - 2}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 flex flex-col">
          {diaSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {format(diaSeleccionado, "d 'de' MMMM", { locale: es })}
                </h3>
                <button type="button"
                  onClick={() => openNuevo(format(diaSeleccionado, "yyyy-MM-dd"))}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition">
                  <Plus size={12} /> Agregar
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {pagosDelDia(diaSeleccionado).length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-600 text-center py-6">Sin pagos este día</p>
                )}
                {pagosDelDia(diaSeleccionado).map(p => {
                  const dias = diasRestantes(p.fecha)
                  const esVencido = dias !== null && dias < 0 && p.estado === "pendiente"
                  return (
                    <div key={p.documentId} className={`group rounded-lg border px-3 py-2.5 transition-colors ${
                      esVencido ? "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                              {p.tipo === "cobro" ? "Cobro" : "Pago"}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${estadoBadgeCls(p.estado)}`}>
                              {ESTADO_PAGO_LABELS[p.estado]}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.concepto}</p>
                          {p.categoria && <p className="text-[11px] text-slate-400 dark:text-slate-500">{p.categoria}</p>}
                        </div>
                        {p.monto != null && (
                          <p className="text-sm font-bold shrink-0 text-slate-900 dark:text-slate-100">{fmt(p.monto)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.estado === "pendiente" && (
                          <button type="button" title="Marcar como pagado" onClick={() => handleMarkPaid(p)}
                            className="p-1 text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition">
                            <Check size={12} />
                          </button>
                        )}
                        <button type="button" title="Editar" onClick={() => openEditar(p)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition">
                          <Pencil size={12} />
                        </button>
                        {delId === p.documentId ? (
                          <div className="flex items-center gap-1 px-1">
                            <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-500 font-medium">Sí</button>
                            <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-400">No</button>
                          </div>
                        ) : (
                          <button type="button" title="Eliminar" onClick={() => setDelId(p.documentId)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition">
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
              <CalendarDays size={28} className="text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-600">Selecciona un día para ver o agregar pagos</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de próximos pagos */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-1">
            {([["todos", "Todos"], ["pago", "Pagos"], ["cobro", "Cobros"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFiltroTipo(v as any)} className={pill(filtroTipo === v)}>{l}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setFiltroEstado("todos")} className={pill(filtroEstado === "todos")}>Todos</button>
            {ESTADOS.map(e => (
              <button key={e} type="button" onClick={() => setFiltroEstado(e)} className={pill(filtroEstado === e)}>{ESTADO_PAGO_LABELS[e]}</button>
            ))}
          </div>
          <button type="button" onClick={() => openNuevo()}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition-colors ml-auto">
            <Plus size={13} /> Nuevo pago
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-80 overflow-y-auto">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 px-4 flex items-center">
              <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-full" />
            </div>
          ))}
          {!loading && filtrados.length === 0 && (
            <div className="py-10 text-center text-slate-400 dark:text-slate-600">
              <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin pagos programados.</p>
            </div>
          )}
          {!loading && filtrados.map(p => {
            const dias = diasRestantes(p.fecha)
            const esVencido = dias !== null && dias < 0 && p.estado === "pendiente"
            return (
              <div key={p.documentId} className={`group flex items-center gap-3 px-4 py-3 transition-colors ${esVencido ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}>
                <span className="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                  {p.tipo === "cobro" ? "Cobro" : "Pago"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.concepto}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {p.fecha && (
                      <span className={`text-[11px] ${esVencido ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {p.fecha}
                        {dias !== null && p.estado === "pendiente" && (
                          <span className="ml-1">
                            {dias === 0 ? "(hoy)" : dias < 0 ? `(${Math.abs(dias)}d vencido)` : `(en ${dias}d)`}
                          </span>
                        )}
                      </span>
                    )}
                    <span className={`text-[10px] px-1 py-0.5 rounded border shrink-0 ${estadoBadgeCls(p.estado)}`}>
                      {ESTADO_PAGO_LABELS[p.estado]}
                    </span>
                    {p.recurrente && (
                      <span className="text-[10px] px-1 py-0.5 rounded border bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 shrink-0">{p.frecuencia}</span>
                    )}
                  </div>
                </div>
                {p.monto != null && (
                  <p className="text-sm font-bold shrink-0 text-slate-900 dark:text-slate-100">{fmt(p.monto)}</p>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {p.estado === "pendiente" && (
                    <button type="button" title="Marcar como pagado" onClick={() => handleMarkPaid(p)}
                      className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
                      <Check size={13} />
                    </button>
                  )}
                  <button type="button" title="Editar" onClick={() => openEditar(p)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
                    <Pencil size={13} />
                  </button>
                  {delId === p.documentId ? (
                    <div className="flex items-center gap-1 px-1">
                      <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-500 font-medium">Sí</button>
                      <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-400">No</button>
                    </div>
                  ) : (
                    <button type="button" title="Eliminar" onClick={() => setDelId(p.documentId)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editing ? "Editar" : "Nuevo pago programado"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className={labelCls}>Concepto <span className="text-violet-500">*</span></label>
                <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
                  className={fieldCls} placeholder="Ej. Renta local, Factura proveedor…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <DropdownPicker label="Tipo" value={form.tipo} onChange={v => setForm(f => ({ ...f, tipo: v }))}
                    options={[{ value: "pago", label: "Pago (salida)" }, { value: "cobro", label: "Cobro (entrada)" }]} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <DropdownPicker label="Estado" value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v }))}
                    options={ESTADOS.map(s => ({ value: s, label: ESTADO_PAGO_LABELS[s] }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Monto ($)</label>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} className={fieldCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Fecha</label>
                  <CalendarioPicker value={ymdToDate(form.fecha)} label="Fecha" className="w-full" onChange={d => setForm(f => ({ ...f, fecha: toYMD(d) }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Cuenta {form.tipo === "cobro" ? "destino" : "origen"} (opcional)</label>
                <DropdownPicker label="Cuenta" value={form.cuentaId} onChange={v => setForm(f => ({ ...f, cuentaId: v }))}
                  placeholder="Se pedirá al marcar como pagado" options={[{ value: "", label: "Se pedirá al marcar como pagado" }, ...cuentasDisponibles.map(c => ({ value: c.documentId, label: c.nombre }))]} />
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <input type="text" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className={fieldCls} placeholder="Ej. Servicios, Proveedores…" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurrente" checked={form.recurrente}
                  onChange={e => setForm(f => ({ ...f, recurrente: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-violet-500 focus:ring-violet-300 dark:bg-slate-800" />
                <label htmlFor="recurrente" className="text-sm text-slate-600 dark:text-slate-300">Recurrente</label>
              </div>
              {form.recurrente && (
                <div>
                  <label className={labelCls}>Frecuencia</label>
                  <DropdownPicker label="Frecuencia" value={form.frecuencia} onChange={v => setForm(f => ({ ...f, frecuencia: v }))}
                    options={FRECUENCIAS.map(fr => ({ value: fr, label: fr.charAt(0).toUpperCase() + fr.slice(1) }))} />
                </div>
              )}
              <div>
                <label className={labelCls}>Notas</label>
                <textarea rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className={`${fieldCls} h-auto py-2 resize-none`} placeholder="Observaciones…" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarPago && (
        <ConfirmarCuentaModal pago={confirmarPago} cuentas={cuentasDisponibles}
          onConfirmar={cuentaId => confirmarYPagar(confirmarPago, cuentaId)}
          onCerrar={() => setConfirmarPago(null)} />
      )}
    </div>
  )
}
