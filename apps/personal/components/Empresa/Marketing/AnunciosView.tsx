"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, Tv } from "lucide-react"
import { toast } from "sonner"
import { useGetAnuncios, createAnuncio, updateAnuncio, deleteAnuncio } from "@/api/anuncio/getAnuncios"
import {
  AnuncioType, AnuncioPayload, PLATAFORMAS, TIPOS_ANUNCIO, ESTADOS_ANUNCIO,
  ESTADO_BADGE, PLATAFORMA_COLOR, EstadoAnuncio, PlataformaAnuncio, TipoAnuncio,
} from "@/types/anuncio"
import { cn } from "@/lib/utils"

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const fmt = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
const pct = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—"

function emptyForm(): AnuncioPayload {
  return { nombre: "", plataforma: "Instagram", tipo: "imagen", estado: "borrador", presupuesto: 0, gastado: 0, impresiones: 0, clics: 0, conversiones: 0, fecha_inicio: null, fecha_fin: null, objetivo: null, notas: null }
}

export function AnunciosView() {
  const { anuncios, setAnuncios, loading } = useGetAnuncios()
  const [filtroEstado,     setFiltroEstado]     = useState<EstadoAnuncio | "todos">("todos")
  const [filtroPlataforma, setFiltroPlataforma] = useState<PlataformaAnuncio | "todas">("todas")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<AnuncioType | null>(null)
  const [form,      setForm]      = useState<AnuncioPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const filtrados = useMemo(() => anuncios.filter(a => {
    const okEstado     = filtroEstado === "todos" || a.estado === filtroEstado
    const okPlataforma = filtroPlataforma === "todas" || a.plataforma === filtroPlataforma
    return okEstado && okPlataforma
  }), [anuncios, filtroEstado, filtroPlataforma])

  const totales = useMemo(() => ({
    presupuesto:  anuncios.reduce((s, a) => s + a.presupuesto, 0),
    gastado:      anuncios.reduce((s, a) => s + a.gastado, 0),
    impresiones:  anuncios.reduce((s, a) => s + a.impresiones, 0),
    clics:        anuncios.reduce((s, a) => s + a.clics, 0),
    activos:      anuncios.filter(a => a.estado === "activo").length,
  }), [anuncios])

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(a: AnuncioType) {
    setEditing(a)
    setForm({ nombre: a.nombre, plataforma: a.plataforma, tipo: a.tipo, estado: a.estado, presupuesto: a.presupuesto, gastado: a.gastado, impresiones: a.impresiones, clics: a.clics, conversiones: a.conversiones, fecha_inicio: a.fecha_inicio, fecha_fin: a.fecha_fin, objetivo: a.objetivo, notas: a.notas })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateAnuncio(editing.documentId, form)
        setAnuncios(prev => prev.map(a => a.documentId === editing.documentId ? updated : a))
        toast.success("Anuncio actualizado")
      } else {
        const nuevo = await createAnuncio(form)
        setAnuncios(prev => [nuevo, ...prev])
        toast.success("Anuncio creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteAnuncio(documentId)
      setAnuncios(prev => prev.filter(a => a.documentId !== documentId))
      toast.success("Anuncio eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Activos",      value: totales.activos,                color: "text-violet-400" },
          { label: "Presupuesto",  value: fmt(totales.presupuesto),        color: "text-slate-200" },
          { label: "Gastado",      value: fmt(totales.gastado),            color: "text-violet-400" },
          { label: "CTR global",   value: pct(totales.clics, totales.impresiones), color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(["todos", ...ESTADOS_ANUNCIO] as const).map(e => (
            <button key={e} type="button" onClick={() => setFiltroEstado(e)}
              className={cn("h-7 px-3 text-xs rounded-lg border capitalize transition-colors",
                filtroEstado === e ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["todas", ...PLATAFORMAS] as const).map(p => (
            <button key={p} type="button" onClick={() => setFiltroPlataforma(p)}
              className={cn("h-7 px-3 text-xs rounded-lg border transition-colors",
                filtroPlataforma === p ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {p === "todas" ? "Todas" : p}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo anuncio
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Nombre", "Plataforma", "Estado", "Presupuesto", "Gastado", "Impresiones", "Clics", "CTR", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(a => (
                <tr key={a.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[160px] truncate">{a.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", PLATAFORMA_COLOR[a.plataforma])}>{a.plataforma}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize", ESTADO_BADGE[a.estado])}>{a.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{fmt(a.presupuesto)}</td>
                  <td className="px-4 py-3 text-violet-400 tabular-nums">{fmt(a.gastado)}</td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{a.impresiones.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{a.clics.toLocaleString()}</td>
                  <td className="px-4 py-3 text-violet-400 tabular-nums">{pct(a.clics, a.impresiones)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => openEditar(a)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                      {delId === a.documentId ? (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleDelete(a.documentId)} className="text-[11px] text-red-400 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setDelId(a.documentId)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><X size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtrados.length === 0 && (
            <div className="py-14 text-center text-slate-600">
              <Tv size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin anuncios registrados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar anuncio" : "Nuevo anuncio"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Campaña San Valentín IG" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Plataforma</label>
                  <select value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value as PlataformaAnuncio }))} className={inp + " cursor-pointer"}>
                    {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoAnuncio }))} className={inp + " cursor-pointer"}>
                    {TIPOS_ANUNCIO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoAnuncio }))} className={inp + " cursor-pointer"}>
                    {ESTADOS_ANUNCIO.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Presupuesto ($)</label>
                  <input type="number" min={0} value={form.presupuesto} onChange={e => setForm(f => ({ ...f, presupuesto: Number(e.target.value) || 0 }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Gastado ($)</label>
                  <input type="number" min={0} value={form.gastado} onChange={e => setForm(f => ({ ...f, gastado: Number(e.target.value) || 0 }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Impresiones</label>
                  <input type="number" min={0} value={form.impresiones} onChange={e => setForm(f => ({ ...f, impresiones: Number(e.target.value) || 0 }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Clics</label>
                  <input type="number" min={0} value={form.clics} onChange={e => setForm(f => ({ ...f, clics: Number(e.target.value) || 0 }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Conversiones</label>
                  <input type="number" min={0} value={form.conversiones} onChange={e => setForm(f => ({ ...f, conversiones: Number(e.target.value) || 0 }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha inicio</label>
                  <input type="date" value={form.fecha_inicio ?? ""} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value || null }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha fin</label>
                  <input type="date" value={form.fecha_fin ?? ""} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value || null }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Objetivo</label>
                <input type="text" placeholder="Ej. Aumentar seguidores, ventas temporada…" value={form.objetivo ?? ""}
                  onChange={e => setForm(f => ({ ...f, objetivo: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
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
