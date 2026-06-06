"use client"

import { useState, useMemo } from "react"
import { CalendarHeart, Plus, X, Check, Pencil, Trash2, Loader2, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import { useGetEventos, createEvento, updateEvento, deleteEvento } from "@/api/evento-social/getEventos"
import {
  EventoSocial, EventoSocialPayload,
  TIPOS_EVENTO, TIPO_EVENTO_LABEL, TIPO_EVENTO_COLOR, TIPO_EVENTO_EMOJI, TipoEvento,
} from "@/types/evento-social"

const inp = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
const lbl = "block text-[11px] font-medium text-slate-400 mb-1"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function fmtFecha(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function emptyForm(): EventoSocialPayload {
  return {
    fecha: new Date().toISOString().split("T")[0],
    tipo: "amigos", lugar: null, descripcion: null,
    personas: null, notas: null, estado: "realizado",
  }
}

export function EventosSocialView() {
  const { eventos, setEventos, loading } = useGetEventos()
  const [filtroTipo, setFiltroTipo] = useState<TipoEvento | "">("")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editando,   setEditando]   = useState<EventoSocial | null>(null)
  const [form,       setForm]       = useState<EventoSocialPayload>(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtrados = useMemo(() =>
    eventos.filter(e => !filtroTipo || e.tipo === filtroTipo),
  [eventos, filtroTipo])

  const pendientes = useMemo(() => eventos.filter(e => e.estado === "pendiente").length, [eventos])

  function abrir(e?: EventoSocial) {
    setEditando(e ?? null)
    setForm(e ? { fecha: e.fecha, tipo: e.tipo, lugar: e.lugar, descripcion: e.descripcion, personas: e.personas, notas: e.notas, estado: e.estado } : emptyForm())
    setModalOpen(true)
  }

  async function guardar() {
    if (!form.fecha) { toast.error("La fecha es obligatoria"); return }
    setSaving(true)
    try {
      if (editando) {
        const u = await updateEvento(editando.documentId, form)
        setEventos(prev => prev.map(e => e.documentId === u.documentId ? u : e))
        toast.success("Actualizado")
      } else {
        const n = await createEvento(form)
        setEventos(prev => [n, ...prev])
        toast.success("Evento registrado")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally { setSaving(false) }
  }

  async function borrar(e: EventoSocial) {
    if (!confirm(`¿Eliminar este evento?`)) return
    setDeletingId(e.documentId)
    try {
      await deleteEvento(e.documentId)
      setEventos(prev => prev.filter(x => x.documentId !== e.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
            <CalendarHeart className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Eventos sociales</h1>
            <p className="text-xs text-slate-500">
              {eventos.length} registrados{pendientes > 0 ? ` · ${pendientes} pendiente${pendientes > 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => abrir()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Registrar evento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button type="button" onClick={() => setFiltroTipo("")}
          className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroTipo === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
          Todos
        </button>
        {TIPOS_EVENTO.map(t => (
          <button type="button" key={t} onClick={() => setFiltroTipo(filtroTipo === t ? "" : t)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${filtroTipo === t ? TIPO_EVENTO_COLOR[t] : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
            {TIPO_EVENTO_EMOJI[t]} {TIPO_EVENTO_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Cargando...</p>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-14 text-slate-600">
          <CalendarHeart size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin eventos registrados.</p>
          <button type="button" onClick={() => abrir()} className="mt-3 text-xs text-pink-500 hover:text-pink-400">+ Registrar el primero</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(e => (
            <div key={e.documentId}
              className={`bg-slate-900 border rounded-xl px-4 py-3 flex gap-3 ${e.estado === "pendiente" ? "border-amber-500/30" : "border-slate-800"}`}>
              {/* Fecha */}
              <div className="shrink-0 w-14 text-center pt-0.5">
                <p className="text-xl font-bold text-slate-100 leading-none">
                  {new Date(e.fecha + "T00:00:00").getDate()}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">
                  {MESES[new Date(e.fecha + "T00:00:00").getMonth()]}
                </p>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${TIPO_EVENTO_COLOR[e.tipo]}`}>
                    {TIPO_EVENTO_EMOJI[e.tipo]} {TIPO_EVENTO_LABEL[e.tipo]}
                  </span>
                  {e.estado === "pendiente" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold">
                      Pendiente
                    </span>
                  )}
                </div>
                {e.descripcion && <p className="text-sm text-slate-200">{e.descripcion}</p>}
                <div className="flex gap-3 text-[11px] text-slate-500 flex-wrap">
                  {e.lugar && <span className="flex items-center gap-1"><MapPin size={10}/>{e.lugar}</span>}
                  {e.personas && <span className="flex items-center gap-1"><Users size={10}/>{e.personas}</span>}
                </div>
                {e.notas && <p className="text-[11px] text-slate-600 line-clamp-1">{e.notas}</p>}
              </div>

              <div className="flex gap-1 shrink-0 self-start">
                <button type="button" onClick={() => abrir(e)} title="Editar"
                  className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={() => borrar(e)} disabled={deletingId === e.documentId} title="Eliminar"
                  className="p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition disabled:opacity-40">
                  {deletingId === e.documentId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
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
              <h2 className="text-sm font-semibold text-slate-100">{editando ? "Editar evento" : "Nuevo evento"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} title="Cerrar"
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="ev-fecha">Fecha *</label>
                  <input id="ev-fecha" type="date" value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className={lbl} htmlFor="ev-tipo">Tipo</label>
                  <select id="ev-tipo" value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoEvento }))} className={inp}>
                    {TIPOS_EVENTO.map(t => <option key={t} value={t}>{TIPO_EVENTO_EMOJI[t]} {TIPO_EVENTO_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl} htmlFor="ev-desc">¿Qué hicieron?</label>
                <textarea id="ev-desc" value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                  placeholder="Salimos a cenar, vimos una película..." rows={2}
                  className={`${inp} resize-none`} />
              </div>
              <div>
                <label className={lbl} htmlFor="ev-lugar">Lugar</label>
                <input id="ev-lugar" value={form.lugar ?? ""}
                  onChange={e => setForm(f => ({ ...f, lugar: e.target.value || null }))}
                  placeholder="Restaurante, casa, parque..." className={inp} />
              </div>
              <div>
                <label className={lbl} htmlFor="ev-personas">¿Quién estuvo?</label>
                <input id="ev-personas" value={form.personas ?? ""}
                  onChange={e => setForm(f => ({ ...f, personas: e.target.value || null }))}
                  placeholder="Mamá, Ana, Ricardo..." className={inp} />
              </div>
              <div>
                <label className={lbl} htmlFor="ev-estado">Estado</label>
                <select id="ev-estado" value={form.estado}
                  onChange={e => setForm(f => ({ ...f, estado: e.target.value as "pendiente" | "realizado" }))}
                  className={inp}>
                  <option value="realizado">Realizado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="ev-notas">Notas / recuerdo</label>
                <textarea id="ev-notas" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Anécdota, detalle especial..." rows={2}
                  className={`${inp} resize-none`} />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex-1 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={guardar} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Guardando..." : editando ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
