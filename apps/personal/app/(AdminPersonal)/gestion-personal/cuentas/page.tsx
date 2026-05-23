"use client"

import { useState, useMemo, useRef, useLayoutEffect } from "react"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { createCuenta } from "@/api/cuenta/createCuenta"
import { updateCuenta } from "@/api/cuenta/updateCuenta"
import { deleteCuenta } from "@/api/cuenta/deleteCuenta"
import { CuentaType, CuentaPayload, TipoCuenta, PropositoCuenta } from "@/types/cuenta"
import { TransaccionPayload } from "@/types/transaccion"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import {
  Plus, Pencil, Trash2, X, Check,
  Banknote, PiggyBank, Bookmark, Wallet, LineChart, CreditCard, Star, ArrowLeftRight,
} from "lucide-react"
import { toast } from "sonner"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPOS: TipoCuenta[] = ["Efectivo", "Crédito", "Debito"]
const PROPOSITOS: PropositoCuenta[] = ["Operativa", "Ahorro", "Inversión", "Apartado", "Presupuesto 1"]
const COLORES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"]

const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

type PropositoMeta = { label: string; icon: React.ElementType; color: string }
const PROPOSITO_META: Record<string, PropositoMeta> = {
  "Operativa":     { label: "Operativa",   icon: Star,       color: "text-emerald-400" },
  "Ahorro":        { label: "Ahorro",      icon: PiggyBank,  color: "text-blue-400"    },
  "Inversión":     { label: "Inversión",   icon: LineChart,  color: "text-violet-400"  },
  "Apartado":      { label: "Apartado",    icon: Bookmark,   color: "text-amber-400"   },
  "Presupuesto 1": { label: "Presupuesto", icon: Wallet,     color: "text-indigo-400"  },
  "__sin":         { label: "Sin propósito", icon: Banknote, color: "text-slate-400"   },
  "__credito":     { label: "Crédito",     icon: CreditCard, color: "text-red-400"     },
}
const ORDEN_PROPOSITOS = ["Operativa", "Ahorro", "Inversión", "Apartado", "Presupuesto 1", "__sin", "__credito"]

const emptyForm = (): CuentaPayload => ({
  nombre: "", tipo: null, proposito: null,
  saldoActual: null, saldoBanco: null, metaDeCuenta: null,
  color: COLORES[0], activa: true,
})

// ─── ColorDot (sin inline styles) ────────────────────────────────────────────

function ColorDot({ color }: { color: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.backgroundColor = color ?? "#6366f1"
  }, [color])
  return <span ref={ref} className="w-3 h-3 rounded-full shrink-0 inline-block" />
}

