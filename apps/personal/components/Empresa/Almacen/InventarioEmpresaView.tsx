"use client"

import { useState, useMemo, useRef } from "react"
import { Plus, Search, X, Pencil, Loader2, Package, TrendingUp, AlertTriangle, RefreshCw, ImagePlus, Store, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useGetInventario, createInventario, updateInventario, deleteInventario, patchStock, uploadFoto, publishToTienda } from "@/api/inventarioEmpresa/getInventario"
import { InventarioType, CATEGORIAS_JOYA, MATERIALES_JOYA, CategoriaJoya, MaterialJoya } from "@/types/inventario"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const imgUrl  = (url: string) => url.startsWith("http") ? url : `${BACKEND}${url}`

const fmt    = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const margen = (costo: number | null, precio: number | null) => {
  if (!costo || !precio || costo === 0) return null
  return Math.round(((precio - costo) / precio) * 100)
}

const CAT_ABBR: Record<CategoriaJoya, string> = {
  "Anillos": "ANI", "Cadenas": "CAD", "Esclavas": "ESC", "Dijes": "DIJ",
  "Broqueles": "BRO", "Aretes": "ARE", "Pulsos": "PUL", "Rosarios": "ROS", "Argollas": "ARG",
}
const MAT_ABBR: Record<MaterialJoya, string> = { "Oro 10k": "O10K", "Plata 925": "P925" }

function buildSku(cat: CategoriaJoya | "", mat: MaterialJoya | "", talla: string, allItems: InventarioType[], excludeId?: string): string {
  if (!cat) return ""
  const catCode   = CAT_ABBR[cat]
  const matCode   = mat ? MAT_ABBR[mat] : null
  const tallaCode = talla.trim() ? talla.trim().toUpperCase().replace(/\s+/g, "") : null
  const base      = [catCode, ...(matCode ? [matCode] : [])].join("-")
  const pool      = excludeId ? allItems.filter(i => i.documentId !== excludeId) : allItems
  const count     = pool.filter(i => i.sku?.startsWith(catCode + "-") || i.sku === catCode).length
  return [base, ...(tallaCode ? [tallaCode] : []), String(count + 1).padStart(3, "0")].join("-")
}

const CAT_COLOR: Record<CategoriaJoya, string> = {
  "Anillos":   "bg-violet-500/10 text-violet-300 border-violet-500/20",
  "Cadenas":   "bg-blue-500/10 text-blue-300 border-blue-500/20",
  "Esclavas":  "bg-pink-500/10 text-pink-300 border-pink-500/20",
  "Dijes":     "bg-sky-500/10 text-sky-300 border-sky-500/20",
  "Broqueles": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "Aretes":    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "Pulsos":    "bg-rose-500/10 text-rose-300 border-rose-500/20",
  "Rosarios":  "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "Argollas":  "bg-orange-500/10 text-orange-300 border-orange-500/20",
}

type FormData = {
  nombre: string; sku: string; descripcion: string; figura: string
  categoriaJoya: CategoriaJoya | ""; materialJoya: MaterialJoya | ""
  talla: string; costoProduccion: string; precioVenta: string; stock: string
  material: "producto" | "servicio"
}
const emptyForm = (): FormData => ({
  nombre: "", sku: "", descripcion: "", figura: "", categoriaJoya: "", materialJoya: "",
  talla: "", costoProduccion: "", precioVenta: "", stock: "0", material: "producto",
})
const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"

