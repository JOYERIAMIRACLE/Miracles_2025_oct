"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, Search, FolderOpen, FileText, ImageIcon, Monitor, Video, File, Link2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  CategoriaDigital, CATEGORIAS_DIGITAL, CATEGORIA_CONFIG,
  SUBCATEGORIAS, TIPOS_MATERIAL, TIPO_CONFIG, GRUPOS_MATERIAL,
  MaterialDigitalType, MaterialDigitalPayload, TipoMaterial,
} from "@/types/material-digital"
import { useGetMaterialDigital } from "@/api/material-digital/getMaterialDigital"
import { createMaterialDigital, updateMaterialDigital, deleteMaterialDigital } from "@/api/material-digital/mutateMaterialDigital"

// ─── helpers ──────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 transition"
const labelCls = "block text-[11px] text-slate-500 mb-1"

const AMBITO = "trabajo" as const

function emptyPayload(categoria: CategoriaDigital): MaterialDigitalPayload {
  return {
    nombre: "", url: "", categoria,
    subcategoria: SUBCATEGORIAS[categoria][0] ?? "",
    tipo: "link", descripcion: null, evento: null, ambito: AMBITO,
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ editando, categoriaInicial, onGuardar, onCerrar }: {
  editando:        MaterialDigitalType | null
  categoriaInicial: CategoriaDigital
  onGuardar:       (p: MaterialDigitalPayload) => Promise<void>
  onCerrar:        () => void
}) {
  const [form, setForm] = useState<MaterialDigitalPayload>(
    editando
      ? { nombre: editando.nombre, url: editando.url, categoria: editando.categoria,
          subcategoria: editando.subcategoria, tipo: editando.tipo,
          descripcion: editando.descripcion, evento: editando.evento }
      : emptyPayload(categoriaInicial)
  )
  const [saving, setSaving] = useState(false)

  const subcats = SUBCATEGORIAS[form.categoria]
  const esEventos = form.categoria === "EVENTOS_PROYECTOS"

  const set = <K extends keyof MaterialDigitalPayload>(k: K, v: MaterialDigitalPayload[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.nombre.trim() || !form.url.trim()) {
      toast.error("Nombre y URL son obligatorios")
      return
    }
    setSaving(true)
    try { await onGuardar(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">
            {editando ? "Editar material" : "Nuevo material"}
          </h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        {/* Categoría */}
        <div>
          <label className={labelCls}>Categoría</label>
          <select aria-label="Categoría" value={form.categoria}
            onChange={e => {
              const cat = e.target.value as CategoriaDigital
              setForm(f => ({ ...f, categoria: cat, subcategoria: SUBCATEGORIAS[cat][0] ?? "" }))
            }}
            className={inputCls}>
            {CATEGORIAS_DIGITAL.map(c => (
              <option key={c} value={c}>{CATEGORIA_CONFIG[c].label}</option>
            ))}
          </select>
        </div>

        {/* Subcategoría */}
        {!esEventos && (
          <div>
            <label className={labelCls}>Subcategoría</label>
            {subcats.length > 0 ? (
              <select aria-label="Subcategoría" value={form.subcategoria}
                onChange={e => set("subcategoria", e.target.value)}
                className={inputCls}>
                {subcats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={form.subcategoria}
                onChange={e => set("subcategoria", e.target.value)}
                placeholder="Subcategoría…" className={inputCls} />
            )}
          </div>
        )}

        {/* Evento (solo EVENTOS_PROYECTOS) */}
        {esEventos && (
          <div>
            <label className={labelCls}>Nombre del evento / proyecto</label>
            <input value={form.evento ?? ""}
              onChange={e => set("evento", e.target.value || null)}
              placeholder="Stand UDEM 2025, Lanzamiento Producto…"
              className={inputCls} />
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className={labelCls}>Nombre del material</label>
          <input value={form.nombre}
            onChange={e => set("nombre", e.target.value)}
            placeholder="Manual de Identidad v3, Logo horizontal…"
            className={inputCls} />
        </div>

        {/* URL */}
        <div>
          <label className={labelCls}>URL (link a Drive, Notion, etc.)</label>
          <input value={form.url}
            onChange={e => set("url", e.target.value)}
            placeholder="https://drive.google.com/…"
            className={inputCls} />
        </div>

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo de archivo</label>
          <select aria-label="Tipo" value={form.tipo}
            onChange={e => set("tipo", e.target.value as TipoMaterial)}
            className={inputCls}>
            {TIPOS_MATERIAL.map(t => (
              <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción (opcional)</label>
          <textarea value={form.descripcion ?? ""}
            onChange={e => set("descripcion", e.target.value || null)}
            rows={2} placeholder="Versión aprobada mayo 2025, uso interno…"
            className={`${inputCls} resize-none`} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de material ──────────────────────────────────────────────────────

const CAT_DOT: Record<string, string> = {
  violet:  "bg-violet-400",
  blue:    "bg-blue-400",
  amber:   "bg-amber-400",
  cyan:    "bg-cyan-400",
  emerald: "bg-emerald-400",
  rose:    "bg-rose-400",
  orange:  "bg-orange-400",
  teal:    "bg-teal-400",
}

const TIPO_ICON = {
  pdf:          FileText,
  imagen:       ImageIcon,
  presentacion: Monitor,
  video:        Video,
  documento:    File,
  link:         Link2,
} as const

const TIPO_ICON_BG: Record<TipoMaterial, string> = {
  pdf:          "bg-red-500/15 text-red-400",
  imagen:       "bg-rose-500/15 text-rose-400",
  presentacion: "bg-blue-500/15 text-blue-400",
  video:        "bg-amber-500/15 text-amber-400",
  documento:    "bg-sky-500/15 text-sky-400",
  link:         "bg-slate-500/15 text-slate-400",
}

function MaterialCard({ material, onEdit, onDelete }: {
  material: MaterialDigitalType
  onEdit:   () => void
  onDelete: () => void
}) {
  const tipo     = TIPO_CONFIG[material.tipo]
  const cat      = CATEGORIA_CONFIG[material.categoria]
  const dot      = CAT_DOT[cat.color] ?? "bg-slate-400"
  const Icon     = TIPO_ICON[material.tipo]
  const iconBg   = TIPO_ICON_BG[material.tipo]

  return (
    <a href={material.url} target="_blank" rel="noopener noreferrer"
      className="group block rounded-xl border border-slate-700/60 bg-[#0d1117]/90 backdrop-blur-sm hover:border-slate-600/60 hover:bg-[#111827]/90 transition-all duration-150 cursor-pointer">
      <div className="px-3 pt-3 pb-2.5">
        {/* Icono de tipo */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${iconBg}`}>
          <Icon size={15} />
        </div>
        {/* Subcategoría con dot de categoria */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
          <span className="text-[10px] font-mono text-slate-500 truncate leading-none">{material.subcategoria || material.evento}</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-200 leading-snug line-clamp-2">{material.nombre}</p>
        {material.descripcion && (
          <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{material.descripcion}</p>
        )}
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 border-t border-white/6">
        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tipo.badge}`}>
          {tipo.label}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onEdit() }}
            className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition" title="Editar">
            <Pencil size={12} />
          </button>
          <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete() }}
            className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition" title="Eliminar">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </a>
  )
}

// ─── Sidebar con grupos colapsables ──────────────────────────────────────────

function SidebarGrupos({ categoriaActiva, materiales, onSelect }: {
  categoriaActiva: CategoriaDigital
  materiales: MaterialDigitalType[]
  onSelect: (cat: CategoriaDigital) => void
}) {
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setAbiertos(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="flex flex-col gap-1 px-2">
      {GRUPOS_MATERIAL.map(grupo => {
        const isOpen  = grupo.collapsible ? (abiertos[grupo.id] ?? false) : true
        const single  = grupo.categorias.length === 1
        const soloCat = single ? grupo.categorias[0] : null
        const active  = soloCat ? categoriaActiva === soloCat : false
        const qty     = soloCat ? materiales.filter(m => m.categoria === soloCat).length : 0

        return (
          <div key={grupo.id}>
            {/* Cabecera del grupo */}
            {grupo.collapsible ? (
              // Grupo con 1 categoría: header es selector + toggle
              single ? (
                <button type="button"
                  onClick={() => { toggle(grupo.id); if (soloCat) onSelect(soloCat) }}
                  className={[
                    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1",
                    active
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
                  ].join(" ")}>
                  <span className="truncate">{grupo.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {qty > 0 && <span className="text-[10px] text-slate-600">{qty}</span>}
                    <ChevronDown size={11} className={`transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`} />
                  </div>
                </button>
              ) : (
                // Grupo con múltiples categorías: header solo togglea
                <button type="button"
                  onClick={() => toggle(grupo.id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition mt-1">
                  <span>{grupo.label}</span>
                  <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`} />
                </button>
              )
            ) : (
              <p className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
                {grupo.label}
              </p>
            )}

            {/* Ítems del grupo — solo si tiene múltiples categorías */}
            {isOpen && !single && (
              <div className="space-y-0.5">
                {grupo.categorias.map(cat => {
                  const c       = CATEGORIA_CONFIG[cat]
                  const catQty  = materiales.filter(m => m.categoria === cat).length
                  const catActive = cat === categoriaActiva
                  return (
                    <button key={cat} type="button"
                      onClick={() => onSelect(cat)}
                      className={[
                        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left",
                        catActive
                          ? "bg-slate-800 text-slate-100 font-medium"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-900",
                      ].join(" ")}>
                      <span className="truncate">{c.label}</span>
                      {catQty > 0 && (
                        <span className="text-[10px] text-slate-600 shrink-0">{catQty}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function InventarioDigitalView() {
  const { materiales, setMateriales, loading } = useGetMaterialDigital("trabajo")
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaDigital>("BRANDING")
  const [busqueda,  setBusqueda]  = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<MaterialDigitalType | null>(null)

  const materialesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return materiales.filter(m => {
      if (m.categoria !== categoriaActiva) return false
      if (!q) return true
      return (
        m.nombre.toLowerCase().includes(q) ||
        m.subcategoria.toLowerCase().includes(q) ||
        (m.descripcion ?? "").toLowerCase().includes(q) ||
        (m.evento ?? "").toLowerCase().includes(q)
      )
    })
  }, [materiales, categoriaActiva, busqueda])

  // Agrupar por subcategoría (o evento para EVENTOS_PROYECTOS)
  const grupos = useMemo(() => {
    const esEventos = categoriaActiva === "EVENTOS_PROYECTOS"
    const map = new Map<string, MaterialDigitalType[]>()

    if (!esEventos) {
      // Respetar orden definido en SUBCATEGORIAS
      SUBCATEGORIAS[categoriaActiva].forEach(sub => map.set(sub, []))
    }

    materialesFiltrados.forEach(m => {
      const key = esEventos ? (m.evento ?? "Sin evento") : m.subcategoria
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    })

    // Si no es eventos, eliminar grupos vacíos que no tienen materiales
    if (!esEventos) {
      for (const [k, v] of map) {
        if (v.length === 0) map.delete(k)
      }
    }

    return map
  }, [materialesFiltrados, categoriaActiva])

  const totalCategoria = useMemo(
    () => materiales.filter(m => m.categoria === categoriaActiva).length,
    [materiales, categoriaActiva]
  )

  const guardar = async (payload: MaterialDigitalPayload) => {
    try {
      if (editando) {
        const u = await updateMaterialDigital(editando.documentId, payload)
        setMateriales(prev => prev.map(m => m.documentId === u.documentId ? u : m))
        toast.success("Actualizado")
      } else {
        const n = await createMaterialDigital(payload)
        setMateriales(prev => [...prev, n])
        toast.success("Material agregado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  const borrar = async (m: MaterialDigitalType) => {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return
    try {
      await deleteMaterialDigital(m.documentId)
      setMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  const abrirNuevo = () => { setEditando(null); setModalOpen(true) }
  const abrirEditar = (m: MaterialDigitalType) => { setEditando(m); setModalOpen(true) }

  const cfg = CATEGORIA_CONFIG[categoriaActiva]

  return (
    <div className="flex h-full min-h-0 -m-4 md:-m-6 bg-dot-pattern">

      {/* Sidebar de categorías — solo desktop */}
      <aside className="w-56 shrink-0 border-r border-slate-800/60 py-3 hidden lg:flex flex-col gap-3 bg-slate-950 overflow-y-auto">
        <SidebarGrupos
          categoriaActiva={categoriaActiva}
          materiales={materiales}
          onSelect={cat => { setCategoriaActiva(cat); setBusqueda("") }}
        />
      </aside>

      {/* Columna principal (scroll independiente) */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

        {/* Selector de categoría — mobile y tablet */}
        <div className="lg:hidden px-4 pt-4 pb-1">
          <select aria-label="Categoría" value={categoriaActiva}
            onChange={e => { setCategoriaActiva(e.target.value as CategoriaDigital); setBusqueda("") }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-200 outline-none focus:border-slate-600 transition">
            {GRUPOS_MATERIAL.map(g => (
              <optgroup key={g.id} label={g.label}>
                {g.categorias.map(c => (
                  <option key={c} value={c}>{CATEGORIA_CONFIG[c].label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-4 lg:p-6 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-100">{cfg.label}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalCategoria} {totalCategoria === 1 ? "material" : "materiales"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar…"
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-300 placeholder:text-slate-600 outline-none focus:border-slate-600 w-full sm:w-44 transition" />
              </div>
              <button type="button" onClick={abrirNuevo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shrink-0">
                <Plus size={13} /> Agregar
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
          ) : grupos.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen className="h-8 w-8 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">
                {busqueda ? "Sin resultados para esa búsqueda" : "Sin materiales en esta categoría"}
              </p>
              {!busqueda && (
                <button type="button" onClick={abrirNuevo}
                  className="mt-3 text-xs text-blue-500 hover:text-blue-400 underline underline-offset-2 transition">
                  Agregar el primero
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {[...grupos.entries()].map(([grupo, items]) => (
                <div key={grupo}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{grupo}</p>
                    <span className="text-[10px] text-slate-700">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map(m => (
                      <MaterialCard key={m.documentId} material={m}
                        onEdit={() => abrirEditar(m)}
                        onDelete={() => borrar(m)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal
          editando={editando}
          categoriaInicial={categoriaActiva}
          onGuardar={guardar}
          onCerrar={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
