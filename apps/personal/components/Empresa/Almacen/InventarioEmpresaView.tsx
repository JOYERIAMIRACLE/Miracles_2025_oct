"use client"

import { useState, useMemo, useRef } from "react"
import { Plus, Search, X, Pencil, Loader2, Package, TrendingUp, AlertTriangle, RefreshCw, ImagePlus, Star, Eye, EyeOff, BookOpen, Percent } from "lucide-react"
import { toast } from "sonner"
import { useGetInventario, createProducto, updateProducto, deleteProducto, patchStock, uploadFoto, publishToTienda, toggleActivoTienda, toggleIsFeatured } from "@/api/inventarioEmpresa/getInventario"
import { ProductType, CATEGORIAS_JOYA, MATERIALES, CategoriaJoya, MaterialProducto, MaterialItem } from "@/types/product"
import { fetchCatalogo } from "@/api/catalogoJoyeria/getCatalogoJoyeria"
import { CatalogoNodo } from "@/types/catalogoJoyeria"
import { useGetMateriales } from "@/api/material/getMateriales"
import { createMovimientoMaterial } from "@/api/movimiento-material/mutateMovimientoMaterial"

// Qué atributos mostrar según categoría — un solo modelo de campos opcionales
// que cubre las 9 categorías, en vez de un formulario distinto por cada una.
function atributosRelevantes(cat: CategoriaJoya | "") {
  if (cat === "Anillos" || cat === "Argollas")   return { piedra: true,  largo: false, cierre: false }
  if (cat === "Cadenas" || cat === "Esclavas" || cat === "Pulsos" || cat === "Rosarios") return { piedra: false, largo: true, cierre: false }
  if (cat === "Aretes" || cat === "Broqueles")   return { piedra: true,  largo: false, cierre: true }
  if (cat === "Dijes")                            return { piedra: true,  largo: false, cierre: false }
  return { piedra: true, largo: true, cierre: true }
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const imgUrl  = (url: string) => url.startsWith("http") ? url : `${BACKEND}${url}`

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

const fmt    = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const margen = (costo: number | null, precio: number | null) => {
  if (!costo || !precio || costo === 0) return null
  return Math.round(((precio - costo) / precio) * 100)
}

const CAT_ABBR: Record<CategoriaJoya, string> = {
  "Anillos":"ANI","Cadenas":"CAD","Esclavas":"ESC","Dijes":"DIJ",
  "Broqueles":"BRQ","Aretes":"ARE","Pulsos":"PUL","Rosarios":"ROS","Argollas":"ARG",
}
const MAT_ABBR: Record<MaterialProducto, string> = { "Oro 10k":"O10","Plata 925":"P92" }

// Formato: [MAT]-[CAT]-[FIGURA]-[TALLA]   ej. O10-ANI-LIS-T6 / P92-CAD-CUB-45
function buildSku(cat: CategoriaJoya | "", mat: MaterialProducto | "", figura: string, talla: string): string {
  if (!cat) return ""
  const matCode = mat ? MAT_ABBR[mat] : null
  const catCode = CAT_ABBR[cat]
  const figCode = figura.trim() ? figura.trim().slice(0, 3).toUpperCase() : null
  const talCode = talla.trim() ? talla.trim().toUpperCase().replace(/\s+/g, "") : null
  return [
    ...(matCode ? [matCode] : []),
    catCode,
    ...(figCode ? [figCode] : []),
    ...(talCode ? [talCode] : []),
  ].join("-")
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
  materialInsumo: string; pesoGramos: string; costoManoObra: string
  conPiedra: boolean; tipoPiedra: string; kilates: string; largoCm: string; cierre: string
}
const emptyForm = (): FormData => ({
  nombreProducto:"", sku:"", descripcion:"", figura:"", categoriaJoya:"", materialProducto:"",
  talla:"", costoProduccion:"", costo:"", stock:"0", material:"producto",
  materialInsumo:"", pesoGramos:"", costoManoObra:"",
  conPiedra:false, tipoPiedra:"", kilates:"", largoCm:"", cierre:"",
})
const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"

export function InventarioEmpresaView() {
  const { items, setItems, loading } = useGetInventario()
  const { materiales } = useGetMateriales()
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
  const [featuring,    setFeaturing]    = useState<string | null>(null)
  const [catalogo,     setCatalogo]     = useState<CatalogoNodo[]>([])
  const [margenPanel,  setMargenPanel]  = useState(false)
  const [globalMargen, setGlobalMargen] = useState(70)
  const [applyingMar,  setApplyingMar]  = useState(false)
  const [marProgress,  setMarProgress]  = useState({ done: 0, total: 0 })
  const [showCatPick, setShowCatPick] = useState(false)
  const [catSearch,   setCatSearch]   = useState("")
  const [catalogCard, setCatalogCard] = useState<{
    sku: string; nombre: string; categoria: string; material: string; notas: string
    descripcion: string; fotoUrl: string; fotoId: number | null
  } | null>(null)

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

  // Carga catálogo cuando abre el modal (una sola vez)
  function openModal() {
    if (catalogo.length === 0) fetchCatalogo().then(setCatalogo).catch(() => {})
  }

  function openNuevo() {
    setEditing(null); setForm(emptyForm()); setSkuAuto(true)
    setFotoPreview(null); setFotoFile(null)
    setCatalogCard(null); setCatSearch("")
    setModalOpen(true); openModal()
  }

  // Mapeo catálogo → inventario
  const CAT_MAP: Record<string, CategoriaJoya> = {
    "Anillos":"Anillos","Arracadas":"Aretes","Broqueles":"Broqueles",
    "Aretes":"Aretes","Cadenas":"Cadenas","Esclavas":"Esclavas",
    "Pulsos":"Pulsos","Dijes":"Dijes","Rosarios":"Rosarios",
  }
  const MAT_MAP: Record<string, MaterialProducto> = { "Oro 10k":"Oro 10k","Plata 925":"Plata 925" }

  function applyFromCatalogo(
    matNombre: string, catNombre: string,
    prod: CatalogoNodo, modeloNombre: string, catalogSku?: string
  ) {
    const cat = CAT_MAP[catNombre] ?? "" as CategoriaJoya | ""
    const mat = MAT_MAP[matNombre] ?? "" as MaterialProducto | ""
    const desc = prod.descripcion?.trim()
      || [prod.notas, ...prod.caracteristicas.map(c => `${c.clave}: ${c.valor}`)].filter(Boolean).join(" · ")
    const nombre = `${prod.nombre}${modeloNombre ? ` ${modeloNombre}` : ""}`
    const sku    = catalogSku || buildSku(cat, mat, prod.nombre, modeloNombre)
    setForm(f => ({
      ...f, nombreProducto: nombre, descripcion: desc,
      categoriaJoya: cat, materialProducto: mat, talla: modeloNombre, sku,
    }))
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
    const fotoUrl = prod.fotoUrl
      ? prod.fotoUrl.startsWith("http") ? prod.fotoUrl : `${backendUrl}${prod.fotoUrl}`
      : ""
    setCatalogCard({ sku, nombre, categoria: catNombre, material: matNombre, notas: prod.notas, descripcion: prod.descripcion ?? "", fotoUrl, fotoId: prod.fotoId ?? null })
    if (fotoUrl) setFotoPreview(fotoUrl)
    setShowCatPick(false); setCatSearch("")
  }

  function openEditar(it: ProductType) {
    openModal(); setEditing(it); setSkuAuto(true)
    setFotoPreview(it.imagenes?.[0] ? imgUrl(it.imagenes[0].url) : null)
    setFotoFile(null)
    const cat = it.categoriaJoya ?? ""
    const mat = it.materialProducto ?? ""
    const tal = it.talla ?? ""
    const sku = cat ? buildSku(cat, mat, it.figura ?? "", tal) : (it.sku ?? "")
    setForm({
      nombreProducto: it.nombreProducto, sku, descripcion: it.descripcion ?? "",
      figura: it.figura ?? "", categoriaJoya: cat,
      materialProducto: mat, talla: tal,
      costoProduccion: it.costoProduccion != null ? String(it.costoProduccion) : "",
      costo: it.costo != null ? String(it.costo) : "",
      stock: String(it.stock ?? 0), material: it.material ?? "producto",
      materialInsumo: it.materialInsumo?.documentId ?? "",
      pesoGramos: it.pesoGramos != null ? String(it.pesoGramos) : "",
      costoManoObra: it.costoManoObra != null ? String(it.costoManoObra) : "",
      conPiedra: it.atributos?.conPiedra ?? false,
      tipoPiedra: it.atributos?.tipoPiedra ?? "",
      kilates: it.atributos?.kilates ?? "",
      largoCm: it.atributos?.largoCm != null ? String(it.atributos.largoCm) : "",
      cierre: it.atributos?.cierre ?? "",
    })
    setModalOpen(true)
  }

  // Costo de material = peso (g) × precio/gramo del material elegido + mano de obra manual.
  // Solo se auto-calcula cuando hay material + peso capturados; si no, el costo sigue siendo editable a mano
  // (compatibilidad con productos que no llevan seguimiento de peso).
  function recalcularCosto(next: Partial<Pick<FormData, "materialInsumo" | "pesoGramos" | "costoManoObra">>) {
    setForm(f => {
      const merged = { ...f, ...next }
      const mat = materiales.find(m => m.documentId === merged.materialInsumo)
      if (mat?.precioReferenciaGramo && merged.pesoGramos) {
        const costo = Number(merged.pesoGramos) * mat.precioReferenciaGramo + (Number(merged.costoManoObra) || 0)
        return { ...merged, costoProduccion: String(Math.round(costo * 100) / 100) }
      }
      return merged
    })
  }
  const costeoAutomatico = !!(form.materialInsumo && form.pesoGramos)

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
      else if (!editing && catalogCard?.fotoId && catalogCard.fotoUrl)
        fotoData = { id: catalogCard.fotoId, url: catalogCard.fotoUrl }

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
        pesoGramos:     form.pesoGramos ? Number(form.pesoGramos) : null,
        costoManoObra:  form.costoManoObra ? Number(form.costoManoObra) : null,
        materialInsumo: form.materialInsumo || null,
        atributos: {
          conPiedra:  form.conPiedra,
          tipoPiedra: form.tipoPiedra.trim() || null,
          kilates:    form.kilates.trim() || null,
          largoCm:    form.largoCm ? Number(form.largoCm) : null,
          cierre:     form.cierre.trim() || null,
        },
        ...(needsSlug ? { slug: slugify(form.nombreProducto.trim()) } : {}),
        ...(fotoData ? { imagenes: [fotoData.id] } : {}),
      }

      // Al crear una pieza con material+peso capturados, consume ese peso del
      // inventario de materia prima (una vez por cada unidad de stock inicial) —
      // es la "individualización" de un lote a granel en piezas vendibles reales.
      if (!editing && form.materialInsumo && form.pesoGramos) {
        const unidades = Math.max(1, Number(form.stock) || 1)
        for (let i = 0; i < unidades; i++) {
          await createMovimientoMaterial({
            tipo: "salida", material: form.materialInsumo, gramos: Number(form.pesoGramos),
            fecha: new Date().toISOString(), notas: `Alta de producto: ${form.nombreProducto.trim()}`,
          })
        }
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
      // Cada unidad adicional de una pieza con material+peso consume ese peso otra vez
      // (se hizo/repuso otra pieza física del mismo diseño) — no se restaura al bajar stock.
      if (delta > 0 && it.materialInsumo && it.pesoGramos) {
        await createMovimientoMaterial({
          tipo: "salida", material: it.materialInsumo.documentId, gramos: it.pesoGramos * delta,
          fecha: new Date().toISOString(), notas: `Reposición de stock: ${it.nombreProducto}`,
          producto: it.documentId,
        })
      }
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

  async function handleAplicarMargen() {
    const targets = items.filter(i => (i.costoProduccion ?? 0) > 0)
    if (!targets.length) { toast.error("No hay productos con costo registrado"); return }
    setApplyingMar(true)
    setMarProgress({ done: 0, total: targets.length })
    let done = 0
    try {
      for (const item of targets) {
        const nuevo = Math.round((item.costoProduccion!) * (1 + globalMargen / 100) * 100) / 100
        await updateProducto(item.documentId, { costo: nuevo })
        setItems(prev => prev.map(i => i.documentId === item.documentId ? { ...i, costo: nuevo } : i))
        done++
        setMarProgress({ done, total: targets.length })
      }
      toast.success(`Precio de venta actualizado en ${targets.length} productos`)
      setMargenPanel(false)
    } catch {
      toast.error("Error al actualizar precios")
    } finally {
      setApplyingMar(false)
      setMarProgress({ done: 0, total: 0 })
    }
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
        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={() => setMargenPanel(v => !v)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border transition-all ${
              margenPanel
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            <Percent size={13}/> Margen global
          </button>
          <button type="button" onClick={openNuevo}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
            <Plus size={15} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Panel margen global */}
      {margenPanel && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 shrink-0">Margen global</span>
            <input type="number" min={0} max={500} step={5}
              title="Margen (%)"
              value={globalMargen}
              onChange={e => setGlobalMargen(Math.max(0, Number(e.target.value)))}
              className="w-16 h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-center font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
            <span className="text-sm text-slate-500">%</span>
          </div>
          <span className="text-xs text-slate-600">
            P.Venta = Costo ×{" "}
            <span className="font-mono text-amber-500">{(1 + globalMargen / 100).toFixed(2)}</span>
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] text-slate-600">
              {items.filter(i => (i.costoProduccion ?? 0) > 0).length} productos con costo
            </span>
            <button type="button" onClick={handleAplicarMargen} disabled={applyingMar}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
              {applyingMar
                ? <><Loader2 size={11} className="animate-spin"/> {marProgress.done}/{marProgress.total}</>
                : <><TrendingUp size={11}/> Aplicar a todos</>}
            </button>
          </div>
        </div>
      )}

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
          <div className={`w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col ${
            !editing && !catalogCard ? "max-w-xl" : "max-w-lg"
          }`}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">
                {editing ? "Editar producto" : catalogCard ? catalogCard.nombre : "Nuevo producto"}
              </h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16}/></button>
            </div>

            {/* ── ESTADO 1: Picker de catálogo (nuevo sin selección) ── */}
            {!editing && !catalogCard && (
              <>
                <div className="px-5 pt-4 pb-2 shrink-0">
                  <p className="text-xs text-slate-500 mb-3">Selecciona el producto del catálogo para continuar</p>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                    <input autoFocus placeholder="Buscar por nombre, categoría o SKU…" value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/40"/>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-3">
                  {catalogo.length === 0 && (
                    <div className="py-8 text-center">
                      <Loader2 size={20} className="mx-auto mb-2 text-slate-700 animate-spin"/>
                      <p className="text-xs text-slate-600">Cargando catálogo…</p>
                    </div>
                  )}
                  {catalogo.map(mat => mat.children.map(cat => {
                    const prods = cat.children.filter(p =>
                      !catSearch ||
                      p.nombre.toLowerCase().includes(catSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(catSearch.toLowerCase()) ||
                      cat.nombre.toLowerCase().includes(catSearch.toLowerCase()) ||
                      mat.nombre.toLowerCase().includes(catSearch.toLowerCase()) ||
                      p.modelos.some(m => m.sku.toLowerCase().includes(catSearch.toLowerCase()))
                    )
                    if (!prods.length) return null
                    return (
                      <div key={`${mat.id}-${cat.id}`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-1 mb-1">
                          {mat.nombre} › {cat.nombre}
                        </p>
                        <div className="bg-slate-800/40 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
                          {prods.map(prod =>
                            prod.modelos.length > 0
                              ? prod.modelos.map(mod => (
                                  <button key={mod.id} type="button"
                                    onClick={() => applyFromCatalogo(mat.nombre, cat.nombre, prod, mod.nombre, mod.sku || prod.sku)}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors group">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm text-slate-200">{prod.nombre}</span>
                                      {mod.nombre && <span className="text-slate-500 text-xs ml-1.5">{mod.nombre}</span>}
                                    </div>
                                    <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 shrink-0">
                                      {mod.sku || prod.sku}
                                    </span>
                                    <Plus size={13} className="text-slate-700 group-hover:text-emerald-400 transition-colors shrink-0"/>
                                  </button>
                                ))
                              : (
                                <button key={prod.id} type="button"
                                  onClick={() => applyFromCatalogo(mat.nombre, cat.nombre, prod, "", prod.sku)}
                                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors group">
                                  <span className="flex-1 text-sm text-slate-200">{prod.nombre}</span>
                                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 shrink-0">{prod.sku}</span>
                                  <Plus size={13} className="text-slate-700 group-hover:text-emerald-400 transition-colors shrink-0"/>
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    )
                  }))}
                </div>
                <div className="px-5 py-3 border-t border-slate-800 shrink-0 text-center">
                  <button type="button" onClick={() => setModalOpen(false)} className="text-xs text-slate-600 hover:text-slate-400 transition">Cancelar</button>
                </div>
              </>
            )}

            {/* ── ESTADO 2: Producto del catálogo seleccionado — form simplificado ── */}
            {!editing && catalogCard && (
              <>
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

                  {/* Card del producto del catálogo */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 leading-snug">{catalogCard.nombre}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{catalogCard.material} · {catalogCard.categoria}</p>
                      <p className="font-mono text-[11px] text-amber-400 mt-1">{catalogCard.sku}</p>
                    </div>
                    <button type="button" onClick={() => setCatalogCard(null)}
                      className="text-[10px] text-slate-600 hover:text-amber-400 border border-slate-700 rounded-lg px-2.5 py-1 transition shrink-0">
                      Cambiar
                    </button>
                  </div>

                  {/* Foto */}
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
                        <ImagePlus size={14}/> {fotoPreview ? "Cambiar foto" : "Subir foto"}
                      </button>
                      <p className="text-[10px] text-slate-600 mt-1.5">JPG, PNG, WEBP · Máx. 10 MB</p>
                      <input ref={fileRef} type="file" accept="image/*" title="Foto" className="hidden" onChange={handleFotoChange}/>
                    </div>
                  </div>

                  {/* Precios y stock */}
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
                      <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Stock inicial</label>
                      <input type="number" min={0} placeholder="0" value={form.stock}
                        onChange={e => setForm(f => ({...f, stock:e.target.value}))} className={inp}/>
                    </div>
                  </div>
                  {form.costoProduccion && form.costo && (
                    <p className="text-[11px] text-slate-500">
                      Margen: <span className={`font-semibold ${(margen(Number(form.costoProduccion),Number(form.costo))??0)>=40?"text-emerald-400":"text-amber-400"}`}>
                        {margen(Number(form.costoProduccion),Number(form.costo))??0}%
                      </span>
                    </p>
                  )}

                  {/* Descripción */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción / Notas</label>
                    <textarea placeholder="Detalles adicionales…" value={form.descripcion}
                      onChange={e => setForm(f => ({...f, descripcion:e.target.value}))}
                      rows={2} className={inp+" resize-none h-auto py-2"}/>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                    className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
                    {saving && <Loader2 size={14} className="animate-spin"/>}
                    Agregar al inventario
                  </button>
                </div>
              </>
            )}

            {/* ── ESTADO 3: Editar producto existente — form completo ── */}
            {editing && (
              <>
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

                  {/* Foto */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Foto</p>
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
                              ? <button type="button" onClick={() => { setSkuAuto(true); setForm(f => ({...f, sku:buildSku(f.categoriaJoya,f.materialProducto,f.figura,f.talla)})) }}
                                  className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                                  <RefreshCw size={9}/> Regenerar
                                </button>
                              : null}
                        </div>
                        <input type="text" placeholder="Auto" value={form.sku}
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
                        <textarea placeholder="Detalles…" value={form.descripcion}
                          onChange={e => setForm(f => ({...f, descripcion:e.target.value}))}
                          rows={2} className={inp+" resize-none h-auto py-2"}/>
                      </div>
                    </div>
                  </div>

                  {/* Atributos */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Atributos</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                        <select title="Categoría" value={form.categoriaJoya}
                          onChange={e => { const cat=e.target.value as CategoriaJoya|""; setForm(f => ({...f,categoriaJoya:cat,sku:skuAuto?buildSku(cat,f.materialProducto,f.figura,f.talla):f.sku})) }}
                          className={inp+" cursor-pointer"}>
                          <option value="">— —</option>
                          {CATEGORIAS_JOYA.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Material</label>
                        <select title="Material" value={form.materialProducto}
                          onChange={e => { const mat=e.target.value as MaterialProducto|""; setForm(f => ({...f,materialProducto:mat,sku:skuAuto?buildSku(f.categoriaJoya,mat,f.figura,f.talla):f.sku})) }}
                          className={inp+" cursor-pointer"}>
                          <option value="">— —</option>
                          {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Talla / Medida</label>
                        <input type="text" placeholder="T6, 45cm" value={form.talla}
                          onChange={e => { const t=e.target.value; setForm(f => ({...f,talla:t,sku:skuAuto?buildSku(f.categoriaJoya,f.materialProducto,f.figura,t):f.sku})) }} className={inp}/>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estilo / Figura</label>
                        <input type="text" placeholder="Cartier, Figaro, Corazón…" value={form.figura}
                          onChange={e => { const fig=e.target.value; setForm(f => ({...f,figura:fig,sku:skuAuto?buildSku(f.categoriaJoya,f.materialProducto,fig,f.talla):f.sku})) }} className={inp}/>
                      </div>
                    </div>
                  </div>

                  {/* Peso / insumo real (individualización de piezas) */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Peso e insumo (costeo automático)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Material real</label>
                        <select title="Material real" value={form.materialInsumo}
                          onChange={e => recalcularCosto({ materialInsumo: e.target.value })}
                          className={inp+" cursor-pointer"}>
                          <option value="">Sin especificar</option>
                          {materiales.map(m => <option key={m.documentId} value={m.documentId}>{m.nombre} {m.precioReferenciaGramo ? `· $${m.precioReferenciaGramo}/g` : ""}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Peso (g)</label>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.pesoGramos}
                          onChange={e => recalcularCosto({ pesoGramos: e.target.value })} className={inp}/>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Mano de obra ($)</label>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.costoManoObra}
                          onChange={e => recalcularCosto({ costoManoObra: e.target.value })} className={inp}/>
                      </div>
                    </div>
                    {!editing && costeoAutomatico && (
                      <p className="text-[11px] text-emerald-500 mt-2">
                        Costo calculado solo: {Number(form.pesoGramos)}g × ${materiales.find(m => m.documentId === form.materialInsumo)?.precioReferenciaGramo ?? 0}/g
                        {Number(form.costoManoObra) > 0 ? ` + $${form.costoManoObra} mano de obra` : ""} = ${form.costoProduccion}
                        {Number(form.stock) > 1 ? ` · se descontarán ${(Number(form.pesoGramos) * Number(form.stock)).toFixed(2)}g en total (${form.stock} piezas)` : ""}
                      </p>
                    )}
                    {editing && costeoAutomatico && (
                      <p className="text-[11px] text-slate-600 mt-2">El costo se recalculó con el peso/material actuales — editar aquí no vuelve a descontar material (solo pasa al crear la pieza o al sumar stock).</p>
                    )}
                  </div>

                  {/* Atributos de joya */}
                  {form.categoriaJoya && (() => {
                    const rel = atributosRelevantes(form.categoriaJoya)
                    return (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Atributos de joya</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Kilates / Ley</label>
                            <input type="text" placeholder="10k, 925…" value={form.kilates}
                              onChange={e => setForm(f => ({...f, kilates:e.target.value}))} className={inp}/>
                          </div>
                          {rel.largo && (
                            <div>
                              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Largo (cm)</label>
                              <input type="number" min="0" step="0.5" placeholder="0" value={form.largoCm}
                                onChange={e => setForm(f => ({...f, largoCm:e.target.value}))} className={inp}/>
                            </div>
                          )}
                          {rel.cierre && (
                            <div>
                              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cierre</label>
                              <input type="text" placeholder="Mariposa, presión…" value={form.cierre}
                                onChange={e => setForm(f => ({...f, cierre:e.target.value}))} className={inp}/>
                            </div>
                          )}
                          {rel.piedra && (
                            <>
                              <div className="flex items-center gap-2 pt-6">
                                <input type="checkbox" id="con-piedra" checked={form.conPiedra}
                                  onChange={e => setForm(f => ({...f, conPiedra:e.target.checked}))}
                                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"/>
                                <label htmlFor="con-piedra" className="text-sm text-slate-300">Con piedra</label>
                              </div>
                              {form.conPiedra && (
                                <div className="col-span-2">
                                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo de piedra</label>
                                  <input type="text" placeholder="Circonia, zafiro, perla…" value={form.tipoPiedra}
                                    onChange={e => setForm(f => ({...f, tipoPiedra:e.target.value}))} className={inp}/>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Precios y stock */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Precios y Stock</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
                          Costo ($) {costeoAutomatico && <span className="text-emerald-500 normal-case">· automático</span>}
                        </label>
                        <input type="number" placeholder="0" value={form.costoProduccion} readOnly={costeoAutomatico}
                          onChange={e => setForm(f => ({...f, costoProduccion:e.target.value}))}
                          className={inp+(costeoAutomatico?" opacity-70 cursor-not-allowed":"")}/>
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
                        Margen: <span className={`font-semibold ${(margen(Number(form.costoProduccion),Number(form.costo))??0)>=40?"text-emerald-400":"text-amber-400"}`}>
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
                    Guardar cambios
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
