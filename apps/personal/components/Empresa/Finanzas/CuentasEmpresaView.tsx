"use client"

import { useState, useMemo, useRef, useLayoutEffect } from "react"
import {
  Plus, Pencil, X, Loader2,
  Banknote, PiggyBank, Wallet, Star, LineChart, CreditCard,
  ArrowLeftRight, CheckCircle, AlertTriangle, Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { createCuenta } from "@/api/cuenta/createCuenta"
import { updateCuenta } from "@/api/cuenta/updateCuenta"
import { deleteCuenta } from "@/api/cuenta/deleteCuenta"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { CuentaType, CuentaPayload } from "@/types/cuenta"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

const TIPOS = ["Efectivo", "Crédito", "Debito"] as const
const PROPOSITOS_EMPRESA = ["Operativa", "Nómina", "Impuestos", "Inversión", "Fondo Emergencia", "Reserva"] as const
const COLORES = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"]

const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
function ymdToDate(s: string): Date | null { return s ? new Date(`${s}T00:00:00Z`) : null }

type PropositoMeta = { label: string; icon: React.ElementType; esCredito?: boolean }
const PROPOSITO_META: Record<string, PropositoMeta> = {
  "Operativa":        { label: "Operativa",       icon: Star },
  "Nómina":           { label: "Nómina",           icon: Banknote },
  "Impuestos":        { label: "Impuestos",        icon: Wallet },
  "Inversión":        { label: "Inversión",        icon: LineChart },
  "Fondo Emergencia": { label: "Fondo Emergencia", icon: PiggyBank },
  "Reserva":          { label: "Reserva",          icon: PiggyBank },
  "__credito":        { label: "Crédito",          icon: CreditCard, esCredito: true },
  "__sin":            { label: "Sin propósito",    icon: Banknote },
}
const ORDEN = ["Operativa", "Nómina", "Impuestos", "Inversión", "Fondo Emergencia", "Reserva", "__sin", "__credito"]

const emptyForm = (): CuentaPayload => ({
  nombre: "", tipo: null, proposito: null,
  saldoActual: null, saldoBanco: null, metaDeCuenta: null,
  color: COLORES[0], activa: true,
})

function ColorDot({ color }: { color: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = color ?? "#8b5cf6" }, [color])
  return <span ref={ref} className="w-3 h-3 rounded-full shrink-0 inline-block" />
}

