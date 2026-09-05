"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  BookOpen, ChevronRight, ChevronDown, Plus, Trash2,
  ChevronUp, Loader2, Search, X, SlidersHorizontal,
  Tag, Gem, Layers, CheckCircle, WifiOff, ImagePlus, Package, Wand2,
} from "lucide-react"
import { uploadFoto, useGetInventario, createProducto } from "@/api/inventarioEmpresa/getInventario"
import { ProductType, CategoriaJoya, MaterialProducto } from "@/types/product"
import { toast } from "sonner"
import {
  CatalogoNodo, TipoNodo, Caracteristica, Modelo,
  TIPO_CONFIG, nodoVacio, modeloVacio, caracteristicaVacia, arbolInicial,
} from "@/types/catalogoJoyeria"
import { fetchCatalogo, saveCatalogo, fetchSkus, saveSkus } from "@/api/catalogoJoyeria/getCatalogoJoyeria"
import { SkuEntry, MATERIALES_SKU, ESTILOS_SKU, TIPOS_SKU, EXTRAS_SKU, PIEDRAS_SKU } from "@/types/skuCatalogo"
import { SkuBuilder } from "@/components/Shared/SkuBuilder"

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function upd(tree: CatalogoNodo[], id: string, patch: Partial<CatalogoNodo>): CatalogoNodo[] {
  return tree.map(n =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, children: upd(n.children, id, patch) }
  )
}

function del(tree: CatalogoNodo[], id: string): CatalogoNodo[] {
  return tree
    .filter(n => n.id !== id)
    .map(n => ({ ...n, children: del(n.children, id) }))
}

function ins(tree: CatalogoNodo[], parentId: string, child: CatalogoNodo): CatalogoNodo[] {
  return tree.map(n =>
    n.id === parentId
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: ins(n.children, parentId, child) }
  )
}

function mov(tree: CatalogoNodo[], id: string, dir: 1 | -1): CatalogoNodo[] {
  const doMov = (arr: CatalogoNodo[]): CatalogoNodo[] => {
    const i = arr.findIndex(n => n.id === id)
    if (i !== -1) {
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      const next = [...arr]
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    }
    return arr.map(n => ({ ...n, children: doMov(n.children) }))
  }
  return doMov(tree)
}

function find(tree: CatalogoNodo[], id: string): CatalogoNodo | null {
  for (const n of tree) {
    if (n.id === id) return n
    const found = find(n.children, id)
    if (found) return found
  }
  return null
}

function countAll(tree: CatalogoNodo[]): { materiales: number; categorias: number; productos: number } {
  let materiales = 0, categorias = 0, productos = 0
  const walk = (n: CatalogoNodo) => {
    if (n.tipo === "material")  materiales++
    if (n.tipo === "categoria") categorias++
    if (n.tipo === "producto")  productos++
    n.children.forEach(walk)
  }
  tree.forEach(walk)
  return { materiales, categorias, productos }
}

function matchSearch(n: CatalogoNodo, q: string): boolean {
  if (!q) return true
  const lq = q.toLowerCase()
  return (
    n.nombre.toLowerCase().includes(lq) ||
    n.sku.toLowerCase().includes(lq) ||
    n.notas.toLowerCase().includes(lq) ||
    n.children.some(c => matchSearch(c, q))
  )
}

// Códigos de piedras para detectar "con/sin piedra" en extras
const PIEDRA_CODES = new Set([...PIEDRAS_SKU.map(p => p.code), "PIE"])

function tienePiedra(s: SkuEntry) { return s.extras.some(e => PIEDRA_CODES.has(e)) }

// ─── Paleta por material ──────────────────────────────────────────────────────

const MAT_STYLE = {
  gold: {
    dot:       "bg-amber-400",
    matBadge:  "bg-amber-400/15 text-amber-300 border-amber-400/25",
    skuColor:  "text-amber-400",
    iconColor: "text-amber-400/80",
  },
  silv: {
    dot:       "bg-slate-400",
    matBadge:  "bg-slate-700/70 text-slate-300 border-slate-600/50",
    skuColor:  "text-violet-400",
    iconColor: "text-slate-400",
  },
} as const

function matKindFromName(name: string): "gold" | "silv" {
  return name.toLowerCase().includes("oro") ? "gold" : "silv"
}

