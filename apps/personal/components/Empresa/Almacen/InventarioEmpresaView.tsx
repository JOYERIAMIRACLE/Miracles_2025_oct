"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X, Pencil, Loader2, Package, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useGetInventario, createInventario, updateInventario, deleteInventario, patchStock } from "@/api/inventarioEmpresa/getInventario"
import { InventarioType } from "@/types/inventario"

const fmt    = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const margen = (costo: number | null, precio: number | null) => {
  if (!costo || !precio || costo === 0) return null
  return Math.round(((precio - costo) / precio) * 100)
}

type FormData = {
  nombre:          string
  sku:             string
  descripcion:     string
  costoProduccion: string
  precioVenta:     string
  stock:           string
  material:        "producto" | "servicio" | ""
}

const emptyForm = (): FormData => ({
  nombre: "", sku: "", descripcion: "", costoProduccion: "", precioVenta: "", stock: "0", material: "producto",
})

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"

export function InventarioEmpresaView() {
  const { items, setItems, loading } = useGetInventario()

  const [search,    setSearch]    = useState("")
  const [filtroMat, setFiltroMat] = useState<"todos" | "producto" | "servicio">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<InventarioType | null>(null)
  const [form,      setForm]      = useState<FormData>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const filtrados = useMemo(() => {
    return items.filter(it => {
      const matchSearch = !search ||
        it.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (it.sku ?? "").toLowerCase().includes(search.toLowerCase())
      const matchMat = filtroMat === "todos" || it.material === filtroMat
      return matchSearch && matchMat
    })
  }, [items, search, filtroMat])

  const kpis = useMemo(() => ({
    total:      items.length,
    stockTotal: items.reduce((s, i) => s + (i.stock ?? 0), 0),
    valorCosto: items.reduce((s, i) => s + ((i.stock ?? 0) * (i.costoProduccion ?? 0)), 0),
    valorVenta: items.reduce((s, i) => s + ((i.stock ?? 0) * (i.precioVenta ?? 0)), 0),
    stockBajo:  items.filter(i => (i.stock ?? 0) <= 2 && i.material === "producto").length,
  }), [items])

  function openNuevo() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEditar(it: InventarioType) {
    setEditing(it)
    setForm({
      nombre:          it.nombre,
      sku:             it.sku ?? "",
      descripcion:     it.descripcion ?? "",
      costoProduccion: it.costoProduccion != null ? String(it.costoProduccion) : "",
      precioVenta:     it.precioVenta != null ? String(it.precioVenta) : "",
      stock:           String(it.stock ?? 0),
      material:        it.material ?? "producto",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        nombre:          form.nombre.trim(),
        sku:             form.sku.trim() || null,
        descripcion:     form.descripcion.trim() || null,
        costoProduccion: form.costoProduccion ? Number(form.costoProduccion) : null,
        precioVenta:     form.precioVenta ? Number(form.precioVenta) : null,
        stock:           Number(form.stock) || 0,
        material:        form.material || null,
      }
      if (editing) {
        const updated = await updateInventario(editing.documentId, payload as any)
        setItems(prev => prev.map(i => i.documentId === updated.documentId ? updated : i))
        toast.success("Producto actualizado")
      } else {
        const nuevo = await createInventario(payload as any)
        setItems(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Producto creado")
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
      await deleteInventario(documentId)
      setItems(prev => prev.filter(i => i.documentId !== documentId))
      toast.success("Producto eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  async function handleStock(it: InventarioType, delta: number) {
    const nuevo = Math.max(0, (it.stock ?? 0) + delta)
    try {
      await patchStock(it.documentId, nuevo)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, stock: nuevo } : i))
    } catch {
      toast.error("Error actualizando stock")
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Productos",     value: kpis.total,                 color: "text-slate-200" },
          { label: "Stock total",   value: kpis.stockTotal,            color: "text-slate-200" },
          { label: "Valor costo",   value: fmt(kpis.valorCosto),       color: "text-amber-400" },
          { label: "Valor venta",   value: fmt(kpis.valorVenta),       color: "text-emerald-400" },
          { label: "Stock bajo",    value: kpis.stockBajo,             color: kpis.stockBajo > 0 ? "text-red-400" : "text-slate-500" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-lg font-bold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar por nombre o SKU…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
        </div>
        <div className="flex gap-1">
          {(["todos", "producto", "servicio"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltroMat(f)}
              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                filtroMat === f
                  ? "bg-slate-700 text-slate-100 border-slate-600"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {f === "todos" ? "Todos" : f === "producto" ? "Productos" : "Servicios"}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Nombre / SKU", "Tipo", "Costo", "Precio venta", "Margen", "Stock", ""].map(h => (
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
              {!loading && filtrados.map(it => {
                const m = margen(it.costoProduccion, it.precioVenta)
                const bajo = (it.stock ?? 0) <= 2 && it.material === "producto"
                return (
                  <tr key={it.documentId} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {bajo && <AlertTriangle size={12} className="text-red-400 shrink-0" title="Stock bajo" />}
                        <div>
                          <p className="font-medium text-slate-200">{it.nombre}</p>
                          {it.sku && <p className="text-[10px] text-slate-500">{it.sku}</p>}
                          {it.descripcion && (
                            <p className="text-[10px] text-slate-600 max-w-[200px] truncate mt-0.5" title={it.descripcion}>
                              {it.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                        it.material === "producto"
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                          : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                      }`}>
                        {it.material === "producto" ? "Producto" : it.material === "servicio" ? "Servicio" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{fmt(it.costoProduccion)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium tabular-nums">{fmt(it.precioVenta)}</td>
                    <td className="px-4 py-3">
                      {m != null ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${m >= 40 ? "text-emerald-400" : m >= 20 ? "text-amber-400" : "text-red-400"}`}>
                          <TrendingUp size={11} /> {m}%
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleStock(it, -1)}
                          className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors">
                          −
                        </button>
                        <span className={`w-7 text-center font-bold tabular-nums text-sm ${bajo ? "text-red-400" : "text-slate-200"}`}>
                          {it.stock ?? 0}
                        </span>
                        <button type="button" onClick={() => handleStock(it, +1)}
                          className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors">
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {delId === it.documentId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(it.documentId)}
                            className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)}
                            className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => openEditar(it)}
                            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                            <Pencil size={13} />
                          </button>
                          <button type="button" onClick={() => setDelId(it.documentId)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filtrados.length === 0 && (
            <div className="py-14 text-center text-slate-600">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search || filtroMat !== "todos" ? "Sin resultados." : "Sin productos registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar producto" : "Nuevo producto"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Anillo solitario oro 14k" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                <textarea placeholder="Material, medidas, características…" value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={2} className={inp + " resize-none h-auto py-2"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">SKU</label>
                  <input type="text" placeholder="Ej. ANI-001" value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select title="Tipo" value={form.material}
                    onChange={e => setForm(f => ({ ...f, material: e.target.value as "producto" | "servicio" }))}
                    className={inp + " cursor-pointer"}>
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Costo producción ($)</label>
                  <input type="number" placeholder="0" value={form.costoProduccion}
                    onChange={e => setForm(f => ({ ...f, costoProduccion: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Precio venta ($)</label>
                  <input type="number" placeholder="0" value={form.precioVenta}
                    onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Stock inicial</label>
                <input type="number" min={0} value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
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
