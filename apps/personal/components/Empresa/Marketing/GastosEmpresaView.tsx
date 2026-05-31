"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X, Pencil, Loader2, Wallet, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { useGetGastos }  from "@/api/gasto/getGastos"
import { createGasto }   from "@/api/gasto/createGasto"
import { updateGasto }   from "@/api/gasto/updateGasto"
import { deleteGasto }   from "@/api/gasto/deleteGasto"
import { GastoType, GastoPayload, AmbitoGasto, CategoriaGasto, CATEGORIAS, CATEGORIA_COLOR } from "@/types/gasto"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null ? `$${Math.round(n).toLocaleString("es-MX")}` : "—"

const fmtFecha = (iso: string | null) =>
  iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }) : "—"

const fmtK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${Math.round(n / 1_000)}k`
  : `$${Math.round(n)}`

function emptyForm(): GastoPayload {
  return {
    concepto: "", monto: null,
    fecha: new Date().toISOString().split("T")[0],
    categoria: null, proveedor: null, factura: null, notas: null,
  }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
const sel = `${inp} appearance-none`

const TOOLTIP_STYLE = {
  background: "#0f172a", border: "1px solid #1e293b",
  borderRadius: "8px", fontSize: "12px", color: "#94a3b8",
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GastosEmpresaView({ ambito = "trabajo" }: { ambito?: AmbitoGasto }) {
  const { gastos: raw, loading } = useGetGastos(ambito)

  const [gastos,    setGastos]    = useState<GastoType[]>([])
  const [tab,       setTab]       = useState<"tabla" | "metricas">("tabla")
  const [search,    setSearch]    = useState("")
  const [filtCat,   setFiltCat]   = useState<CategoriaGasto | "todas">("todas")
  const [periodo,   setPeriodo]   = useState<"mes" | "trimestre" | "año" | "todo">("mes")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<GastoType | null>(null)
  const [form,      setForm]      = useState<GastoPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  useMemo(() => {
    const data = raw ?? []
    const filtered = ambito === "empresa"
      ? data.filter(g => g.ambito === "empresa")
      : data.filter(g => g.ambito === "trabajo" || g.ambito == null)
    setGastos(filtered)
  }, [raw, ambito])

  const hoy    = new Date()
  const mesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  // ── Filtrado ────────────────────────────────────────────────────────────────

  const filtrados = useMemo(() => {
    const corte = new Date(hoy)
    if (periodo === "mes")      corte.setDate(1)
    else if (periodo === "trimestre") corte.setMonth(corte.getMonth() - 3)
    else if (periodo === "año") corte.setFullYear(corte.getFullYear() - 1)
    const corteMs = periodo === "todo" ? 0 : corte.getTime()

    return gastos
      .filter(g => {
        const matchSearch = !search || g.concepto.toLowerCase().includes(search.toLowerCase())
          || (g.proveedor ?? "").toLowerCase().includes(search.toLowerCase())
        const matchCat    = filtCat === "todas" || g.categoria === filtCat
        const matchPeriodo = periodo === "todo" || (
          g.fecha ? new Date(g.fecha + "T12:00:00").getTime() >= corteMs : true
        )
        return matchSearch && matchCat && matchPeriodo
      })
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
  }, [gastos, search, filtCat, periodo, hoy])

  const totalFiltrado  = filtrados.reduce((s, g) => s + (g.monto ?? 0), 0)
  const totalEsteMes   = gastos.filter(g => g.fecha?.startsWith(mesStr)).reduce((s, g) => s + (g.monto ?? 0), 0)
  const totalHistorico = gastos.reduce((s, g) => s + (g.monto ?? 0), 0)

  // ── Datos para gráficas ──────────────────────────────────────────────────────

  const porMes = useMemo(() => {
    const map = new Map<string, number>()
    gastos.forEach(g => {
      if (!g.fecha) return
      const key = g.fecha.slice(0, 7)
      map.set(key, (map.get(key) ?? 0) + (g.monto ?? 0))
    })
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => {
        const [y, m] = mes.split("-")
        const label = new Date(Number(y), Number(m) - 1, 1)
          .toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
        return { mes: label, mesKey: mes, total: Math.round(total) }
      })
  }, [gastos])

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>()
    filtrados.forEach(g => {
      const key = g.categoria ?? "(Sin categoría)"
      map.set(key, (map.get(key) ?? 0) + (g.monto ?? 0))
    })
    return [...map.entries()]
      .map(([cat, total]) => ({
        cat,
        total: Math.round(total),
        color: CATEGORIA_COLOR[cat as CategoriaGasto] ?? "#64748b",
      }))
      .sort((a, b) => b.total - a.total)
  }, [filtrados])

  const topProveedores = useMemo(() => {
    const map = new Map<string, number>()
    filtrados.forEach(g => {
      const key = g.proveedor?.trim() || "(Sin proveedor)"
      map.set(key, (map.get(key) ?? 0) + (g.monto ?? 0))
    })
    return [...map.entries()]
      .map(([prov, total]) => ({ prov, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [filtrados])

  const maxProv = topProveedores[0]?.total ?? 1

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(g: GastoType) {
    setEditing(g)
    setForm({ concepto: g.concepto, monto: g.monto, fecha: g.fecha, categoria: g.categoria, proveedor: g.proveedor, factura: g.factura, notas: g.notas })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateGasto(editing.documentId, form)
        setGastos(prev => prev.map(g => g.documentId === updated.documentId ? updated : g))
        toast.success("Gasto actualizado")
      } else {
        const nuevo = await createGasto({ ...form, ambito })
        setGastos(prev => [nuevo, ...prev])
        toast.success("Gasto registrado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteGasto(documentId)
      setGastos(prev => prev.filter(g => g.documentId !== documentId))
      toast.success("Gasto eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const periodoOpts: { key: typeof periodo; label: string }[] = [
    { key: "mes",       label: "Este mes" },
    { key: "trimestre", label: "3 meses" },
    { key: "año",       label: "12 meses" },
    { key: "todo",      label: "Historial" },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total filtrado",   value: fmt(totalFiltrado),  color: "text-red-400" },
          { label: "Este mes",         value: fmt(totalEsteMes),   color: "text-amber-400" },
          { label: "Historial total",  value: fmt(totalHistorico), color: "text-slate-200" },
          { label: "Registros",        value: gastos.length,       color: "text-blue-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {([["tabla", "Registros"], ["metricas", "Métricas"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                tab === key ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {key === "metricas" && <BarChart2 size={13} />}
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
          <Plus size={15} /> Nuevo gasto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar concepto o proveedor…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={filtCat} onChange={e => setFiltCat(e.target.value as CategoriaGasto | "todas")}
          title="Filtrar por categoría"
          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-300 focus:outline-none">
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1">
          {periodoOpts.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setPeriodo(key)}
              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                periodo === key ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TABLA ════════════════════════════════════════════════════════════ */}
      {tab === "tabla" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr>
                  {["Fecha", "Categoría", "Concepto", "Proveedor", "Notas", "Monto", ""].map(h => (
                    <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
                  ))}</tr>
                ))}
                {!loading && filtrados.map(g => (
                  <tr key={g.documentId} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{fmtFecha(g.fecha)}</td>
                    <td className="px-4 py-3">
                      {g.categoria && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{ backgroundColor: `${CATEGORIA_COLOR[g.categoria]}20`, color: CATEGORIA_COLOR[g.categoria], border: `1px solid ${CATEGORIA_COLOR[g.categoria]}40` }}>
                          {g.categoria}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{g.concepto}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{g.proveedor ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{g.notas ?? "—"}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold tabular-nums whitespace-nowrap">{fmt(g.monto)}</td>
                    <td className="px-4 py-3">
                      {delId === g.documentId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(g.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" title="Editar" onClick={() => openEditar(g)} className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                            <Pencil size={13} />
                          </button>
                          <button type="button" title="Eliminar" onClick={() => setDelId(g.documentId)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtrados.length === 0 && (
              <div className="py-14 text-center text-slate-600">
                <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{search ? "Sin resultados." : "Sin gastos registrados."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MÉTRICAS ══════════════════════════════════════════════════════════ */}
      {tab === "metricas" && (
        <div className="space-y-5">

          {/* Tendencia mensual */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Gasto mensual — historial completo</h3>
            {porMes.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porMes} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [fmt(v), "Gasto"]} />
                  <Bar dataKey="total" name="Gasto" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Por categoría + Top proveedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Donut categoría */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Por categoría</h3>
              {porCategoria.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Sin datos</p>
              ) : (
                <div className="flex items-center gap-5">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={porCategoria} dataKey="total" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                        {porCategoria.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [fmt(v), ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="flex-1 space-y-2 overflow-hidden">
                    {porCategoria.map(d => (
                      <li key={d.cat} className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-400 flex-1 truncate" title={d.cat}>{d.cat}</span>
                        <span className="font-medium text-slate-200 shrink-0">{fmtK(d.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Top proveedores */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Top proveedores</h3>
              {topProveedores.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Sin datos</p>
              ) : (
                <div className="space-y-2.5">
                  {topProveedores.map(p => (
                    <div key={p.prov} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 truncate w-36 shrink-0" title={p.prov}>{p.prov}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.round(p.total / maxProv * 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-300 font-medium shrink-0 w-16 text-right">{fmtK(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ═════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar gasto" : "Nuevo gasto"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Categoría */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                <select title="Categoría" value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || null) as CategoriaGasto | null }))} className={sel}>
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Concepto */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Boost de publicación Instagram" value={form.concepto}
                  onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inp} />
              </div>
              {/* Proveedor + Factura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Proveedor</label>
                  <input type="text" placeholder="Ej. Google México" value={form.proveedor ?? ""}
                    onChange={e => setForm(f => ({ ...f, proveedor: e.target.value || null }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Factura</label>
                  <input type="text" placeholder="FCP-12345" value={form.factura ?? ""}
                    onChange={e => setForm(f => ({ ...f, factura: e.target.value || null }))} className={inp} />
                </div>
              </div>
              {/* Monto + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($)</label>
                  <input type="number" placeholder="0" value={form.monto ?? ""}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value ? Number(e.target.value) : null }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={form.fecha ?? ""}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value || null }))} className={inp} />
                </div>
              </div>
              {/* Notas */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <input type="text" placeholder="Descripción adicional…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
