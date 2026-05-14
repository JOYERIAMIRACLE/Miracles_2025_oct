"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, Search, List, LayoutGrid, Clock, User, Tag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useGetTickets } from "@/api/ticket/getTickets"
import { createTicket } from "@/api/ticket/createTicket"
import { updateTicket } from "@/api/ticket/updateTicket"
import { deleteTicket } from "@/api/ticket/deleteTicket"
import { TicketType, TicketPayload, EstadoTicket, TipoTicket, PrioridadTicket } from "@/types/ticket"

// ─── Metadatos visuales ───────────────────────────────────────────────────────

const ESTADOS: EstadoTicket[] = ["nuevo", "en_revision", "en_progreso", "entregado", "cerrado"]
const TIPOS: TipoTicket[]     = ["Diseño", "Landing", "Campaña", "Contenido", "Soporte", "Otro"]
const PRIORIDADES: PrioridadTicket[] = ["baja", "media", "alta", "urgente"]

const ESTADO_META: Record<EstadoTicket, { label: string; col: string; header: string; badge: string }> = {
  nuevo:       { label: "Nuevo",       col: "bg-slate-900/60 border-slate-700",   header: "text-slate-300",  badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  en_revision: { label: "En revisión", col: "bg-amber-950/30 border-amber-800/40", header: "text-amber-300",  badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  en_progreso: { label: "En progreso", col: "bg-blue-950/30 border-blue-800/40",   header: "text-blue-300",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  entregado:   { label: "Entregado",   col: "bg-violet-950/30 border-violet-800/40", header: "text-violet-300", badge: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  cerrado:     { label: "Cerrado",     col: "bg-emerald-950/30 border-emerald-800/40", header: "text-emerald-300", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
}

const PRIORIDAD_DOT: Record<PrioridadTicket, string> = {
  baja: "bg-slate-400", media: "bg-blue-400", alta: "bg-amber-400", urgente: "bg-red-500",
}

const TIPO_COLOR: Record<TipoTicket, string> = {
  Diseño:    "bg-pink-500/10 text-pink-300 border-pink-500/20",
  Landing:   "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  Campaña:   "bg-orange-500/10 text-orange-300 border-orange-500/20",
  Contenido: "bg-green-500/10 text-green-300 border-green-500/20",
  Soporte:   "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  Otro:      "bg-slate-500/10 text-slate-300 border-slate-500/20",
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const emptyForm = (): TicketPayload => ({
  titulo: "", descripcion: null, tipo: null,
  estado: "nuevo", prioridad: "media",
  solicitante: null, responsable: null,
  estimacion: null, tiempoReal: null,
  fechaCierre: null, notas: null,
})

type Vista = "lista" | "kanban"

// ─── Componente principal ─────────────────────────────────────────────────────

export function TicketsView() {
  const { tickets, setTickets, loading } = useGetTickets()
  const [vista, setVista]       = useState<Vista>("kanban")
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo]     = useState<TipoTicket | "">("")
  const [filtroResp, setFiltroResp]     = useState("")
  const [modalOpen, setModalOpen]       = useState(false)
  const [editando, setEditando]         = useState<TicketType | null>(null)
  const [guardando, setGuardando]       = useState(false)
  const [form, setForm]                 = useState<TicketPayload>(emptyForm())

  const responsablesUsados = useMemo(() => {
    const s = new Set<string>()
    tickets.forEach(t => { if (t.responsable) s.add(t.responsable) })
    return [...s].sort()
  }, [tickets])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tickets.filter(t =>
      (!q || t.titulo.toLowerCase().includes(q) || (t.solicitante ?? "").toLowerCase().includes(q) || (t.responsable ?? "").toLowerCase().includes(q)) &&
      (!filtroTipo || t.tipo === filtroTipo) &&
      (!filtroResp || t.responsable === filtroResp)
    )
  }, [tickets, busqueda, filtroTipo, filtroResp])

  const stats = useMemo(() => ({
    total:       tickets.length,
    nuevo:       tickets.filter(t => t.estado === "nuevo").length,
    en_progreso: tickets.filter(t => t.estado === "en_progreso").length,
    entregado:   tickets.filter(t => t.estado === "entregado").length,
    cerrado:     tickets.filter(t => t.estado === "cerrado").length,
  }), [tickets])

  const abrirCrear = () => { setEditando(null); setForm(emptyForm()); setModalOpen(true) }
  const abrirEditar = (t: TicketType) => {
    setEditando(t)
    setForm({
      titulo: t.titulo, descripcion: t.descripcion, tipo: t.tipo,
      estado: t.estado, prioridad: t.prioridad,
      solicitante: t.solicitante, responsable: t.responsable,
      estimacion: t.estimacion, tiempoReal: t.tiempoReal,
      fechaCierre: t.fechaCierre, notas: t.notas,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateTicket(editando.documentId, form)
        setTickets(prev => prev.map(t => t.documentId === updated.documentId ? { ...updated, tareas: editando.tareas } : t))
        toast.success("Ticket actualizado")
      } else {
        const nuevo = await createTicket(form)
        setTickets(prev => [nuevo, ...prev])
        toast.success("Ticket creado")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (t: TicketType) => {
    if (!confirm(`¿Eliminar ticket "${t.titulo}"?`)) return
    try {
      await deleteTicket(t.documentId)
      setTickets(prev => prev.filter(x => x.documentId !== t.documentId))
      toast.success("Ticket eliminado")
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar")
    }
  }

  const moverEstado = async (t: TicketType, nuevoEstado: EstadoTicket) => {
    try {
      const updated = await updateTicket(t.documentId, { estado: nuevoEstado })
      setTickets(prev => prev.map(x => x.documentId === updated.documentId ? { ...updated, tareas: t.tareas } : x))
    } catch { toast.error("Error al mover ticket") }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tickets</h1>
          <p className="text-sm text-slate-500">Solicitudes de trabajo y seguimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0 rounded-lg border border-slate-700 p-0.5">
            <button type="button" onClick={() => setVista("kanban")} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition ${vista === "kanban" ? "bg-slate-700 text-slate-100" : "text-slate-500"}`}>
              <LayoutGrid size={12} /> Kanban
            </button>
            <button type="button" onClick={() => setVista("lista")} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition ${vista === "lista" ? "bg-slate-700 text-slate-100" : "text-slate-500"}`}>
              <List size={12} /> Lista
            </button>
          </div>
          <Button size="sm" onClick={abrirCrear}>
            <Plus size={14} className="mr-1" /> Nuevo ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Total",       value: stats.total,       cls: "border-slate-700 text-slate-100" },
          { label: "Nuevos",      value: stats.nuevo,       cls: "border-slate-600 text-slate-300" },
          { label: "En progreso", value: stats.en_progreso, cls: "border-blue-700/50 text-blue-300" },
          { label: "Entregados",  value: stats.entregado,   cls: "border-violet-700/50 text-violet-300" },
          { label: "Cerrados",    value: stats.cerrado,     cls: "border-emerald-700/50 text-emerald-300" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 bg-slate-900/40 ${s.cls}`}>
            <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls.split(" ")[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar ticket..." className="h-8 pl-9 text-sm bg-slate-900/60 border-slate-700 text-slate-200" />
        </div>
        <select title="Filtrar por tipo" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as TipoTicket | "")} className="h-8 text-xs px-2 rounded-md border border-slate-700 bg-slate-900/60 text-slate-300">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select title="Filtrar por responsable" value={filtroResp} onChange={e => setFiltroResp(e.target.value)} className="h-8 text-xs px-2 rounded-md border border-slate-700 bg-slate-900/60 text-slate-300">
          <option value="">Todos los responsables</option>
          {responsablesUsados.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(busqueda || filtroTipo || filtroResp) && (
          <button type="button" onClick={() => { setBusqueda(""); setFiltroTipo(""); setFiltroResp("") }} className="text-xs text-slate-500 hover:text-slate-300 px-2">
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando tickets...</p>
      ) : vista === "kanban" ? (
        <KanbanView tickets={filtrados} onEditar={abrirEditar} onBorrar={borrar} onMover={moverEstado} />
      ) : (
        <ListaView tickets={filtrados} onEditar={abrirEditar} onBorrar={borrar} onMover={moverEstado} />
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar ticket" : "Nuevo ticket"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>

            <div>
              <Label className="text-xs text-slate-400">Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" placeholder="Ej: Rediseño landing Black Friday" />
            </div>

            <div>
              <Label className="text-xs text-slate-400">Descripción</Label>
              <textarea value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))} className="w-full min-h-[60px] text-sm rounded-md border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2" placeholder="Contexto, requerimientos..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Tipo</Label>
                <select aria-label="Tipo" value={form.tipo ?? ""} onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as TipoTicket | null }))} className="w-full h-9 rounded-md border border-slate-600 bg-slate-800 text-slate-200 px-3 text-sm">
                  <option value="">— Seleccionar —</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Prioridad</Label>
                <select aria-label="Prioridad" value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as PrioridadTicket }))} className="w-full h-9 rounded-md border border-slate-600 bg-slate-800 text-slate-200 px-3 text-sm">
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Estado</Label>
                <select aria-label="Estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoTicket }))} className="w-full h-9 rounded-md border border-slate-600 bg-slate-800 text-slate-200 px-3 text-sm">
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_META[e].label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Solicitante</Label>
                <Input value={form.solicitante ?? ""} onChange={e => setForm(f => ({ ...f, solicitante: e.target.value || null }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" placeholder="Quién lo pidió" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Responsable</Label>
                <Input list="resp-ticket" value={form.responsable ?? ""} onChange={e => setForm(f => ({ ...f, responsable: e.target.value || null }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" placeholder="Quién lo atiende" />
                <datalist id="resp-ticket">{responsablesUsados.map(r => <option key={r} value={r} />)}</datalist>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Fecha cierre</Label>
                <Input type="date" value={form.fechaCierre?.slice(0, 10) ?? ""} onChange={e => setForm(f => ({ ...f, fechaCierre: e.target.value ? new Date(e.target.value).toISOString() : null }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Est. horas</Label>
                <Input type="number" value={form.estimacion ?? ""} onChange={e => setForm(f => ({ ...f, estimacion: e.target.value ? Number(e.target.value) : null }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" placeholder="0" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Horas reales</Label>
                <Input type="number" value={form.tiempoReal ?? ""} onChange={e => setForm(f => ({ ...f, tiempoReal: e.target.value ? Number(e.target.value) : null }))} className="h-9 bg-slate-800 border-slate-600 text-slate-100" placeholder="0" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-400">Notas internas</Label>
              <textarea value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className="w-full min-h-[48px] text-sm rounded-md border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2" placeholder="Notas del equipo..." />
            </div>

            {editando && (editando.tareas?.length ?? 0) > 0 && (
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Tareas vinculadas ({editando.tareas!.length})</p>
                <ul className="space-y-1">
                  {editando.tareas!.slice(0, 5).map(t => (
                    <li key={t.documentId} className="text-xs text-slate-300 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.estado === "completada" ? "bg-emerald-500" : "bg-blue-400"}`} />
                      {t.titulo}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
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

// ─── Vista Kanban ─────────────────────────────────────────────────────────────

function KanbanView({ tickets, onEditar, onBorrar, onMover }: {
  tickets: TicketType[]
  onEditar: (t: TicketType) => void
  onBorrar: (t: TicketType) => void
  onMover: (t: TicketType, e: EstadoTicket) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {ESTADOS.map(estado => {
        const cols = tickets.filter(t => t.estado === estado)
        const meta = ESTADO_META[estado]
        return (
          <div key={estado} className={`flex-shrink-0 w-64 rounded-xl border ${meta.col} p-3 flex flex-col gap-2`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${meta.header}`}>{meta.label}</span>
              <span className="text-[10px] text-slate-500 bg-slate-800/60 rounded px-1.5 py-0.5">{cols.length}</span>
            </div>
            {cols.length === 0 && (
              <p className="text-[11px] text-slate-600 text-center py-4">Sin tickets</p>
            )}
            {cols.map(t => (
              <TicketCard key={t.documentId} ticket={t} onEditar={onEditar} onBorrar={onBorrar} onMover={onMover} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Vista Lista ──────────────────────────────────────────────────────────────

function ListaView({ tickets, onEditar, onBorrar, onMover }: {
  tickets: TicketType[]
  onEditar: (t: TicketType) => void
  onBorrar: (t: TicketType) => void
  onMover: (t: TicketType, e: EstadoTicket) => void
}) {
  if (tickets.length === 0) return <p className="text-sm text-slate-500 text-center py-12">Sin tickets con los filtros actuales.</p>
  return (
    <div className="space-y-2">
      {tickets.map(t => (
        <div key={t.documentId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/40 transition">
          <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORIDAD_DOT[t.prioridad]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-slate-200 truncate">{t.titulo}</p>
              {t.tipo && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TIPO_COLOR[t.tipo]}`}>{t.tipo}</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ESTADO_META[t.estado].badge}`}>{ESTADO_META[t.estado].label}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {t.solicitante && <span className="text-[10px] text-slate-500 flex items-center gap-1"><User size={9} />{t.solicitante}</span>}
              {t.responsable && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Tag size={9} />{t.responsable}</span>}
              {(t.estimacion || t.tiempoReal) && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={9} />
                  {t.tiempoReal ?? 0}h / {t.estimacion ?? "?"}h
                  {t.estimacion && t.tiempoReal && t.tiempoReal > t.estimacion && <AlertCircle size={9} className="text-red-400" />}
                </span>
              )}
              {(t.tareas?.length ?? 0) > 0 && <span className="text-[10px] text-slate-500">{t.tareas!.length} tarea{t.tareas!.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>
          <EstadoSelector ticket={t} onMover={onMover} />
          <button type="button" onClick={() => onEditar(t)} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300"><Pencil size={13} /></button>
          <button type="button" onClick={() => onBorrar(t)} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Ticket Card (Kanban) ─────────────────────────────────────────────────────

function TicketCard({ ticket: t, onEditar, onBorrar, onMover }: {
  ticket: TicketType
  onEditar: (t: TicketType) => void
  onBorrar: (t: TicketType) => void
  onMover: (t: TicketType, e: EstadoTicket) => void
}) {
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-lg p-3 space-y-2 hover:border-slate-600 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 mt-0.5 ${PRIORIDAD_DOT[t.prioridad]}`} />
          <p className="text-xs font-medium text-slate-200 leading-snug">{t.titulo}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button type="button" onClick={() => onEditar(t)} className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-slate-300"><Pencil size={11} /></button>
          <button type="button" onClick={() => onBorrar(t)} className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {t.tipo && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TIPO_COLOR[t.tipo]}`}>{t.tipo}</span>}
      </div>

      {(t.solicitante || t.responsable) && (
        <div className="space-y-0.5">
          {t.solicitante && <p className="text-[10px] text-slate-500 flex items-center gap-1"><User size={9} /> {t.solicitante}</p>}
          {t.responsable && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Tag size={9} /> {t.responsable}</p>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(t.estimacion || t.tiempoReal) && (
            <span className={`text-[10px] flex items-center gap-1 ${t.estimacion && t.tiempoReal && t.tiempoReal > t.estimacion ? "text-red-400" : "text-slate-500"}`}>
              <Clock size={9} />{t.tiempoReal ?? 0}h/{t.estimacion ?? "?"}h
            </span>
          )}
          {(t.tareas?.length ?? 0) > 0 && (
            <span className="text-[10px] text-slate-500">{t.tareas!.length} tarea{t.tareas!.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <EstadoSelector ticket={t} onMover={onMover} compact />
      </div>
    </div>
  )
}

// ─── Selector de estado (flecha rápida) ───────────────────────────────────────

function EstadoSelector({ ticket, onMover, compact = false }: {
  ticket: TicketType
  onMover: (t: TicketType, e: EstadoTicket) => void
  compact?: boolean
}) {
  const idx  = ESTADOS.indexOf(ticket.estado)
  const next = ESTADOS[idx + 1] as EstadoTicket | undefined
  const meta = ESTADO_META[ticket.estado]
  if (!next) return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${meta.badge}`}>{compact ? "✓" : meta.label}</span>
  return (
    <button
      type="button"
      title={`Mover a ${ESTADO_META[next].label}`}
      onClick={() => onMover(ticket, next)}
      className={`text-[10px] px-1.5 py-0.5 rounded border transition hover:opacity-80 ${meta.badge}`}
    >
      {compact ? "→" : `${meta.label} →`}
    </button>
  )
}
