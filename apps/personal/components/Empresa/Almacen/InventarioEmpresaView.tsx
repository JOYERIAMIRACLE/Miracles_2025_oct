"use client"

import { useState, useMemo, useRef } from "react"
import { Plus, Search, X, Pencil, Loader2, Package, TrendingUp, AlertTriangle, RefreshCw, ImagePlus, Star, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useGetInventario, createProducto, updateProducto, deleteProducto, patchStock, uploadFoto, publishToTienda, toggleActivoTienda, toggleIsFeatured } from "@/api/inventarioEmpresa/getInventario"
import { ProductType, CATEGORIAS_JOYA, MATERIALES, CategoriaJoya, MaterialProducto, MaterialItem } from "@/types/product"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const imgUrl  = (url: string) => url.startsWith("http") ? url : `${BACKEND}${url}`

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

const fmt    = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const margen = (costo: number | null, precio: number | null) => {
  if (!costo || !precio || costo === 0) return null
  return Math.round(((precio - costo) / precio) * 100)
}

const CAT_ABBR: Record<CategoriaJoya, string> = {
  "Anillos":"ANI","Cadenas":"CAD","Esclavas":"ESC","Dijes":"DIJ",
  "Broqueles":"BRO","Aretes":"ARE","Pulsos":"PUL","Rosarios":"ROS","Argollas":"ARG",
}
const MAT_ABBR: Record<MaterialProducto, string> = { "Oro 10k":"O10K","Plata 925":"P925" }

function buildSku(cat: CategoriaJoya | "", mat: MaterialProducto | "", talla: string, allItems: ProductType[], excludeId?: string): string {
  if (!cat) return ""
  const catCode   = CAT_ABBR[cat]
  const matCode   = mat ? MAT_ABBR[mat] : null
  const tallaCode = talla.trim() ? talla.trim().toUpperCase().replace(/\s+/g,"") : null
  const pool      = excludeId ? allItems.filter(i => i.documentId !== excludeId) : allItems
  const count     = pool.filter(i => i.sku?.startsWith(catCode+"-") || i.sku === catCode).length
  const base      = [catCode,...(matCode?[matCode]:[])].join("-")
  return [base,...(tallaCode?[tallaCode]:[]),String(count+1).padStart(3,"0")].join("-")
}

const CAT_COLOR: Record<CategoriaJoya, string> = {
  "Anillos":"bg-violet-500/10 text-violet-300 border-violet-500/20",
  "Cadenas":"bg-blue-500/10 text-blue-300 border-blue-500/20",
  "Esclavas":"bg-pink-500/10 text-pink-300 border-pink-500/20",
  "Dijes":"bg-sky-500/10 text-sky-300 border-sky-500/20",
  "Broqueles":"bg-amber-500/10 text-amber-300 border-amber-500/20",
  "Aretes":"bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "Pulsos":"bg-rose-500/10 text-rose-300 border-rose-500/20",
  "Rosarios":"bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "Argollas":"bg-orange-500/10 text-orange-300 border-orange-500/20",
}

type FormData = {
  nombreProducto: string; sku: string; descripcion: string; figura: string
  categoriaJoya: CategoriaJoya | ""; materialProducto: MaterialProducto | ""
  talla: string; costoProduccion: string; costo: string; stock: string
  material: MaterialItem
}
const emptyForm = (): FormData => ({
  nombreProducto:"", sku:"", descripcion:"", figura:"", categoriaJoya:"", materialProducto:"",
  talla:"", costoProduccion:"", costo:"", stock:"0", material:"producto",
})
const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"

