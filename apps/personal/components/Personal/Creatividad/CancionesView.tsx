"use client"

import { useState, useMemo } from "react"
import { Music, Plus, X, Check, Pencil, Trash2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useGetCanciones, createCancion, updateCancion, deleteCancion } from "@/api/cancion/getCanciones"
import {
  Cancion, CancionPayload,
  ESTADOS_CANCION, ESTADO_CANCION_LABEL, ESTADO_CANCION_COLOR, EstadoCancion,
} from "@/types/cancion"

const inp = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
const lbl = "block text-[11px] font-medium text-slate-400 mb-1"

function emptyForm(): CancionPayload {
  return { titulo: "", estilo: null, estado: "en_proceso", slogan: null, hookPrincipal: null, referencias: null, letra: null, notasProceso: null }
}

export function CancionesView() {
  const { canciones, setCanciones, loading } = useGetCanciones()
  const [filtroEstado, setFiltroEstado] = useState<EstadoCancion | "">("")
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<Cancion | null>(null)
  const [form,         setForm]         = useState<CancionPayload>(emptyForm())
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const filtradas = useMemo(() =>
    canciones.filter(c => !filtroEstado || c.estado === filtroEstado),
  [canciones, filtroEstado])

  function abrir(c?: Cancion) {
    setEditando(c ?? null)
    setForm(c ? {
      titulo: c.titulo, estilo: c.estilo, estado: c.estado, slogan: c.slogan,
      hookPrincipal: c.hookPrincipal, referencias: c.referencias, letra: c.letra, notasProceso: c.notasProceso,
    } : emptyForm())
    setModalOpen(true)
  }

  async function guardar() {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    try {
      if (editando) {
        const u = await updateCancion(editando.documentId, form)
        setCanciones(prev => prev.map(c => c.documentId === u.documentId ? u : c))
        toast.success("Actualizada")
      } else {
        const n = await createCancion(form)
        setCanciones(prev => [n, ...prev])
        toast.success("Canción creada")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally { setSaving(false) }
  }

  async function borrar(c: Cancion) {
    if (!confirm(`¿Eliminar "${c.titulo}"?`)) return
    setDeletingId(c.documentId)
    try {
      await deleteCancion(c.documentId)
      setCanciones(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Eliminada")
    } catch { toast.error("Error al eliminar") }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Music className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Música</h1>
            <p className="text-xs text-slate-500">{canciones.length} canciones en proceso</p>
          </div>
        </div>
        <button onClick={() => abrir()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Nueva canción
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltroEstado("")}
          className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroEstado === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
          Todas
        </button>
        {ESTADOS_CANCION.map(e => (
          <button key={e} onClick={() => setFiltroEstado(filtroEstado === e ? "" : e)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroEstado === e ? ESTADO_CANCION_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
            {ESTADO_CANCION_LABEL[e]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-14 text-slate-600">
          <Music size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin canciones{filtroEstado ? " en este estado" : ""}.</p>
          <button onClick={() => abrir()} className="mt-3 text-xs text-indigo-500 hover:text-indigo-400">+ Registrar la primera</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map(c => (
            <div key={c.documentId} onClick={() => abrir(c)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-100">{c.titulo}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ESTADO_CANCION_COLOR[c.estado]}`}>
                      {ESTADO_CANCION_LABEL[c.estado]}
                    </span>
                  </div>
                  {c.estilo && <p className="text-[11px] text-slate-500 mt-0.5">{c.estilo}</p>}
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => abrir(c)}
                    className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => borrar(c)} disabled={deletingId === c.documentId}
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition disabled:opacity-40">
                    {deletingId === c.documentId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              {c.slogan && (
                <p className="flex items-start gap-1.5 text-[11px] text-indigo-300/80 italic">
                  <Sparkles size={11} className="shrink-0 mt-0.5" /> "{c.slogan}"
                </p>
              )}
              {c.letra && <p className="text-[11px] text-slate-500 line-clamp-3 whitespace-pre-line">{c.letra}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editando ? "Editar canción" : "Nueva canción"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Título *</label>
                  <input autoFocus value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej. El Richa" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoCancion }))} className={inp}>
                    {ESTADOS_CANCION.map(e => <option key={e} value={e}>{ESTADO_CANCION_LABEL[e]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Estilo / referencias sonoras</label>
                <input value={form.estilo ?? ""} onChange={e => setForm(f => ({ ...f, estilo: e.target.value || null }))} placeholder="Ej. Fufu, trap mexa, spanglish" className={inp} />
              </div>
              <div>
                <label className={lbl}>Slogan / barra insignia</label>
                <input value={form.slogan ?? ""} onChange={e => setForm(f => ({ ...f, slogan: e.target.value || null }))} placeholder="La frase que se repite como sello" className={inp} />
              </div>
              <div>
                <label className={lbl}>Hook / coro</label>
                <textarea value={form.hookPrincipal ?? ""} onChange={e => setForm(f => ({ ...f, hookPrincipal: e.target.value || null }))} rows={2}
                  placeholder="El coro ya escrito" className={`${inp} resize-none`} />
              </div>
              <div>
                <label className={lbl}>Letra</label>
                <textarea value={form.letra ?? ""} onChange={e => setForm(f => ({ ...f, letra: e.target.value || null }))} rows={12}
                  placeholder={"[Verso 1]\n...\n\n[Coro]\n..."} className={`${inp} resize-y font-mono text-xs`} />
              </div>
              <div>
                <label className={lbl}>Notas del proceso</label>
                <textarea value={form.notasProceso ?? ""} onChange={e => setForm(f => ({ ...f, notasProceso: e.target.value || null }))} rows={5}
                  placeholder="Decisiones, alburres explicados, alternativas descartadas..." className={`${inp} resize-y`} />
              </div>
              <div>
                <label className={lbl}>Referencias de artistas</label>
                <textarea value={form.referencias ?? ""} onChange={e => setForm(f => ({ ...f, referencias: e.target.value || null }))} rows={2}
                  placeholder="Ej. Fufu — trap despierto, mezcla de géneros con actitud segura" className={`${inp} resize-none`} />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex-1 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={guardar} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Guardando..." : editando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
