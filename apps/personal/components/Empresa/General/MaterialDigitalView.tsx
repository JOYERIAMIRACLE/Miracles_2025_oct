"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, HardDrive, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { useGetMaterialDigital } from "@/api/material-digital/getMaterialDigital"
import { createMaterialDigital, updateMaterialDigital, deleteMaterialDigital } from "@/api/material-digital/mutateMaterialDigital"
import {
  MaterialDigitalType, MaterialDigitalPayload,
  TipoMaterial, TIPOS_MATERIAL, TIPO_CONFIG,
  CategoriaDigital, CATEGORIAS_DIGITAL, CATEGORIA_CONFIG, SUBCATEGORIAS,
} from "@/types/material-digital"

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"

function emptyForm(): MaterialDigitalPayload {
  return { nombre: "", tipo: "documento", url: "", categoria: "BRANDING", subcategoria: "", descripcion: null, evento: null }
}

export function MaterialDigitalView() {
  const { materiales, setMateriales, loading } = useGetMaterialDigital()

  const [filtroCat, setFiltroCat] = useState<CategoriaDigital | "todos">("todos")
  const [collapsed,  setCollapsed]  = useState<Record<string, boolean>>({})
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<MaterialDigitalType | null>(null)
  const [form,       setForm]       = useState<MaterialDigitalPayload>(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [delId,      setDelId]      = useState<string | null>(null)

  const filtrados = useMemo(() =>
    filtroCat === "todos" ? materiales : materiales.filter(m => m.categoria === filtroCat),
    [materiales, filtroCat]
  )

  const porCategoria = useMemo(() =>
    CATEGORIAS_DIGITAL.map(cat => ({
      cat,
      items: filtrados.filter(m => m.categoria === cat),
    })).filter(g => filtroCat === "todos" ? g.items.length > 0 : g.cat === filtroCat),
    [filtrados, filtroCat]
  )

  const subcatOpciones = useMemo(() =>
    SUBCATEGORIAS[form.categoria as CategoriaDigital] ?? [],
    [form.categoria]
  )

  function toggleCollapse(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  function openNuevo() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEditar(m: MaterialDigitalType) {
    setEditing(m)
    setForm({ nombre: m.nombre, tipo: m.tipo, url: m.url, categoria: m.categoria, subcategoria: m.subcategoria, descripcion: m.descripcion, evento: m.evento })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateMaterialDigital(editing.documentId, form)
        setMateriales(prev => prev.map(m => m.documentId === editing.documentId ? updated : m))
        toast.success("Material actualizado")
      } else {
        const nuevo = await createMaterialDigital(form)
        setMateriales(prev => [...prev, nuevo])
        toast.success("Material creado")
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
      await deleteMaterialDigital(documentId)
      setMateriales(prev => prev.filter(m => m.documentId !== documentId))
      toast.success("Material eliminado")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Material Digital</h1>
          <p className="text-sm text-slate-500 mt-0.5">Links, archivos y recursos digitales de la empresa</p>
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 transition-colors">
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setFiltroCat("todos")}
          className={`h-7 px-3 text-xs rounded-lg border transition-colors ${
            filtroCat === "todos"
              ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
              : "border-slate-700 text-slate-500 hover:text-slate-300"
          }`}>
          Todos ({materiales.length})
        </button>
        {CATEGORIAS_DIGITAL.map(cat => {
          const cfg = CATEGORIA_CONFIG[cat]
          const count = materiales.filter(m => m.categoria === cat).length
          return (
            <button key={cat} type="button" onClick={() => setFiltroCat(cat)}
              className={`h-7 px-3 text-xs rounded-lg border transition-colors ${
                filtroCat === cat
                  ? cfg.accent
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-16 text-center text-slate-600">
          <HardDrive size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{filtroCat === "todos" ? "Sin materiales registrados." : "Sin materiales en esta categoría."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {porCategoria.map(({ cat, items }) => {
            const cfg = CATEGORIA_CONFIG[cat]
            const isCollapsed = collapsed[cat]
            return (
              <div key={cat} className="rounded-xl border border-slate-800 overflow-hidden">
                <button type="button" onClick={() => toggleCollapse(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg.accent}`}>{cfg.label}</span>
                    <span className="text-xs text-slate-500">{items.length} archivo{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  {isCollapsed ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-slate-950/30">
                    {items.map(m => {
                      const tipoCfg = TIPO_CONFIG[m.tipo]
                      return (
                        <div key={m.documentId}
                          className="group bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">{m.nombre}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border ${tipoCfg.badge}`}>
                                  {tipoCfg.label}
                                </span>
                                {m.subcategoria && (
                                  <span className="text-[10px] text-slate-500">{m.subcategoria}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button type="button" title="Editar" onClick={() => openEditar(m)}
                                className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                                <Pencil size={13} />
                              </button>
                              {delId === m.documentId ? (
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => handleDelete(m.documentId)}
                                    className="text-[11px] text-red-400 hover:text-red-300 font-medium px-1">Sí</button>
                                  <button type="button" onClick={() => setDelId(null)}
                                    className="text-[11px] text-slate-500 px-1">No</button>
                                </div>
                              ) : (
                                <button type="button" title="Eliminar" onClick={() => setDelId(m.documentId)}
                                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {m.descripcion && <p className="text-xs text-slate-500 line-clamp-2">{m.descripcion}</p>}

                          {m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors truncate">
                              <ExternalLink size={11} className="shrink-0" />
                              <span className="truncate">{m.url}</span>
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar material" : "Nuevo material"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input title="Nombre" type="text" placeholder="Ej. Logo principal SVG" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                  <select title="Categoría" value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaDigital, subcategoria: "" }))}
                    className={inp + " cursor-pointer"}>
                    {CATEGORIAS_DIGITAL.map(c => (
                      <option key={c} value={c}>{CATEGORIA_CONFIG[c].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select title="Tipo" value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoMaterial }))}
                    className={inp + " cursor-pointer"}>
                    {TIPOS_MATERIAL.map(t => (
                      <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {subcatOpciones.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Subcategoría</label>
                  <select title="Subcategoría" value={form.subcategoria}
                    onChange={e => setForm(f => ({ ...f, subcategoria: e.target.value }))}
                    className={inp + " cursor-pointer"}>
                    <option value="">— Sin subcategoría —</option>
                    {subcatOpciones.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">URL / Link</label>
                <input title="URL" type="url" placeholder="https://drive.google.com/..." value={form.url ?? ""}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value || "" }))} className={inp} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                <input title="Descripción" type="text" placeholder="Breve descripción…" value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 transition">
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
