"use client"

import { useState, useMemo, useRef, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, X, Wallet, Pencil, Check, Settings2, BarChart2, Search,
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip as RCTooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { useGetPagosTrabajo }   from "@/api/pago-trabajo/getPagosTrabajo"
import { useGetCategoriasPago } from "@/api/categoria-pago/getCategoriasPago"
import { createCategoriaPago, updateCategoriaPago, deleteCategoriaPago } from "@/api/categoria-pago/mutateCategoriasPago"
import { createPagoTrabajo, updatePagoTrabajo, deletePagoTrabajo }       from "@/api/pago-trabajo/mutatePagoTrabajo"
import { PagoTrabajoType, EstadoPago } from "@/types/pago-trabajo"
import { CategoriaPagoType }           from "@/types/categoria-pago"

// ─── Constantes ───────────────────────────────────────────────────────────────

const fmt      = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtAxis  = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`

const ESTADO_BADGE: Record<EstadoPago, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pagado:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  parcial:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

const CAT_COLORS = [
  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "bg-pink-500/15 text-pink-400 border-pink-500/20",
]

const CHART_HEX = [
  "#8b5cf6","#38bdf8","#34d399","#fb7185",
  "#fb923c","#fbbf24","#2dd4bf","#f472b6","#94a3b8",
]

const catColor = (id: number) => CAT_COLORS[id % CAT_COLORS.length] ?? CAT_COLORS[0]
const catHex   = (idx: number) => CHART_HEX[idx % CHART_HEX.length]

const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

const TOOLTIP_STYLE = {
  background: "#0f172a", border: "1px solid #334155",
  borderRadius: "8px", fontSize: "12px", color: "#cbd5e1",
}

// ─── Gestión de categorías ────────────────────────────────────────────────────

function GestionCategorias({ categorias, onRefetch }: {
  categorias: CategoriaPagoType[]
  onRefetch:  () => Promise<void>
}) {
  const [editId,     setEditId]     = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [newNombre,  setNewNombre]  = useState("")
  const [adding,     setAdding]     = useState(false)
  const [saving,     setSaving]     = useState(false)

  async function handleRename(cat: CategoriaPagoType) {
    if (!editNombre.trim() || editNombre === cat.nombre) { setEditId(null); return }
    setSaving(true)
    await updateCategoriaPago(cat.documentId, editNombre.trim())
    await onRefetch()
    setEditId(null); setSaving(false)
  }

  async function handleAdd() {
    if (!newNombre.trim()) return
    setSaving(true)
    await createCategoriaPago(newNombre.trim())
    await onRefetch()
    setNewNombre(""); setAdding(false); setSaving(false)
  }

  async function handleDelete(cat: CategoriaPagoType) {
    await deleteCategoriaPago(cat.documentId)
    await onRefetch()
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Gestionar categorías</p>
      <div className="space-y-1.5">
        {categorias.map(cat => (
          <div key={cat.documentId} className="flex items-center gap-2 group">
            {editId === cat.documentId ? (
              <>
                <input autoFocus value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(cat); if (e.key === "Escape") setEditId(null) }}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50" />
                <button type="button" aria-label="Guardar" onClick={() => handleRename(cat)} disabled={saving} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check className="h-4 w-4" /></button>
                <button type="button" aria-label="Cancelar" onClick={() => setEditId(null)} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${catColor(cat.id)}`}>{cat.nombre}</span>
                <button type="button" aria-label="Renombrar" onClick={() => { setEditId(cat.documentId); setEditNombre(cat.nombre) }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Eliminar" onClick={() => handleDelete(cat)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all ml-auto"><X className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}
      </div>
      {adding ? (
        <div className="flex items-center gap-2 mt-2">
          <input autoFocus value={newNombre} onChange={e => setNewNombre(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewNombre("") } }}
            placeholder="Nombre de categoría"
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 placeholder:text-slate-600" />
          <button type="button" aria-label="Confirmar" onClick={handleAdd} disabled={!newNombre.trim() || saving} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"><Check className="h-4 w-4" /></button>
          <button type="button" aria-label="Cancelar" onClick={() => { setAdding(false); setNewNombre("") }} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2">
          <Plus className="h-3.5 w-3.5" /> Nueva categoría
        </button>
      )}
    </div>
  )
}

