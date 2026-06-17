"use client"

import { useState, useMemo } from "react"
import { Plus, X, Check, Trash2, TrendingUp, DollarSign, Banknote, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { useGetIngresos, createIngreso, deleteIngreso } from "@/api/ingreso/getIngresos"
import {
  Ingreso, IngresoPayload,
  METODOS_PAGO_INGRESO, CATEGORIAS_INGRESO, METODO_COLOR,
  MetodoPagoIngreso, CategoriaIngreso,
} from "@/types/ingreso"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const fmtFecha = (iso: string | null) => {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

const hoy = () => new Date().toISOString().split("T")[0]

const inRango = (fecha: string | null, desde: string, hasta: string) => {
  if (!fecha) return false
  return fecha >= desde && fecha <= hasta
}

const getRango = (periodo: "mes" | "anio" | "todo") => {
  const now = new Date()
  const hoyS = now.toISOString().split("T")[0]
  if (periodo === "mes")  return { desde: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, hasta: hoyS }
  if (periodo === "anio") return { desde: `${now.getFullYear()}-01-01`, hasta: hoyS }
  return { desde: "2000-01-01", hasta: hoyS }
}

// ─── Modal nuevo ingreso ──────────────────────────────────────────────────────
function IngresoModal({ onClose, onSaved }: {
  onClose:  () => void
  onSaved:  (i: Ingreso) => void
}) {
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const lbl = "block text-[11px] text-slate-500 mb-1"

  const [form, setForm] = useState({
    concepto:   "",
    monto:      "",
    fecha:      hoy(),
    metodoPago: "Efectivo" as MetodoPagoIngreso,
    categoria:  "VENTA - JOYERÍA" as CategoriaIngreso,
    referencia: "",
    notas:      "",
  })
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    const monto = parseFloat(form.monto)
    if (!form.concepto.trim()) { toast.error("Concepto requerido"); return }
    if (!form.monto || isNaN(monto) || monto <= 0) { toast.error("Monto inválido"); return }
    if (!form.fecha) { toast.error("Fecha requerida"); return }
    setGuardando(true)
    try {
      const payload: IngresoPayload = {
        concepto:   form.concepto.trim(),
        monto,
        fecha:      form.fecha,
        metodoPago: form.metodoPago,
        categoria:  form.categoria,
        referencia: form.referencia || null,
        notas:      form.notas     || null,
        ambito:     "empresa",
      }
      const saved = await createIngreso(payload)
      onSaved(saved)
      toast.success("Ingreso registrado")
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Nuevo ingreso</h2>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className={lbl}>Concepto *</label>
          <input autoFocus value={form.concepto}
            onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
            placeholder="Venta anillo solitario…" className={inp} />
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
            <input type="date" title="Fecha del ingreso" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Método de pago</label>
          <div className="flex flex-wrap gap-1.5">
            {METODOS_PAGO_INGRESO.map(m => (
              <button key={m} type="button"
                onClick={() => setForm(f => ({ ...f, metodoPago: m }))}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition ${
                  form.metodoPago === m ? METODO_COLOR[m] : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>Categoría</label>
          <select value={form.categoria} title="Categoría"
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaIngreso }))}
            className={inp}>
            {CATEGORIAS_INGRESO.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Referencia / Cliente</label>
          <input value={form.referencia}
            onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
            placeholder="Nombre del cliente…" className={inp} />
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <input value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            placeholder="Detalles adicionales…" className={inp} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function IngresosEmpresaView() {
  const { ingresos, setIngresos, loading } = useGetIngresos("empresa")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [periodo,    setPeriodo]    = useState<"mes" | "anio" | "todo">("mes")
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoPagoIngreso | "">("")

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

  const eliminar = async (ing: Ingreso) => {
    if (!confirm(`¿Eliminar ingreso "${ing.concepto}"?`)) return
    try {
      await deleteIngreso(ing.documentId)
      setIngresos(prev => prev.filter(i => i.documentId !== ing.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ingresos</h1>
          <p className="text-sm text-slate-500">Pagos y cobros recibidos de clientes</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo ingreso
        </button>
      </div>

      {/* Filtros de periodo */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["mes", "anio", "todo"] as const).map(p => (
          <button key={p} type="button" onClick={() => setPeriodo(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              periodo === p
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}>
            {p === "mes" ? "Este mes" : p === "anio" ? "Este año" : "Todo"}
          </button>
        ))}
        <div className="h-4 w-px bg-slate-700 mx-1" />
        {(["", ...METODOS_PAGO_INGRESO] as const).map(m => (
          <button key={m} type="button" onClick={() => setMetodoFiltro(m as MetodoPagoIngreso | "")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              metodoFiltro === m
                ? m ? METODO_COLOR[m as MetodoPagoIngreso] : "bg-slate-700 text-slate-200 border-slate-600"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {m || "Todos"}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total cobrado",    value: fmt(totalFiltrado),      icon: DollarSign,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Efectivo",         value: fmt(totalEfectivo),       icon: Banknote,    color: "text-amber-400",   bg: "bg-amber-500/10"   },
          { label: "Transferencia",    value: fmt(totalTransferencia),  icon: TrendingUp,  color: "text-blue-400",    bg: "bg-blue-500/10"    },
          { label: "Clientes distintos", value: String(countClientes), icon: CalendarDays, color: "text-violet-400",  bg: "bg-violet-500/10"  },
        ].map(kpi => (
          <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{loading ? "..." : kpi.value}</p>
            </div>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <kpi.icon size={15} className={kpi.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-slate-500 text-sm">Sin ingresos en el periodo seleccionado</p>
            <button type="button" onClick={() => setModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition">
              + Registrar ingreso
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Concepto</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cliente</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Fecha</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Método</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Monto</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtrados.map(ing => (
                <tr key={ing.documentId} className="hover:bg-slate-800/40 transition group">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium">{ing.concepto}</p>
                    {ing.notas && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{ing.notas}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{ing.referencia || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtFecha(ing.fecha)}</td>
                  <td className="px-4 py-3">
                    {ing.metodoPago
                      ? <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${METODO_COLOR[ing.metodoPago]}`}>
                          {ing.metodoPago}
                        </span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-emerald-400 font-bold font-mono">{fmt(ing.monto ?? 0)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" title="Eliminar ingreso"
                      onClick={() => eliminar(ing)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 rounded transition">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700">
                <td colSpan={4} className="px-4 py-3 text-xs text-slate-500">{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-emerald-300 font-bold font-mono text-sm">{fmt(totalFiltrado)}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {modalOpen && (
        <IngresoModal
          onClose={() => setModalOpen(false)}
          onSaved={ing => {
            setIngresos(prev => [ing, ...prev])
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