function ColorBtn({ col, selected, onClick }: { col: string; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = col }, [col])
  return (
    <button ref={ref} type="button" title={col} onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-transform ${selected ? "border-slate-900 dark:border-white scale-110" : "border-transparent"}`} />
  )
}

const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"

export function CuentasEmpresaView() {
  const { cuentas, setCuentas, loading } = useGetCuentas("empresa")
  const [modalOpen,        setModalOpen]        = useState(false)
  const [form,             setForm]             = useState<CuentaPayload>(emptyForm())
  const [editando,         setEditando]         = useState<CuentaType | null>(null)
  const [guardando,        setGuardando]        = useState(false)
  const [mostrarInactivas, setMostrarInactivas] = useState(false)
  const [delId,            setDelId]            = useState<string | null>(null)

  const [transModal,     setTransModal]     = useState(false)
  const [transForm,      setTransForm]      = useState({ origenId: "", destinoId: "", monto: "", descripcion: "", fecha: toYMD(new Date()) })
  const [transGuardando, setTransGuardando] = useState(false)

  const cerrarModalSiVacio = useModalBackdropClose(form, () => setModalOpen(false), editando?.documentId)
  const cerrarTransSiVacio = useModalBackdropClose(transForm, () => setTransModal(false))

  const activas = useMemo(() =>
    mostrarInactivas ? cuentas : cuentas.filter(c => c.activa !== false), [cuentas, mostrarInactivas])

  const liquidas  = activas.filter(c => c.tipo !== "Crédito")
  const creditos  = activas.filter(c => c.tipo === "Crédito")
  const saldoTotal = liquidas.reduce((s, c) => s + (c.saldoActual ?? 0), 0)
  const totalDeuda = creditos.reduce((s, c) => s + (c.saldoActual ?? 0), 0)

  const totalBanco  = liquidas.filter(c => c.saldoBanco != null).reduce((s, c) => s + (c.saldoBanco ?? 0), 0)
  const tieneBancos = liquidas.some(c => c.saldoBanco != null)
  const diferencia  = tieneBancos ? totalBanco - saldoTotal : null

  const resumenCards = useMemo(() => {
    return ORDEN.filter(k => k !== "__sin").map(k => {
      const items = k === "__credito" ? creditos : liquidas.filter(c => (c.proposito ?? "__sin") === k)
      return { key: k, meta: PROPOSITO_META[k], total: items.reduce((s, c) => s + (c.saldoActual ?? 0), 0), count: items.length }
    }).filter(c => c.count > 0)
  }, [activas])

  const grupos = useMemo(() => {
    const map = new Map<string, CuentaType[]>()
    for (const c of activas) {
      const key = c.tipo === "Crédito" ? "__credito" : (c.proposito ?? "__sin")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return ORDEN.filter(k => map.has(k)).map(k => ({
      key: k,
      meta: PROPOSITO_META[k] ?? PROPOSITO_META["__sin"],
      items: map.get(k)!,
      subtotal: map.get(k)!.reduce((s, c) => s + (c.saldoActual ?? 0), 0),
    }))
  }, [activas])

  const cuentasDisponibles = activas.filter(c => c.tipo !== "Crédito")

  function openNuevo() { setEditando(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(c: CuentaType) {
    setEditando(c)
    setForm({ nombre: c.nombre, tipo: c.tipo, proposito: c.proposito, saldoActual: c.saldoActual, saldoBanco: c.saldoBanco, metaDeCuenta: c.metaDeCuenta, color: c.color, activa: c.activa })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      const payload = { ...form, ambito: "empresa" } as any
      if (editando) {
        const updated = await updateCuenta(editando.documentId, payload)
        setCuentas(prev => prev.map(c => c.documentId === editando.documentId ? updated : c))
        toast.success("Cuenta actualizada")
      } else {
        const nueva = await createCuenta(payload)
        setCuentas(prev => [...prev, nueva])
        toast.success("Cuenta creada")
      }
      setModalOpen(false)
    } catch (err: any) { toast.error(err.message ?? "Error al guardar") }
    finally { setGuardando(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteCuenta(documentId)
      setCuentas(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Cuenta eliminada")
    } catch (err: any) { toast.error(err.message ?? "Error al eliminar") }
    finally { setDelId(null) }
  }

  async function transferir() {
    const monto = Number(transForm.monto)
    if (!transForm.origenId || !transForm.destinoId) { toast.error("Selecciona origen y destino"); return }
    if (transForm.origenId === transForm.destinoId) { toast.error("Origen y destino deben ser distintos"); return }
    if (!monto || monto <= 0) { toast.error("Monto inválido"); return }
    setTransGuardando(true)
    try {
      await createTransaccion({
        tipo: "transferencia",
        descripcion: transForm.descripcion.trim() || "Transferencia entre cuentas empresa",
        monto,
        fecha: `${transForm.fecha}T12:00:00`,
        cuentaOrigen: transForm.origenId,
        cuentaDestino: transForm.destinoId,
        ambito: "empresa",
      })
      setCuentas(prev => prev.map(c => {
        if (c.documentId === transForm.origenId)  return { ...c, saldoActual: (c.saldoActual ?? 0) - monto }
        if (c.documentId === transForm.destinoId) return { ...c, saldoActual: (c.saldoActual ?? 0) + monto }
        return c
      }))
      toast.success(`Transferencia de ${fmt(monto)} registrada`)
      setTransModal(false)
      setTransForm({ origenId: "", destinoId: "", monto: "", descripcion: "", fecha: toYMD(new Date()) })
    } catch (err: any) { toast.error(err.message ?? "Error al transferir") }
    finally { setTransGuardando(false) }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cuentas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldos y distribución del dinero de la empresa.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTransModal(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeftRight size={14} /> Transferir
          </button>
          <button type="button" onClick={openNuevo}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
            <Plus size={15} /> Nueva cuenta
          </button>
        </div>
      </div>

      {/* Saldo total */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Saldo total empresa</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{fmt(saldoTotal)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{liquidas.length} cuenta{liquidas.length !== 1 ? "s" : ""} activa{liquidas.length !== 1 ? "s" : ""}</p>
        </div>
        {totalDeuda > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Deuda crédito</p>
            <p className="text-xl font-bold text-red-500 dark:text-red-400">{fmt(totalDeuda)}</p>
          </div>
        )}
      </div>

      {/* Cards resumen por propósito */}
      {resumenCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {resumenCards.map(({ key, meta, total, count }) => {
            const Icon = meta.icon
            return (
              <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={13} className="text-violet-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{meta.label}</p>
                </div>
                <p className={`text-xl font-bold ${meta.esCredito ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>{fmt(total)}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{count} cuenta{count !== 1 ? "s" : ""}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Banco vs sistema */}
      {tieneBancos && (
        <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            {diferencia === 0 ? <CheckCircle size={14} className="text-violet-500" /> : <AlertTriangle size={14} className="text-red-500" />}
            <span className="text-[11px] font-medium uppercase tracking-wide">
              {diferencia === 0 ? "Sistema cuadra con banco" : diferencia! > 0 ? "Sobrante sin registrar" : "Faltante en sistema"}
            </span>
          </div>
          {diferencia !== 0 && <span className="font-bold text-sm text-red-500 dark:text-red-400">{diferencia! > 0 ? "+" : ""}{fmt(diferencia)}</span>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setMostrarInactivas(v => !v)}
          className={`h-8 px-3 text-xs rounded-lg border transition-colors ${
            mostrarInactivas
              ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-400"
              : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}>
          {mostrarInactivas ? "Ocultar inactivas" : "Ver inactivas"}
        </button>
      </div>

      {/* Grupos */}
      <div className="space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        ))}
        {!loading && grupos.length === 0 && (
          <div className="py-14 text-center text-slate-400 dark:text-slate-600">
            <Banknote size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin cuentas registradas.</p>
          </div>
        )}
        {!loading && grupos.map(({ key, meta, items, subtotal }) => {
          const Icon = meta.icon
          return (
            <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <Icon size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex-1">{meta.label}</span>
                <span className={`text-xs font-bold ${key === "__credito" ? "text-red-500 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>{fmt(subtotal)}</span>
              </div>
              {items.map(c => (
                <div key={c.documentId}
                  className="group flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <ColorDot color={c.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.nombre}</p>
                      {c.activa === false && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-600/50">Inactiva</span>
                      )}
                      {c.tipo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600/50">{c.tipo}</span>
                      )}
                    </div>
                    {c.saldoBanco != null && c.saldoBanco !== c.saldoActual && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Banco: {fmt(c.saldoBanco)}</p>
                    )}
                    {c.metaDeCuenta != null && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Meta: {fmt(c.metaDeCuenta)}</p>
                    )}
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${key === "__credito" ? "text-red-500 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                    {fmt(c.saldoActual)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" title="Editar" onClick={() => openEditar(c)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                      <Pencil size={13} />
                    </button>
                    {delId === c.documentId ? (
                      <div className="flex items-center gap-1 px-1">
                        <button type="button" onClick={() => handleDelete(c.documentId)} className="text-[11px] text-red-500 hover:text-red-400 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-400">No</button>
                      </div>
                    ) : (
                      <button type="button" title="Eliminar" onClick={() => setDelId(c.documentId)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Modal transferencia */}
      {transModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarTransSiVacio}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-violet-500" /> Transferencia entre cuentas
              </h2>
              <button type="button" title="Cerrar" onClick={() => setTransModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Cuenta origen</label>
                <DropdownPicker label="Cuenta origen" value={transForm.origenId} onChange={v => setTransForm(f => ({ ...f, origenId: v }))}
                  placeholder="— Seleccionar —"
                  options={cuentasDisponibles.map(c => ({ value: c.documentId, label: `${c.nombre} (${fmt(c.saldoActual)})` }))} />
              </div>
              <div>
                <label className={labelCls}>Cuenta destino</label>
                <DropdownPicker label="Cuenta destino" value={transForm.destinoId} onChange={v => setTransForm(f => ({ ...f, destinoId: v }))}
                  placeholder="— Seleccionar —"
                  options={cuentasDisponibles.filter(c => c.documentId !== transForm.origenId).map(c => ({ value: c.documentId, label: `${c.nombre} (${fmt(c.saldoActual)})` }))} />
              </div>
              <div>
                <label className={labelCls}>Monto *</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00" value={transForm.monto}
                  onChange={e => setTransForm(f => ({ ...f, monto: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Descripción (opcional)</label>
                <input type="text" placeholder="Ej. Paso a cuenta nómina" value={transForm.descripcion}
                  onChange={e => setTransForm(f => ({ ...f, descripcion: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <CalendarioPicker value={ymdToDate(transForm.fecha)} label="Fecha de transferencia" className="w-full"
                  onChange={d => setTransForm(f => ({ ...f, fecha: toYMD(d) }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setTransModal(false)}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
              <button type="button" onClick={transferir} disabled={transGuardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
                <ArrowLeftRight size={14} />
                {transGuardando ? "Transfiriendo..." : "Transferir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarModalSiVacio}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editando ? "Editar cuenta" : "Nueva cuenta"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className={labelCls}>Nombre <span className="text-violet-500">*</span></label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={fieldCls} placeholder="Ej. Cuenta operativa BBVA…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <DropdownPicker label="Tipo" value={form.tipo ?? ""} onChange={v => setForm(f => ({ ...f, tipo: (v || null) as any }))}
                    placeholder="Sin tipo" options={[{ value: "", label: "Sin tipo" }, ...TIPOS.map(t => ({ value: t, label: t }))]} />
                </div>
                <div>
                  <label className={labelCls}>Propósito</label>
                  <DropdownPicker label="Propósito" value={form.proposito ?? ""} onChange={v => setForm(f => ({ ...f, proposito: (v || null) as any }))}
                    placeholder="Sin propósito" options={[{ value: "", label: "Sin propósito" }, ...PROPOSITOS_EMPRESA.map(p => ({ value: p, label: p }))]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Saldo {editando ? "actual" : "inicial"} ($)
                  </label>
                  {editando ? (
                    <div className={`${fieldCls} flex items-center text-slate-400 dark:text-slate-500 cursor-not-allowed bg-slate-50 dark:bg-slate-800/60`}>{fmt(form.saldoActual)}</div>
                  ) : (
                    <input type="number" step="0.01" value={form.saldoActual ?? ""}
                      onChange={e => setForm(f => ({ ...f, saldoActual: e.target.value ? Number(e.target.value) : null }))}
                      className={fieldCls} placeholder="0.00" />
                  )}
                </div>
                <div>
                  <label className={labelCls}>Saldo banco ($)</label>
                  <input type="number" step="0.01" value={form.saldoBanco ?? ""}
                    onChange={e => setForm(f => ({ ...f, saldoBanco: e.target.value ? Number(e.target.value) : null }))}
                    className={fieldCls} placeholder="0.00" />
                </div>
              </div>
              {editando && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-1">El saldo actual se actualiza solo con ingresos, gastos y transferencias.</p>
              )}
              <div>
                <label className={labelCls}>Meta de cuenta ($)</label>
                <input type="number" step="0.01" value={form.metaDeCuenta ?? ""}
                  onChange={e => setForm(f => ({ ...f, metaDeCuenta: e.target.value ? Number(e.target.value) : null }))}
                  className={fieldCls} placeholder="Ej. 100000" />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(col => (
                    <ColorBtn key={col} col={col} selected={form.color === col} onClick={() => setForm(f => ({ ...f, color: col }))} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activa-emp" checked={form.activa ?? true}
                  onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-violet-500 focus:ring-violet-300 dark:bg-slate-800" />
                <label htmlFor="activa-emp" className="text-sm text-slate-600 dark:text-slate-300">Cuenta activa</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={guardando}
                className="h-8 px-4 rounded-lg text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={guardando}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition">
                {guardando && <Loader2 size={14} className="animate-spin" />}
                {editando ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
