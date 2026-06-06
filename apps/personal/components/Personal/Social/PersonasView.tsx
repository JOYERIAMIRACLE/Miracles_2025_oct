"use client"

import { useState, useMemo } from "react"
import { Users, Plus, X, Check, Pencil, Trash2, Loader2, Phone, Cake, Clock } from "lucide-react"
import { toast } from "sonner"
import { useGetPersonas, createPersona, updatePersona, deletePersona } from "@/api/persona-social/getPersonas"
import {
  PersonaSocial, PersonaSocialPayload,
  RELACIONES, RELACION_LABEL, RELACION_COLOR, RelacionPersona,
} from "@/types/persona-social"

const inp   = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
const lbl   = "block text-[11px] font-medium text-slate-400 mb-1"

function emptyForm(): PersonaSocialPayload {
  return { nombre: "", relacion: "amigo", telefono: null, cumpleaños: null, ultimaVez: null, notas: null }
}

function diasHastaCumple(cumpleaños: string | null): number | null {
  if (!cumpleaños) return null
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const [,mes,dia] = cumpleaños.split("-").map(Number)
  const esteAño  = new Date(hoy.getFullYear(), mes - 1, dia)
  if (esteAño < hoy) esteAño.setFullYear(hoy.getFullYear() + 1)
  return Math.round((esteAño.getTime() - hoy.getTime()) / 86400000)
}

function fmtFecha(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtCumple(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long" })
}

export function PersonasView() {
  const { personas, setPersonas, loading } = useGetPersonas()
  const [filtroRel,  setFiltroRel]  = useState<RelacionPersona | "">("")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editando,   setEditando]   = useState<PersonaSocial | null>(null)
  const [form,       setForm]       = useState<PersonaSocialPayload>(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const cumplesPróximos = useMemo(() =>
    personas
      .map(p => ({ p, dias: diasHastaCumple(p.cumpleaños) }))
      .filter(({ dias }) => dias !== null && dias <= 30)
      .sort((a, b) => a.dias! - b.dias!),
  [personas])

  const filtradas = useMemo(() =>
    personas.filter(p => !filtroRel || p.relacion === filtroRel),
  [personas, filtroRel])

  function abrir(p?: PersonaSocial) {
    setEditando(p ?? null)
    setForm(p ? { nombre: p.nombre, relacion: p.relacion, telefono: p.telefono, cumpleaños: p.cumpleaños, ultimaVez: p.ultimaVez, notas: p.notas } : emptyForm())
    setModalOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editando) {
        const u = await updatePersona(editando.documentId, form)
        setPersonas(prev => prev.map(p => p.documentId === u.documentId ? u : p))
        toast.success("Actualizado")
      } else {
        const n = await createPersona(form)
        setPersonas(prev => [...prev, n].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Persona agregada")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally { setSaving(false) }
  }

  async function borrar(p: PersonaSocial) {
    if (!confirm(`¿Eliminar a ${p.nombre}?`)) return
    setDeletingId(p.documentId)
    try {
      await deletePersona(p.documentId)
      setPersonas(prev => prev.filter(x => x.documentId !== p.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Personas</h1>
            <p className="text-xs text-slate-500">{personas.length} contactos guardados</p>
          </div>
        </div>
        <button onClick={() => abrir()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Agregar persona
        </button>
      </div>

      {/* Cumpleaños próximos */}
      {cumplesPróximos.length > 0 && (
        <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-pink-400 flex items-center gap-1.5">
            <Cake size={13} /> Cumpleaños próximos (30 días)
          </p>
          <div className="flex flex-wrap gap-2">
            {cumplesPróximos.map(({ p, dias }) => (
              <span key={p.documentId}
                className="text-xs px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300">
                🎂 {p.nombre} {dias === 0 ? "— ¡hoy!" : `en ${dias}d`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltroRel("")}
          className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroRel === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
          Todos
        </button>
        {RELACIONES.map(r => (
          <button key={r} onClick={() => setFiltroRel(filtroRel === r ? "" : r)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroRel === r ? RELACION_COLOR[r] : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
            {RELACION_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-14 text-slate-600">
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin personas{filtroRel ? " en esta categoría" : ""}.</p>
          <button onClick={() => abrir()} className="mt-3 text-xs text-pink-500 hover:text-pink-400">+ Agregar la primera</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map(p => (
            <div key={p.documentId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{p.nombre}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${RELACION_COLOR[p.relacion]}`}>
                      {RELACION_LABEL[p.relacion]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => abrir(p)}
                    className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => borrar(p)} disabled={deletingId === p.documentId}
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition disabled:opacity-40">
                    {deletingId === p.documentId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500">
                {p.telefono && (
                  <p className="flex items-center gap-1.5"><Phone size={10} /> {p.telefono}</p>
                )}
                {p.cumpleaños && (
                  <p className="flex items-center gap-1.5">
                    <Cake size={10} /> {fmtCumple(p.cumpleaños)}
                    {(() => { const d = diasHastaCumple(p.cumpleaños); return d !== null && d <= 30 ? <span className="text-pink-400 font-medium ml-1">({d === 0 ? "¡hoy!" : `en ${d}d`})</span> : null })()}
                  </p>
                )}
                {p.ultimaVez && (
                  <p className="flex items-center gap-1.5"><Clock size={10} /> Última vez: {fmtFecha(p.ultimaVez)}</p>
                )}
                {p.notas && <p className="text-slate-600 line-clamp-1">{p.notas}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editando ? "Editar persona" : "Nueva persona"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              <div>
                <label className={lbl}>Nombre *</label>
                <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Ana García" className={inp} />
              </div>
              <div>
                <label className={lbl}>Relación</label>
                <select value={form.relacion} onChange={e => setForm(f => ({ ...f, relacion: e.target.value as RelacionPersona }))} className={inp}>
                  {RELACIONES.map(r => <option key={r} value={r}>{RELACION_LABEL[r]}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Teléfono</label>
                <input value={form.telefono ?? ""} onChange={e => setForm(f => ({ ...f, telefono: e.target.value || null }))} placeholder="81 1234 5678" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Cumpleaños</label>
                  <input type="date" value={form.cumpleaños ?? ""} onChange={e => setForm(f => ({ ...f, cumpleaños: e.target.value || null }))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Última vez que lo vi</label>
                  <input type="date" value={form.ultimaVez ?? ""} onChange={e => setForm(f => ({ ...f, ultimaVez: e.target.value || null }))} className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Notas</label>
                <textarea value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} rows={2}
                  placeholder="Detalles, intereses..." className={`${inp} resize-none`} />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex-1 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={guardar} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Guardando..." : editando ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
