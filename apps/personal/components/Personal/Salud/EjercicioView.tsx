"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, Dumbbell } from "lucide-react"
import { toast } from "sonner"
import { useGetEjercicios, createEjercicio, updateEjercicio, deleteEjercicio } from "@/api/ejercicio/getEjercicios"
import { EjercicioType, EjercicioPayload, DiaSemana, DIAS, DIA_LABEL } from "@/types/ejercicio"

const DIA_COLOR: Record<DiaSemana, string> = {
  lunes:     "bg-blue-500/15 text-blue-300 border-blue-500/30",
  martes:    "bg-violet-500/15 text-violet-300 border-violet-500/30",
  miercoles: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  jueves:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  viernes:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  sabado:    "bg-orange-500/15 text-orange-300 border-orange-500/30",
  domingo:   "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

function emptyForm(): EjercicioPayload {
  return { titulo: "", descripcion: null, diaSemana: null }
}

function EjercicioCard({ e, onEdit, onDelete }: {
  e: EjercicioType
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {e.diaSemana && (
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${DIA_COLOR[e.diaSemana]}`}>
              {DIA_LABEL[e.diaSemana]}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-100 leading-snug">{e.titulo}</h3>
        </div>
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
      {e.descripcion && (
        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{e.descripcion}</p>
      )}
    </div>
  )
}

export function EjercicioView() {
  const { ejercicios, setEjercicios, loading } = useGetEjercicios()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<EjercicioType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form,      setForm]      = useState<EjercicioPayload>(emptyForm())
  const [filtroDia, setFiltroDia] = useState<DiaSemana | "">("")

  const filtrados = useMemo(() =>
    ejercicios.filter(e => !filtroDia || e.diaSemana === filtroDia),
  [ejercicios, filtroDia])

  const porDia = useMemo(() => {
    if (filtroDia) return null
    const map = new Map<DiaSemana | "sin_dia", EjercicioType[]>()
    ejercicios.forEach(e => {
      const key = e.diaSemana ?? "sin_dia"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    const orden: (DiaSemana | "sin_dia")[] = [...DIAS, "sin_dia"]
    return orden.map(d => ({ dia: d, items: map.get(d) ?? [] })).filter(g => g.items.length > 0)
  }, [ejercicios, filtroDia])

  const abrirCrear  = () => { setEditando(null); setForm(emptyForm()); setModalOpen(true) }
  const abrirEditar = (e: EjercicioType) => {
    setEditando(e)
    setForm({ titulo: e.titulo, descripcion: e.descripcion, diaSemana: e.diaSemana })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.titulo.trim()) { toast.error("El titulo es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateEjercicio(editando.documentId, form)
        setEjercicios(prev => prev.map(e => e.documentId === updated.documentId ? updated : e))
        toast.success("Ejercicio actualizado")
      } else {
        const nuevo = await createEjercicio(form)
        setEjercicios(prev => [...prev, nuevo])
        toast.success("Ejercicio guardado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (e: EjercicioType) => {
    if (!confirm(`Eliminar "${e.titulo}"?`)) return
    try {
      await deleteEjercicio(e.documentId)
      setEjercicios(prev => prev.filter(x => x.documentId !== e.documentId))
      toast.success("Ejercicio eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ejercicio</h1>
          <p className="text-sm text-slate-500">Tu rutina semanal</p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo ejercicio
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        <button type="button" onClick={() => setFiltroDia("")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            filtroDia === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"
          }`}>
          Todos
        </button>
        {DIAS.map(d => (
          <button key={d} type="button" onClick={() => setFiltroDia(d)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filtroDia === d ? `${DIA_COLOR[d]} font-medium` : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {DIA_LABEL[d]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : ejercicios.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Dumbbell className="mx-auto h-10 w-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No hay ejercicios registrados</p>
          <button type="button" onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition">
            <Plus size={14} /> Agregar primer ejercicio
          </button>
        </div>
      ) : filtroDia ? (
        filtrados.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">Sin ejercicios para {DIA_LABEL[filtroDia]}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(e => (
              <EjercicioCard key={e.documentId} e={e} onEdit={() => abrirEditar(e)} onDelete={() => borrar(e)} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {porDia!.map(({ dia, items }) => (
            <div key={dia}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-bold text-slate-300">
                  {dia === "sin_dia" ? "Sin dia asignado" : DIA_LABEL[dia as DiaSemana]}
                </h2>
                <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{items.length}</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(e => (
                  <EjercicioCard key={e.documentId} e={e} onEdit={() => abrirEditar(e)} onDelete={() => borrar(e)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {editando ? "Editar ejercicio" : "Nuevo ejercicio"}
              </h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Titulo *</label>
                <input autoFocus value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej. Sentadillas, Press banca..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Descripcion</label>
                <textarea value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                  placeholder="Series, repeticiones, notas..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-y" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-2">Dia de la semana</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map(d => (
                    <button key={d} type="button"
                      onClick={() => setForm(f => ({ ...f, diaSemana: f.diaSemana === d ? null : d }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        form.diaSemana === d ? `${DIA_COLOR[d]} font-medium` : "border-slate-700 text-slate-500 hover:text-slate-300"
                      }`}>
                      {DIA_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
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
