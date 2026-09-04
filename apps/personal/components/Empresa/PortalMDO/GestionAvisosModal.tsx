"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, X, Check, Trash2, Camera, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import type { AvisoType, AvisoColor } from "@/types/aviso"
import type { AvisoPayload } from "@/api/aviso/mutateAviso"
import { useGetAllAvisos } from "@/api/aviso/getAvisos"
import { createAviso, updateAviso, deleteAviso } from "@/api/aviso/mutateAviso"
import { uploadMedia } from "@/lib/upload"

const fieldCls = "w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm px-3 outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40 focus:border-violet-400"

export const AVISO_COLOR_HEX: Record<AvisoColor, string> = {
  violet: "#8b5cf6", emerald: "#10b981", blue: "#3b82f6",
  orange: "#f97316", red: "#ef4444", amber: "#f59e0b",
}
// El carrusel público (HeroCarusel) solo distingue violeta (default) de rojo
// (alerta real) — el resto de AvisoColor sigue existiendo por avisos viejos
// ya guardados con ese valor, pero el picker solo ofrece las dos opciones
// que de verdad cambian algo, para no prometer un color que no se va a ver.
export const AVISO_COLORS: AvisoColor[] = ["violet", "red"]

function colorAleatorio(): AvisoColor {
  return AVISO_COLORS[Math.floor(Math.random() * AVISO_COLORS.length)]
}

export function emptyAvisoForm(override?: Partial<AvisoPayload>): AvisoPayload {
  return { titulo: "", desc: "", area: "", color: colorAleatorio(), autor: null, vigencia: null, activo: true, orden: 0, ...override }
}

