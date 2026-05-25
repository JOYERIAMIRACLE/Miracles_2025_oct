"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, X, Pencil, Loader2, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useGetPartidas } from "@/api/partida-presupuesto/getPartidas"
import { createPartida } from "@/api/partida-presupuesto/createPartida"
import { updatePartida } from "@/api/partida-presupuesto/updatePartida"
import { deletePartida } from "@/api/partida-presupuesto/deletePartida"
import { useGetGastos } from "@/api/gasto/getGastos"
import { PartidaPresupuestoType } from "@/types/partida-presupuesto"
import { cn } from "@/lib/utils"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-all"

const CATEGORIAS_EMPRESA = ["Operaciones", "Marketing", "Ventas", "Administración", "Producción", "IT", "Otro"]
const FRECUENCIAS = ["mensual", "trimestral", "anual", "único"] as const
type Frecuencia = typeof FRECUENCIAS[number]

function calcMensual(monto: number, frecuencia: string | null): number {
  switch (frecuencia) {
    case "mensual":     return monto
    case "trimestral":  return monto / 3
    case "anual":       return monto / 12
    case "único":       return monto
    default:            return monto
  }
}

const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString("es-MX")}`

type Form = {
  descripcion: string; categoria: string; tipo: string; frecuencia: string; monto: string
}
function emptyForm(): Form {
  return { descripcion: "", categoria: "Operaciones", tipo: "gasto", frecuencia: "mensual", monto: "" }
}

export function PresupuestosEmpresaView() {
  const { partidas: raw, loading, error } = useGetPartidas("empresa")
  const { gastos } = useGetGastos("empresa")

  const [partidas,    setPartidas]    = useState<PartidaPresupuestoType[]>([])
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editing,     setEditing]     = useState<PartidaPresupuestoType | null>(null)
  const [form,        setForm]        = useState<Form>(emptyForm())
  const [saving,      setSaving]      = useState(false)
  const [delId,       setDelId]       = useState<string | null>(null)

  const hoy = new Date()
  const mesDefault = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
  const [mes, setMes] = useState(mesDefault)

  useEffect(() => { setPartidas(raw ?? []) }, [raw])

  const activas = useMemo(() => partidas.filter(p => p.activo !== false), [partidas])

  const porCategoria = useMemo(() => CATEGORIAS_EMPRESA.map(cat => ({
    cat,
    items: activas.filter(p => (p.categoria ?? "Otro") === cat),
  })).filter(g => g.items.length > 0), [activas])

  // Gastos reales del mes seleccionado
  const gastosMes = useMemo(() =>
    gastos.filter(g => g.fecha?.slice(0, 7) === mes), [gastos, mes])

  const comparativa = useMemo(() => CATEGORIAS_EMPRESA.map(cat => {
    const itemsCat = activas.filter(p => (p.categoria ?? "Otro") === cat)
    const presupuestado = itemsCat.reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
    const gastado = gastosMes.reduce((s, g) => s + Number(g.monto ?? 0), 0) // simplificado: todos los gastos
    return { cat, presupuestado, gastado }
  }).filter(c => c.presupuestado > 0), [activas, gastosMes])

  const totalPresupuestado = useMemo(() =>
    activas.filter(p => p.tipo !== "ingreso").reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0), [activas])

  const totalGastado = useMemo(() =>
    gastosMes.reduce((s, g) => s + Number(g.monto ?? 0), 0), [gastosMes])

  const pct = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0
  const disponible = totalPresupuestado - totalGastado

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(p: PartidaPresupuestoType) {
    setEditing(p)
    setForm({
      descripcion: p.descripcion,
      categoria:   p.categoria ?? "Operaciones",
      tipo:        p.tipo ?? "gasto",
      frecuencia:  p.frecuencia ?? "mensual",
      monto:       p.monto ? String(p.monto) : "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) { toast.error("La descripción es obligatoria"); return }
    if (!form.monto) { toast.error("El monto es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        descripcion: form.descripcion,
        categoria:   form.categoria || null,
        tipo:        form.tipo as any || null,
        frecuencia:  form.frecuencia as any || null,
        monto:       Number(form.monto),
        activo:      true,
        ambito:      "empresa",
      }
      if (editing) {
        const updated = await updatePartida(editing.documentId, payload)
        setPartidas(prev => prev.map(p => p.documentId === editing.documentId ? updated : p))
        toast.success("Partida actualizada")
      } else {
        const nueva = await createPartida(payload)
        setPartidas(prev => [...prev, nueva])
        toast.success("Partida creada")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deletePartida(documentId)
      setPartidas(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Partida eliminada")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  if (error) return <div className="p-8 text-sm text-red-400">Error: {error}</div>

  const mesLabel = new Date(mes + "-15").toLocaleString("es-MX", { month: "long", year: "numeric" })

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Presupuesto mensual</p>
          <p className="text-xl font-bold text-slate-200">{fmt(totalPresupuestado)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">Gastado en {mesLabel}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
              pct > 100 ? "bg-red-500/10 text-red-400" : pct > 80 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
            )}>{Math.round(pct)}%</span>
          </div>
          <p className={`text-xl font-bold ${pct > 100 ? "text-red-400" : "text-amber-400"}`}>{fmt(totalGastado)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Disponible</p>
          <p className={`text-xl font-bold ${disponible >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(disponible)}</p>
        </div>
      </div>

      {/* Selector de mes + Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Mes:</span>
          <button type="button" onClick={() => {
            const d = new Date(mes + "-15"); d.setMonth(d.getMonth() - 1)
            setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
          }} className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors">←</button>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="h-7 text-xs bg-slate-800 border border-slate-700 rounded-md px-2 text-slate-300" />
          <button type="button" onClick={() => {
            const d = new Date(mes + "-15"); d.setMonth(d.getMonth() + 1)
            setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
          }} className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors">→</button>
          {mes !== mesDefault && (
            <button type="button" onClick={() => setMes(mesDefault)} className="text-[10px] text-cyan-400 hover:text-cyan-300">Hoy</button>
          )}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nueva partida
        </button>
      </div>

      {/* Barras presupuesto vs real */}
      {comparativa.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Presupuesto vs real — {mesLabel}</p>
          {comparativa.map(c => {
            const p = c.presupuestado > 0 ? Math.min((c.gastado / c.presupuestado) * 100, 100) : 0
            const excedido = c.presupuestado > 0 && c.gastado > c.presupuestado
            return (
              <div key={c.cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{c.cat}</span>
                  <span className="text-[10px] text-slate-500">{fmt(c.gastado)} / {fmt(c.presupuestado)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", excedido ? "bg-red-500" : "bg-blue-500")}
                    style={{ width: `${p}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabla por categoría */}
      <div className="space-y-3">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
        {!loading && porCategoria.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <TrendingDown size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin partidas de presupuesto. Agrega la primera.</p>
          </div>
        )}
        {!loading && porCategoria.map(({ cat, items }) => {
          const subtotal = items.reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
          return (
            <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{cat}</span>
                <span className="text-xs font-bold text-slate-200">{fmt(subtotal)}/mes</span>
              </div>
              {items.map(p => {
                const mensual = calcMensual(p.monto ?? 0, p.frecuencia)
                return (
                  <div key={p.documentId}
                    className="group flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{p.descripcion}</p>
                      <p className="text-[11px] text-slate-600">
                        {fmt(p.monto ?? 0)} · {p.frecuencia ?? "mensual"}
                        {p.frecuencia !== "mensual" && ` (${fmt(mensual)}/mes)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
          )
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar partida" : "Nueva partida"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción <span className="text-red-400">*</span></label>
                <input type="text" value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className={inp} placeholder="Ej. Renta bodega, Campaña Meta…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inp + " cursor-pointer"}>
                    {CATEGORIAS_EMPRESA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp + " cursor-pointer"}>
                    <option value="necesidad">Necesidad</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="ahorro">Ahorro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Frecuencia</label>
                  <select value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} className={inp + " cursor-pointer"}>
                    {FRECUENCIAS.map(fr => <option key={fr} value={fr}>{fr.charAt(0).toUpperCase() + fr.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($) <span className="text-red-400">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    className={inp} placeholder="0.00" />
                </div>
              </div>
              {form.monto && Number(form.monto) > 0 && form.frecuencia !== "mensual" && (
                <p className="text-[11px] text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                  Equivale a {fmt(calcMensual(Number(form.monto), form.frecuencia))} / mes
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
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
