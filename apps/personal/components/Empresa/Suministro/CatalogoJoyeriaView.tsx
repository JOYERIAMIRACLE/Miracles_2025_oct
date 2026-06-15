"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  BookOpen, ChevronRight, ChevronDown, Plus, Trash2,
  ChevronUp, Loader2, Search, X, SlidersHorizontal,
  Tag, Gem, Layers, CheckCircle, WifiOff, ImagePlus, Package,
} from "lucide-react"
import { uploadFoto } from "@/api/inventarioEmpresa/getInventario"
import {
  CatalogoNodo, TipoNodo, Caracteristica, Modelo,
  TIPO_CONFIG, nodoVacio, modeloVacio, caracteristicaVacia, arbolInicial,
} from "@/types/catalogoJoyeria"
import { fetchCatalogo, saveCatalogo } from "@/api/catalogoJoyeria/getCatalogoJoyeria"

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

// ─── TreeRow ──────────────────────────────────────────────────────────────────

function TreeRow({
  node, depth, selected, onSelect, onAdd, onDel, onMov, busqueda,
}: {
  node:     CatalogoNodo
  depth:    number
  selected: string | null
  onSelect: (id: string) => void
  onAdd:    (parentId: string, tipo: TipoNodo) => void
  onDel:    (id: string) => void
  onMov:    (id: string, dir: 1 | -1) => void
  busqueda: string
}) {
  const [open, setOpen] = useState(depth === 0)
  const cfg   = TIPO_CONFIG[node.tipo]
  const childTipo = cfg.childTipo
  const hasChildren = node.children.length > 0
  const isActive = selected === node.id

  if (!matchSearch(node, busqueda)) return null

  const forceOpen = busqueda ? node.children.some(c => matchSearch(c, busqueda)) : false

  const TipoIcon = node.tipo === "material"
    ? Gem
    : node.tipo === "categoria"
      ? Layers
      : Tag

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? "bg-slate-700/60 border border-slate-600/50"
            : "hover:bg-slate-800/50"
        }`}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle */}
        <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
          className="w-4 shrink-0 flex items-center justify-center text-slate-600 hover:text-slate-400">
          {hasChildren
            ? (open || forceOpen)
              ? <ChevronDown size={11} />
              : <ChevronRight size={11} />
            : <span className="w-1 h-1 rounded-full bg-slate-700 inline-block" />
          }
        </button>

        {/* Icono tipo */}
        <TipoIcon size={11} className={`shrink-0 ${cfg.color}`} />

        {/* Nombre + SKU apilados */}
        <span className="flex-1 min-w-0 leading-tight">
          <span className={`block text-[12px] wrap-break-word ${isActive ? "text-slate-100 font-medium" : "text-slate-300"}`}>
            {node.nombre || <span className="italic text-slate-600">sin nombre</span>}
          </span>
          {node.sku && (
            <span className="block text-[9px] font-mono text-slate-600 truncate">
              {node.sku}
            </span>
          )}
        </span>

        {/* Modelos count */}
        {node.modelos.length > 0 && (
          <span className="text-[9px] text-slate-600 shrink-0">{node.modelos.length} mod.</span>
        )}

        {/* Actions (visible on hover or active) */}
        <div className={`flex items-center gap-0.5 shrink-0 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
          {childTipo && (
            <button type="button" title={`Agregar ${TIPO_CONFIG[childTipo].label}`}
              onClick={e => { e.stopPropagation(); onAdd(node.id, childTipo) }}
              className="p-0.5 text-slate-600 hover:text-emerald-400 rounded">
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
          <button type="button" title="Eliminar" onClick={e => { e.stopPropagation(); onDel(node.id) }}
            className="p-0.5 text-slate-600 hover:text-red-400 rounded">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (open || forceOpen) && (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  node, onUpdate,
}: {
  node: CatalogoNodo
  onUpdate: (patch: Partial<CatalogoNodo>) => void
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

  const inp = "w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 transition"
  const lbl = "block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1"

  return (
    <div className="flex flex-col gap-5 p-5">

      {/* Tipo badge */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
          node.tipo === "material"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : node.tipo === "categoria"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
          {cfg.label}
        </span>
        {node.tipo === "producto" && (
          <span className="text-[10px] text-slate-600">{node.modelos.length} modelos · {node.caracteristicas.length} características</span>
        )}
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
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 border border-slate-700 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50">
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
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition">
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
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="Clave (Ej. Metal)"
                    value={c.clave}
                    onChange={e => updCaract(c.id, { clave: e.target.value })}
                  />
                  <input
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
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
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition">
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
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="SKU" value={m.sku} onChange={e => updModelo(m.id, { sku: e.target.value })} />
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="Talla 6" value={m.nombre} onChange={e => updModelo(m.id, { nombre: e.target.value })} />
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="Amarillo" value={m.variedad} onChange={e => updModelo(m.id, { variedad: e.target.value })} />
                  <input type="number" className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="0" value={m.stock ?? ""} onChange={e => updModelo(m.id, { stock: e.target.value === "" ? null : Number(e.target.value) })} />
                  <input type="number" className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
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

// ─── Main View ────────────────────────────────────────────────────────────────

export function CatalogoJoyeriaView() {
  const [tree,      setTree]      = useState<CatalogoNodo[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [offline,   setOffline]   = useState(false)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [busqueda,  setBusqueda]  = useState("")

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  // Cargar árbol
  useEffect(() => {
    fetchCatalogo().then(arbol => {
      setTree(arbol)
      setLoading(false)
      initialized.current = true
    })
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
    if (selected === id) setSelected(null)
    setTreeAndSave(t => del(t, id))
  }

  const handleAdd = (parentId: string, tipo: TipoNodo) => {
    const child = nodoVacio(tipo)
    setTreeAndSave(t => ins(t, parentId, child))
    setSelected(child.id)
  }

  const handleAddMaterial = () => {
    const node = nodoVacio("material")
    setTreeAndSave(t => [...t, node])
    setSelected(node.id)
  }

  const handleMov = (id: string, dir: 1 | -1) =>
    setTreeAndSave(t => mov(t, id, dir))

  const selectedNode = selected ? find(tree, selected) : null
  const stats = useMemo(() => countAll(tree), [tree])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={20} className="animate-spin text-slate-500 mr-2" />
      <span className="text-slate-500 text-sm">Cargando catálogo…</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800 shrink-0 flex-wrap">
        <div className="flex items-center gap-2.5">
          <BookOpen size={16} className="text-amber-400" />
          <div>
            <h1 className="text-lg font-bold text-slate-100 leading-none">Catálogo de Joyería</h1>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {stats.materiales} materiales · {stats.categorias} categorías · {stats.productos} productos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Estado de guardado */}
          {saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Loader2 size={11} className="animate-spin" /> Guardando…
            </div>
          )}
          {saved && !saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle size={11} /> Guardado
            </div>
          )}
          {offline && !saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400">
              <WifiOff size={11} /> Sin conexión
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="pl-7 pr-6 py-1.5 text-xs bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40 w-44 transition" />
            {busqueda && (
              <button type="button" title="Limpiar búsqueda" onClick={() => setBusqueda("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Inicializar plantilla */}
          {tree.length === 0 && (
            <button type="button"
              onClick={() => { const t = arbolInicial(); setTree(t); scheduleSave(t) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600/90 hover:bg-violet-500 text-white rounded-lg transition">
              <Layers size={13} /> Inicializar plantilla
            </button>
          )}

          {/* Agregar material */}
          <button type="button" onClick={handleAddMaterial}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg transition">
            <Plus size={13} /> Material
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Árbol — panel izquierdo */}
        <div className="w-72 shrink-0 border-r border-slate-800 overflow-y-auto p-3 space-y-0.5">
          {tree.length === 0 ? (
            <div className="py-12 text-center">
              <Gem size={28} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-600 text-xs mb-3">Sin materiales</p>
              <button type="button" onClick={handleAddMaterial}
                className="text-xs text-amber-400 hover:text-amber-300 transition">
                + Agregar material
              </button>
            </div>
          ) : tree.map(node => (
            <TreeRow
              key={node.id}
              node={node}
              depth={0}
              selected={selected}
              onSelect={setSelected}
              onAdd={handleAdd}
              onDel={handleDel}
              onMov={handleMov}
              busqueda={busqueda}
            />
          ))}
        </div>

        {/* Panel derecho — detalle */}
        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <>
              {/* Sub-header del nodo */}
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${TIPO_CONFIG[selectedNode.tipo].color}`}>
                    {TIPO_CONFIG[selectedNode.tipo].label}
                  </span>
                  <span className="text-slate-300 text-sm font-medium">
                    {selectedNode.nombre || "sin nombre"}
                  </span>
                </div>
                {/* Agregar hijo */}
                {TIPO_CONFIG[selectedNode.tipo].childTipo && (
                  <button type="button"
                    onClick={() => handleAdd(selectedNode.id, TIPO_CONFIG[selectedNode.tipo].childTipo!)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition border border-slate-700 rounded-lg px-2.5 py-1">
                    <Plus size={11} />
                    {TIPO_CONFIG[selectedNode.tipo].childLabel}
                  </button>
                )}
              </div>
              <DetailPanel
                node={selectedNode}
                onUpdate={patch => handleUpdate(selectedNode.id, patch)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
              <SlidersHorizontal size={32} className="text-slate-700" />
              <p className="text-slate-600 text-sm">Selecciona un elemento del árbol para editarlo</p>
              <p className="text-slate-700 text-xs">Material → Categoría → Producto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
