"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, PlayCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { useGetRecetas, createReceta, updateReceta, deleteReceta } from "@/api/receta/getRecetas"
import { RecetaType, RecetaPayload } from "@/types/recetario"

function emptyForm(): RecetaPayload {
  return { nombre: "", descripcion: null, videoUrl: null }
}

function RecetaCard({ r, onEdit, onDelete }: {
  r: RecetaType
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-amber-800/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-snug flex-1">{r.nombre}</h3>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button type="button" onClick={onEdit} title="Editar"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Eliminar"
            className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {r.descripcion && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{r.descripcion}</p>
      )}

      {r.videoUrl ? (
        <a href={r.videoUrl} target="_blank" rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition">
          <PlayCircle size={16} /> Ver video
        </a>
      ) : (
        <span className="mt-auto text-[11px] text-slate-700">Sin video</span>
      )}
    </div>
  )
}

export function RecetarioView() {
  const { recetas, setRecetas, loading } = useGetRecetas()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<RecetaType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form,      setForm]      = useState<RecetaPayload>(emptyForm())
  const [busqueda,  setBusqueda]  = useState("")

  const filtradas = useMemo(() =>
    recetas.filter(r =>
      !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ),
  [recetas, busqueda])

  const abrirCrear = () => {
    setEditando(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const abrirEditar = (r: RecetaType) => {
    setEditando(r)
    setForm({ nombre: r.nombre, descripcion: r.descripcion, videoUrl: r.videoUrl })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateReceta(editando.documentId, form)
        setRecetas(prev => prev.map(r => r.documentId === updated.documentId ? updated : r))
        toast.success("Receta actualizada")
      } else {
        const nueva = await createReceta(form)
        setRecetas(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Receta guardada")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (r: RecetaType) => {
    if (!confirm(`¿Eliminar "${r.nombre}"?`)) return
    try {
      await deleteReceta(r.documentId)
      setRecetas(prev => prev.filter(x => x.documentId !== r.documentId))
      toast.success("Receta eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Recetario</h1>
          <p className="text-sm text-slate-500">Tus recetas con video</p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition">
          <Plus size={15} /> Nueva receta
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar receta..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500 text-sm">
            {busqueda ? "Sin resultados" : "No hay recetas guardadas"}
          </p>
          {!busqueda && (
            <button type="button" onClick={abrirCrear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
              <Plus size={14} /> Agregar primera receta
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(r => (
            <RecetaCard key={r.documentId} r={r}
              onEdit={() => abrirEditar(r)}
              onDelete={() => borrar(r)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {editando ? "Editar receta" : "Nueva receta"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Nombre *</label>
                <input
                  autoFocus
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Tacos de canasta..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                  placeholder="Ingredientes, pasos rápidos, notas..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Link del video</label>
                <input
                  value={form.videoUrl ?? ""}
                  onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value || null }))}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition">
                <Check size={14} />
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
