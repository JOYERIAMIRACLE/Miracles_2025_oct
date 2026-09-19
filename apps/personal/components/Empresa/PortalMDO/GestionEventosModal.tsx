"use client"
import { useState, useEffect, useRef } from "react"
import { Plus, X, Check, Trash2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import type { EventoEmpresaType } from "@/types/evento-empresa"
import { useGetAllEventosEmpresa } from "@/api/evento-empresa/getEventosEmpresa"
import { createEventoEmpresa, updateEventoEmpresa, deleteEventoEmpresa, type EventoEmpresaPayload } from "@/api/evento-empresa/mutateEventoEmpresa"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { fieldCls } from "@/lib/styles"

const ymdToDate = (s: string): Date | null => s ? new Date(`${s}T00:00:00Z`) : null
const dateToYmd = (d: Date): string => d.toISOString().slice(0, 10)

function emptyForm(override?: Partial<EventoEmpresaPayload>): EventoEmpresaPayload {
  return { titulo: "", fecha: "", descripcion: null, seccion: null, activo: true, ...override }
}

function fmtFecha(fechaStr: string) {
  if (!fechaStr) return ""
  const d = new Date(fechaStr + "T12:00:00")
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

/**
 * Portado de sdi-portal/components/Trabajo/portal/GestionEventosModal.tsx —
 * mismo modal lista→edición CRUD, con las adaptaciones ya establecidas en
 * GestionAvisosModal (MDO): confirmación de borrado inline (dos pasos, sin
 * lib/confirm — no existe en MDO), `useGetAllEventosEmpresa` en vez de un
 * fetch privado, violeta en vez de naranja, sin selector de color (un solo
 * acento). Se agregan descripción/sección al formulario (existen en el
 * schema pero sdi-portal no las editaba desde aquí).
 *
 * fechaInicial (YYYY-MM-DD): al abrir desde un día del calendario de Inicio
 * — si ese día ya tiene eventos se queda en la lista para que los
 * encuentres ahí, si no, salta directo al formulario de "Nuevo evento" con
 * la fecha ya puesta.
 */
export function GestionEventosModal({ onClose, onUpdated, fechaInicial }: { onClose: () => void; onUpdated: () => void; fechaInicial?: string }) {
  const { eventos, loading, reload } = useGetAllEventosEmpresa()
  const [view,     setView]     = useState<"list" | "edit">("list")
  const [editando, setEditando] = useState<EventoEmpresaType | null>(null)
  const [form,     setForm]     = useState<EventoEmpresaPayload>(emptyForm())
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const prefillAplicado = useRef(false)

  useEffect(() => {
    if (!fechaInicial || loading || prefillAplicado.current) return
    prefillAplicado.current = true
    if (!eventos.some(e => e.fecha === fechaInicial)) {
      setForm(emptyForm({ fecha: fechaInicial }))
      setEditando(null)
      setErrors({})
      setView("edit")
    }
  }, [fechaInicial, loading, eventos])

  function openEdit(e: EventoEmpresaType | null) {
    if (e) setForm({ titulo: e.titulo, fecha: e.fecha, descripcion: e.descripcion, seccion: e.seccion, activo: e.activo })
    else setForm(emptyForm())
    setEditando(e)
    setErrors({})
    setConfirmandoEliminar(false)
    setView("edit")
  }

  async function guardar() {
    const errs: Record<string, string> = {}
    if (!form.titulo.trim()) errs.titulo = "Requerido"
    if (!form.fecha)         errs.fecha  = "Requerida"
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      const payload: EventoEmpresaPayload = { ...form, titulo: form.titulo.trim(),
        descripcion: form.descripcion?.trim() || null, seccion: form.seccion?.trim() || null }
      if (editando) await updateEventoEmpresa(editando.documentId, payload)
      else await createEventoEmpresa(payload)
      toast.success(editando ? "Evento actualizado" : "Evento creado")
      reload(); onUpdated(); setView("list")
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  async function handleEliminar(e: EventoEmpresaType) {
    setDeleting(true)
    try { await deleteEventoEmpresa(e.documentId); toast.success("Eliminado"); reload(); onUpdated(); setView("list") }
    catch (err) { toast.error(`Error · ${(err as Error).message}`) }
    finally { setDeleting(false); setConfirmandoEliminar(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-white dark:bg-[#2a1b3d] rounded-2xl shadow-2xl overflow-hidden mb-10">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {view === "edit" && (
              <button type="button" onClick={() => setView("list")}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm flex items-center gap-1 transition">
                ← Lista
              </button>
            )}
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {view === "list" ? "Eventos · Portal Medalla de oro" : editando ? "Editar evento" : "Nuevo evento"}
            </h2>
            {view === "list" && !loading && (
              <span className="text-[10px] bg-slate-100 dark:bg-[#2a1b3d] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{eventos.length}</span>
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
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a1b3d] transition">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {view === "list" && (
            <div className="space-y-2">
              {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
              {!loading && eventos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Sin eventos. Crea el primero.</p>
              )}
              {eventos.map(e => (
                <button key={e.documentId} type="button" onClick={() => openEdit(e)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2a1b3d] hover:border-slate-300 transition-colors text-left">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${e.activo ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through"}`}>{e.titulo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtFecha(e.fecha)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {view === "edit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Título <span className="text-violet-500">*</span>
                  </label>
                  <input autoFocus value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ej. Aniversario Medalla de Oro"
                    className={`${fieldCls} ${errors.titulo ? "border-red-300 ring-1 ring-red-200" : ""}`} />
                  {errors.titulo && <p className="text-[11px] text-red-500 mt-0.5">{errors.titulo}</p>}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Fecha <span className="text-violet-500">*</span>
                  </label>
                  <CalendarioPicker value={ymdToDate(form.fecha)} label="Fecha" className={`w-full ${errors.fecha ? "border-red-300" : ""}`}
                    onChange={d => setForm(f => ({ ...f, fecha: dateToYmd(d) }))}
                    onClear={() => setForm(f => ({ ...f, fecha: "" }))} />
                  {errors.fecha && <p className="text-[11px] text-red-500 mt-0.5">{errors.fecha}</p>}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Descripción</label>
                  <textarea value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                    rows={3} placeholder="Detalle opcional del evento..."
                    className={`${fieldCls} h-auto resize-y py-2`} />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input id="activo" type="checkbox" checked={form.activo}
                    onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                    className="h-4 w-4 accent-violet-500" />
                  <label htmlFor="activo" className="text-xs font-medium text-slate-600 dark:text-slate-300">Activo (visible en el calendario)</label>
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
          )}
        </div>
      </div>
    </div>
  )
}