export function GestionAvisosModal({ onClose, onUpdated }: { onClose: () => void; onUpdated: () => void }) {
  const { avisos, loading, reload } = useGetAllAvisos()
  const [view,     setView]     = useState<"list" | "edit">("list")
  const [editando, setEditando] = useState<AvisoType | null>(null)
  const [form,     setForm]     = useState<AvisoPayload>(emptyAvisoForm())
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [imagenFile,    setImagenFile]    = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string>("")
  const [editImagenUrl, setEditImagenUrl] = useState<string>("")
  const imagenRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (imagenPreview) URL.revokeObjectURL(imagenPreview) }, [imagenPreview])

  function handleImagenSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagenPreview) URL.revokeObjectURL(imagenPreview)
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  function openEdit(aviso: AvisoType | null) {
    if (aviso) {
      setForm({ titulo: aviso.titulo, desc: aviso.desc, area: aviso.area,
        color: aviso.color, autor: aviso.autor, vigencia: aviso.vigencia, activo: aviso.activo, orden: aviso.orden })
      setEditImagenUrl(aviso.imagen?.url ?? "")
    } else {
      setForm(emptyAvisoForm({ orden: avisos.length }))
      setEditImagenUrl("")
    }
    setImagenFile(null)
    setImagenPreview("")
    setEditando(aviso)
    setView("edit")
  }

  async function guardar() {
    const errs: Record<string, string> = {}
    if (!form.titulo.trim()) errs.titulo = "Requerido"
    if (!form.desc.trim())   errs.desc   = "Requerida"
    if (!form.area.trim())   errs.area   = "Requerida"
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      let imagenId: number | undefined
      if (imagenFile) imagenId = (await uploadMedia(imagenFile)).id
      const payload: AvisoPayload = { ...form, titulo: form.titulo.trim(), desc: form.desc.trim(),
        area: form.area.trim(), autor: form.autor?.trim() || null, vigencia: form.vigencia || null,
        ...(imagenId !== undefined ? { imagen: imagenId } : {}) }
      if (editando) await updateAviso(editando.documentId, payload)
      else await createAviso(payload)
      toast.success(editando ? "Comunicado actualizado" : "Comunicado creado")
      reload(); onUpdated(); setView("list")
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  async function handleEliminar(a: AvisoType) {
    setDeleting(true)
    try { await deleteAviso(a.documentId); toast.success("Eliminado"); reload(); onUpdated(); setView("list") }
    catch (e) { toast.error(`Error al eliminar · ${(e as Error).message}`) }
    finally { setDeleting(false); setConfirmandoEliminar(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {view === "edit" && (
              <button type="button" onClick={() => setView("list")}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm flex items-center gap-1 transition">
                ← Lista
              </button>
            )}
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {view === "list" ? "Comunicados · Portal Medalla de oro" : editando ? "Editar comunicado" : "Nuevo comunicado"}
            </h2>
            {view === "list" && !loading && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{avisos.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view === "list" && (
              <button type="button" onClick={() => openEdit(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition">
                <Plus size={12} /> Nuevo
              </button>
            )}
            <button type="button" onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {view === "list" && (
            <div className="space-y-2">
              {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
              {!loading && avisos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Sin comunicados. Crea el primero.</p>
              )}
              {avisos.map(a => (
                <button key={a.documentId} type="button" onClick={() => openEdit(a)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-colors text-left">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: AVISO_COLOR_HEX[a.color] }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${a.activo ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through"}`}>{a.titulo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{a.area}{a.autor ? ` · ${a.autor}` : ""}{a.vigencia ? ` · hasta ${a.vigencia}` : ""}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">#{a.orden}</span>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {view === "edit" && (
            <div className="flex gap-5">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                      Título <span className="text-violet-500">*</span>
                    </label>
                    <input autoFocus value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                      placeholder="Ej. Nueva colección disponible..."
                      className={`${fieldCls} ${errors.titulo ? "border-red-300 ring-1 ring-red-200" : ""}`} />
                    {errors.titulo && <p className="text-[11px] text-red-500 mt-0.5">{errors.titulo}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                      Descripción <span className="text-violet-500">*</span>
                    </label>
                    <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      rows={6} placeholder="Descripción del comunicado..."
                      className={`${fieldCls} h-auto resize-y py-2 ${errors.desc ? "border-red-300 ring-1 ring-red-200" : ""}`} />
                    {errors.desc && <p className="text-[11px] text-red-500 mt-0.5">{errors.desc}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                      Área <span className="text-violet-500">*</span>
                    </label>
                    <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="Ej. Comercial · COMUNICADO"
                      className={`${fieldCls} ${errors.area ? "border-red-300 ring-1 ring-red-200" : ""}`} />
                    {errors.area && <p className="text-[11px] text-red-500 mt-0.5">{errors.area}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Imagen del comunicado</label>
                    <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                      onClick={() => imagenRef.current?.click()}>
                      {imagenPreview || editImagenUrl ? (
                        <img src={imagenPreview || editImagenUrl} alt="Imagen" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <Camera className="h-5 w-5 text-slate-400" />
                          <p className="text-xs text-slate-400">Subir imagen</p>
                        </div>
                      )}
                      {(imagenPreview || editImagenUrl) && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>
                    <input ref={imagenRef} type="file" accept="image/*" onChange={handleImagenSelect} className="hidden" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Autor</label>
                    <input value={form.autor ?? ""} onChange={e => setForm(f => ({ ...f, autor: e.target.value || null }))}
                      placeholder="Ej. Ricardo" className={fieldCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Vigencia</label>
                    <input type="date" value={form.vigencia ?? ""} min={new Date().toISOString().slice(0, 10)}
                      onChange={e => setForm(f => ({ ...f, vigencia: e.target.value || null }))}
                      className={fieldCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Color</label>
                    <div className="flex items-center gap-1.5">
                      {AVISO_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                          className={`h-6 w-6 rounded-full shrink-0 transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900" : ""}`}
                          style={{ background: AVISO_COLOR_HEX[c] }} aria-label={c} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input id="activo" type="checkbox" checked={form.activo}
                      onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                      className="h-4 w-4 accent-violet-500" />
                    <label htmlFor="activo" className="text-xs font-medium text-slate-600 dark:text-slate-300">Activo (visible en el carrusel)</label>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {editando ? (
                    confirmandoEliminar ? (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">¿Eliminar?</span>
                        <button type="button" onClick={() => handleEliminar(editando)} disabled={deleting}
                          className="text-[11px] text-red-500 dark:text-red-400 font-medium disabled:opacity-50">
                          {deleting ? "Eliminando..." : "Sí"}
                        </button>
                        <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={deleting}
                          className="text-[11px] text-slate-500 dark:text-slate-400">No</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmandoEliminar(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                        <Trash2 size={14} />Eliminar
                      </button>
                    )
                  ) : <span />}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setView("list")}
                      className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg transition">
                      Cancelar
                    </button>
                    <button type="button" onClick={guardar} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
                      <Check size={14} />
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex flex-col gap-2 w-52 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vista previa</p>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm" style={{ borderLeftColor: AVISO_COLOR_HEX[form.color], borderLeftWidth: "4px" }}>
                  {(imagenPreview || editImagenUrl) && (
                    <img src={imagenPreview || editImagenUrl} alt="" className="w-full h-24 object-cover" />
                  )}
                  <div className="p-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: AVISO_COLOR_HEX[form.color] }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{form.area || "ÁREA"}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                      {form.titulo || "Título del comunicado"}
                    </p>
                    {form.desc && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">{form.desc}</p>
                    )}
                    {form.autor && <p className="text-[10px] text-slate-400 mt-2">Por {form.autor}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