export function InventarioEmpresaView() {
  const { items, setItems, loading } = useGetInventario()
  const fileRef = useRef<HTMLInputElement>(null)

  const [search,      setSearch]      = useState("")
  const [filtroMat,   setFiltroMat]   = useState<"todos" | "producto" | "servicio">("todos")
  const [filtroCat,   setFiltroCat]   = useState<CategoriaJoya | "todas">("todas")
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editing,     setEditing]     = useState<InventarioType | null>(null)
  const [form,        setForm]        = useState<FormData>(emptyForm())
  const [saving,      setSaving]      = useState(false)
  const [delId,       setDelId]       = useState<string | null>(null)
  const [skuAuto,     setSkuAuto]     = useState(true)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile,    setFotoFile]    = useState<File | null>(null)
  const [publishing,  setPublishing]  = useState<string | null>(null)

  const filtrados = useMemo(() => items.filter(it => {
    const matchSearch = !search || it.nombre.toLowerCase().includes(search.toLowerCase()) || (it.sku ?? "").toLowerCase().includes(search.toLowerCase())
    const matchMat = filtroMat === "todos" || it.material === filtroMat
    const matchCat = filtroCat === "todas" || it.categoriaJoya === filtroCat
    return matchSearch && matchMat && matchCat
  }), [items, search, filtroMat, filtroCat])

  const kpis = useMemo(() => ({
    total:      items.length,
    stockTotal: items.reduce((s, i) => s + (i.stock ?? 0), 0),
    valorCosto: items.reduce((s, i) => s + ((i.stock ?? 0) * (i.costoProduccion ?? 0)), 0),
    valorVenta: items.reduce((s, i) => s + ((i.stock ?? 0) * (i.precioVenta ?? 0)), 0),
    stockBajo:  items.filter(i => (i.stock ?? 0) <= 2 && i.material === "producto").length,
  }), [items])

  function openNuevo() {
    setEditing(null); setForm(emptyForm()); setSkuAuto(true)
    setFotoPreview(null); setFotoFile(null); setModalOpen(true)
  }

  function openEditar(it: InventarioType) {
    setEditing(it); setSkuAuto(false)
    setFotoPreview(it.foto ? imgUrl(it.foto.url) : null)
    setFotoFile(null)
    setForm({
      nombre: it.nombre, sku: it.sku ?? "", descripcion: it.descripcion ?? "",
      figura: it.figura ?? "", categoriaJoya: it.categoriaJoya ?? "",
      materialJoya: it.materialJoya ?? "", talla: it.talla ?? "",
      costoProduccion: it.costoProduccion != null ? String(it.costoProduccion) : "",
      precioVenta: it.precioVenta != null ? String(it.precioVenta) : "",
      stock: String(it.stock ?? 0), material: it.material ?? "producto",
    })
    setModalOpen(true)
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      let fotoId: number | undefined
      if (fotoFile) {
        const uploaded = await uploadFoto(fotoFile)
        fotoId = uploaded.id
      }

      const payload: Record<string, unknown> = {
        nombre: form.nombre.trim(), sku: form.sku.trim() || null,
        descripcion: form.descripcion.trim() || null, figura: form.figura.trim() || null,
        categoriaJoya: (form.categoriaJoya || null) as CategoriaJoya | null,
        materialJoya: (form.materialJoya || null) as MaterialJoya | null,
        talla: form.talla.trim() || null,
        costoProduccion: form.costoProduccion ? Number(form.costoProduccion) : null,
        precioVenta: form.precioVenta ? Number(form.precioVenta) : null,
        stock: Number(form.stock) || 0, material: form.material,
        ...(fotoId ? { foto: fotoId } : {}),
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
    } catch { toast.error("No se pudo eliminar") }
    finally { setDelId(null) }
  }

  async function handleStock(it: InventarioType, delta: number) {
    const nuevo = Math.max(0, (it.stock ?? 0) + delta)
    try {
      await patchStock(it.documentId, nuevo)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, stock: nuevo } : i))
    } catch { toast.error("Error actualizando stock") }
  }

  async function handlePublish(it: InventarioType) {
    setPublishing(it.documentId)
    try {
      await publishToTienda(it)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, publicadoEnTienda: true } : i))
      toast.success(it.publicadoEnTienda ? "Tienda actualizada" : "¡Publicado en tienda!")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al publicar")
    } finally { setPublishing(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "SKUs",        value: kpis.total,           color: "text-slate-200" },
          { label: "Stock total", value: kpis.stockTotal,      color: "text-slate-200" },
          { label: "Valor costo", value: fmt(kpis.valorCosto), color: "text-amber-400" },
          { label: "Valor venta", value: fmt(kpis.valorVenta), color: "text-emerald-400" },
          { label: "Stock bajo",  value: kpis.stockBajo,       color: kpis.stockBajo > 0 ? "text-red-400" : "text-slate-500" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-lg font-bold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar nombre o SKU…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button type="button" onClick={() => setFiltroCat("todas")}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${filtroCat === "todas" ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>Todas</button>
          {CATEGORIAS_JOYA.map(c => (
            <button key={c} type="button" onClick={() => setFiltroCat(prev => prev === c ? "todas" : c)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${filtroCat === c ? `${CAT_COLOR[c]} shadow-sm` : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>{c}</button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["", "Producto / SKU", "Categoría", "Material", "Talla / Figura", "Costo", "P. Venta", "Margen", "Stock", ""].map((h, i) => (
                  <th key={i} className="h-10 px-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 10 }).map((_, j) => (
                  <td key={j} className="px-3 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(it => {
                const m    = margen(it.costoProduccion, it.precioVenta)
                const bajo = (it.stock ?? 0) <= 2 && it.material === "producto"
                const isPublishing = publishing === it.documentId
                return (
                  <tr key={it.documentId} className="hover:bg-slate-800/40 transition-colors group">

                    {/* Thumbnail */}
                    <td className="px-2 py-2 w-10">
                      {it.foto ? (
                        <img src={imgUrl(it.foto.url)} alt={it.nombre}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600">
                          <Package size={13} />
                        </div>
                      )}
                    </td>

                    {/* Nombre / SKU */}
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-1.5">
                        {bajo && <AlertTriangle size={11} className="text-red-400 shrink-0 mt-0.5" title="Stock bajo" />}
                        <div>
                          <p className="font-medium text-slate-200 leading-snug">{it.nombre}</p>
                          {it.sku && (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {it.sku}
                            </span>
                          )}
                          {it.descripcion && (
                            <p className="text-[10px] text-slate-600 max-w-[160px] truncate mt-0.5" title={it.descripcion}>{it.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-3 py-3">
                      {it.categoriaJoya
                        ? <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${CAT_COLOR[it.categoriaJoya]}`}>{it.categoriaJoya}</span>
                        : <span className="text-slate-700 text-xs">—</span>}
                    </td>

                    {/* Material */}
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{it.materialJoya ?? <span className="text-slate-700">—</span>}</td>

                    {/* Talla / Figura */}
                    <td className="px-3 py-3 text-xs text-slate-400">
                      {it.talla && <span className="block">{it.talla}</span>}
                      {it.figura && <span className="block text-slate-600 italic">{it.figura}</span>}
                      {!it.talla && !it.figura && <span className="text-slate-700">—</span>}
                    </td>

                    {/* Costo */}
                    <td className="px-3 py-3 text-slate-400 tabular-nums text-xs">{fmt(it.costoProduccion)}</td>

                    {/* Precio venta */}
                    <td className="px-3 py-3 text-emerald-400 font-medium tabular-nums text-xs">{fmt(it.precioVenta)}</td>

                    {/* Margen */}
                    <td className="px-3 py-3">
                      {m != null
                        ? <span className={`flex items-center gap-0.5 text-xs font-medium ${m >= 40 ? "text-emerald-400" : m >= 20 ? "text-amber-400" : "text-red-400"}`}>
                            <TrendingUp size={10} /> {m}%
                          </span>
                        : <span className="text-slate-700 text-xs">—</span>}
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handleStock(it, -1)}
                          className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors">−</button>
                        <span className={`w-6 text-center font-bold tabular-nums text-sm ${bajo ? "text-red-400" : "text-slate-200"}`}>{it.stock ?? 0}</span>
                        <button type="button" onClick={() => handleStock(it, +1)}
                          className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors">+</button>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3">
                      {delId === it.documentId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(it.documentId)}
                            className="text-[10px] text-red-400 hover:text-red-300 font-medium px-1">Sí</button>
                          <button type="button" onClick={() => setDelId(null)}
                            className="text-[10px] text-slate-500 px-1">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Publicar en tienda */}
                          <button type="button" onClick={() => handlePublish(it)} disabled={isPublishing}
                            title={it.publicadoEnTienda ? "Actualizar en tienda" : "Publicar en tienda"}
                            className={`p-1.5 rounded transition ${
                              it.publicadoEnTienda
                                ? "text-emerald-500 hover:bg-slate-800"
                                : "text-slate-600 hover:text-violet-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                            }`}>
                            {isPublishing
                              ? <Loader2 size={12} className="animate-spin" />
                              : it.publicadoEnTienda
                                ? <CheckCircle2 size={12} />
                                : <Store size={12} />}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => openEditar(it)} title="Editar"
                              className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                              <Pencil size={12} />
                            </button>
                            <button type="button" onClick={() => setDelId(it.documentId)} title="Eliminar"
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                              <X size={12} />
                            </button>
                          </div>
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
              <p className="text-sm">{search || filtroCat !== "todas" ? "Sin resultados." : "Sin productos registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar producto" : "Dar de alta producto"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

              {/* Foto */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Foto del producto</p>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative shrink-0">
                      <img src={fotoPreview} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
                      <button type="button" title="Quitar foto" onClick={() => { setFotoPreview(null); setFotoFile(null); if (fileRef.current) fileRef.current.value = "" }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center shrink-0">
                      <Package size={22} className="text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                      <ImagePlus size={14} />
                      {fotoPreview ? "Cambiar foto" : "Subir foto"}
                    </button>
                    <p className="text-[10px] text-slate-600 mt-1.5">JPG, PNG, WEBP · Máx. 10 MB</p>
                    <input ref={fileRef} type="file" accept="image/*" title="Foto del producto" className="hidden" onChange={handleFotoChange} />
                  </div>
                </div>
              </div>

              {/* Identificación */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Identificación</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Ej. Cadena cubana pesada" value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} autoFocus />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-400">SKU</label>
                      {skuAuto && form.categoriaJoya
                        ? <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5"><RefreshCw size={9} /> Auto</span>
                        : form.categoriaJoya
                          ? <button type="button" onClick={() => { setSkuAuto(true); setForm(f => ({ ...f, sku: buildSku(f.categoriaJoya, f.materialJoya, f.talla, items, editing?.documentId) })) }}
                              className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                              <RefreshCw size={9} /> Regenerar
                            </button>
                          : null}
                    </div>
                    <input type="text" placeholder="Auto al seleccionar categoría" value={form.sku}
                      onChange={e => { setSkuAuto(false); setForm(f => ({ ...f, sku: e.target.value })) }}
                      className={inp + " font-mono"} />
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
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                    <textarea placeholder="Detalles adicionales, observaciones…" value={form.descripcion}
                      onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      rows={2} className={inp + " resize-none h-auto py-2"} />
                  </div>
                </div>
              </div>

              {/* Atributos */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Atributos de joyería</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                    <select title="Categoría" value={form.categoriaJoya}
                      onChange={e => {
                        const cat = e.target.value as CategoriaJoya | ""
                        setForm(f => ({ ...f, categoriaJoya: cat, sku: skuAuto ? buildSku(cat, f.materialJoya, f.talla, items, editing?.documentId) : f.sku }))
                      }} className={inp + " cursor-pointer"}>
                      <option value="">— Seleccionar —</option>
                      {CATEGORIAS_JOYA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Material</label>
                    <select title="Material" value={form.materialJoya}
                      onChange={e => {
                        const mat = e.target.value as MaterialJoya | ""
                        setForm(f => ({ ...f, materialJoya: mat, sku: skuAuto ? buildSku(f.categoriaJoya, mat, f.talla, items, editing?.documentId) : f.sku }))
                      }} className={inp + " cursor-pointer"}>
                      <option value="">— Seleccionar —</option>
                      {MATERIALES_JOYA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Talla / Medida</label>
                    <input type="text" placeholder="Ej. T6, 45cm" value={form.talla}
                      onChange={e => {
                        const t = e.target.value
                        setForm(f => ({ ...f, talla: t, sku: skuAuto ? buildSku(f.categoriaJoya, f.materialJoya, t, items, editing?.documentId) : f.sku }))
                      }} className={inp} />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estilo / Figura / Tejido</label>
                    <input type="text" placeholder="Ej. Cartier, Figaro, Corazón, Solitario…" value={form.figura}
                      onChange={e => setForm(f => ({ ...f, figura: e.target.value }))} className={inp} />
                  </div>
                </div>
              </div>

              {/* Precios y stock */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Precios y Stock</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Costo ($)</label>
                    <input type="number" placeholder="0" value={form.costoProduccion}
                      onChange={e => setForm(f => ({ ...f, costoProduccion: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Precio venta ($)</label>
                    <input type="number" placeholder="0" value={form.precioVenta}
                      onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Stock inicial</label>
                    <input type="number" min={0} placeholder="0" value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inp} />
                  </div>
                </div>
                {form.costoProduccion && form.precioVenta && (
                  <p className="text-[11px] mt-2 text-slate-500">
                    Margen estimado:{" "}
                    <span className={`font-semibold ${(margen(Number(form.costoProduccion), Number(form.precioVenta)) ?? 0) >= 40 ? "text-emerald-400" : "text-amber-400"}`}>
                      {margen(Number(form.costoProduccion), Number(form.precioVenta)) ?? 0}%
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar cambios" : "Dar de alta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
