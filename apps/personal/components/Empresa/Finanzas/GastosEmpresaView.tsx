"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X, Loader2, Wallet, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { updateTransaccion } from "@/api/transaccion/updateTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { TransaccionType, TransaccionPayload } from "@/types/transaccion"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null ? `$${Math.round(n).toLocaleString("es-MX")}` : "—"

const fmtFecha = (iso: string | null) =>
  iso ? new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }) : "—"

const fmtK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${Math.round(n / 1_000)}k`
  : `$${Math.round(n)}`

function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
function ymdToDate(s: string): Date | null { return s ? new Date(`${s}T00:00:00Z`) : null }

// Un solo acento (violeta) en distintas opacidades — sin arcoíris de categorías.
const VIOLET_SHADES = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9", "#ddd6fe", "#5b21b6", "#a78bfa"]
function shadeDe(idx: number): string { return VIOLET_SHADES[idx % VIOLET_SHADES.length] }

function emptyForm(): TransaccionPayload {
  return {
    descripcion: "", tipo: "gasto", monto: 0,
    fecha: `${toYMD(new Date())}T12:00:00`,
    categoria: null, cuentaOrigen: null, proveedor: null, factura: null, notas: null, ambito: "empresa",
  }
}

const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
const pill = (active: boolean) => `h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
  active ? "bg-violet-500 text-white border-violet-500" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
}`

const TOOLTIP_STYLE = {
  background: "#0f172a", border: "1px solid #334155",
  borderRadius: "8px", fontSize: "12px", color: "#e2e8f0",
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GastosEmpresaView({ ambito = "empresa" }: { ambito?: "trabajo" | "empresa" }) {
  const { transacciones: raw, setTransacciones: setTx, loading } = useGetTransacciones(ambito)
  const { categorias } = useGetCategorias(ambito)
  const { cuentas } = useGetCuentas(ambito)
  const categoriasGasto = useMemo(() => categorias.filter(c => c.tipo === "gasto" && c.activa), [categorias])
  const cuentasDisponibles = useMemo(() => cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito"), [cuentas])

  const gastos = useMemo(() => raw.filter(t => t.tipo === "gasto"), [raw])

  const [tab,       setTab]       = useState<"tabla" | "metricas">("tabla")
  const [search,    setSearch]    = useState("")
  const [filtCat,   setFiltCat]   = useState<string>("")
  const [periodo,   setPeriodo]   = useState<"mes" | "trimestre" | "año" | "todo">("mes")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<TransaccionType | null>(null)
  const [form,      setForm]      = useState<TransaccionPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)
  const cerrarSiVacio = useModalBackdropClose(form, () => setModalOpen(false), editing?.documentId)

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
        const matchSearch = !search || g.descripcion.toLowerCase().includes(search.toLowerCase())
          || (g.proveedor ?? "").toLowerCase().includes(search.toLowerCase())
        const matchCat    = !filtCat || g.categoria === filtCat
        const matchPeriodo = periodo === "todo" || (
          g.fecha ? new Date(g.fecha).getTime() >= corteMs : true
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
      .map(([cat, total], i) => ({ cat, total: Math.round(total), color: shadeDe(i) }))
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
  function openEditar(g: TransaccionType) {
    setEditing(g)
    setForm({
      descripcion: g.descripcion, tipo: "gasto", monto: g.monto, fecha: g.fecha,
      categoria: g.categoria, cuentaOrigen: g.cuentaOrigen?.documentId ?? null,
      proveedor: g.proveedor, factura: g.factura, notas: g.notas, ambito: "empresa",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.cuentaOrigen) { toast.error("Selecciona la cuenta origen"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateTransaccion(editing.documentId, form)
        setTx(prev => prev.map(g => g.documentId === updated.documentId ? updated : g))
        toast.success("Gasto actualizado")
      } else {
        const nuevo = await createTransaccion(form)
        setTx(prev => [nuevo, ...prev])
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
      await deleteTransaccion(documentId)
      setTx(prev => prev.filter(g => g.documentId !== documentId))
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
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total filtrado",   value: fmt(totalFiltrado),  destacado: true },
          { label: "Este mes",         value: fmt(totalEsteMes),   destacado: false },
          { label: "Historial total",  value: fmt(totalHistorico), destacado: false },
          { label: "Registros",        value: String(gastos.length), destacado: false },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.destacado ? "text-violet-600 dark:text-violet-400" : "text-slate-900 dark:text-slate-100"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {([["tabla", "Registros"], ["metricas", "Métricas"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)} className={pill(tab === key)}>
              <span className="flex items-center gap-1.5">{key === "metricas" && <BarChart2 size={13} />}{label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
          <Plus size={15} /> Nuevo gasto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar concepto o proveedor…" value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${fieldCls} h-9 pl-9`} />
        </div>
        <div className="w-52">
          <DropdownPicker label="Categoría" value={filtCat} onChange={setFiltCat} placeholder="Todas las categorías"
            options={[{ value: "", label: "Todas las categorías" }, ...categoriasGasto.map(c => ({ value: c.nombre, label: c.nombre }))]} />
        </div>
        <div className="flex gap-1">
          {periodoOpts.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setPeriodo(key)} className={pill(periodo === key)}>{label}</button>
          ))}
        </div>
      </div>

      {/* ═══ TABLA ════════════════════════════════════════════════════════════ */}
      {tab === "tabla" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  {["Fecha", "Categoría", "Concepto", "Cuenta", "Proveedor", "Monto", ""].map(h => (
                    <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" /></td>
                  ))}</tr>
                ))}
                {!loading && filtrados.map(g => (
                  <tr key={g.documentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => delId !== g.documentId && openEditar(g)}>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{fmtFecha(g.fecha)}</td>
                    <td className="px-4 py-3">
                      {g.categoria && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          {g.categoria}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">{g.descripcion}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-[140px] truncate">{g.cuentaOrigen?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-[140px] truncate">{g.proveedor ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold tabular-nums whitespace-nowrap">{fmt(g.monto)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {delId === g.documentId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(g.documentId)} className="text-[11px] text-red-500 hover:text-red-400 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-400 hover:text-slate-600">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" title="Eliminar" onClick={() => setDelId(g.documentId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
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
              <div className="py-14 text-center text-slate-400 dark:text-slate-600">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Gasto mensual — historial completo</h3>
            {porMes.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porMes} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [fmt(v), "Gasto"]} />
                  <Bar dataKey="total" name="Gasto" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Por categoría + Top proveedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Donut categoría */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Por categoría</h3>
              {porCategoria.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Sin datos</p>
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
                        <span className="text-slate-500 dark:text-slate-400 flex-1 truncate" title={d.cat}>{d.cat}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0">{fmtK(d.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Top proveedores */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Top proveedores</h3>
              {topProveedores.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Sin datos</p>
              ) : (
                <div className="space-y-2.5">
                  {topProveedores.map(p => (
                    <div key={p.prov} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-36 shrink-0" title={p.prov}>{p.prov}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${Math.round(p.total / maxProv * 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium shrink-0 w-16 text-right">{fmtK(p.total)}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editing ? "Editar gasto" : "Nuevo gasto"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Categoría */}
              <div>
                <label className={labelCls}>Categoría</label>
                <DropdownPicker label="Categoría" value={form.categoria ?? ""} onChange={v => setForm(f => ({ ...f, categoria: v || null }))}
                  placeholder="Sin categoría" options={[{ value: "", label: "Sin categoría" }, ...categoriasGasto.map(c => ({ value: c.nombre, label: c.nombre }))]} />
              </div>
              {/* Concepto */}
              <div>
                <label className={labelCls}>Concepto <span className="text-violet-500">*</span></label>
                <input type="text" placeholder="Ej. Boost de publicación Instagram" value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={fieldCls} />
              </div>
              {/* Cuenta origen */}
              <div>
                <label className={labelCls}>Cuenta origen <span className="text-violet-500">*</span></label>
                <DropdownPicker label="Cuenta origen" value={form.cuentaOrigen ? String(form.cuentaOrigen) : ""} onChange={v => setForm(f => ({ ...f, cuentaOrigen: v || null }))}
                  placeholder="— Seleccionar —" options={cuentasDisponibles.map(c => ({ value: c.documentId, label: c.nombre }))} />
              </div>
              {/* Proveedor + Factura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Proveedor</label>
                  <input type="text" placeholder="Ej. Google México" value={form.proveedor ?? ""}
                    onChange={e => setForm(f => ({ ...f, proveedor: e.target.value || null }))} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Factura</label>
                  <input type="text" placeholder="FCP-12345" value={form.factura ?? ""}
                    onChange={e => setForm(f => ({ ...f, factura: e.target.value || null }))} className={fieldCls} />
                </div>
              </div>
              {/* Monto + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Monto ($)</label>
                  <input type="number" placeholder="0" value={form.monto ?? ""}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value ? Number(e.target.value) : 0 }))} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Fecha</label>
                  <CalendarioPicker value={form.fecha ? ymdToDate(form.fecha.slice(0, 10)) : null} label="Fecha" className="w-full"
                    onChange={d => setForm(f => ({ ...f, fecha: `${toYMD(d)}T12:00:00` }))} />
                </div>
              </div>
              {/* Notas */}
              <div>
                <label className={labelCls}>Notas</label>
                <input type="text" placeholder="Descripción adicional…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className={fieldCls} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition">
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
