"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, Calendar as CalIcon, Tag, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useGetTareas } from "@/api/tarea/getTareas"
import { createTarea } from "@/api/tarea/createTarea"
import { updateTarea } from "@/api/tarea/updateTarea"
import { deleteTarea } from "@/api/tarea/deleteTarea"
import { TareaType, TareaPayload, AmbitoTarea, EstadoTarea, PrioridadTarea } from "@/types/tarea"

const ESTADOS: { key: EstadoTarea | "todas"; label: string }[] = [
  { key: "todas",       label: "Todas" },
  { key: "pendiente",   label: "Pendientes" },
  { key: "en_progreso", label: "En progreso" },
  { key: "completada",  label: "Completadas" },
]

const PRIORIDADES: PrioridadTarea[] = ["baja", "media", "alta", "urgente"]

const PRIORIDAD_COLORS: Record<PrioridadTarea, string> = {
  baja:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
  media:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  alta:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgente: "bg-red-500/10 text-red-400 border-red-500/20",
}

const ESTADO_COLORS: Record<EstadoTarea, string> = {
  pendiente:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  en_progreso: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completada:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente:   "Pendiente",
  en_progreso: "En progreso",
  completada:  "Completada",
}

const fmtFecha = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

const diasHastaVencimiento = (iso: string | null): number | null => {
  if (!iso) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(iso + "T00:00:00")
  return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export function TareasView({ ambito, titulo }: { ambito: AmbitoTarea; titulo: string }) {
  const { tareas, setTareas, loading } = useGetTareas(ambito)
  const [filtro, setFiltro] = useState<EstadoTarea | "todas">("todas")
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<TareaType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<TareaPayload>({
    titulo: "", descripcion: "", ambito,
    estado: "pendiente", prioridad: "media",
    etiqueta: null, fechaVencimiento: null, notas: null,
  })

  // Etiquetas únicas usadas para autocomplete
  const etiquetasUsadas = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => { if (t.etiqueta) set.add(t.etiqueta) })
    return [...set].sort()
  }, [tareas])

  const filtradas = useMemo(() => {
    return tareas
      .filter(t => filtro === "todas" || t.estado === filtro)
      .filter(t => !filtroEtiqueta || t.etiqueta === filtroEtiqueta)
      .sort((a, b) => {
        // Pendientes primero, ordenadas por fecha de vencimiento
        const orden = { pendiente: 0, en_progreso: 1, completada: 2 }
        if (orden[a.estado] !== orden[b.estado]) return orden[a.estado] - orden[b.estado]
        const aVenc = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity
        const bVenc = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity
        return aVenc - bVenc
      })
  }, [tareas, filtro, filtroEtiqueta])

  const stats = {
    total:       tareas.length,
    pendientes:  tareas.filter(t => t.estado === "pendiente").length,
    enProgreso:  tareas.filter(t => t.estado === "en_progreso").length,
    completadas: tareas.filter(t => t.estado === "completada").length,
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm({
      titulo: "", descripcion: "", ambito,
      estado: "pendiente", prioridad: "media",
      etiqueta: null, fechaVencimiento: null, notas: null,
    })
    setModalOpen(true)
  }

  const abrirEditar = (t: TareaType) => {
    setEditando(t)
    setForm({
      titulo: t.titulo, descripcion: t.descripcion, ambito: t.ambito,
      estado: t.estado, prioridad: t.prioridad,
      etiqueta: t.etiqueta, fechaVencimiento: t.fechaVencimiento, notas: t.notas,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setGuardando(true)
    try {
      // Si el estado cambia a completada, registrar fechaCompletada
      const payload: TareaPayload = { ...form }
      if (form.estado === "completada" && (!editando || editando.estado !== "completada")) {
        payload.fechaCompletada = new Date().toISOString()
      } else if (form.estado !== "completada") {
        payload.fechaCompletada = null
      }

      if (editando) {
        const updated = await updateTarea(editando.documentId, payload)
        setTareas(prev => prev.map(t => t.documentId === updated.documentId ? updated : t))
        toast.success("Tarea actualizada")
      } else {
        const nueva = await createTarea(payload)
        setTareas(prev => [nueva, ...prev])
        toast.success("Tarea creada")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (t: TareaType, nuevoEstado: EstadoTarea) => {
    try {
      const payload: Partial<TareaPayload> = {
        estado: nuevoEstado,
        fechaCompletada: nuevoEstado === "completada" ? new Date().toISOString() : null,
      }
      const updated = await updateTarea(t.documentId, payload)
      setTareas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch {
      toast.error("Error al actualizar")
    }
  }

  const borrar = async (t: TareaType) => {
    if (!confirm(`¿Eliminar tarea "${t.titulo}"?`)) return
    try {
      await deleteTarea(t.documentId)
      setTareas(prev => prev.filter(x => x.documentId !== t.documentId))
      toast.success("Tarea eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus tareas</p>
        </div>
        <Button onClick={abrirCrear} size="sm">
          <Plus size={14} className="mr-1" /> Nueva tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 rounded-xl p-3">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase">Pendientes</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pendientes}</p>
        </div>
        <div className="border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-3">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase">En progreso</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.enProgreso}</p>
        </div>
        <div className="border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl p-3">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Completadas</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completadas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {ESTADOS.map(e => (
          <button
            key={e.key}
            type="button"
            onClick={() => setFiltro(e.key)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filtro === e.key
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            {e.label}
          </button>
        ))}
        {etiquetasUsadas.length > 0 && (
          <select
            title="Filtrar por etiqueta"
            value={filtroEtiqueta}
            onChange={e => setFiltroEtiqueta(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background"
          >
            <option value="">Todas las etiquetas</option>
            {etiquetasUsadas.map(et => <option key={et} value={et}>{et}</option>)}
          </select>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {filtro === "todas" ? "No hay tareas. Crea una." : "No hay tareas en este estado."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtradas.map(t => {
            const dias = diasHastaVencimiento(t.fechaVencimiento)
            const vencida = dias !== null && dias < 0 && t.estado !== "completada"
            const proxima = dias !== null && dias >= 0 && dias <= 2 && t.estado !== "completada"

            return (
              <div
                key={t.documentId}
                className={`flex items-start gap-3 p-3 rounded-xl border bg-white dark:bg-card ${
                  vencida ? "border-red-300 dark:border-red-900/50"
                  : proxima ? "border-amber-300 dark:border-amber-900/50"
                  : "border-zinc-200 dark:border-zinc-800"
                } ${t.estado === "completada" ? "opacity-60" : ""}`}
              >
                {/* Checkbox de estado */}
                <button
                  type="button"
                  title={t.estado === "completada" ? "Marcar como pendiente" : "Marcar como completada"}
                  onClick={() => cambiarEstado(t, t.estado === "completada" ? "pendiente" : "completada")}
                  className={`mt-0.5 h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center transition ${
                    t.estado === "completada"
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-500"
                  }`}
                >
                  {t.estado === "completada" && <Check size={12} className="text-white" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${t.estado === "completada" ? "line-through text-muted-foreground" : ""}`}>
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button title="Editar" onClick={() => abrirEditar(t)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                        <Pencil size={12} />
                      </button>
                      <button title="Eliminar" onClick={() => borrar(t)} className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-muted">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {t.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.descripcion}</p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ESTADO_COLORS[t.estado]}`}>
                      {ESTADO_LABEL[t.estado]}
                    </span>
                    {t.prioridad !== "media" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORIDAD_COLORS[t.prioridad]}`}>
                        {t.prioridad}
                      </span>
                    )}
                    {t.etiqueta && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 inline-flex items-center gap-1">
                        <Tag size={9} />
                        {t.etiqueta}
                      </span>
                    )}
                    {t.fechaVencimiento && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                        vencida ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-500"
                        : proxima ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                        : "border-zinc-200 dark:border-zinc-800 text-muted-foreground"
                      }`}>
                        <CalIcon size={9} />
                        {fmtFecha(t.fechaVencimiento)}
                        {dias !== null && t.estado !== "completada" && (
                          dias === 0 ? " · hoy"
                          : dias < 0 ? ` · vencida ${-dias}d`
                          : dias <= 7 ? ` · en ${dias}d`
                          : ""
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md space-y-3 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editando ? "Editar tarea" : "Nueva tarea"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </Button>
            </div>

            <div>
              <Label className="text-xs" htmlFor="t-titulo">Título *</Label>
              <Input id="t-titulo" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="h-9" placeholder="Ej. Revisar propuesta" />
            </div>

            <div>
              <Label className="text-xs" htmlFor="t-desc">Descripción</Label>
              <textarea
                id="t-desc"
                value={form.descripcion ?? ""}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                className="w-full min-h-[60px] text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2"
                placeholder="Detalles, contexto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-estado">Estado</Label>
                <select
                  id="t-estado"
                  aria-label="Estado de la tarea"
                  value={form.estado}
                  onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoTarea }))}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-prio">Prioridad</Label>
                <select
                  id="t-prio"
                  aria-label="Prioridad"
                  value={form.prioridad}
                  onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as PrioridadTarea }))}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                >
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-fecha">Vencimiento</Label>
                <Input
                  id="t-fecha"
                  type="date"
                  value={form.fechaVencimiento ?? ""}
                  onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value || null }))}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-etiqueta">Etiqueta</Label>
                <Input
                  id="t-etiqueta"
                  list="etiquetas-tarea"
                  value={form.etiqueta ?? ""}
                  onChange={e => setForm(f => ({ ...f, etiqueta: e.target.value || null }))}
                  placeholder="trabajo, urgente, idea..."
                  className="h-9"
                />
                <datalist id="etiquetas-tarea">
                  {etiquetasUsadas.map(et => <option key={et} value={et} />)}
                </datalist>
              </div>
            </div>

            <div>
              <Label className="text-xs" htmlFor="t-notas">Notas</Label>
              <textarea
                id="t-notas"
                value={form.notas ?? ""}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                className="w-full min-h-[50px] text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2"
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar} disabled={guardando}>
                <Check size={14} className="mr-1" />
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
