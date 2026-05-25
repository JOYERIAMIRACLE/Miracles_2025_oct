"use client"

import { useState, useMemo, useRef, useLayoutEffect } from "react"
import { Plus, Pencil, X, Loader2, Banknote, PiggyBank, Wallet, Star, LineChart, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { createCuenta } from "@/api/cuenta/createCuenta"
import { updateCuenta } from "@/api/cuenta/updateCuenta"
import { deleteCuenta } from "@/api/cuenta/deleteCuenta"
import { CuentaType, CuentaPayload } from "@/types/cuenta"
import { cn } from "@/lib/utils"

const TIPOS = ["Efectivo", "Crédito", "Debito"] as const
const PROPOSITOS_EMPRESA = ["Operativa", "Nómina", "Impuestos", "Inversión", "Fondo Emergencia", "Reserva"] as const
type PropositoEmpresa = typeof PROPOSITOS_EMPRESA[number]
const COLORES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"]

const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"

type PropositoMeta = { label: string; icon: React.ElementType; color: string }
const PROPOSITO_META: Record<string, PropositoMeta> = {
  "Operativa":       { label: "Operativa",        icon: Star,      color: "text-emerald-400" },
  "Nómina":          { label: "Nómina",            icon: Banknote,  color: "text-blue-400"    },
  "Impuestos":       { label: "Impuestos",         icon: Wallet,    color: "text-amber-400"   },
  "Inversión":       { label: "Inversión",         icon: LineChart, color: "text-violet-400"  },
  "Fondo Emergencia":{ label: "Fondo Emergencia",  icon: PiggyBank, color: "text-cyan-400"    },
  "Reserva":         { label: "Reserva",           icon: PiggyBank, color: "text-indigo-400"  },
  "__credito":       { label: "Crédito",           icon: CreditCard,color: "text-red-400"     },
  "__sin":           { label: "Sin propósito",     icon: Banknote,  color: "text-slate-400"   },
}
const ORDEN = ["Operativa", "Nómina", "Impuestos", "Inversión", "Fondo Emergencia", "Reserva", "__sin", "__credito"]

const emptyForm = (): CuentaPayload => ({
  nombre: "", tipo: null, proposito: null,
  saldoActual: null, saldoBanco: null, metaDeCuenta: null,
  color: COLORES[0], activa: true,
})

function ColorDot({ color }: { color: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.backgroundColor = color ?? "#6366f1"
  }, [color])
  return <span ref={ref} className="w-3 h-3 rounded-full shrink-0 inline-block" />
}

function ColorBtn({ col, selected, onClick }: { col: string; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = col }, [col])
  return (
    <button ref={ref} type="button" title={col} onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-transform ${selected ? "border-white scale-110" : "border-transparent"}`} />
  )
}

export function CuentasEmpresaView() {
  const { cuentas, setCuentas, loading } = useGetCuentas("empresa")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [form,       setForm]       = useState<CuentaPayload>(emptyForm())
  const [editando,   setEditando]   = useState<CuentaType | null>(null)
  const [guardando,  setGuardando]  = useState(false)
  const [mostrarInactivas, setMostrarInactivas] = useState(false)
  const [delId,      setDelId]      = useState<string | null>(null)

  const activas = useMemo(() =>
    mostrarInactivas ? cuentas : cuentas.filter(c => c.activa !== false), [cuentas, mostrarInactivas])

  const saldoTotal = useMemo(() =>
    activas.filter(c => c.tipo !== "Crédito").reduce((s, c) => s + (c.saldoActual ?? 0), 0), [activas])

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

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Saldo total */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Saldo total empresa</p>
        <p className="text-3xl font-bold text-slate-100">{fmt(saldoTotal)}</p>
        <p className="text-xs text-slate-600 mt-1">{activas.filter(c => c.tipo !== "Crédito").length} cuentas activas</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setMostrarInactivas(v => !v)}
          className={cn("h-8 px-3 text-xs rounded-lg border transition-colors",
            mostrarInactivas ? "bg-slate-700/50 border-slate-600 text-slate-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
          )}>
          {mostrarInactivas ? "Ocultar inactivas" : "Ver inactivas"}
        </button>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nueva cuenta
        </button>
      </div>

      {/* Grupos */}
      <div className="space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
        {!loading && grupos.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <Banknote size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin cuentas registradas.</p>
          </div>
        )}
        {!loading && grupos.map(({ key, meta, items, subtotal }) => {
          const Icon = meta.icon
          return (
            <div key={key} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-800">
                <Icon size={14} className={meta.color} />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex-1">{meta.label}</span>
                <span className={cn("text-xs font-bold", key === "__credito" ? "text-red-400" : "text-slate-200")}>{fmt(subtotal)}</span>
              </div>
              {items.map(c => (
                <div key={c.documentId}
                  className="group flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <ColorDot color={c.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200">{c.nombre}</p>
                      {c.activa === false && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500 border border-slate-600/50">Inactiva</span>
                      )}
                      {c.tipo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">{c.tipo}</span>
                      )}
                    </div>
                    {c.saldoBanco != null && c.saldoBanco !== c.saldoActual && (
                      <p className="text-[11px] text-slate-600 mt-0.5">Banco: {fmt(c.saldoBanco)}</p>
                    )}
                  </div>
                  <p className={cn("text-sm font-bold", key === "__credito" ? "text-red-400" : "text-slate-200")}>
                    {fmt(c.saldoActual)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" onClick={() => openEditar(c)}
                      className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                      <Pencil size={13} />
                    </button>
                    {delId === c.documentId ? (
                      <div className="flex items-center gap-1 px-1">
                        <button type="button" onClick={() => handleDelete(c.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setDelId(c.documentId)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editando ? "Editar cuenta" : "Nueva cuenta"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={inp} placeholder="Ej. Cuenta operativa BBVA…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select value={form.tipo ?? ""} onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as any }))} className={inp + " cursor-pointer"}>
                    <option value="">Sin tipo</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Propósito</label>
                  <select value={form.proposito ?? ""} onChange={e => setForm(f => ({ ...f, proposito: (e.target.value || null) as any }))} className={inp + " cursor-pointer"}>
                    <option value="">Sin propósito</option>
                    {PROPOSITOS_EMPRESA.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Saldo actual ($)</label>
                  <input type="number" step="0.01" value={form.saldoActual ?? ""}
                    onChange={e => setForm(f => ({ ...f, saldoActual: e.target.value ? Number(e.target.value) : null }))}
                    className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Saldo banco ($)</label>
                  <input type="number" step="0.01" value={form.saldoBanco ?? ""}
                    onChange={e => setForm(f => ({ ...f, saldoBanco: e.target.value ? Number(e.target.value) : null }))}
                    className={inp} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(col => (
                    <ColorBtn key={col} col={col} selected={form.color === col} onClick={() => setForm(f => ({ ...f, color: col }))} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activa-emp" checked={form.activa ?? true}
                  onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800" />
                <label htmlFor="activa-emp" className="text-sm text-slate-300">Cuenta activa</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={guardando}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={guardando}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
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
