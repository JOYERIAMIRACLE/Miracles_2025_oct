"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Check, Archive, AlertTriangle, Search, SlidersHorizontal, ChevronDown, BarChart2, List } from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip as RCTooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import { useGetMaterialesTrabajo } from "@/api/material-trabajo/getMaterialesTrabajo"
import { createMaterialTrabajo, updateMaterialTrabajo, deleteMaterialTrabajo } from "@/api/material-trabajo/mutateMaterialTrabajo"
import { MaterialTrabajoType, CategoriaMaterial, MaterialTrabajoPayload } from "@/types/material-trabajo"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

const AMBITO = "empresa" as const
const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
const CATEGORIAS = ["promocional", "folleto", "camisa", "otro"] as const

const CATEGORIA_LABEL: Record<CategoriaMaterial, string> = {
  promocional: "Promocional", folleto: "Folleto", camisa: "Camisa", otro: "Otro",
}
const CATEGORIA_BADGE: Record<CategoriaMaterial, string> = {
  promocional: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  folleto:     "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  camisa:      "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  otro:        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
}
const CATEGORIA_HEX: Record<CategoriaMaterial, string> = {
  promocional: "#8b5cf6", folleto: "#38bdf8", camisa: "#fb7185", otro: "#94a3b8",
}
const TOOLTIP_STYLE = { background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#cbd5e1" }

type FormMode = { type: "create" } | { type: "edit"; item: MaterialTrabajoType }

function FormMaterial({ mode, onSave, onCancel }: { mode: FormMode; onSave: (m: MaterialTrabajoType) => void; onCancel: () => void }) {
  const editing = mode.type === "edit" ? mode.item : null
  const [nombre, setNombre] = useState(editing?.nombre ?? "")
  const [categoria, setCategoria] = useState<CategoriaMaterial>(editing?.categoria ?? "otro")
  const [cantidad, setCantidad] = useState(String(editing?.cantidad ?? 0))
  const [minimo, setMinimo] = useState(String(editing?.minimo ?? 0))
  const [notas, setNotas] = useState(editing?.notas ?? "")
  const [saving, setSaving] = useState(false)

  const cerrarSiVacio = useModalBackdropClose({ nombre, categoria, cantidad, minimo, notas }, onCancel)

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const payload: MaterialTrabajoPayload = {
      nombre: nombre.trim(), categoria, cantidad: Number(cantidad) || 0, minimo: Number(minimo) || 0,
      notas: notas.trim() || null, ambito: AMBITO,
    }
    if (editing) {
      const res = await updateMaterialTrabajo(editing.documentId, payload)
      if (res?.data) onSave(res.data)
    } else {
      const res = await createMaterialTrabajo(payload)
      if (res?.data) onSave(res.data)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editing ? "Editar item" : "Nuevo item de inventario"}</h3>
          <button type="button" title="Cerrar" onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del item" className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Categoría</label>
            <DropdownPicker label="Categoría" value={categoria} onChange={v => setCategoria(v as CategoriaMaterial)}
              options={CATEGORIAS.map(c => ({ value: c, label: CATEGORIA_LABEL[c] }))} />
          </div>
          <div>
            <label className={labelCls}>Cantidad actual</label>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" min="0" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Mínimo (alerta)</label>
            <input type="number" value={minimo} onChange={e => setMinimo(e.target.value)} placeholder="0" min="0" className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notas</label>
            <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas adicionales (opcional)" className={fieldCls} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={!nombre.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:hover:bg-violet-500 disabled:cursor-not-allowed text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar item"}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color ?? "text-slate-800 dark:text-slate-100"}`}>{value}</p>
    </div>
  )
}

function MetricasPanel({ materiales, porCategoria, stats }: {
  materiales: MaterialTrabajoType[]; porCategoria: { cat: CategoriaMaterial; piezas: number; count: number }[]
  stats: { total: number; piezas: number; bajos: number }
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const donutData = porCategoria.map(({ cat, piezas }) => ({ name: CATEGORIA_LABEL[cat], value: piezas, color: CATEGORIA_HEX[cat] }))
  const totalDonut = donutData.reduce((s, d) => s + d.value, 0)

  const stockBajo = useMemo(() =>
    materiales.filter(m => m.minimo > 0 && m.cantidad <= m.minimo)
      .sort((a, b) => (a.cantidad - a.minimo) - (b.cantidad - b.minimo)).slice(0, 10),
    [materiales])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Items" value={stats.total} />
        <StatTile label="Piezas" value={stats.piezas} color="text-violet-500" />
        <StatTile label="Stock bajo" value={stats.bajos} color={stats.bajos > 0 ? "text-violet-500" : undefined} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Piezas por categoría</p>
          {donutData.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">Sin datos</p> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={2}
                    onMouseEnter={(_, i) => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={activeIdx === null || activeIdx === i ? 1 : 0.35} style={{ cursor: "pointer", outline: "none" }} />
                    ))}
                  </Pie>
                  <RCTooltip formatter={(v: number) => [`${v} pz  (${totalDonut > 0 ? ((v / totalDonut) * 100).toFixed(1) : 0}%)`, ""]}
                    contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#cbd5e1" }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 flex-1 min-w-0">
                {donutData.map((d, i) => (
                  <li key={i} className={`flex items-center gap-1.5 text-[11px] transition-opacity ${activeIdx !== null && activeIdx !== i ? "opacity-40" : ""}`}
                    onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-400 truncate flex-1">{d.name}</span>
                    <span className="text-slate-500 tabular-nums shrink-0 text-[10px] w-8 text-right">{totalDonut > 0 ? ((d.value / totalDonut) * 100).toFixed(0) : 0}%</span>
                    <span className="text-slate-700 dark:text-slate-200 tabular-nums shrink-0">{d.value} pz</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Stock bajo (actual vs. mínimo)</p>
          {stockBajo.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">Todo el stock está por arriba del mínimo 🎉</p> : (
            <ResponsiveContainer width="100%" height={Math.min(stockBajo.length * 32 + 24, 260)}>
              <BarChart data={stockBajo} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={100}
                  tickFormatter={v => v.length > 14 ? v.slice(0, 14) + "…" : v} />
                <RCTooltip formatter={(v: number, name: string) => [`${v} pz`, name]} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#cbd5e1" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="cantidad" name="Actual" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={10} />
                <Bar dataKey="minimo" name="Mínimo" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export function MerchView() {
  const { materiales, setMateriales, loading } = useGetMaterialesTrabajo(AMBITO)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [tab, setTab] = useState<"lista" | "metricas">("lista")
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaMaterial | null>(null)
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [showFiltros, setShowFiltros] = useState(false)
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) { if (filtrosRef.current && !filtrosRef.current.contains(e.target as Node)) setShowFiltros(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return materiales
      .filter(m => filtroCategoria === null || m.categoria === filtroCategoria)
      .filter(m => !soloStockBajo || (m.minimo > 0 && m.cantidad <= m.minimo))
      .filter(m => !q || m.nombre.toLowerCase().includes(q) || (m.notas ?? "").toLowerCase().includes(q))
  }, [materiales, filtroCategoria, soloStockBajo, busqueda])

  const stats = useMemo(() => ({
    total: materiales.length,
    piezas: materiales.reduce((s, m) => s + m.cantidad, 0),
    bajos: materiales.filter(m => m.cantidad <= m.minimo && m.minimo > 0).length,
  }), [materiales])

  const porCategoria = useMemo(() =>
    CATEGORIAS.map(cat => ({
      cat,
      piezas: materiales.filter(m => m.categoria === cat).reduce((s, m) => s + m.cantidad, 0),
      count: materiales.filter(m => m.categoria === cat).length,
    })).filter(x => x.count > 0),
    [materiales])

  async function handleCantidad(m: MaterialTrabajoType, delta: number) {
    const nueva = Math.max(0, m.cantidad + delta)
    await updateMaterialTrabajo(m.documentId, { cantidad: nueva })
    setMateriales(prev => prev.map(x => x.documentId === m.documentId ? { ...x, cantidad: nueva } : x))
  }
  async function handleDelete(m: MaterialTrabajoType) {
    await deleteMaterialTrabajo(m.documentId)
    setMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
  }
  function handleSave(saved: MaterialTrabajoType) {
    if (formMode?.type === "edit") setMateriales(prev => prev.map(x => x.documentId === saved.documentId ? saved : x))
    else setMateriales(prev => [...prev, saved].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setFormMode(null)
  }

  const filtrosActivos = (filtroCategoria ? 1 : 0) + (soloStockBajo ? 1 : 0)
  const hayFiltrosLista = busqueda !== "" || filtroCategoria !== null || soloStockBajo

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />)}</div>
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-700" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500 dark:text-slate-400">Control de stock de material promocional, folletos y merchandising.</p>
        <button type="button" onClick={() => setFormMode({ type: "create" })}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo item
        </button>
      </div>

      <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg w-fit border border-slate-300 dark:border-slate-700 shadow-sm">
        <button type="button" onClick={() => setTab("lista")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "lista" ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <List size={14} /> Lista
        </button>
        <button type="button" onClick={() => setTab("metricas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "metricas" ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <BarChart2 size={14} /> Métricas
        </button>
      </div>

      {formMode && <FormMaterial mode={formMode} onSave={handleSave} onCancel={() => setFormMode(null)} />}

      {tab === "metricas" ? (
        <MetricasPanel materiales={materiales} porCategoria={porCategoria} stats={stats} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o notas…"
                className="pl-8 pr-3 h-9 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-violet-400 transition shadow-sm w-64" />
            </div>
            <div ref={filtrosRef} className="relative">
              <button type="button" onClick={() => setShowFiltros(v => !v)}
                className="h-9 flex items-center gap-1.5 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm">
                <SlidersHorizontal size={13} />
                <span>Filtros</span>
                {filtrosActivos > 0 && <span className="h-4 w-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">{filtrosActivos}</span>}
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${showFiltros ? "rotate-180" : ""}`} />
              </button>
              {showFiltros && (
                <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 w-60 p-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Categoría</p>
                    <DropdownPicker label="Categoría" value={filtroCategoria ?? ""} placeholder="Todas"
                      onChange={v => setFiltroCategoria(v ? v as CategoriaMaterial : null)}
                      options={[{ value: "", label: "Todas" }, ...CATEGORIAS.map(c => ({ value: c, label: CATEGORIA_LABEL[c] }))]} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                    <input type="checkbox" checked={soloStockBajo} onChange={e => setSoloStockBajo(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
                    Solo stock bajo
                  </label>
                  {filtrosActivos > 0 && (
                    <button type="button" onClick={() => { setFiltroCategoria(null); setSoloStockBajo(false) }}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors pt-1 border-t border-slate-100 dark:border-slate-800 w-full text-left">
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{hayFiltrosLista ? "Sin resultados para esos filtros." : "Sin items registrados."}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Notas</th>
                    <th className="px-2 py-3 w-10"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtrados.map(m => {
                      const bajo = m.minimo > 0 && m.cantidad <= m.minimo
                      return (
                        <motion.tr key={m.documentId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={() => setFormMode({ type: "edit", item: m })}
                          className="border-b border-slate-200 dark:border-slate-700 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {bajo && <AlertTriangle className="h-3.5 w-3.5 text-violet-400 shrink-0" aria-label="Stock bajo mínimo" />}
                              <span className={`font-medium truncate max-w-[140px] ${bajo ? "text-violet-600" : "text-slate-800 dark:text-slate-100"}`}>{m.nombre}</span>
                            </div>
                            <span className={`sm:hidden mt-0.5 inline-flex text-[10px] px-1.5 py-0.5 rounded border ${CATEGORIA_BADGE[m.categoria]}`}>{CATEGORIA_LABEL[m.categoria]}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="inline-flex items-center text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium">{CATEGORIA_LABEL[m.categoria]}</span>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => handleCantidad(m, -1)}
                                className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm font-bold transition-colors">−</button>
                              <span className={`w-8 text-center font-bold tabular-nums ${bajo ? "text-violet-500" : "text-slate-800 dark:text-slate-100"}`}>{m.cantidad}</span>
                              <button type="button" onClick={() => handleCantidad(m, 1)}
                                className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm font-bold transition-colors">+</button>
                            </div>
                            {m.minimo > 0 && <p className="text-center text-[10px] text-slate-400 mt-0.5">mín. {m.minimo}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell max-w-[160px] truncate">{m.notas ?? "—"}</td>
                          <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => handleDelete(m)} aria-label="Eliminar" className="text-slate-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