export function InventarioEmpresaView() {
  const { items, setItems, loading } = useGetInventario()
  const fileRef = useRef<HTMLInputElement>(null)

  const [search,      setSearch]      = useState("")
  const [filtroCat,   setFiltroCat]   = useState<CategoriaJoya | "todas">("todas")
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editing,     setEditing]     = useState<ProductType | null>(null)
  const [form,        setForm]        = useState<FormData>(emptyForm())
  const [saving,      setSaving]      = useState(false)
  const [delId,       setDelId]       = useState<string | null>(null)
  const [skuAuto,     setSkuAuto]     = useState(true)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile,    setFotoFile]    = useState<File | null>(null)
  const [publishing,  setPublishing]  = useState<string | null>(null)
  const [featuring,   setFeaturing]   = useState<string | null>(null)

  const filtrados = useMemo(() => items.filter(it => {
    const matchSearch = !search || it.nombreProducto.toLowerCase().includes(search.toLowerCase()) || (it.sku ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCat    = filtroCat === "todas" || it.categoriaJoya === filtroCat
    return matchSearch && matchCat
  }), [items, search, filtroCat])

  const kpis = useMemo(() => ({
    total:      items.length,
    stockTotal: items.reduce((s,i) => s+(i.stock??0), 0),
    valorCosto: items.reduce((s,i) => s+((i.stock??0)*(i.costoProduccion??0)), 0),
    valorVenta: items.reduce((s,i) => s+((i.stock??0)*(i.costo??0)), 0),
    stockBajo:  items.filter(i => (i.stock??0)<=2 && i.material==="producto").length,
    enTienda:   items.filter(i => i.activo).length,
  }), [items])

  function openNuevo() {
    setEditing(null); setForm(emptyForm()); setSkuAuto(true)
    setFotoPreview(null); setFotoFile(null); setModalOpen(true)
  }

  function openEditar(it: ProductType) {
    setEditing(it); setSkuAuto(false)
    setFotoPreview(it.imagenes?.[0] ? imgUrl(it.imagenes[0].url) : null)
    setFotoFile(null)
    setForm({
      nombreProducto: it.nombreProducto, sku: it.sku ?? "", descripcion: it.descripcion ?? "",
      figura: it.figura ?? "", categoriaJoya: it.categoriaJoya ?? "",
      materialProducto: it.materialProducto ?? "", talla: it.talla ?? "",
      costoProduccion: it.costoProduccion != null ? String(it.costoProduccion) : "",
      costo: it.costo != null ? String(it.costo) : "",
      stock: String(it.stock ?? 0), material: it.material ?? "producto",
    })
    setModalOpen(true)
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file); setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.nombreProducto.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      let fotoData: { id: number; url: string } | undefined
      if (fotoFile) fotoData = await uploadFoto(fotoFile)

      const needsSlug = !editing || !editing.slug
      const payload: Record<string, unknown> = {
        nombreProducto: form.nombreProducto.trim(),
        sku:            form.sku.trim() || null,
        descripcion:    form.descripcion.trim() || null,
        figura:         form.figura.trim() || null,
        categoriaJoya:  (form.categoriaJoya || null) as CategoriaJoya | null,
        materialProducto: (form.materialProducto || null) as MaterialProducto | null,
        talla:          form.talla.trim() || null,
        costoProduccion: form.costoProduccion ? Number(form.costoProduccion) : null,
        costo:          form.costo ? Number(form.costo) : null,
        stock:          Number(form.stock) || 0,
        material:       form.material,
        ...(needsSlug ? { slug: slugify(form.nombreProducto.trim()) } : {}),
        ...(fotoData ? { imagenes: [fotoData.id] } : {}),
      }

      if (editing) {
        const updated = await updateProducto(editing.documentId, payload)
        const merged: ProductType = {
          ...editing, ...updated,
          slug: updated.slug ?? editing.slug ?? slugify(form.nombreProducto.trim()),
          imagenes: fotoData
            ? [{ id: fotoData.id, url: fotoData.url, alternativeText: null }, ...(editing.imagenes ?? []).slice(1)]
            : editing.imagenes ?? [],
          categoria: editing.categoria,
        }
        setItems(prev => prev.map(i => i.documentId === merged.documentId ? merged : i))
        toast.success("Producto actualizado")
      } else {
        const nuevo = await createProducto(payload as any)
        const withFoto: ProductType = {
          ...nuevo,
          imagenes: fotoData ? [{ id: fotoData.id, url: fotoData.url, alternativeText: null }] : [],
        }
        setItems(prev => [...prev, withFoto].sort((a,b) => a.nombreProducto.localeCompare(b.nombreProducto)))
        toast.success("Producto creado")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar")
    } finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteProducto(documentId)
      setItems(prev => prev.filter(i => i.documentId !== documentId))
      toast.success("Eliminado")
    } catch { toast.error("No se pudo eliminar") }
    finally { setDelId(null) }
  }

  async function handleStock(it: ProductType, delta: number) {
    const nuevo = Math.max(0, (it.stock ?? 0) + delta)
    try {
      await patchStock(it.documentId, nuevo)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, stock: nuevo } : i))
    } catch { toast.error("Error actualizando stock") }
  }

  async function handlePublish(it: ProductType) {
    setPublishing(it.documentId)
    try {
      await publishToTienda(it)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, activo: true } : i))
      toast.success(it.activo ? "Tienda actualizada" : "¡Visible en tienda!")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al publicar")
    } finally { setPublishing(null) }
  }

  async function handleToggleActivo(it: ProductType) {
    const nuevoActivo = !it.activo
    setPublishing(it.documentId)
    try {
      await toggleActivoTienda(it.documentId, nuevoActivo)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, activo: nuevoActivo } : i))
      toast.success(nuevoActivo ? "Visible en tienda" : "Oculto de tienda")
    } catch { toast.error("Error al cambiar visibilidad") }
    finally { setPublishing(null) }
  }

  async function handleToggleFeatured(it: ProductType) {
    const nuevo = !it.isFeatured
    setFeaturing(it.documentId)
    try {
      await toggleIsFeatured(it.documentId, nuevo)
      setItems(prev => prev.map(i => i.documentId === it.documentId ? { ...i, isFeatured: nuevo } : i))
      toast.success(nuevo ? "Marcado como destacado" : "Quitado de destacados")
    } catch { toast.error("Error al cambiar destacado") }
    finally { setFeaturing(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label:"SKUs",         value:kpis.total,           color:"text-slate-200" },
          { label:"Stock total",  value:kpis.stockTotal,      color:"text-slate-200" },
          { label:"Valor costo",  value:fmt(kpis.valorCosto), color:"text-amber-400" },
          { label:"Valor venta",  value:fmt(kpis.valorVenta), color:"text-emerald-400" },
          { label:"En tienda",    value:kpis.enTienda,        color:"text-violet-400" },
          { label:"Stock bajo",   value:kpis.stockBajo,       color:kpis.stockBajo>0?"text-red-400":"text-slate-500" },
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
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${filtroCat==="todas"?"bg-slate-700 text-slate-100 border-slate-600":"border-slate-700 text-slate-500 hover:text-slate-300"}`}>Todas</button>
          {CATEGORIAS_JOYA.map(c => (
            <button key={c} type="button" onClick={() => setFiltroCat(prev => prev===c?"todas":c)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${filtroCat===c?`${CAT_COLOR[c]} shadow-sm`:"border-slate-700 text-slate-500 hover:text-slate-300"}`}>{c}</button>
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
                {["","Producto / SKU","Categoría","Material","Talla / Figura","Costo","P. Venta","Margen","Stock","Tienda","⭐",""].map((h,i) => (
                  <th key={i} className="h-10 px-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({length:5}).map((_,i) => (
                <tr key={i}>{Array.from({length:11}).map((_,j) => (
                  <td key={j} className="px-3 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4"/></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(it => {
                const m    = margen(it.costoProduccion, it.costo)
                const bajo = (it.stock??0)<=2 && it.material==="producto"
                const thumb = it.imagenes?.[0]
                const isPublishing = publishing===it.documentId
                const isFeaturing  = featuring===it.documentId
                return (
                  <tr key={it.documentId} className="hover:bg-slate-800/40 transition-colors group">

                    {/* Thumbnail */}
                    <td className="px-2 py-2 w-10">
                      {thumb?.url ? (
                        <img src={imgUrl(thumb.url)} alt={it.nombreProducto}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-700"/>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600">
                          <Package size={13}/>
                        </div>
                      )}
                    </td>

                    {/* Nombre / SKU */}
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-1.5">
                        {bajo && <AlertTriangle size={11} className="text-red-400 shrink-0 mt-0.5" title="Stock bajo"/>}
                        <div>
                          <p className="font-medium text-slate-200 leading-snug">{it.nombreProducto}</p>
                          {it.sku && (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">{it.sku}</span>
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
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{it.materialProducto ?? <span className="text-slate-700">—</span>}</td>

                    {/* Talla / Figura */}
                    <td className="px-3 py-3 text-xs text-slate-400">
                      {it.talla && <span className="block">{it.talla}</span>}
                      {it.figura && <span className="block text-slate-600 italic">{it.figura}</span>}
                      {!it.talla && !it.figura && <span className="text-slate-700">—</span>}
                    </td>

                    {/* Costo */}
                    <td className="px-3 py-3 text-slate-400 tabular-nums text-xs">{fmt(it.costoProduccion)}</td>

                    {/* Precio venta */}
                    <td className="px-3 py-3 text-emerald-400 font-medium tabular-nums text-xs">{fmt(it.costo)}</td>

                    {/* Margen */}
                    <td className="px-3 py-3">
                      {m!=null
                        ? <span className={`flex items-center gap-0.5 text-xs font-medium ${m>=40?"text-emerald-400":m>=20?"text-amber-400":"text-red-400"}`}>
                            <TrendingUp size={10}/> {m}%
                          </span>
                        : <span className="text-slate-700 text-xs">—</span>}
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handleStock(it,-1)}
                          className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors">−</button>
                        <span className={`w-6 text-center font-bold tabular-nums text-sm ${bajo?"text-red-400":"text-slate-200"}`}>{it.stock??0}</span>
                        <button type="button" onClick={() => handleStock(it,+1)}
                          className="h-5 w-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors">+</button>
                      </div>
                    </td>

                    {/* Tienda (visible/oculto) */}
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => it.activo ? handleToggleActivo(it) : handlePublish(it)}
                        disabled={isPublishing}
                        title={it.activo ? "Visible en tienda — clic para ocultar" : "Oculto — clic para publicar"}
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-medium transition-all ${
                          it.activo
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                            : "border-slate-700 text-slate-600 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10"
                        }`}>
                        {isPublishing
                          ? <Loader2 size={10} className="animate-spin"/>
                          : it.activo ? <><Eye size={10}/> Activo</> : <><EyeOff size={10}/> Oculto</>}
                      </button>
                    </td>

                    {/* Destacado */}
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => handleToggleFeatured(it)}
                        disabled={isFeaturing}
                        title={it.isFeatured ? "Destacado — clic para quitar" : "No destacado — clic para marcar"}
                        className={`p-1.5 rounded-lg transition-all ${it.isFeatured ? "text-amber-400 hover:text-amber-300" : "text-slate-700 hover:text-amber-500"}`}>
                        {isFeaturing ? <Loader2 size={14} className="animate-spin"/> : <Star size={14} fill={it.isFeatured ? "currentColor" : "none"}/>}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3">
                      {delId===it.documentId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(it.documentId)}
                            className="text-[10px] text-red-400 hover:text-red-300 font-medium px-1">Sí</button>
                          <button type="button" onClick={() => setDelId(null)}
                            className="text-[10px] text-slate-500 px-1">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => openEditar(it)} title="Editar"
                            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                            <Pencil size={12}/>
                          </button>
                          <button type="button" onClick={() => setDelId(it.documentId)} title="Eliminar"
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                            <X size={12}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filtrados.length===0 && (
            <div className="py-14 text-center text-slate-600">
              <Package size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">{search||filtroCat!=="todas"?"Sin resultados.":"Sin productos registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target===e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing?"Editar producto":"Dar de alta producto"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16}/></button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

              {/* Foto */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Foto del producto</p>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative shrink-0">
                      <img src={fotoPreview} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-slate-700"/>
                      <button type="button" title="Quitar foto"
                        onClick={() => { setFotoPreview(null); setFotoFile(null); if (fileRef.current) fileRef.current.value="" }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                        <X size={10}/>
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center shrink-0">
                      <Package size={22} className="text-slate-600"/>
                    </div>
                  )}
                  <div className="flex-1">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                      <ImagePlus size={14}/> {fotoPreview?"Cambiar foto":"Subir foto"}
                    </button>
                    <p className="text-[10px] text-slate-600 mt-1.5">JPG, PNG, WEBP · Máx. 10 MB</p>
                    <input ref={fileRef} type="file" accept="image/*" title="Foto" className="hidden" onChange={handleFotoChange}/>
                  </div>
                </div>
              </div>

              {/* Identificación */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Identificación</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Ej. Cadena cubana pesada" value={form.nombreProducto}
                      onChange={e => setForm(f => ({...f, nombreProducto:e.target.value}))} className={inp} autoFocus/>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-400">SKU</label>
                      {skuAuto && form.categoriaJoya
                        ? <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5"><RefreshCw size={9}/> Auto</span>
                        : form.categoriaJoya
                          ? <button type="button" onClick={() => { setSkuAuto(true); setForm(f => ({...f, sku:buildSku(f.categoriaJoya, f.materialProducto, f.talla, items, editing?.documentId)})) }}
                              className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                              <RefreshCw size={9}/> Regenerar
                            </button>
                          : null}
                    </div>
                    <input type="text" placeholder="Auto al seleccionar categoría" value={form.sku}
                      onChange={e => { setSkuAuto(false); setForm(f => ({...f, sku:e.target.value})) }}
                      className={inp+" font-mono"}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                    <select title="Tipo" value={form.material}
                      onChange={e => setForm(f => ({...f, material:e.target.value as MaterialItem}))}
                      className={inp+" cursor-pointer"}>
                      <option value="producto">Producto</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                    <textarea placeholder="Detalles, observaciones…" value={form.descripcion}
                      onChange={e => setForm(f => ({...f, descripcion:e.target.value}))}
                      rows={2} className={inp+" resize-none h-auto py-2"}/>
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
                        const cat = e.target.value as CategoriaJoya|""
                        setForm(f => ({...f, categoriaJoya:cat, sku:skuAuto?buildSku(cat,f.materialProducto,f.talla,items,editing?.documentId):f.sku}))
                      }} className={inp+" cursor-pointer"}>
                      <option value="">— Seleccionar —</option>
                      {CATEGORIAS_JOYA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Material</label>
                    <select title="Material" value={form.materialProducto}
                      onChange={e => {
                        const mat = e.target.value as MaterialProducto|""
                        setForm(f => ({...f, materialProducto:mat, sku:skuAuto?buildSku(f.categoriaJoya,mat,f.talla,items,editing?.documentId):f.sku}))
                      }} className={inp+" cursor-pointer"}>
                      <option value="">— Seleccionar —</option>
                      {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Talla / Medida</label>
                    <input type="text" placeholder="Ej. T6, 45cm" value={form.talla}
                      onChange={e => {
                        const t = e.target.value
                        setForm(f => ({...f, talla:t, sku:skuAuto?buildSku(f.categoriaJoya,f.materialProducto,t,items,editing?.documentId):f.sku}))
                      }} className={inp}/>
                  </div>
                  <div className="col-span-3">
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estilo / Figura / Tejido</label>
                    <input type="text" placeholder="Ej. Cartier, Figaro, Corazón…" value={form.figura}
                      onChange={e => setForm(f => ({...f, figura:e.target.value}))} className={inp}/>
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
                      onChange={e => setForm(f => ({...f, costoProduccion:e.target.value}))} className={inp}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Precio venta ($)</label>
                    <input type="number" placeholder="0" value={form.costo}
                      onChange={e => setForm(f => ({...f, costo:e.target.value}))} className={inp}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Stock</label>
                    <input type="number" min={0} placeholder="0" value={form.stock}
                      onChange={e => setForm(f => ({...f, stock:e.target.value}))} className={inp}/>
                  </div>
                </div>
                {form.costoProduccion && form.costo && (
                  <p className="text-[11px] mt-2 text-slate-500">
                    Margen estimado:{" "}
                    <span className={`font-semibold ${(margen(Number(form.costoProduccion),Number(form.costo))??0)>=40?"text-emerald-400":"text-amber-400"}`}>
                      {margen(Number(form.costoProduccion),Number(form.costo))??0}%
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
                {saving && <Loader2 size={14} className="animate-spin"/>}
                {editing?"Guardar cambios":"Dar de alta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