function matKindFromProduct(p: ProductType): "gold" | "silv" {
  return p.materialProducto?.includes("Oro") ? "gold" : "silv"
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
function prodImgUrl(url: string) { return url.startsWith("http") ? url : `${BACKEND_URL}${url}` }

/** Devuelve el nodo material padre de una categoría (árbol de 2 niveles: material → categoría) */
function findParentMat(tree: CatalogoNodo[], catId: string): CatalogoNodo | null {
  return tree.find(mat => mat.children.some(c => c.id === catId)) ?? null
}

// ─── TreeRow ──────────────────────────────────────────────────────────────────

function TreeRow({
  node, depth, selected, onSelect, onAdd, onDel, onMov, busqueda, skuCount, parentMatKind,
}: {
  node:          CatalogoNodo
  depth:         number
  selected:      string | null
  onSelect:      (id: string) => void
  onAdd:         (parentId: string, tipo: TipoNodo) => void
  onDel:         (id: string) => void
  onMov:         (id: string, dir: 1 | -1) => void
  busqueda:      string
  /** Mapa "matKind:categoría" → cantidad de SKUs */
  skuCount?:     Record<string, number>
  /** matKind del material padre — lo pasa el material a sus categorías hijas */
  parentMatKind?: "gold" | "silv"
}) {
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )
  const cfg   = TIPO_CONFIG[node.tipo]
  const childTipo = cfg.childTipo
  const hasChildren = node.children.length > 0
  const isActive = selected === node.id
  const isCat = node.tipo === "categoria"
  const matKind = node.tipo === "material" ? matKindFromName(node.nombre) : null
  const matMs   = matKind ? MAT_STYLE[matKind] : null

  if (!matchSearch(node, busqueda)) return null

  const forceOpen = busqueda ? node.children.some(c => matchSearch(c, busqueda)) : false

  const TipoIcon = node.tipo === "material"
    ? Gem
    : node.tipo === "categoria"
      ? Layers
      : Tag

  // Las categorías son hojas de navegación — no se expanden, solo seleccionan
  const canExpand = hasChildren && !isCat

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all select-none ${
          isActive
            ? "bg-violet-600/15 border border-violet-500/25 shadow-sm"
            : isCat
              ? "hover:bg-slate-800/70 border border-transparent"
              : "hover:bg-slate-800/50 border border-transparent"
        }`}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle — solo para material */}
        <button type="button"
          onClick={e => { e.stopPropagation(); if (canExpand) setOpen(v => !v) }}
          className="w-4 shrink-0 flex items-center justify-center text-slate-600 hover:text-slate-400">
          {canExpand
            ? (open || forceOpen)
              ? <ChevronDown size={11} />
              : <ChevronRight size={11} />
            : isCat
              ? <span className={`w-1.5 h-1.5 rounded-full inline-block transition-colors ${isActive ? "bg-violet-500" : "bg-slate-700"}`} />
              : <span className="w-1 h-1 rounded-full bg-slate-700 inline-block" />
          }
        </button>

        {/* Icono tipo */}
        <TipoIcon size={11} className={`shrink-0 ${isActive ? "text-violet-400" : matMs?.iconColor ?? cfg.color}`} />

        {/* Nombre */}
        <span className="flex-1 min-w-0 leading-tight">
          <span className={`block text-[12px] truncate ${
            isActive ? "text-slate-100 font-semibold" : isCat ? "text-slate-300" : "text-slate-400"
          }`}>
            {node.nombre || <span className="italic text-slate-600">sin nombre</span>}
          </span>
        </span>

        {/* Badge SKUs en categoría — clave "matKind:categoría" para no mezclar materiales */}
        {isCat && skuCount && parentMatKind && (skuCount[`${parentMatKind}:${node.nombre}`] ?? 0) > 0 && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${
            isActive
              ? "bg-violet-500/40 text-violet-200 border border-violet-500/30"
              : "bg-slate-800 text-slate-500 border border-slate-700/60"
          }`}>{skuCount[`${parentMatKind}:${node.nombre}`]}</span>
        )}

        {/* Modelos count — solo productos */}
        {!isCat && node.modelos.length > 0 && (
          <span className="text-[9px] text-slate-600 shrink-0">{node.modelos.length} mod.</span>
        )}

        {/* Actions — sin eliminar (evitar borrado accidental; eliminar desde el panel de detalle) */}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}>
          {childTipo && !isCat && (
            <button type="button" title={`Agregar ${TIPO_CONFIG[childTipo].label}`}
              onClick={e => { e.stopPropagation(); onAdd(node.id, childTipo) }}
              className="p-0.5 text-slate-600 hover:text-violet-400 rounded">
              <Plus size={11} />
            </button>
          )}
          <button type="button" title="Subir" onClick={e => { e.stopPropagation(); onMov(node.id, -1) }}
            className="p-0.5 text-slate-600 hover:text-slate-400 rounded">
            <ChevronUp size={11} />
          </button>
          <button type="button" title="Bajar" onClick={e => { e.stopPropagation(); onMov(node.id, 1) }}
            className="p-0.5 text-slate-600 hover:text-slate-400 rounded">
            <ChevronDown size={11} />
          </button>
        </div>
      </div>

      {/* Children — solo para materiales, nunca para categorías */}
      {canExpand && (open || forceOpen) && (
        <div className="border-l border-slate-800/50 ml-5">
          {node.children.map(child => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              onAdd={onAdd}
              onDel={onDel}
              onMov={onMov}
              busqueda={busqueda}
              skuCount={skuCount}
              parentMatKind={matKind ?? parentMatKind}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  node, onUpdate, onDel,
}: {
  node: CatalogoNodo
  onUpdate: (patch: Partial<CatalogoNodo>) => void
  onDel: () => void
}) {
  const cfg = TIPO_CONFIG[node.tipo]

  const fotoRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const data = await uploadFoto(file)
      onUpdate({ fotoUrl: data.url, fotoId: data.id })
    } catch { /* silencioso */ }
    finally { setUploadingFoto(false) }
  }

  const updCaract = (id: string, patch: Partial<Caracteristica>) =>
    onUpdate({ caracteristicas: node.caracteristicas.map(c => c.id === id ? { ...c, ...patch } : c) })

  const delCaract = (id: string) =>
    onUpdate({ caracteristicas: node.caracteristicas.filter(c => c.id !== id) })

  const updModelo = (id: string, patch: Partial<Modelo>) =>
    onUpdate({ modelos: node.modelos.map(m => m.id === id ? { ...m, ...patch } : m) })

  const delModelo = (id: string) =>
    onUpdate({ modelos: node.modelos.filter(m => m.id !== id) })

  const inp = "w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition"
  const lbl = "block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1"

  return (
    <div className="flex flex-col gap-5 p-5">

      {/* Tipo badge + eliminar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">
            {cfg.label}
          </span>
          {node.tipo === "producto" && (
            <span className="text-[10px] text-slate-600">{node.modelos.length} modelos · {node.caracteristicas.length} características</span>
          )}
        </div>
        <button type="button" onClick={onDel}
          className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 rounded-lg px-2.5 py-1 transition-colors shrink-0">
          <Trash2 size={11} /> Eliminar
        </button>
      </div>

      {/* Nombre */}
      <div>
        <label className={lbl}>Nombre</label>
        <input className={inp} value={node.nombre}
          onChange={e => onUpdate({ nombre: e.target.value })}
          placeholder={`Nombre del ${cfg.label.toLowerCase()}`} />
      </div>

      {/* Foto + SKU — solo producto */}
      {node.tipo === "producto" && (
        <>
          <div>
            <label className={lbl}>Foto del producto</label>
            <div className="flex items-center gap-3">
              {node.fotoUrl ? (
                <div className="relative shrink-0">
                  <img src={node.fotoUrl.startsWith("http") ? node.fotoUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}${node.fotoUrl}`}
                    alt={node.nombre} className="w-16 h-16 rounded-lg object-cover border border-slate-700"/>
                  <button type="button" title="Quitar foto"
                    onClick={() => onUpdate({ fotoUrl: "", fotoId: null })}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow text-[8px]">
                    <X size={8}/>
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-slate-600"/>
                </div>
              )}
              <div>
                <button type="button" onClick={() => fotoRef.current?.click()} disabled={uploadingFoto}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 border border-slate-700 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50">
                  {uploadingFoto ? <Loader2 size={11} className="animate-spin"/> : <ImagePlus size={11}/>}
                  {node.fotoUrl ? "Cambiar" : "Subir foto"}
                </button>
                <input ref={fotoRef} type="file" accept="image/*" title="Foto" className="hidden" onChange={handleFotoChange}/>
                <p className="text-[9px] text-slate-700 mt-1">Se usará en inventario y tienda</p>
              </div>
            </div>
          </div>

          <div>
            <label className={lbl}>SKU base</label>
            <input className={inp} value={node.sku}
              onChange={e => onUpdate({ sku: e.target.value })}
              placeholder="Ej. ANI-O10K" />
          </div>

          <div>
            <label className={lbl}>Descripción pública</label>
            <textarea className={`${inp} resize-none`} rows={2}
              value={node.descripcion ?? ""}
              onChange={e => onUpdate({ descripcion: e.target.value })}
              placeholder="Descripción que aparece en inventario y tienda…" />
            <p className="text-[9px] text-slate-700 mt-1">Se pre-llena al agregar al inventario</p>
          </div>
        </>
      )}

      {/* Notas */}
      <div>
        <label className={lbl}>Notas</label>
        <textarea className={`${inp} resize-none`} rows={3}
          value={node.notas}
          onChange={e => onUpdate({ notas: e.target.value })}
          placeholder="Notas internas, descripción, observaciones…" />
      </div>

      {/* Características — solo producto */}
      {node.tipo === "producto" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={lbl}>Características</label>
            <button type="button"
              onClick={() => onUpdate({ caracteristicas: [...node.caracteristicas, caracteristicaVacia()] })}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-400 transition">
              <Plus size={10} /> Agregar
            </button>
          </div>
          {node.caracteristicas.length === 0 ? (
            <p className="text-[11px] text-slate-600 italic">Sin características</p>
          ) : (
            <div className="space-y-2">
              {node.caracteristicas.map(c => (
                <div key={c.id} className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="Clave (Ej. Metal)"
                    value={c.clave}
                    onChange={e => updCaract(c.id, { clave: e.target.value })}
                  />
                  <input
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="Valor (Ej. Oro)"
                    value={c.valor}
                    onChange={e => updCaract(c.id, { valor: e.target.value })}
                  />
                  <button type="button" title="Eliminar característica" onClick={() => delCaract(c.id)}
                    className="text-slate-700 hover:text-red-400 transition p-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modelos / SKUs — solo producto */}
      {node.tipo === "producto" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={lbl}>Modelos / SKUs</label>
            <button type="button"
              onClick={() => onUpdate({ modelos: [...node.modelos, modeloVacio()] })}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-400 transition">
              <Plus size={10} /> Agregar
            </button>
          </div>
          {node.modelos.length === 0 ? (
            <p className="text-[11px] text-slate-600 italic">Sin modelos registrados</p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_64px_72px_28px] gap-1.5 px-1">
                {["SKU", "Nombre", "Variedad", "Stock", "Precio", ""].map(h => (
                  <span key={h} className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {node.modelos.map(m => (
                <div key={m.id} className="grid grid-cols-[1fr_1fr_1fr_64px_72px_28px] gap-1.5 items-center">
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="SKU" value={m.sku} onChange={e => updModelo(m.id, { sku: e.target.value })} />
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="Talla 6" value={m.nombre} onChange={e => updModelo(m.id, { nombre: e.target.value })} />
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="Amarillo" value={m.variedad} onChange={e => updModelo(m.id, { variedad: e.target.value })} />
                  <input type="number" className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="0" value={m.stock ?? ""} onChange={e => updModelo(m.id, { stock: e.target.value === "" ? null : Number(e.target.value) })} />
                  <input type="number" className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                    placeholder="0.00" value={m.precio ?? ""} onChange={e => updModelo(m.id, { precio: e.target.value === "" ? null : Number(e.target.value) })} />
                  <button type="button" title="Eliminar modelo" onClick={() => delModelo(m.id)}
                    className="text-slate-700 hover:text-red-400 transition p-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SKU Browser Panel ────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all whitespace-nowrap ${
        active
          ? "bg-violet-500/20 border-violet-500/40 text-violet-200"
          : "bg-slate-900 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800/60"
      }`}>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </button>
  )
}

function SkuBrowserPanel({
  skus,
  products,
  categoryFilter,
  materialFilter,
  onSkuDeleted,
  onSkuAdded,
}: {
  skus: SkuEntry[]
  products: ProductType[]
  categoryFilter: string | null
  /** "gold" | "silv" cuando se seleccionó una categoría de un material específico */
  materialFilter: "gold" | "silv" | null
  onSkuDeleted: (id: string) => void
  onSkuAdded: (entry: SkuEntry) => void
}) {
  const [q,            setQ]            = useState("")
  const [filterMat,    setFilterMat]    = useState<string[]>([])
  const [filterEstilo, setFilterEstilo] = useState<string[]>([])
  const [filterTalla,  setFilterTalla]  = useState<string[]>([])
  const [filterExtras, setFilterExtras] = useState<string[]>([])
  const [filterPiedra, setFilterPiedra] = useState<"con" | "sin" | null>(null)
  const [showBuilder,  setShowBuilder]  = useState(false)
  const [showFilters,  setShowFilters]  = useState(false)

  function clearFilters() {
    setFilterMat([]); setFilterEstilo([]); setFilterTalla([])
    setFilterExtras([]); setFilterPiedra(null)
  }

  useEffect(() => { clearFilters(); setQ(""); setShowBuilder(false); setShowFilters(false) }, [categoryFilter, materialFilter])

  const tipoCat = categoryFilter ? TIPOS_SKU.find(t => t.catJoya === categoryFilter) : null

  const scopeSkus = useMemo(() => {
    let list = categoryFilter ? skus.filter(s => s.tipoCategoria === categoryFilter) : skus
    if (materialFilter) list = list.filter(s => s.matKind === materialFilter)
    return list
  }, [skus, categoryFilter, materialFilter])

  const scopeProducts = useMemo(() => {
    let list = categoryFilter ? products.filter(p => p.categoriaJoya === categoryFilter) : products
    if (materialFilter) list = list.filter(p => matKindFromProduct(p) === materialFilter)
    return list
  }, [products, categoryFilter, materialFilter])

  const availMat    = useMemo(() => [...new Set(scopeSkus.map(s => s.mat))],    [scopeSkus])
  const availEstilo = useMemo(() => [...new Set(scopeSkus.map(s => s.estilo))], [scopeSkus])
  const availTalla  = useMemo(() => [...new Set(scopeSkus.map(s => s.talla))].sort(), [scopeSkus])

  // Extras no-piedra disponibles en el scope (ej. DIA=Diamantada, PLA=Con placa)
  const availExtrasNoPiedra = useMemo(() => {
    const set = new Set<string>()
    for (const s of scopeSkus)
      for (const e of s.extras)
        if (!PIEDRA_CODES.has(e)) set.add(e)
    return [...set]
  }, [scopeSkus])

  // Si hay algún SKU con piedra y alguno sin piedra → mostrar filtro
  const scopeConPiedra   = useMemo(() => scopeSkus.some(tienePiedra),  [scopeSkus])
  const showPiedraFilter = scopeConPiedra

  const visible = useMemo(() => {
    let list = scopeSkus
    if (filterMat.length > 0)    list = list.filter(s => filterMat.includes(s.mat))
    if (filterEstilo.length > 0) list = list.filter(s => filterEstilo.includes(s.estilo))
    if (filterTalla.length > 0)  list = list.filter(s => filterTalla.includes(s.talla))
    if (filterExtras.length > 0) list = list.filter(s => filterExtras.some(fe => s.extras.includes(fe)))
    if (filterPiedra === "con")  list = list.filter(tienePiedra)
    if (filterPiedra === "sin")  list = list.filter(s => !tienePiedra(s))
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(s =>
        s.sku.toLowerCase().includes(lq) ||
        s.nombre.toLowerCase().includes(lq) ||
        s.estiloLabel.toLowerCase().includes(lq) ||
        s.matLabel.toLowerCase().includes(lq)
      )
    }
    return list
  }, [scopeSkus, filterMat, filterEstilo, filterTalla, filterExtras, filterPiedra, q])

  const visibleProducts = useMemo(() => {
    if (!q.trim()) return scopeProducts
    const lq = q.toLowerCase()
    return scopeProducts.filter(p =>
      p.nombreProducto.toLowerCase().includes(lq) ||
      (p.sku ?? "").toLowerCase().includes(lq)
    )
  }, [scopeProducts, q])

  function toggle(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const activeFilterCount = filterMat.length + filterEstilo.length + filterTalla.length + filterExtras.length + (filterPiedra ? 1 : 0)
  const hasFilters    = activeFilterCount > 0
  const showFilterBar = scopeSkus.length > 0 && (
    availMat.length > 1 || availEstilo.length > 0 || availTalla.length > 0 ||
    availExtrasNoPiedra.length > 0 || showPiedraFilter
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 shrink-0 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 leading-none">
              {categoryFilter ?? "Catálogo completo"}
            </h2>
            {tipoCat && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-violet-500/25 bg-violet-500/10 text-violet-400 tracking-widest uppercase">
                {tipoCat.code}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
            {visibleProducts.length !== scopeProducts.length
              ? `${visibleProducts.length} de ${scopeProducts.length} piezas`
              : `${scopeProducts.length} pieza${scopeProducts.length !== 1 ? "s" : ""} en inventario`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar SKU…"
              className="pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/50 rounded-lg text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/40 w-28 sm:w-36 transition" />
          </div>
          {showFilterBar && (
            <button type="button" onClick={() => setShowFilters(v => !v)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showFilters || hasFilters
                  ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                  : "bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200"
              }`}>
              <SlidersHorizontal size={12} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
          <button type="button" onClick={() => setShowBuilder(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              showBuilder
                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/20"
                : "bg-slate-800 border border-slate-700/60 text-slate-300 hover:border-violet-500/40 hover:text-violet-300"
            }`}>
            <Wand2 size={12} />
            <span className="hidden sm:inline">{showBuilder ? "Cerrar" : "Nueva pieza"}</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros — colapsable */}
      {showFilterBar && showFilters && (
        <div className="border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="px-4 py-3 space-y-2">

            {availMat.length > 1 && (
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-14 shrink-0 pt-1.5">Material</span>
                <div className="flex flex-wrap gap-1.5">
                  {MATERIALES_SKU.filter(m => availMat.includes(m.code)).map(m => (
                    <FilterChip key={m.code} label={m.label} active={filterMat.includes(m.code)}
                      onClick={() => toggle(filterMat, setFilterMat, m.code)} />
                  ))}
                </div>
              </div>
            )}

            {availEstilo.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-14 shrink-0 pt-1.5">Estilo</span>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  {availEstilo.map(code => {
                    const label = Object.values(ESTILOS_SKU).flat().find(e => e.code === code)?.label ?? code
                    return <FilterChip key={code} label={label} active={filterEstilo.includes(code)}
                      onClick={() => toggle(filterEstilo, setFilterEstilo, code)} />
                  })}
                </div>
              </div>
            )}

            {availTalla.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-14 shrink-0 pt-1.5">Talla</span>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  {availTalla.map(t => (
                    <FilterChip key={t} label={t} active={filterTalla.includes(t)}
                      onClick={() => toggle(filterTalla, setFilterTalla, t)} />
                  ))}
                </div>
              </div>
            )}

            {availExtrasNoPiedra.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-14 shrink-0 pt-1.5">Acabado</span>
                <div className="flex flex-wrap gap-1.5">
                  {EXTRAS_SKU.filter(ex => availExtrasNoPiedra.includes(ex.code)).map(ex => (
                    <FilterChip key={ex.code} label={ex.label} active={filterExtras.includes(ex.code)}
                      onClick={() => toggle(filterExtras, setFilterExtras, ex.code)} />
                  ))}
                </div>
              </div>
            )}

            {showPiedraFilter && (
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-14 shrink-0 pt-1.5">Piedras</span>
                <div className="flex gap-1.5">
                  <FilterChip label="Con piedras" active={filterPiedra === "con"}
                    onClick={() => setFilterPiedra(prev => prev === "con" ? null : "con")} />
                  <FilterChip label="Sin piedras" active={filterPiedra === "sin"}
                    onClick={() => setFilterPiedra(prev => prev === "sin" ? null : "sin")} />
                </div>
              </div>
            )}
          </div>

          {hasFilters && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-800/80" />
              <button type="button" onClick={clearFilters}
                className="flex items-center gap-1 text-[10px] font-medium text-violet-400 hover:text-violet-300 transition">
                <X size={9} /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* SkuBuilder expandible */}
      {showBuilder && (
        <div className="shrink-0 border-b border-slate-800 p-5 overflow-y-auto max-h-[55vh] bg-slate-950/50">
          <SkuBuilder
            defaultTipo={tipoCat?.code}
            onAdd={entry => { onSkuAdded(entry); setShowBuilder(false) }}
          />
        </div>
      )}

      {/* Grid de SKUs — ocupa todo el ancho */}
      <div className="flex-1 overflow-y-auto p-5">
        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
              <Gem size={22} className="text-slate-600" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-semibold">
                {scopeProducts.length === 0 ? "Sin piezas en inventario" : "Sin resultados"}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {scopeProducts.length === 0
                  ? "Agrega productos en la sección Inventario → Productos"
                  : "Prueba ajustando los filtros o la búsqueda"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {/* Tarjetas de productos del inventario — única fuente de verdad */}
            {visibleProducts.map(p => {
              const ms = MAT_STYLE[matKindFromProduct(p)]
              const coverImg = p.imagenes?.[0]
              return (
                <div key={p.documentId}
                  className="relative flex flex-col rounded-xl bg-slate-800/25 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/50 transition-all overflow-hidden">

                  {/* Stripe de material */}
                  <div className={`absolute left-0 inset-y-0 w-0.75 rounded-l-xl ${ms.dot}`} aria-hidden />

                  {/* Cuerpo */}
                  <div className="flex items-start gap-2.5 pl-5 pr-4 pt-3 pb-2">
                    {coverImg ? (
                      <img src={prodImgUrl(coverImg.url)} alt={p.nombreProducto}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700/50 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-dashed border-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Package size={14} className="text-slate-600" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-slate-100 leading-snug line-clamp-2">{p.nombreProducto}</p>
                      {p.sku && <p className={`text-[10px] font-mono tracking-wider ${ms.skuColor}`}>{p.sku}</p>}
                    </div>
                  </div>

                  {/* Footer con tags */}
                  <div className="flex flex-wrap gap-1 pl-5 pr-3 py-2 border-t border-slate-800/70 bg-slate-900/30">
                    {p.materialProducto && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ms.matBadge}`}>{p.materialProducto}</span>
                    )}
                    {p.stock !== null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-slate-700/50 bg-slate-800/50 text-slate-400 font-medium">×{p.stock}</span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-700/30 bg-emerald-900/20 text-emerald-400 font-medium">Inventario</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function CatalogoJoyeriaView() {
  const [tree,       setTree]       = useState<CatalogoNodo[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [offline,    setOffline]    = useState(false)
  const [selected,   setSelected]   = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [busqueda,   setBusqueda]   = useState("")
  const [skus,       setSkus]       = useState<SkuEntry[]>([])
  const { items: inventoryProducts, setItems: setInventoryProducts } = useGetInventario()

  function handleSelect(id: string) { setSelected(id); setShowDetail(true) }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  // Cargar árbol y SKUs planos
  useEffect(() => {
    fetchCatalogo().then(arbol => {
      setTree(arbol)
      setLoading(false)
      initialized.current = true
    })
    fetchSkus().then(setSkus)
  }, [])

  // Auto-save debounced
  const scheduleSave = useCallback((nextTree: CatalogoNodo[]) => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveCatalogo(nextTree)
        setSaved(true)
        setOffline(false)
        setTimeout(() => setSaved(false), 2000)
      } catch {
        setOffline(true)
      } finally {
        setSaving(false)
      }
    }, 800)
  }, [])

  const setTreeAndSave = (fn: (t: CatalogoNodo[]) => CatalogoNodo[]) => {
    setTree(prev => {
      const next = fn(prev)
      scheduleSave(next)
      return next
    })
  }

  // Tree operations
  const handleUpdate = (id: string, patch: Partial<CatalogoNodo>) =>
    setTreeAndSave(t => upd(t, id, patch))

  const handleDel = (id: string) => {
    if (selected === id) { setSelected(null); setShowDetail(false) }
    setTreeAndSave(t => del(t, id))
  }

  const handleAdd = (parentId: string, tipo: TipoNodo) => {
    const child = nodoVacio(tipo)
    setTreeAndSave(t => ins(t, parentId, child))
    setSelected(child.id)
    setShowDetail(true)
  }

  const handleAddMaterial = () => {
    const node = nodoVacio("material")
    setTreeAndSave(t => [...t, node])
    setSelected(node.id)
    setShowDetail(true)
  }

  const handleMov = (id: string, dir: 1 | -1) =>
    setTreeAndSave(t => mov(t, id, dir))

  const selectedNode = selected ? find(tree, selected) : null
  const stats = useMemo(() => countAll(tree), [tree])

  // Cuando se selecciona una categoría, identifica el material padre para filtrar SKUs por él
  const selectedMatKind = useMemo<"gold" | "silv" | null>(() => {
    if (selectedNode?.tipo !== "categoria") return null
    const parentMat = findParentMat(tree, selectedNode.id)
    return parentMat ? matKindFromName(parentMat.nombre) : null
  }, [selectedNode, tree])

  // Mapa "matKind:categoría" → cantidad de productos en inventario (única fuente de verdad)
  const skuCountByCat = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of inventoryProducts) {
      if (!p.categoriaJoya) continue
      const kind = matKindFromProduct(p)
      const key  = `${kind}:${p.categoriaJoya}`
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [inventoryProducts])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={20} className="animate-spin text-slate-500 mr-2" />
      <span className="text-slate-500 text-sm">Cargando catálogo…</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen size={15} className="text-violet-400 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-100 leading-none">Catálogo</h1>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] text-slate-500 tabular-nums">{stats.materiales}M · {stats.categorias}C · {stats.productos}P</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 tabular-nums">{inventoryProducts.length} piezas</span>
              {saving && <Loader2 size={10} className="animate-spin text-slate-500" />}
              {saved && !saving && <CheckCircle size={10} className="text-violet-400" />}
              {offline && !saving && <WifiOff size={10} className="text-red-400" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda árbol */}
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="pl-7 pr-6 py-1.5 text-xs bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/40 w-32 transition" />
            {busqueda && (
              <button type="button" title="Limpiar" onClick={() => setBusqueda("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <X size={11} />
              </button>
            )}
          </div>

          {tree.length === 0 && (
            <button type="button"
              onClick={() => { const t = arbolInicial(); setTree(t); scheduleSave(t) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600/90 hover:bg-violet-500 text-white rounded-lg transition">
              <Layers size={12} /> Plantilla
            </button>
          )}

          <button type="button" onClick={handleAddMaterial}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600/90 hover:bg-violet-500 text-white rounded-lg transition">
            <Plus size={12} /> Material
          </button>
        </div>
      </div>

      {/* Body — master-detail: mobile alterna árbol/detalle, desktop los muestra juntos */}
      <div className="flex flex-1 overflow-hidden">

        {/* Árbol — oculto en mobile cuando hay detalle visible */}
        <div className={`${showDetail ? "hidden" : "flex flex-col"} md:flex md:flex-col w-full md:w-64 shrink-0 md:border-r border-slate-800 overflow-y-auto p-3 space-y-0.5`}>
          {tree.length === 0 ? (
            <div className="py-12 text-center">
              <Gem size={28} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-600 text-xs mb-3">Sin materiales</p>
              <button type="button" onClick={handleAddMaterial}
                className="text-xs text-violet-400 hover:text-violet-300 transition">
                + Agregar material
              </button>
            </div>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 px-2 pt-1 pb-2 select-none">
                Materiales
              </p>
              {tree.map(node => (
                <TreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected}
                  onSelect={handleSelect}
                  onAdd={handleAdd}
                  onDel={handleDel}
                  onMov={handleMov}
                  busqueda={busqueda}
                  skuCount={skuCountByCat}
                />
              ))}
            </>
          )}
        </div>

        {/* Panel derecho — oculto en mobile cuando se muestra el árbol */}
        <div className={`${!showDetail ? "hidden" : "flex flex-col"} md:flex md:flex-col flex-1 overflow-hidden min-w-0`}>

          {/* Botón volver al árbol — solo mobile */}
          <button type="button"
            onClick={() => { setShowDetail(false); setSelected(null) }}
            className="md:hidden flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-violet-400 border-b border-slate-800 hover:bg-slate-800/40 transition-colors shrink-0">
            <ChevronRight size={13} className="rotate-180" /> Árbol
          </button>

          {selectedNode?.tipo === "producto" || selectedNode?.tipo === "material" ? (
            /* Material o Producto seleccionado → editor de detalles */
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TIPO_CONFIG[selectedNode.tipo].color} bg-slate-800/80 border-slate-700/50 uppercase tracking-widest`}>
                    {TIPO_CONFIG[selectedNode.tipo].label}
                  </span>
                  <span className="text-slate-100 text-sm font-semibold">
                    {selectedNode.nombre || <span className="text-slate-600 italic font-normal">sin nombre</span>}
                  </span>
                </div>
                {TIPO_CONFIG[selectedNode.tipo].childTipo && (
                  <button type="button"
                    onClick={() => handleAdd(selectedNode.id, TIPO_CONFIG[selectedNode.tipo].childTipo!)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition border border-slate-700 rounded-lg px-2.5 py-1">
                    <Plus size={11} />
                    {TIPO_CONFIG[selectedNode.tipo].childLabel}
                  </button>
                )}
              </div>
              <DetailPanel
                node={selectedNode}
                onUpdate={patch => handleUpdate(selectedNode.id, patch)}
                onDel={() => handleDel(selectedNode.id)}
              />
            </div>
          ) : (
            /* Categoría seleccionada → SKU Browser */
            <SkuBrowserPanel
              skus={skus}
              products={inventoryProducts}
              categoryFilter={selectedNode?.tipo === "categoria" ? selectedNode.nombre : null}
              materialFilter={selectedMatKind}
              onSkuDeleted={id => setSkus(prev => prev.filter(s => s.id !== id))}
              onSkuAdded={async entry => {
                try {
                  const nuevo = await createProducto({
                    nombreProducto: entry.nombre,
                    sku:            entry.sku,
                    categoriaJoya:  (entry.tipoCategoria as CategoriaJoya) || null,
                    materialProducto: (entry.matLabel as MaterialProducto) || null,
                    talla:          entry.talla || null,
                    stock:          0,
                    material:       "producto",
                  } as any)
                  setInventoryProducts(prev =>
                    [...prev, nuevo].sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto))
                  )
                  toast.success(`"${entry.nombre}" agregado al inventario con stock 0`)
                } catch {
                  toast.error("No se pudo crear el producto")
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
