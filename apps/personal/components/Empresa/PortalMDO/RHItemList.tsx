"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight, Settings2, Search, Paperclip, Download, Plus, X, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "./shared"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetRHItems, useGetAllRHItems } from "@/api/rh-item/getRHItems"
import { createRHItem, updateRHItem, deleteRHItem } from "@/api/rh-item/mutateRHItem"
import { uploadMedia } from "@/lib/upload"
import type { RHItemType, RHItemTipo, RHCaracteristica } from "@/types/rhItem"

function formatKB(kb: number): string {
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

function ItemRow({ item }: { item: RHItemType }) {
  const [abierto, setAbierto] = useState(false)
  const caracteristicas = (item.caracteristicas ?? []).filter(c => c.label || c.valor)
  const archivos = item.archivos ?? []

  return (
    <div>
      <div role="button" tabIndex={0} onClick={() => setAbierto(o => !o)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAbierto(o => !o) } }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${abierto ? "bg-slate-50 dark:bg-slate-800/60" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.nombre}</p>
          {item.subtitulo && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug mt-0.5">{item.subtitulo}</p>}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </div>
      {abierto && (
        <div className="px-4 pt-3 pb-4">
          {caracteristicas.length === 0 && archivos.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6 rounded-xl bg-slate-50 dark:bg-slate-800/40">Sin más detalles capturados.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 p-4 space-y-4">
              {caracteristicas.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  {caracteristicas.map((c, i) => (
                    <div key={i} className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{c.label}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{c.valor}</p>
                    </div>
                  ))}
                </div>
              )}
              {archivos.length > 0 && (
                <div className={caracteristicas.length > 0 ? "pt-4 border-t border-slate-200 dark:border-slate-700" : ""}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Archivos adjuntos</p>
                  <div className="flex flex-wrap gap-2">
                    {archivos.map(a => (
                      <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:border-violet-300 dark:hover:border-violet-500/60 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{a.name}</span>
                        <Download className="h-3 w-3 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function emptyForm(tipo: RHItemTipo) {
  return { nombre: "", subtitulo: "", tipo, caracteristicas: [] as RHCaracteristica[], activo: true }
}

function GestionModal({ tipo, titulo, onClose, onUpdated }: { tipo: RHItemTipo; titulo: string; onClose: () => void; onUpdated: () => void }) {
  const { items, loading, reload } = useGetAllRHItems(tipo)
  const [view, setView] = useState<"list" | "edit">("list")
  const [editando, setEditando] = useState<RHItemType | null>(null)
  const [form, setForm] = useState(emptyForm(tipo))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [archivosExistentes, setArchivosExistentes] = useState<{ id: number; name: string; size: number }[]>([])
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([])
  const archivoRef = useRef<HTMLInputElement>(null)

  function openEdit(item: RHItemType | null) {
    if (item) {
      setForm({ nombre: item.nombre, subtitulo: item.subtitulo ?? "", tipo, caracteristicas: item.caracteristicas ?? [], activo: item.activo })
      setArchivosExistentes((item.archivos ?? []).map(a => ({ id: a.id, name: a.name, size: a.size })))
    } else {
      setForm(emptyForm(tipo))
      setArchivosExistentes([])
    }
    setArchivosNuevos([])
    setEditando(item)
    setErrors({})
    setView("edit")
  }

  function agregarCaracteristica() {
    setForm(f => ({ ...f, caracteristicas: [...f.caracteristicas, { label: "", valor: "" }] }))
  }
  function actualizarCaracteristica(i: number, campo: "label" | "valor", valor: string) {
    setForm(f => ({ ...f, caracteristicas: f.caracteristicas.map((c, idx) => idx === i ? { ...c, [campo]: valor } : c) }))
  }
  function quitarCaracteristica(i: number) {
    setForm(f => ({ ...f, caracteristicas: f.caracteristicas.filter((_, idx) => idx !== i) }))
  }
  function handleArchivosSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) setArchivosNuevos(prev => [...prev, ...files])
    e.target.value = ""
  }

  async function guardar() {
    if (!form.nombre.trim()) { setErrors({ nombre: "Requerido" }); return }
    setErrors({})
    setSaving(true)
    try {
      const nuevosIds = await Promise.all(archivosNuevos.map(f => uploadMedia(f).then(r => r.id)))
      const payload = {
        nombre: form.nombre.trim(),
        subtitulo: form.subtitulo.trim(),
        tipo,
        caracteristicas: form.caracteristicas.map(c => ({ label: c.label.trim(), valor: c.valor.trim() })).filter(c => c.label || c.valor),
        archivos: [...archivosExistentes.map(a => a.id), ...nuevosIds],
        activo: form.activo,
        ...(editando ? {} : { orden: items.length }),
      }
      if (editando) await updateRHItem(editando.documentId, payload)
      else await createRHItem(payload)
      toast.success(editando ? "Actualizado" : "Creado")
      onUpdated(); await reload(); setView("list")
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  async function handleEliminar() {
    if (!editando) return
    if (!window.confirm(`¿Eliminar "${editando.nombre}"?`)) return
    setDeleting(true)
    try { await deleteRHItem(editando.documentId); toast.success("Eliminado"); onUpdated(); await reload(); setView("list") }
    catch (e) { toast.error(`Error · ${(e as Error).message}`) }
    finally { setDeleting(false) }
  }

  const labelCls = "text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block"
  const fieldCls = "w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm px-3 outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40 focus:border-violet-400"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-2xl space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {view === "list" ? titulo : editando ? `Editar` : `Nuevo`}
            </h2>
            {view === "list" && !loading && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{items.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {view === "list" && (
              <button type="button" onClick={() => openEdit(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition mr-1">
                <Plus size={12} /> Nuevo
              </button>
            )}
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {view === "list" && (
          <div className="space-y-2">
            {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
            {!loading && items.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Sin registros. Crea el primero.</p>}
            {items.map(item => (
              <button key={item.documentId} type="button" onClick={() => openEdit(item)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate text-slate-800 dark:text-slate-100">{item.nombre}</p>
                  {item.subtitulo && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.subtitulo}</p>}
                </div>
                {!item.activo && <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-400">Inactivo</span>}
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {view === "edit" && (
          <div className="space-y-5">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <label className={labelCls}>Nombre <span className="text-violet-500">*</span></label>
                <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={`${fieldCls} ${errors.nombre ? "border-red-300 ring-1 ring-red-200" : ""}`} />
                {errors.nombre && <p className="text-[11px] text-red-500 mt-0.5">{errors.nombre}</p>}
              </div>
              <div className="col-span-12">
                <label className={labelCls}>Descripción corta</label>
                <input value={form.subtitulo} onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))} className={fieldCls} />
              </div>
              <div className="col-span-12 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos</p>
                <button type="button" onClick={agregarCaracteristica}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition">
                  <Plus size={12} /> Agregar dato
                </button>
              </div>
              {form.caracteristicas.length === 0 ? (
                <div className="col-span-12">
                  <p className="text-xs text-slate-400">Sin datos capturados. Usa "Agregar dato" para crear uno.</p>
                </div>
              ) : (
                <div className="col-span-12 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {form.caracteristicas.map((c, i) => (
                    <div key={i} className="p-3 space-y-2 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <input value={c.label} onChange={e => actualizarCaracteristica(i, "label", e.target.value)}
                          placeholder="Ej. ¿Qué cubre?" className={`w-full max-w-[220px] text-sm font-semibold ${fieldCls}`} />
                        <button type="button" onClick={() => quitarCaracteristica(i)}
                          className="ml-auto h-9 w-9 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                      <textarea rows={2} value={c.valor} onChange={e => actualizarCaracteristica(i, "valor", e.target.value)}
                        className={`w-full ${fieldCls} h-auto py-2 leading-relaxed resize-y`} />
                    </div>
                  ))}
                </div>
              )}
              <div className="col-span-12 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className={labelCls}>Archivos</label>
                {archivosExistentes.length === 0 && archivosNuevos.length === 0 ? (
                  <button type="button" onClick={() => archivoRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-3 text-sm border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400">
                    <Plus size={13} /> Agregar archivo
                  </button>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {archivosExistentes.map(a => (
                      <div key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                        <Paperclip size={13} className="shrink-0 text-slate-400" />
                        <span className="flex-1 min-w-0 truncate">{a.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{formatKB(a.size)}</span>
                        <button type="button" onClick={() => setArchivosExistentes(prev => prev.filter(x => x.id !== a.id))}
                          className="text-slate-300 hover:text-red-500 transition shrink-0"><X size={13} /></button>
                      </div>
                    ))}
                    {archivosNuevos.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">
                        <Paperclip size={13} className="shrink-0 text-violet-400" />
                        <span className="flex-1 min-w-0 truncate">{f.name}</span>
                        <button type="button" onClick={() => setArchivosNuevos(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-violet-400 hover:text-red-500 transition shrink-0"><X size={13} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => archivoRef.current?.click()}
                      className="w-full flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400">
                      <Plus size={13} /> Agregar archivo
                    </button>
                  </div>
                )}
                <input ref={archivoRef} type="file" multiple accept=".pdf,.doc,.docx,image/*" onChange={handleArchivosSelect} className="hidden" />
              </div>
              <div className="col-span-12 flex items-center gap-2 pt-2">
                <input id="rh-item-activo" type="checkbox" checked={form.activo}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="h-4 w-4 accent-violet-500" />
                <label htmlFor="rh-item-activo" className="text-sm text-slate-600 dark:text-slate-300">Activo (visible en el portal)</label>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {editando ? (
                <button type="button" onClick={handleEliminar} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 rounded-lg transition-colors">
                  <Trash2 size={14} />{deleting ? "Eliminando..." : "Eliminar"}
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setView("list")}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={guardar} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                  <Check size={14} />{saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RHItemList({ tipo, titulo, intro }: { tipo: RHItemTipo; titulo: string; intro: string }) {
  const { items, loading, reload } = useGetRHItems(tipo)
  const [busqueda, setBusqueda] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [gestionOpen, setGestionOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropdownOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  const filtrados = items.filter(p =>
    !busqueda.trim() || p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) || (p.subtitulo ?? "").toLowerCase().includes(busqueda.trim().toLowerCase())
  )

  if (loading) {
    return (
      <Card className="p-0! overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700"><Skeleton className="h-9 w-full max-w-xs rounded-lg" /></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-40 rounded" /><Skeleton className="h-2.5 w-56 rounded" /></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{intro}</p>

      {items.length === 0 ? (
        <Card className="text-center py-10! space-y-3">
          <p className="text-sm text-slate-400">Aún no hay {titulo.toLowerCase()} capturadas.</p>
          <button type="button" onClick={() => setGestionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition">
            <Settings2 className="h-3.5 w-3.5" /> Gestionar {titulo.toLowerCase()}
          </button>
        </Card>
      ) : (
        <Card className="p-0! overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="relative flex-1 max-w-xs" ref={searchRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onFocus={() => setDropdownOpen(true)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 transition-colors" />
              <button type="button" tabIndex={-1} onClick={() => setDropdownOpen(o => !o)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-20 max-h-64 overflow-y-auto py-1">
                  {items.map(p => (
                    <button key={p.documentId} type="button" onClick={() => { setBusqueda(p.nombre); setDropdownOpen(false) }}
                      className="w-full text-left px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{p.nombre}</p>
                      {p.subtitulo && <p className="text-xs text-slate-400 truncate">{p.subtitulo}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setGestionOpen(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0">
              <Settings2 className="h-3.5 w-3.5" /> Gestionar
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtrados.length === 0
              ? <p className="text-sm text-slate-400 text-center py-8">Sin resultados.</p>
              : filtrados.map(item => <ItemRow key={item.documentId} item={item} />)}
          </div>
        </Card>
      )}

      {gestionOpen && <GestionModal tipo={tipo} titulo={titulo} onClose={() => setGestionOpen(false)} onUpdated={reload} />}
    </div>
  )
}
