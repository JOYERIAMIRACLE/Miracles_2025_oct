"use client"

import { useState, useMemo } from "react"
import { Plus, X, Check, Trash2, TrendingUp, DollarSign, Banknote, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { TransaccionType, METODOS_PAGO, MetodoPagoTransaccion } from "@/types/transaccion"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const fmtFecha = (iso: string | null) => {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
function ymdToDate(s: string): Date | null { return s ? new Date(`${s}T00:00:00Z`) : null }
const hoy = () => toYMD(new Date())

const inRango = (fecha: string | null, desde: string, hasta: string) => {
  if (!fecha) return false
  const soloFecha = fecha.slice(0, 10)
  return soloFecha >= desde && soloFecha <= hasta
}

const getRango = (periodo: "mes" | "anio" | "todo") => {
  const now = new Date()
  const hoyS = toYMD(now)
  if (periodo === "mes")  return { desde: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, hasta: hoyS }
  if (periodo === "anio") return { desde: `${now.getFullYear()}-01-01`, hasta: hoyS }
  return { desde: "2000-01-01", hasta: hoyS }
}

const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
const pill = (active: boolean) => `px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
  active ? "bg-violet-500 text-white border-violet-500" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
}`

// ─── Modal nuevo ingreso ──────────────────────────────────────────────────────
function IngresoModal({ onClose, onSaved }: {
  onClose:  () => void
  onSaved:  (i: TransaccionType) => void
}) {
  const { categorias } = useGetCategorias("empresa")
  const { cuentas } = useGetCuentas("empresa")
  const categoriasIngreso = useMemo(() => categorias.filter(c => c.tipo === "ingreso" && c.activa), [categorias])
  const cuentasDisponibles = useMemo(() => cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito"), [cuentas])

  const [form, setForm] = useState({
    concepto:   "",
    monto:      "",
    fecha:      hoy(),
    metodoPago: "Efectivo" as MetodoPagoTransaccion,
    categoria:  "",
    cuentaId:   "",
    referencia: "",
    notas:      "",
  })
  const [guardando, setGuardando] = useState(false)
  const cerrarSiVacio = useModalBackdropClose(form, onClose)

  const guardar = async () => {
    const monto = parseFloat(form.monto)
    if (!form.concepto.trim()) { toast.error("Concepto requerido"); return }
    if (!form.monto || isNaN(monto) || monto <= 0) { toast.error("Monto inválido"); return }
    if (!form.fecha) { toast.error("Fecha requerida"); return }
    if (!form.cuentaId) { toast.error("Selecciona la cuenta destino"); return }
    setGuardando(true)
    try {
      const saved = await createTransaccion({
        descripcion: form.concepto.trim(),
        tipo:        "ingreso",
        monto,
        fecha:       `${form.fecha}T12:00:00`,
        metodoPago:  form.metodoPago,
        categoria:   form.categoria || null,
        cuentaDestino: form.cuentaId,
        referencia:  form.referencia || null,
        notas:       form.notas || null,
        ambito:      "empresa",
      })
      onSaved(saved)
      toast.success("Ingreso registrado")
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nuevo ingreso</h2>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className={labelCls}>Concepto *</label>
          <input autoFocus value={form.concepto}
            onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
            placeholder="Venta anillo solitario…" className={fieldCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Monto *</label>
            <input type="number" min="0" step="0.01" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
              placeholder="0.00" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Fecha *</label>
            <CalendarioPicker value={ymdToDate(form.fecha)} label="Fecha del ingreso" className="w-full"
              onChange={d => setForm(f => ({ ...f, fecha: toYMD(d) }))} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Cuenta destino *</label>
          <DropdownPicker label="Cuenta destino" value={form.cuentaId} onChange={v => setForm(f => ({ ...f, cuentaId: v }))}
            placeholder="— Seleccionar —" options={cuentasDisponibles.map(c => ({ value: c.documentId, label: c.nombre }))} />
        </div>

        <div>
          <label className={labelCls}>Método de pago</label>
          <div className="flex flex-wrap gap-1.5">
            {METODOS_PAGO.map(m => (
              <button key={m} type="button"
                onClick={() => setForm(f => ({ ...f, metodoPago: m }))}
                className={pill(form.metodoPago === m)}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Categoría</label>
          <DropdownPicker label="Categoría" value={form.categoria} onChange={v => setForm(f => ({ ...f, categoria: v }))}
            placeholder="Sin categoría" options={[{ value: "", label: "Sin categoría" }, ...categoriasIngreso.map(c => ({ value: c.nombre, label: c.nombre }))]} />
        </div>

        <div>
          <label className={labelCls}>Referencia / Cliente</label>
          <input value={form.referencia}
            onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
            placeholder="Nombre del cliente…" className={fieldCls} />
        </div>

        <div>
          <label className={labelCls}>Notas</label>
          <input value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            placeholder="Detalles adicionales…" className={fieldCls} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function IngresosEmpresaView() {
  const { transacciones, setTransacciones, loading } = useGetTransacciones("empresa")
  const ingresos = useMemo(() => transacciones.filter(t => t.tipo === "ingreso"), [transacciones])
  const [modalOpen,  setModalOpen]  = useState(false)
  const [periodo,    setPeriodo]    = useState<"mes" | "anio" | "todo">("mes")
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoPagoTransaccion | "">("")
  const [delId,      setDelId]      = useState<string | null>(null)

  const { desde, hasta } = getRango(periodo)

  const filtrados = useMemo(() =>
    ingresos.filter(i =>
      inRango(i.fecha, desde, hasta) &&
      (!metodoFiltro || i.metodoPago === metodoFiltro)
    ), [ingresos, desde, hasta, metodoFiltro])

  const totalFiltrado    = filtrados.reduce((s, i) => s + (i.monto ?? 0), 0)
  const totalEfectivo    = filtrados.filter(i => i.metodoPago === "Efectivo").reduce((s, i) => s + (i.monto ?? 0), 0)
  const totalTransferencia = filtrados.filter(i => i.metodoPago === "Transferencia").reduce((s, i) => s + (i.monto ?? 0), 0)
  const countClientes    = new Set(filtrados.map(i => i.referencia ?? i.clienteDocumentId ?? "—").filter(Boolean)).size

  const eliminar = async (ing: TransaccionType) => {
    try {
      await deleteTransaccion(ing.documentId)
      setTransacciones(prev => prev.filter(i => i.documentId !== ing.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="space-y-5">

      {/* Filtros + acción */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(["mes", "anio", "todo"] as const).map(p => (
            <button key={p} type="button" onClick={() => setPeriodo(p)} className={pill(periodo === p)}>
              {p === "mes" ? "Este mes" : p === "anio" ? "Este año" : "Todo"}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          {(["", ...METODOS_PAGO] as const).map(m => (
            <button key={m} type="button" onClick={() => setMetodoFiltro(m as MetodoPagoTransaccion | "")} className={pill(metodoFiltro === m)}>
              {m || "Todos"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition shrink-0">
          <Plus size={15} /> Nuevo ingreso
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total cobrado",      value: fmt(totalFiltrado),       icon: DollarSign,  destacado: true },
          { label: "Efectivo",           value: fmt(totalEfectivo),       icon: Banknote,    destacado: false },
          { label: "Transferencia",      value: fmt(totalTransferencia),  icon: TrendingUp,  destacado: false },
          { label: "Clientes distintos", value: String(countClientes),    icon: CalendarDays, destacado: false },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.destacado ? "text-violet-600 dark:text-violet-400" : "text-slate-900 dark:text-slate-100"}`}>{loading ? "..." : kpi.value}</p>
            </div>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 dark:bg-violet-500/10">
              <kpi.icon size={15} className="text-violet-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-16">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Sin ingresos en el periodo seleccionado</p>
            <button type="button" onClick={() => setModalOpen(true)}
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm transition">
              + Registrar ingreso
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Concepto</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cuenta</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Método</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Monto</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtrados.map(ing => (
                  <tr key={ing.documentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
                    <td className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{ing.descripcion}</p>
                      {ing.notas && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{ing.notas}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{ing.referencia || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{ing.cuentaDestino?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{fmtFecha(ing.fecha)}</td>
                    <td className="px-4 py-3">
                      {ing.metodoPago
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">{ing.metodoPago}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{fmt(ing.monto ?? 0)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {delId === ing.documentId ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">¿Eliminar?</span>
                          <button type="button" onClick={() => eliminar(ing)} className="text-[11px] text-red-500 dark:text-red-400 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500 dark:text-slate-400">No</button>
                        </div>
                      ) : (
                        <button type="button" title="Eliminar ingreso"
                          onClick={() => setDelId(ing.documentId)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={5} className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-violet-600 dark:text-violet-400 font-bold font-mono text-sm">{fmt(totalFiltrado)}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <IngresoModal
          onClose={() => setModalOpen(false)}
          onSaved={ing => {
            setTransacciones(prev => [ing, ...prev])
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