function ColorBtn({ col, selected, onClick }: { col: string; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.backgroundColor = col
  }, [col])
  return (
    <button ref={ref} type="button" title={col} onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-transform ${selected ? "border-white scale-110" : "border-transparent"}`} />
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuentasPage() {
  const { cuentas, setCuentas, loading } = useGetCuentas()
  const [modalOpen, setModalOpen] = useState(false)
  const [form,      setForm]      = useState<CuentaPayload>(emptyForm())
  const [editando,  setEditando]  = useState<CuentaType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarInactivas, setMostrarInactivas] = useState(false)

  const [transModal, setTransModal] = useState(false)
  const [transForm, setTransForm] = useState({
    origenId: "", destinoId: "", monto: "", descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
  })
  const [transGuardando, setTransGuardando] = useState(false)

  const cuentasDisponibles = activas.filter(c => c.tipo !== "Crédito")

  const activas  = cuentas.filter(c => c.activa)
  const inactivas = cuentas.filter(c => !c.activa)
  const liquidas  = activas.filter(c => c.tipo !== "Crédito")
  const creditos  = activas.filter(c => c.tipo === "Crédito")
  const efectivo  = activas.filter(c => c.tipo === "Efectivo")
  const operativas = liquidas.filter(c => c.proposito === "Operativa")
  const apartados  = liquidas.filter(c => c.proposito !== "Operativa")

  const saldoDe = (c: CuentaType) => c.saldoActual ?? 0
  const totalOperativa = operativas.reduce((s, c) => s + saldoDe(c), 0)
  const totalApartados = apartados.reduce((s, c) => s + saldoDe(c), 0)
  const totalEfectivo  = efectivo.reduce((s, c) => s + saldoDe(c), 0)
  const totalBanco     = liquidas.filter(c => c.saldoBanco != null).reduce((s, c) => s + c.saldoBanco!, 0)
  const tieneBancos    = liquidas.some(c => c.saldoBanco != null)
  const totalSistema   = liquidas.reduce((s, c) => s + saldoDe(c), 0)
  const totalDeuda     = creditos.reduce((s, c) => s + saldoDe(c), 0)
  const diferencia     = tieneBancos ? totalBanco - totalSistema : null

  const gruposLista = useMemo(() => {
    return ORDEN_PROPOSITOS.map(key => {
      const items: CuentaType[] =
        key === "__credito" ? creditos
        : key === "__sin"  ? liquidas.filter(c => !c.proposito)
        :                    liquidas.filter(c => c.proposito === key)
      const total = items.reduce((s, c) => s + saldoDe(c), 0)
      return { key, meta: PROPOSITO_META[key], items, total }
    }).filter(g => g.items.length > 0)
  }, [cuentas])

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const abrirCrear = () => { setEditando(null); setForm(emptyForm()); setModalOpen(true) }
  const abrirEditar = (c: CuentaType) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, tipo: c.tipo, proposito: c.proposito,
      saldoActual: c.saldoActual, saldoBanco: c.saldoBanco,
      metaDeCuenta: c.metaDeCuenta, color: c.color, activa: c.activa ?? true,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCuenta(editando.documentId, form)
        setCuentas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Cuenta actualizada")
      } else {
        const nueva = await createCuenta(form)
        setCuentas(prev => [...prev, nueva])
        toast.success("Cuenta creada")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (c: CuentaType) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    try {
      await deleteCuenta(c.documentId)
      setCuentas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Cuenta eliminada")
    } catch { toast.error("Error al eliminar") }
  }

  const toggleActiva = async (c: CuentaType) => {
    try {
      const updated = await updateCuenta(c.documentId, { activa: !c.activa })
      setCuentas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch { toast.error("Error al actualizar") }
  }

  const transferir = async () => {
    const monto = Number(transForm.monto)
    if (!transForm.origenId || !transForm.destinoId) { toast.error("Selecciona origen y destino"); return }
    if (transForm.origenId === transForm.destinoId) { toast.error("Origen y destino deben ser distintos"); return }
    if (!monto || monto <= 0) { toast.error("Monto inválido"); return }
    setTransGuardando(true)
    try {
      const payload: TransaccionPayload = {
        tipo: "transferencia",
        descripcion: transForm.descripcion.trim() || "Transferencia entre cuentas",
        monto,
        fecha: transForm.fecha,
        cuentaOrigen: transForm.origenId,
        cuentaDestino: transForm.destinoId,
      }
      await createTransaccion(payload)
      setCuentas(prev => prev.map(c => {
        if (c.documentId === transForm.origenId)  return { ...c, saldoActual: (c.saldoActual ?? 0) - monto }
        if (c.documentId === transForm.destinoId) return { ...c, saldoActual: (c.saldoActual ?? 0) + monto }
        return c
      }))
      toast.success(`Transferencia de ${fmt(monto)} registrada`)
      setTransModal(false)
      setTransForm({ origenId: "", destinoId: "", monto: "", descripcion: "", fecha: new Date().toISOString().split("T")[0] })
    } catch (e: any) {
      toast.error(e.message ?? "Error al transferir")
    } finally {
      setTransGuardando(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mis Cuentas</h1>
          <p className="text-sm text-slate-500">Saldos y distribución de tu dinero</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTransModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition">
            <ArrowLeftRight size={15} /> Transferir
          </button>
          <button type="button" onClick={abrirCrear}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
            <Plus size={15} /> Nueva cuenta
          </button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
          <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wide mb-1">Operativa</p>
          <p className="text-xl font-bold text-emerald-300">{fmt(totalOperativa)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{operativas.length} cuenta{operativas.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Apartados</p>
          <p className="text-xl font-bold text-slate-200">{fmt(totalApartados)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{apartados.length} cuenta{apartados.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4">
          <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-1">Efectivo</p>
          <p className="text-xl font-bold text-amber-300">{fmt(totalEfectivo)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{efectivo.length} cuenta{efectivo.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4">
          <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wide mb-1">Deuda crédito</p>
          <p className="text-xl font-bold text-red-300">{fmt(totalDeuda)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{creditos.length} tarjeta{creditos.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Banco vs sistema */}
      {tieneBancos && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-center justify-between ${
          diferencia === 0 ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
          : "bg-amber-950/30 border-amber-800/40 text-amber-400"
        }`}>
          <span className="text-[11px] font-medium uppercase tracking-wide">
            {diferencia === 0 ? "✓ Sistema cuadra con banco" : diferencia! > 0 ? "Sobrante sin registrar" : "Faltante en sistema"}
          </span>
          {diferencia !== 0 && (
            <span className="font-bold">{diferencia! > 0 ? "+" : ""}{fmt(diferencia)}</span>
          )}
        </div>
      )}

      {/* Lista agrupada */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>
      ) : cuentas.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">No hay cuentas. Crea una.</p>
      ) : (
        <div className="space-y-5">
          {gruposLista.map(grupo => {
            const Icon = grupo.meta.icon
            return (
              <div key={grupo.key}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${grupo.meta.color}`}>
                    <Icon className="h-3 w-3" />
                    {grupo.meta.label}
                    <span className="text-slate-600 font-normal">· {grupo.items.length}</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">{fmt(grupo.total)}</span>
                </div>
                <div className="space-y-2">
                  {grupo.items.map(c => {
                    const saldo = c.saldoActual ?? 0
                    const esCredito = c.tipo === "Crédito"
                    const saldoOk = esCredito ? saldo === 0 : saldo >= 0
                    const difBanco = c.saldoBanco != null ? c.saldoBanco - saldo : null
                    return (
                      <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity bg-slate-900 ${
                        !c.activa ? "opacity-40 border-slate-800/50" : "border-slate-800"
                      }`}>
                        <ColorDot color={c.color} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-200 truncate">{c.nombre}</p>
                            {c.proposito === "Operativa" && <Star className="h-3 w-3 text-emerald-500 fill-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {c.tipo}{c.proposito ? ` · ${c.proposito}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-600">{esCredito ? "Deuda" : "Saldo"}</p>
                          <p className={`text-sm font-bold ${saldoOk ? "text-emerald-400" : "text-red-400"}`}>
                            {fmt(saldo)}
                          </p>
                        </div>
                        {c.saldoBanco != null && (
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-600">Banco</p>
                            <p className="text-sm font-semibold text-slate-300">{fmt(c.saldoBanco)}</p>
                          </div>
                        )}
                        {difBanco !== null && difBanco !== 0 && (
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-600">{difBanco > 0 ? "sobrante" : "faltante"}</p>
                            <p className="text-xs text-slate-500">{difBanco > 0 ? "+" : ""}{fmt(difBanco)}</p>
                          </div>
                        )}
                        {c.metaDeCuenta && (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] text-slate-600">Meta</p>
                            <p className="text-xs text-slate-400">{fmt(c.metaDeCuenta)}</p>
                          </div>
                        )}
                        <div className="flex gap-0.5 shrink-0">
                          <button type="button" title={c.activa ? "Desactivar" : "Activar"}
                            onClick={() => toggleActiva(c)}
                            className="p-1.5 rounded text-slate-600 hover:text-emerald-400 hover:bg-slate-800 transition">
                            <Check size={13} />
                          </button>
                          <button type="button" title="Editar"
                            onClick={() => abrirEditar(c)}
                            className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition">
                            <Pencil size={13} />
                          </button>
                          <button type="button" title="Eliminar"
                            onClick={() => eliminar(c)}
                            className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-slate-800 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inactivas */}
      {inactivas.length > 0 && (
        <div className="mt-6">
          <button type="button" onClick={() => setMostrarInactivas(v => !v)}
            className="text-xs text-slate-600 hover:text-slate-400 transition">
            {mostrarInactivas ? "Ocultar" : "Ver"} inactivas ({inactivas.length})
          </button>
          {mostrarInactivas && (
            <div className="mt-3 space-y-2">
              {inactivas.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-800 opacity-50">
                  <ColorDot color={c.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-400 truncate">{c.nombre}</p>
                    <p className="text-[11px] text-slate-600">{c.tipo}{c.proposito ? ` · ${c.proposito}` : ""} · Inactiva</p>
                  </div>
                  <p className="text-sm font-bold text-slate-500">{fmt(c.saldoActual ?? 0)}</p>
                  <button type="button" onClick={() => toggleActiva(c)}
                    className="text-xs text-slate-600 hover:text-emerald-400 transition px-2 py-1 rounded border border-slate-700 hover:border-emerald-700">
                    Activar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal transferencia */}
      {transModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-blue-400" /> Transferencia entre cuentas
              </h2>
              <button type="button" title="Cerrar" onClick={() => setTransModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Cuenta origen</label>
                <select title="Cuenta origen" value={transForm.origenId}
                  onChange={e => setTransForm(f => ({ ...f, origenId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500">
                  <option value="">— Seleccionar —</option>
                  {cuentasDisponibles.map(c => (
                    <option key={c.documentId} value={c.documentId}>{c.nombre} ({fmt(c.saldoActual)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Cuenta destino</label>
                <select title="Cuenta destino" value={transForm.destinoId}
                  onChange={e => setTransForm(f => ({ ...f, destinoId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500">
                  <option value="">— Seleccionar —</option>
                  {cuentasDisponibles.filter(c => c.documentId !== transForm.origenId).map(c => (
                    <option key={c.documentId} value={c.documentId}>{c.nombre} ({fmt(c.saldoActual)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Monto *</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={transForm.monto}
                  onChange={e => setTransForm(f => ({ ...f, monto: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Descripción (opcional)</label>
                <input type="text" placeholder="Ej. Paso a cartera para gastos" value={transForm.descripcion}
                  onChange={e => setTransForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Fecha</label>
                <input type="date" title="Fecha de transferencia" value={transForm.fecha}
                  onChange={e => setTransForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setTransModal(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button type="button" onClick={transferir} disabled={transGuardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
                <ArrowLeftRight size={14} />
                {transGuardando ? "Transfiriendo..." : "Transferir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {editando ? "Editar cuenta" : "Nueva cuenta"}
              </h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Nombre *</label>
                <input autoFocus value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: BBVA Débito"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tipo</label>
                  <select title="Tipo de cuenta" value={form.tipo ?? ""}
                    onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as TipoCuenta | null }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500">
                    <option value="">— Seleccionar —</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Propósito</label>
                  <select title="Propósito" value={form.proposito ?? ""}
                    onChange={e => setForm(f => ({ ...f, proposito: (e.target.value || null) as PropositoCuenta | null }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500">
                    <option value="">— Seleccionar —</option>
                    {PROPOSITOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Saldo actual</label>
                  <input type="number" placeholder="0" value={form.saldoActual ?? ""}
                    onChange={e => setForm(f => ({ ...f, saldoActual: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Saldo banco</label>
                  <input type="number" placeholder="Referencia banco" value={form.saldoBanco ?? ""}
                    onChange={e => setForm(f => ({ ...f, saldoBanco: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Meta (opcional)</label>
                <input type="number" placeholder="Ej: 50000" value={form.metaDeCuenta ?? ""}
                  onChange={e => setForm(f => ({ ...f, metaDeCuenta: e.target.value === "" ? null : Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(col => (
                    <ColorBtn key={col} col={col} selected={form.color === col}
                      onClick={() => setForm(f => ({ ...f, color: col }))} />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activa ?? true}
                  onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-slate-400">Cuenta activa</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
                <Check size={14} />
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