function ColorDot({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.style.backgroundColor = color }, [color])
  return <span ref={ref} className="w-2 h-2 rounded-full shrink-0" />
}

// ─── Panel de métricas ────────────────────────────────────────────────────────

type CatStat  = { cat: CategoriaPagoType; total: number; count: number }
type MesStat  = { mes: string; total: number; key: string }
type DonutRow = { name: string; value: number; color: string }

function MetricasPanel({ porCategoria, porMes, sinCategoria }: {
  porCategoria: CatStat[]
  porMes:       MesStat[]
  sinCategoria: number
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const donutData: DonutRow[] = [
    ...porCategoria.map(({ cat, total }, i) => ({
      name:  cat.nombre,
      value: total,
      color: catHex(i)!,
    })),
    ...(sinCategoria > 0 ? [{ name: "Sin categoría", value: sinCategoria, color: "#475569" }] : []),
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Dona — por categoría */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Por categoría</p>
        {donutData.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-10">Sin datos</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={140}>
              <PieChart>
                <Pie
                  data={donutData} cx="50%" cy="50%"
                  innerRadius={42} outerRadius={65}
                  dataKey="value" nameKey="name" paddingAngle={2}
                  onMouseEnter={(_, i) => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={i} fill={entry.color}
                      opacity={activeIdx === null || activeIdx === i ? 1 : 0.35}
                      style={{ cursor: "pointer", outline: "none" }}
                    />
                  ))}
                </Pie>
                <RCTooltip
                  formatter={(v: number) => [fmt(v), ""]}
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: "#cbd5e1" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 flex-1 min-w-0">
              {donutData.map((d, i) => (
                <li key={i}
                  className={`flex items-center gap-1.5 text-[11px] transition-opacity ${activeIdx !== null && activeIdx !== i ? "opacity-40" : ""}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  <ColorDot color={d.color} />
                  <span className="text-slate-400 truncate flex-1">{d.name}</span>
                  <span className="text-slate-300 tabular-nums shrink-0">{fmt(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Barras — por mes */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Por mes</p>
        {porMes.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-10">Sin gastos con fecha</p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={porMes} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={38} />
              <RCTooltip
                formatter={(v: number) => [fmt(v), "Total"]}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "#cbd5e1" }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
              />
              <Bar dataKey="total" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ─── Formulario crear / editar ────────────────────────────────────────────────

type FormMode = { type: "create" } | { type: "edit"; pago: PagoTrabajoType }

function FormPago({ mode, categorias, onSave, onCancel }: {
  mode:       FormMode
  categorias: CategoriaPagoType[]
  onSave:     () => void
  onCancel:   () => void
}) {
  const editing = mode.type === "edit" ? mode.pago : null

  const [concepto,    setConcepto]    = useState(editing?.concepto    ?? "")
  const [monto,       setMonto]       = useState(editing?.monto       ? String(editing.monto) : "")
  const [fecha,       setFecha]       = useState(editing?.fecha       ?? new Date().toISOString().slice(0, 10))
  const [estado,      setEstado]      = useState<EstadoPago>(editing?.estado ?? "pendiente")
  const [categoriaId, setCategoriaId] = useState<number | "">(editing?.categoriaPago?.id ?? "")
  const [proveedor,   setProveedor]   = useState(editing?.proveedor   ?? "")
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? "")
  const [notas,       setNotas]       = useState(editing?.notas       ?? "")
  const [saving,      setSaving]      = useState(false)

  async function handleSave() {
    if (!concepto.trim() || !monto) return
    setSaving(true)
    const payload: Record<string, unknown> = {
      concepto:    concepto.trim(),
      monto:       Number(monto),
      fecha:       fecha || null,
      estado,
      proveedor:   proveedor.trim() || null,
      descripcion: descripcion.trim() || null,
      notas:       notas.trim() || null,
    }
    if (categoriaId) payload.categoriaPago = { connect: [{ id: categoriaId }] }
    else             payload.categoriaPago = { disconnect: [] }

    if (editing) await updatePagoTrabajo(editing.documentId, payload)
    else         await createPagoTrabajo(payload)

    setSaving(false)
    onSave()
  }

  const inputCls  = "bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
  const selectCls = "bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">{editing ? "Editar Pago" : "Nuevo Pago"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Concepto *"
          className={`sm:col-span-2 ${inputCls}`} />
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Monto ($) *" className={inputCls} />
        <input type="date" title="Fecha" value={fecha} onChange={e => setFecha(e.target.value)} className={selectCls} />
        <input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Proveedor" className={inputCls} />
        <select title="Categoría" value={categoriaId} onChange={e => setCategoriaId(e.target.value ? Number(e.target.value) : "")} className={selectCls}>
          <option value="">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select title="Estado" value={estado} onChange={e => setEstado(e.target.value as EstadoPago)} className={selectCls}>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="parcial">Parcial</option>
        </select>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del recurso"
          rows={2} className={`sm:col-span-2 resize-none ${inputCls}`} />
        <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas internas"
          rows={2} className={`sm:col-span-2 resize-none ${inputCls}`} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!concepto.trim() || !monto || saving}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar Pago"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PagosPage() {
  const { pagos, setPagos, loading, refetch }                       = useGetPagosTrabajo()
  const { categorias, refetch: refetchCats, loading: loadingCats }  = useGetCategoriasPago()

  const [formMode,      setFormMode]      = useState<FormMode | null>(null)
  const [showGestion,   setShowGestion]   = useState(false)
  const [showMetricas,  setShowMetricas]  = useState(false)
  const [filtroEst,     setFiltroEst]     = useState<EstadoPago | "todos">("todos")
  const [filtroCatId,   setFiltroCatId]   = useState<number | null>(null)
  const [busqueda,      setBusqueda]      = useState("")
  const [fechaDesde,    setFechaDesde]    = useState("")
  const [fechaHasta,    setFechaHasta]    = useState("")

  function aplicarPreset(preset: "mes" | "mesAnt" | "anio" | "todo") {
    const hoy = new Date()
    if (preset === "mes") {
      setFechaDesde(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`)
      setFechaHasta(hoy.toISOString().slice(0, 10))
    } else if (preset === "mesAnt") {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const h = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      setFechaDesde(d.toISOString().slice(0, 10))
      setFechaHasta(h.toISOString().slice(0, 10))
    } else if (preset === "anio") {
      setFechaDesde(`${hoy.getFullYear()}-01-01`)
      setFechaHasta(hoy.toISOString().slice(0, 10))
    } else {
      setFechaDesde(""); setFechaHasta("")
    }
  }

  const hayFiltroFecha = fechaDesde !== "" || fechaHasta !== ""

  // ── Datos derivados ────────────────────────────────────────────────────────

  // Base filtrada por fecha — usada por métricas y tabla
  const pagosFecha = useMemo(() =>
    pagos.filter(p => {
      if (fechaDesde && (!p.fecha || p.fecha < fechaDesde)) return false
      if (fechaHasta && (!p.fecha || p.fecha > fechaHasta)) return false
      return true
    }),
    [pagos, fechaDesde, fechaHasta]
  )

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return pagosFecha
      .filter(p => filtroEst   === "todos" || p.estado === filtroEst)
      .filter(p => filtroCatId === null    || p.categoriaPago?.id === filtroCatId)
      .filter(p => !q || p.concepto.toLowerCase().includes(q) || (p.proveedor ?? "").toLowerCase().includes(q))
  }, [pagosFecha, filtroEst, filtroCatId, busqueda])

  const resumen = useMemo(() => ({
    total:     pagosFecha.reduce((s, p) => s + p.monto, 0),
    pagado:    pagosFecha.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0),
    pendiente: pagosFecha.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0),
  }), [pagosFecha])

  const porCategoria = useMemo(() =>
    categorias
      .map(cat => ({
        cat,
        total: pagosFecha.filter(p => p.categoriaPago?.id === cat.id).reduce((s, p) => s + p.monto, 0),
        count: pagosFecha.filter(p => p.categoriaPago?.id === cat.id).length,
      }))
      .filter(x => x.count > 0),
    [pagosFecha, categorias]
  )

  const sinCategoria = useMemo(
    () => pagosFecha.filter(p => !p.categoriaPago).reduce((s, p) => s + p.monto, 0),
    [pagosFecha]
  )

  const porMes = useMemo<MesStat[]>(() => {
    const map: Record<string, number> = {}
    pagosFecha.forEach(p => {
      if (!p.fecha) return
      const [y, m] = p.fecha.split("-")
      const key    = `${y}-${m}`
      const label  = `${MESES_ABREV[Number(m) - 1]} ${y}`
      map[key] = (map[key] ?? 0) + p.monto
      if (!map[`${key}_label`]) map[`${key}_label`] = label as unknown as number
    })
    return Object.keys(map)
      .filter(k => !k.endsWith("_label"))
      .sort()
      .map(key => ({ key, mes: String(map[`${key}_label`] ?? key), total: map[key]! }))
  }, [pagosFecha])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleEstado(p: PagoTrabajoType, estado: EstadoPago) {
    await updatePagoTrabajo(p.documentId, { estado })
    setPagos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, estado } : x))
  }

  async function handleCategoria(p: PagoTrabajoType, catId: number | "") {
    const payload = catId
      ? { categoriaPago: { connect: [{ id: catId }] } }
      : { categoriaPago: { disconnect: [] } }
    await updatePagoTrabajo(p.documentId, payload)
    const cat = categorias.find(c => c.id === catId) ?? null
    setPagos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, categoriaPago: cat } : x))
  }

  async function handleDelete(p: PagoTrabajoType) {
    await deletePagoTrabajo(p.documentId)
    setPagos(prev => prev.filter(x => x.documentId !== p.documentId))
  }

  async function handleSave() {
    setFormMode(null)
    await refetch()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || loadingCats) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",     value: resumen.total,     color: "text-slate-200"   },
          { label: "Pagado",    value: resumen.pagado,    color: "text-emerald-400" },
          { label: "Pendiente", value: resumen.pendiente, color: "text-amber-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* ── Toggle métricas ── */}
      <button type="button" onClick={() => setShowMetricas(v => !v)}
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          showMetricas
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
        }`}>
        <BarChart2 className="h-3.5 w-3.5" />
        {showMetricas ? "Ocultar métricas" : "Ver métricas"}
      </button>

      {/* ── Panel de métricas ── */}
      <AnimatePresence>
        {showMetricas && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <MetricasPanel porCategoria={porCategoria} porMes={porMes} sinCategoria={sinCategoria} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desglose por categoría (pills filtro) ── */}
      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {porCategoria.map(({ cat, total, count }) => (
            <button key={cat.documentId} type="button"
              onClick={() => setFiltroCatId(filtroCatId === cat.id ? null : cat.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                filtroCatId === cat.id
                  ? `${catColor(cat.id)} border-current`
                  : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60"
              }`}>
              <div>
                <p className={`text-[11px] font-semibold ${filtroCatId === cat.id ? "" : "text-slate-300"}`}>{cat.nombre}</p>
                <p className="text-[10px] text-slate-500">{count} pago{count !== 1 ? "s" : ""}</p>
              </div>
              <p className={`text-sm font-bold tabular-nums ${filtroCatId === cat.id ? "" : "text-slate-300"}`}>{fmt(total)}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Gestionar categorías ── */}
      <div>
        <button type="button" onClick={() => setShowGestion(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <Settings2 className="h-3.5 w-3.5" />
          {showGestion ? "Ocultar" : "Gestionar categorías"}
        </button>
        <AnimatePresence>
          {showGestion && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
              <GestionCategorias categorias={categorias} onRefetch={refetchCats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filtros + búsqueda + acción ── */}
      <div className="flex flex-col gap-3">

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto o proveedor…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500"
          />
          {busqueda && (
            <button type="button" aria-label="Limpiar búsqueda" onClick={() => setBusqueda("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtro de fechas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          {(["mes","mesAnt","anio","todo"] as const).map(p => {
            const labels = { mes: "Este mes", mesAnt: "Mes anterior", anio: "Este año", todo: "Todo" }
            return (
              <button key={p} type="button" onClick={() => aplicarPreset(p)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  (p === "todo" && !hayFiltroFecha)
                    ? "bg-slate-700/60 border-slate-600 text-slate-200"
                    : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                }`}>
                {labels[p]}
              </button>
            )
          })}

          {/* Separador */}
          <span className="text-slate-700 text-xs">|</span>

          {/* Desde */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-500 shrink-0">De</label>
            <input type="date" title="Fecha desde" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className={`text-xs px-2 py-1 rounded-md border bg-slate-900 text-slate-300 outline-none transition-colors ${
                fechaDesde ? "border-emerald-600/50 text-emerald-300" : "border-slate-700"
              }`} />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-500 shrink-0">Hasta</label>
            <input type="date" title="Fecha hasta" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className={`text-xs px-2 py-1 rounded-md border bg-slate-900 text-slate-300 outline-none transition-colors ${
                fechaHasta ? "border-emerald-600/50 text-emerald-300" : "border-slate-700"
              }`} />
          </div>

          {/* Limpiar fechas */}
          {hayFiltroFecha && (
            <button type="button" onClick={() => aplicarPreset("todo")}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Pills estado + botón nuevo */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(["todos","pendiente","pagado","parcial"] as const).map(f => (
              <button key={f} type="button" onClick={() => setFiltroEst(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filtroEst === f
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {f === "todos"
                  ? `Todos (${pagosFecha.length})`
                  : `${f.charAt(0).toUpperCase() + f.slice(1)} (${pagosFecha.filter(p => p.estado === f).length})`}
              </button>
            ))}
            {filtroCatId !== null && (
              <button type="button" onClick={() => setFiltroCatId(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-500 hover:text-slate-300 flex items-center gap-1">
                <X className="h-3 w-3" /> {categorias.find(c => c.id === filtroCatId)?.nombre}
              </button>
            )}
          </div>
          <button type="button" onClick={() => setFormMode({ type: "create" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" /> Registrar Pago
          </button>
        </div>
      </div>

      {/* ── Formulario crear / editar ── */}
      <AnimatePresence>
        {formMode && (
          <FormPago mode={formMode} categorias={categorias} onSave={handleSave} onCancel={() => setFormMode(null)} />
        )}
      </AnimatePresence>

      {/* ── Tabla ── */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busqueda ? "Sin resultados para esa búsqueda." : "Sin pagos registrados."}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Concepto</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Proveedor</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-3 w-16"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtrados.map(p => (
                  <motion.tr key={p.documentId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="border-b border-slate-800/30 last:border-0 group hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium truncate max-w-[140px]">{p.concepto}</p>
                      {p.descripcion && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{p.descripcion}</p>}
                      {p.notas       && <p className="text-[10px] text-slate-600 truncate max-w-[140px] italic">{p.notas}</p>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <select title="Categoría del pago"
                        value={p.categoriaPago?.id ?? ""}
                        onChange={e => handleCategoria(p, e.target.value ? Number(e.target.value) : "")}
                        className={`text-[10px] px-2 py-1 rounded-full border font-medium cursor-pointer bg-transparent transition-colors ${
                          p.categoriaPago ? catColor(p.categoriaPago.id) : "text-slate-500 border-slate-700"
                        }`}>
                        <option value="">Sin categoría</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-slate-400 text-xs truncate">{p.proveedor ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.fecha ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-200 tabular-nums">{fmt(p.monto)}</td>
                    <td className="px-4 py-3 text-center">
                      <select title="Estado del pago" value={p.estado}
                        onChange={e => handleEstado(p, e.target.value as EstadoPago)}
                        className={`text-[10px] px-2 py-1 rounded-full border font-medium bg-transparent cursor-pointer ${ESTADO_BADGE[p.estado]}`}>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="parcial">Parcial</option>
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" aria-label="Editar pago"
                          onClick={() => setFormMode({ type: "edit", pago: p })}
                          className="text-slate-500 hover:text-emerald-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" aria-label="Eliminar pago"
                          onClick={() => handleDelete(p)}
                          className="text-slate-600 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
