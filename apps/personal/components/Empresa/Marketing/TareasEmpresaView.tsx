"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, X, Check, Pencil, Loader2, CheckSquare, Tag } from "lucide-react"
import { toast } from "sonner"
import { TareaType, EstadoTarea, PrioridadTarea } from "@/types/tarea"
import { createTarea } from "@/api/tarea/createTarea"
import { updateTarea } from "@/api/tarea/updateTarea"
import { deleteTarea } from "@/api/tarea/deleteTarea"
import { ProgresoBar, AvancesPanel } from "@/components/Shared/TareasWidgets"

const ETIQUETA = "empresa-mkt"
const BASE     = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

const ESTADOS: { key: EstadoTarea; label: string; color: string }[] = [
  { key: "pendiente",   label: "Pendiente",   color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { key: "en_progreso", label: "En progreso", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { key: "en_pausa",    label: "En pausa",    color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { key: "completada",  label: "Completada",  color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
]

const PRIORIDADES: { key: PrioridadTarea; label: string; dot: string }[] = [
  { key: "baja",    label: "Baja",    dot: "bg-slate-500" },
  { key: "media",   label: "Media",   dot: "bg-blue-400" },
  { key: "alta",    label: "Alta",    dot: "bg-amber-400" },
  { key: "urgente", label: "Urgente", dot: "bg-red-400" },
]

const CATEGORIAS = ["Contenido", "Campaña", "Diseño", "SEO", "Analytics", "Social Media", "Email", "Infraestructura web", "Otro"]

const CATEGORIA_COLOR: Record<string, string> = {
  "Contenido":          "bg-green-500/10 text-green-400 border-green-500/20",
  "Campaña":            "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Diseño":             "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "SEO":                "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Analytics":          "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Social Media":       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Email":              "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Infraestructura web":"bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Otro":               "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

type FormData = {
  titulo:           string
  descripcion:      string
  estado:           EstadoTarea
  prioridad:        PrioridadTarea
  fechaVencimiento: string
  progreso:         number
  categoria:        string
}

function emptyForm(): FormData {
  return { titulo: "", descripcion: "", estado: "pendiente", prioridad: "media", fechaVencimiento: "", progreso: 0, categoria: "" }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"

// ─── Vista principal ──────────────────────────────────────────────────────────

export function TareasEmpresaView() {
  const [tareas,    setTareas]    = useState<TareaType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<TareaType | null>(null)
  const [form,      setForm]      = useState<FormData>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)
  const [filtroEst,    setFiltroEst]    = useState<EstadoTarea | "todas">("todas")
  const [filtroCat,    setFiltroCat]    = useState("")
  const [avancesOpen,  setAvancesOpen]  = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({
          "filters[etiqueta][$eq]": ETIQUETA,
          "pagination[pageSize]":   "200",
          "sort":                   "createdAt:desc",
        })
        const res  = await fetch(`${BASE}/api/tareas?${params}`)
        const json = await res.json()
        setTareas(json.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtradas = useMemo(() =>
    tareas.filter(t =>
      (filtroEst === "todas" || t.estado === filtroEst) &&
      (!filtroCat || t.area === filtroCat)
    ),
    [tareas, filtroEst, filtroCat]
  )

  const stats = useMemo(() => ({
    total:       tareas.length,
    pendientes:  tareas.filter(t => t.estado === "pendiente").length,
    progreso:    tareas.filter(t => t.estado === "en_progreso").length,
    completadas: tareas.filter(t => t.estado === "completada").length,
  }), [tareas])

  const categoriasUsadas = useMemo(() =>
    [...new Set(tareas.map(t => t.area).filter(Boolean) as string[])].sort(),
    [tareas]
  )

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(t: TareaType) {
    setEditing(t)
    setForm({
      titulo:           t.titulo,
      descripcion:      t.descripcion ?? "",
      estado:           t.estado,
      prioridad:        t.prioridad,
      fechaVencimiento: t.fechaVencimiento ?? "",
      progreso:         t.progreso ?? 0,
      categoria:        t.area ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        titulo:           form.titulo.trim(),
        descripcion:      form.descripcion.trim() || null,
        estado:           form.estado,
        prioridad:        form.prioridad,
        fechaVencimiento: form.fechaVencimiento || null,
        progreso:         form.progreso,
        area:             form.categoria || null,
        etiqueta:         ETIQUETA,
        ambito:           "trabajo" as const,
      }
      if (editing) {
        const updated = await updateTarea(editing.documentId, payload)
        setTareas(prev => prev.map(t => t.documentId === updated.documentId ? updated : t))
        toast.success("Tarea actualizada")
      } else {
        const nueva = await createTarea(payload)
        setTareas(prev => [nueva, ...prev])
        toast.success("Tarea creada")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function cambiarEstado(t: TareaType, estado: EstadoTarea) {
    try {
      const updated = await updateTarea(t.documentId, { estado })
      setTareas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch {
      toast.error("Error al actualizar")
    }
  }

  async function actualizarProgreso(t: TareaType, pct: number) {
    try {
      const updated = await updateTarea(t.documentId, { progreso: pct })
      setTareas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch {
      toast.error("Error al guardar progreso")
    }
  }

  async function agregarAvance(t: TareaType, nota: string) {
    const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    const entrada = `${fecha} · ${nota}`
    const nuevasNotas = t.notas ? `${entrada}\n${t.notas}` : entrada
    setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, notas: nuevasNotas } : x))
    try {
      await updateTarea(t.documentId, { notas: nuevasNotas })
    } catch {
      setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, notas: t.notas } : x))
      toast.error("Error al guardar la nota")
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteTarea(documentId)
      setTareas(prev => prev.filter(t => t.documentId !== documentId))
      toast.success("Tarea eliminada")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: stats.total,       color: "text-slate-200" },
          { label: "Pendientes",  value: stats.pendientes,  color: "text-slate-400" },
          { label: "En progreso", value: stats.progreso,    color: "text-blue-400" },
          { label: "Completadas", value: stats.completadas, color: "text-emerald-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFiltroEst("todas")}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
            filtroEst === "todas" ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
          }`}>
          Todas
        </button>
        {ESTADOS.map(e => (
          <button key={e.key} type="button" onClick={() => setFiltroEst(prev => prev === e.key ? "todas" : e.key)}
            className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
              filtroEst === e.key ? `${e.color} shadow-sm` : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {e.label}
          </button>
        ))}
        {categoriasUsadas.length > 0 && (
          <select title="Filtrar por categoría" value={filtroCat}
            onChange={e => setFiltroCat(e.target.value)}
            className="h-7 px-2 rounded-full text-xs border border-slate-700 bg-slate-900 text-slate-400 focus:outline-none">
            <option value="">Todas las categorías</option>
            {categoriasUsadas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nueva tarea
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
        ))}</div>
      ) : filtradas.length === 0 ? (
        <div className="py-20 text-center text-slate-600 bg-slate-900 border border-slate-800 rounded-xl">
          <CheckSquare size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Sin tareas de marketing.</p>
          <p className="text-xs mt-1 text-slate-700">Crea tu primera tarea con el botón de arriba.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {filtradas.map(t => {
              const est   = ESTADOS.find(e => e.key === t.estado)
              const prior = PRIORIDADES.find(p => p.key === t.prioridad)
              const pct   = t.progreso ?? 0
              const barColor = pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-red-400"
              return (
                <div key={t.documentId} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors group">
                  {/* Toggle completada */}
                  <button type="button"
                    onClick={() => cambiarEstado(t, t.estado === "completada" ? "pendiente" : "completada")}
                    className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                      t.estado === "completada"
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-600 hover:border-emerald-500"
                    }`}>
                    {t.estado === "completada" && <Check size={9} className="text-white" />}
                  </button>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${t.estado === "completada" ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {t.titulo}
                    </p>
                    {t.descripcion && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{t.descripcion}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {prior && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${prior.dot}`} />
                          {prior.label}
                        </span>
                      )}
                      {est && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${est.color}`}>
                          {est.label}
                        </span>
                      )}
                      {t.area && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${CATEGORIA_COLOR[t.area] ?? CATEGORIA_COLOR["Otro"]}`}>
                          <Tag size={8} />{t.area}
                        </span>
                      )}
                      {t.fechaVencimiento && (
                        <span className="text-[10px] text-slate-600">
                          Vence: {new Date(t.fechaVencimiento + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>

                    {/* Barra de progreso */}
                    <ProgresoBar value={pct} onSave={pct => actualizarProgreso(t, pct)} />

                    {/* Panel de avances */}
                    <AvancesPanel
                      notas={t.notas ?? null}
                      open={avancesOpen === t.documentId}
                      onAgregar={nota => agregarAvance(t, nota)}
                    />
                  </div>

                  {/* Estado rápido */}
                  <select title="Cambiar estado" value={t.estado}
                    onChange={e => cambiarEstado(t, e.target.value as EstadoTarea)}
                    className="h-7 rounded-lg border border-slate-700 bg-slate-800 px-2 text-[11px] text-slate-400 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>

                  {/* Acciones */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" title="Anotar avance"
                      onClick={() => setAvancesOpen(prev => prev === t.documentId ? null : t.documentId)}
                      className={`p-1.5 rounded transition-colors ${
                        avancesOpen === t.documentId
                          ? "text-violet-400 bg-violet-500/10"
                          : "text-slate-600 hover:text-violet-400 hover:bg-slate-800"
                      }`}>
                      <Plus size={12} />
                    </button>
                    <button type="button" onClick={() => openEditar(t)} title="Editar"
                      className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                      <Pencil size={12} />
                    </button>
                    {delId === t.documentId ? (
                      <>
                        <button type="button" onClick={() => handleDelete(t.documentId)}
                          className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-slate-800">Sí</button>
                        <button type="button" onClick={() => setDelId(null)}
                          className="text-[10px] text-slate-500 px-1.5 py-1 rounded hover:bg-slate-800">No</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setDelId(t.documentId)} title="Eliminar"
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar tarea" : "Nueva tarea"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Título <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Crear contenido para campaña de madres" value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className={inp} autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                <textarea placeholder="Detalles, referencias, notas…" value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={2} className={inp + " resize-none h-auto py-2"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                  <select title="Categoría" value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className={inp + " cursor-pointer"}>
                    <option value="">— Sin categoría —</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Prioridad</label>
                  <select title="Prioridad" value={form.prioridad}
                    onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as PrioridadTarea }))}
                    className={inp + " cursor-pointer"}>
                    {PRIORIDADES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select title="Estado" value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoTarea }))}
                    className={inp + " cursor-pointer"}>
                    {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha límite</label>
                  <input type="date" title="Fecha límite" value={form.fechaVencimiento}
                    onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
                  Progreso — <span className="text-blue-400 font-mono">{form.progreso}%</span>
                </label>
                <input type="range" min={0} max={100} value={form.progreso} title="Porcentaje de progreso"
                  onChange={e => setForm(f => ({ ...f, progreso: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
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
