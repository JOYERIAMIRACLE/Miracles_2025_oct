"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, FolderKanban, Calendar, DollarSign } from "lucide-react"
import { useGetProyectos }       from "@/api/proyecto/getProyectos"
import { useGetClientesTrabajo } from "@/api/cliente-trabajo/getClientesTrabajo"
import { createProyecto, updateProyecto, deleteProyecto } from "@/api/proyecto/mutateProyecto"
import { ProyectoType, EstadoProyecto, PrioridadProyecto } from "@/types/proyecto"

const ESTADO_BADGE: Record<EstadoProyecto, string> = {
  activo:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  pausado:    "bg-amber-500/15 text-amber-400 border-amber-500/20",
  completado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelado:  "bg-slate-700 text-slate-500 border-slate-600",
}

const COLORES = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"]

function ProyectoCard({ p, onDelete, onEstado }: {
  p: ProyectoType
  onDelete: (p: ProyectoType) => void
  onEstado: (p: ProyectoType, e: EstadoProyecto) => void
}) {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-3 group"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color ?? "#6366f1"}20`, border: `1px solid ${p.color ?? "#6366f1"}40` }}>
          <FolderKanban className="h-4 w-4" style={{ color: p.color ?? "#6366f1" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{p.nombre}</p>
          {p.clienteTrabajo && <p className="text-[10px] text-slate-500">{p.clienteTrabajo.nombre}{p.clienteTrabajo.empresa ? ` · ${p.clienteTrabajo.empresa}` : ""}</p>}
        </div>
        <button type="button" onClick={() => onDelete(p)} aria-label="Eliminar proyecto"
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {p.descripcion && <p className="text-xs text-slate-500 line-clamp-2">{p.descripcion}</p>}

      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className={`px-1.5 py-0.5 rounded-full border font-medium ${ESTADO_BADGE[p.estado]}`}>{p.estado}</span>
        <span className={`px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500`}>{p.prioridad}</span>
        {p.presupuesto != null && (
          <span className="flex items-center gap-0.5 text-emerald-500 ml-auto">
            <DollarSign className="h-3 w-3" />{fmt(p.presupuesto)}
          </span>
        )}
      </div>

      {(p.fechaInicio || p.fechaFin) && (
        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <Calendar className="h-3 w-3" />
          {p.fechaInicio && <span>{p.fechaInicio}</span>}
          {p.fechaInicio && p.fechaFin && <span>→</span>}
          {p.fechaFin && <span>{p.fechaFin}</span>}
        </div>
      )}

      {/* Cambio rápido de estado */}
      <select
        value={p.estado}
        onChange={e => onEstado(p, e.target.value as EstadoProyecto)}
        className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-400"
      >
        <option value="activo">Activo</option>
        <option value="pausado">Pausado</option>
        <option value="completado">Completado</option>
        <option value="cancelado">Cancelado</option>
      </select>
    </motion.div>
  )
}

function FormProyecto({ clientes, onSave, onCancel }: {
  clientes: { id: number; nombre: string; empresa: string | null }[]
  onSave: (p: ProyectoType) => void
  onCancel: () => void
}) {
  const [nombre,      setNombre]      = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado,      setEstado]      = useState<EstadoProyecto>("activo")
  const [prioridad,   setPrioridad]   = useState<PrioridadProyecto>("media")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin,    setFechaFin]    = useState("")
  const [presupuesto, setPresupuesto] = useState("")
  const [clienteId,   setClienteId]   = useState<number | "">("")
  const [color,       setColor]       = useState(COLORES[0])
  const [saving,      setSaving]      = useState(false)

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const payload: any = { nombre: nombre.trim(), descripcion: descripcion || null, estado, prioridad, color,
      fechaInicio: fechaInicio || null, fechaFin: fechaFin || null,
      presupuesto: presupuesto ? Number(presupuesto) : null }
    if (clienteId) payload.clienteTrabajo = { connect: [{ id: clienteId }] }
    const res = await createProyecto(payload)
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-blue-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Nuevo Proyecto</h3>
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del proyecto *"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/50" />
      <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" rows={2}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/50 resize-none" />
      <div className="grid grid-cols-2 gap-3">
        <select value={estado} onChange={e => setEstado(e.target.value as EstadoProyecto)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={prioridad} onChange={e => setPrioridad(e.target.value as PrioridadProyecto)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="baja">Prioridad Baja</option>
          <option value="media">Prioridad Media</option>
          <option value="alta">Prioridad Alta</option>
        </select>
        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} placeholder="Inicio"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} placeholder="Fin"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <input type="number" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} placeholder="Presupuesto ($)"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        {clientes.length > 0 && (
          <select value={clienteId} onChange={e => setClienteId(e.target.value ? Number(e.target.value) : "")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
            <option value="">Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ""}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Color:</span>
        {COLORES.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`}
            className={`h-5 w-5 rounded-full transition-all ${color === c ? "ring-2 ring-white/50 scale-125" : ""}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!nombre.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Crear Proyecto"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

export default function ProyectosPage() {
  const { proyectos, setProyectos, loading } = useGetProyectos()
  const { clientes }                         = useGetClientesTrabajo()
  const [showForm, setShowForm]              = useState(false)
  const [filtro,   setFiltro]                = useState<EstadoProyecto | "todos">("todos")

  const filtrados = filtro === "todos" ? proyectos : proyectos.filter(p => p.estado === filtro)

  async function handleDelete(p: ProyectoType) {
    await deleteProyecto(p.documentId)
    setProyectos(prev => prev.filter(x => x.documentId !== p.documentId))
  }

  async function handleEstado(p: ProyectoType, estado: EstadoProyecto) {
    await updateProyecto(p.documentId, { estado })
    setProyectos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, estado } : x))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["todos","activo","pausado","completado","cancelado"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filtro === f ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === "todos" ? `(${proyectos.length})` : `(${proyectos.filter(p => p.estado === f).length})`}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Proyecto
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <FormProyecto
            clientes={clientes.filter(c => c.activo)}
            onSave={p => { setProyectos(prev => [p, ...prev]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin proyectos{filtro !== "todos" ? ` ${filtro}s` : ""}. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtrados.map(p => (
              <ProyectoCard key={p.documentId} p={p} onDelete={handleDelete} onEstado={handleEstado} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
