"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, X, Check, Search, ExternalLink, Pencil, Trash2, Link2, ChevronDown } from "lucide-react"
import { SeccionHero } from "./shared"
import { useGetMaterialDigital } from "@/api/material-digital/getMaterialDigital"
import { createMaterialDigital, updateMaterialDigital, deleteMaterialDigital } from "@/api/material-digital/mutateMaterialDigital"
import { MaterialDigitalType, MaterialDigitalPayload, CategoriaDigital, CATEGORIA_CONFIG } from "@/types/material-digital"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"

// Únicas dos categorías de material-digital pensadas para enlaces (el resto
// del enum es para la biblioteca de assets de Gestión de marca).
const CATEGORIAS_ENLACE: CategoriaDigital[] = ["LINKS_UTILIDAD", "BASES_DATOS"]
const OPCIONES_CATEGORIA = CATEGORIAS_ENLACE.map(c => ({ value: c, label: CATEGORIA_CONFIG[c].label }))

function dominio(url: string): string {
  try { return new URL(url).hostname.replace("www.", "") } catch { return url }
}

// ─── Ícono del sitio (favicon real, con caída a un ícono genérico) ────────────

function EnlaceFavicon({ url, size = 20 }: { url: string; size?: number }) {
  const [error, setError] = useState(false)
  if (error) return <Link2 className="text-slate-400 shrink-0" style={{ width: size, height: size }} />
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=64&domain=${dominio(url)}`}
      alt=""
      className="shrink-0 rounded-sm"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  )
}

// ─── Formulario crear / editar ────────────────────────────────────────────────

type FormMode = { type: "create" } | { type: "edit"; item: MaterialDigitalType }

function ModalEnlace({ mode, onSave, onCancel }: {
  mode:     FormMode
  onSave:   (m: MaterialDigitalType) => void
  onCancel: () => void
}) {
  const editing = mode.type === "edit" ? mode.item : null

  const [nombre,      setNombre]      = useState(editing?.nombre ?? "")
  const [categoria,   setCategoria]   = useState<CategoriaDigital>(editing?.categoria ?? CATEGORIAS_ENLACE[0]!)
  const [url,         setUrl]         = useState(editing?.url ?? "")
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? "")
  const [saving,      setSaving]      = useState(false)

  const cerrarSiVacio = useModalBackdropClose({ nombre, categoria, url, descripcion }, onCancel)

  async function handleSave() {
    if (!nombre.trim() || !url.trim()) return
    setSaving(true)
    const payload: MaterialDigitalPayload = {
      nombre:       nombre.trim(),
      url:          url.trim(),
      categoria,
      subcategoria: nombre.trim(),
      tipo:         "link",
      descripcion:  descripcion.trim() || null,
      evento:       null,
      ambito:       "empresa",
    }
    try {
      const res = editing
        ? await updateMaterialDigital(editing.documentId, payload)
        : await createMaterialDigital(payload)
      onSave(res)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editing ? "Editar enlace" : "Nuevo enlace"}</h3>
          <button type="button" title="Cerrar" onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. App de contraseñas" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Categoría *</label>
            <DropdownPicker label="Categoría" value={categoria} onChange={v => setCategoria(v as CategoriaDigital)} options={OPCIONES_CATEGORIA} />
          </div>
          <div>
            <label className={labelCls}>URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Notas adicionales (opcional)" className={fieldCls} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={!nombre.trim() || !url.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 disabled:hover:bg-violet-600 disabled:cursor-not-allowed text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar enlace"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de enlace ─────────────────────────────────────────────────────────

function EnlaceCard({ m, onEdit, onDelete }: {
  m: MaterialDigitalType
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={() => window.open(m.url, "_blank", "noopener,noreferrer")}
      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <EnlaceFavicon url={m.url} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{m.nombre}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.descripcion || dominio(m.url)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onEdit} aria-label="Editar"
          className="p-1 text-slate-400 hover:text-violet-500 transition-colors">
          <Pencil size={13} />
        </button>
        <button type="button" onClick={onDelete} aria-label="Eliminar"
          className="p-1 text-slate-400 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Sección ────────────────────────────────────────────────────────────────

export function SeccionEnlaces() {
  const { materiales: todosLosMateriales, setMateriales: setTodosLosMateriales, loading } = useGetMaterialDigital("empresa")
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // El colectivo material-digitals de "empresa" también alimenta la
  // biblioteca de assets de Gestión de marca — aquí solo interesan los de
  // tipo "link".
  const materiales = useMemo(() => todosLosMateriales.filter(m => m.tipo === "link"), [todosLosMateriales])

  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return materiales.filter(m => !q || m.nombre.toLowerCase().includes(q) || (m.descripcion ?? "").toLowerCase().includes(q))
  }, [materiales, busqueda])

  const porCategoria = useMemo(() => (
    CATEGORIAS_ENLACE
      .map(cat => ({ cat, items: filtrados.filter(m => m.categoria === cat) }))
      .filter(g => g.items.length > 0)
  ), [filtrados])

  function abrirEnlace(m: MaterialDigitalType) {
    window.open(m.url, "_blank", "noopener,noreferrer")
    setDropdownOpen(false)
  }

  function handleSave(saved: MaterialDigitalType) {
    setTodosLosMateriales(prev =>
      formMode?.type === "edit"
        ? prev.map(x => x.documentId === saved.documentId ? saved : x)
        : [...prev, saved]
    )
    setFormMode(null)
  }

  async function handleDelete(m: MaterialDigitalType) {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return
    await deleteMaterialDigital(m.documentId)
    setTodosLosMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
  }

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Servicios y apps", "Enlaces"]}
        titulo="Enlaces"
        descripcion="Links de utilidad y accesos a bases de datos de medallitadeoro."
      />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700 w-64" />
          <div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full max-w-sm" ref={searchRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onFocus={() => setDropdownOpen(true)}
                placeholder="Buscar un enlace…"
                className="w-full pl-8 pr-8 h-9 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-violet-400 transition shadow-sm" />
              <button type="button" tabIndex={-1} onClick={() => setDropdownOpen(v => !v)}
                title="Ver todos los enlaces" aria-label="Ver todos los enlaces"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 max-h-72 overflow-y-auto py-1">
                  {filtrados.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Sin resultados.</p>
                  ) : (
                    filtrados.map(m => (
                      <button key={m.documentId} type="button" onClick={() => abrirEnlace(m)}
                        className="w-full flex items-center gap-2.5 text-left px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                        <EnlaceFavicon url={m.url} size={16} />
                        <span className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{m.nombre}</p>
                          <p className="text-[11px] text-slate-400 truncate">{dominio(m.url)}</p>
                        </span>
                        <ExternalLink size={12} className="text-slate-300 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setFormMode({ type: "create" })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shrink-0">
              <Plus size={15} /> Nuevo enlace
            </button>
          </div>

          {formMode && (
            <ModalEnlace mode={formMode} onSave={handleSave} onCancel={() => setFormMode(null)} />
          )}

          {porCategoria.length === 0 ? (
            <div className="text-center py-16 text-slate-600 dark:text-slate-400">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{busqueda ? "Sin resultados para esa búsqueda." : "Sin enlaces registrados todavía."}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {porCategoria.map(({ cat, items }) => (
                <div key={cat}>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-violet-500" />
                    {CATEGORIA_CONFIG[cat].label}
                    <span className="font-normal normal-case text-slate-400">({items.length})</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(m => (
                      <EnlaceCard key={m.documentId} m={m}
                        onEdit={() => setFormMode({ type: "edit", item: m })}
                        onDelete={() => handleDelete(m)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
