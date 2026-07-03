"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"
import { useGetReuniones }         from "@/api/reunion/getReuniones"
import { useGetClientesTrabajo }   from "@/api/cliente-trabajo/getClientesTrabajo"
import { useGetProyectos }         from "@/api/proyecto/getProyectos"
import { createReunion, deleteReunion, updateReunion } from "@/api/reunion/mutateReunion"
import { ReunionType } from "@/types/reunion"

function ReunionCard({ r, onDelete, onUpdate }: {
  r: ReunionType
  onDelete: (r: ReunionType) => void
  onUpdate: (r: ReunionType, notas: string, acuerdos: string) => void
}) {
  const fecha    = new Date(r.fecha)
  const hoy      = new Date().toISOString().slice(0, 10)
  const esPasada = r.fecha.slice(0, 10) < hoy
  const [expanded, setExpanded] = useState(false)
  const [editNotas,    setEditNotas]    = useState(r.notas ?? "")
  const [editAcuerdos, setEditAcuerdos] = useState(r.acuerdos ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateReunion(r.documentId, { notas: editNotas || null, acuerdos: editAcuerdos || null })
    onUpdate(r, editNotas, editAcuerdos)
    setSaving(false)
    setExpanded(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl bg-slate-900/60 border backdrop-blur-sm group ${esPasada ? "border-slate-800/40" : "border-amber-500/20"}`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Fecha badge */}
        <div className={`shrink-0 text-center w-12 rounded-lg p-1.5 ${esPasada ? "bg-slate-800/60" : "bg-amber-500/10 border border-amber-500/20"}`}>
          <p className="text-[9px] uppercase font-semibold text-slate-500">{fecha.toLocaleDateString("es-MX", { month: "short" })}</p>
          <p className={`text-lg font-bold leading-none ${esPasada ? "text-slate-400" : "text-amber-400"}`}>{fecha.getDate()}</p>
          <p className="text-[9px] text-slate-600">{fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-200">{r.titulo}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => setExpanded(!expanded)} aria-label="Expandir notas"
                className="text-slate-600 hover:text-slate-300">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => onDelete(r)} aria-label="Eliminar reunión"
                className="text-slate-600 hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-500">
            {r.clienteTrabajo && <span>{r.clienteTrabajo.nombre}</span>}
            {r.proyecto && <span className="text-slate-600">· {r.proyecto.nombre}</span>}
            {r.participantes && <span className="text-slate-600">· {r.participantes}</span>}
          </div>

          {!expanded && (r.notas || r.acuerdos) && (
            <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">{r.notas ?? r.acuerdos}</p>
          )}
        </div>
      </div>

      {/* Expanded notes editor */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slate-800/40 pt-3">
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Notas</label>
                <textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={3} placeholder="Notas de la reunión..."
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Acuerdos / Pendientes</label>
                <textarea value={editAcuerdos} onChange={e => setEditAcuerdos(e.target.value)} rows={2} placeholder="Acuerdos y próximos pasos..."
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none" />
              </div>
              <button type="button" onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium transition-colors">
                {saving ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FormReunion({ clientes, proyectos, onSave, onCancel }: {
  clientes:  { id: number; nombre: string }[]
  proyectos: { id: number; nombre: string }[]
  onSave: (r: ReunionType) => void
  onCancel: () => void
}) {
  const [titulo,       setTitulo]       = useState("")
  const [fecha,        setFecha]        = useState("")
  const [participantes,setParticipantes]= useState("")
  const [notas,        setNotas]        = useState("")
  const [clienteId,    setClienteId]    = useState<number | "">("")
  const [proyectoId,   setProyectoId]   = useState<number | "">("")
  const [saving,       setSaving]       = useState(false)

  async function handleSave() {
    if (!titulo.trim() || !fecha) return
    setSaving(true)
    const payload: any = { titulo: titulo.trim(), fecha, participantes: participantes || null, notas: notas || null }
    if (clienteId)  payload.clienteTrabajo = { connect: [{ id: clienteId }] }
    if (proyectoId) payload.proyecto       = { connect: [{ id: proyectoId }] }
    const res = await createReunion(payload)
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Nueva Reunión</h3>
      <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título *"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <input value={participantes} onChange={e => setParticipantes(e.target.value)} placeholder="Participantes"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
        {clientes.length > 0 && (
          <select value={clienteId} onChange={e => setClienteId(e.target.value ? Number(e.target.value) : "")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
            <option value="">Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
        {proyectos.length > 0 && (
          <select value={proyectoId} onChange={e => setProyectoId(e.target.value ? Number(e.target.value) : "")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
            <option value="">Sin proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}
      </div>
      <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas iniciales..." rows={2}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none" />
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!titulo.trim() || !fecha || saving}
          className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Crear Reunión"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

export default function ReunionesPage() {
  const { reuniones, setReuniones, loading } = useGetReuniones()
  const { clientes }                         = useGetClientesTrabajo()
  const { proyectos }                        = useGetProyectos()
  const [showForm, setShowForm]              = useState(false)

  const hoy      = new Date().toISOString().slice(0, 10)
  const proximas = reuniones.filter(r => r.fecha.slice(0, 10) >= hoy)
  const pasadas  = reuniones.filter(r => r.fecha.slice(0, 10) <  hoy)

  async function handleDelete(r: ReunionType) {
    await deleteReunion(r.documentId)
    setReuniones(prev => prev.filter(x => x.documentId !== r.documentId))
  }

  function handleUpdate(r: ReunionType, notas: string, acuerdos: string) {
    setReuniones(prev => prev.map(x => x.documentId === r.documentId ? { ...x, notas: notas || null, acuerdos: acuerdos || null } : x))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Nueva Reunión
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <FormReunion
            clientes={clientes.filter(c => c.activo)}
            proyectos={proyectos.filter(p => p.estado === "activo")}
            onSave={r => { setReuniones(prev => [r, ...prev]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {reuniones.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin reuniones registradas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {proximas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-widest mb-3">Próximas ({proximas.length})</p>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {proximas.map(r => <ReunionCard key={r.documentId} r={r} onDelete={handleDelete} onUpdate={handleUpdate} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {pasadas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Pasadas ({pasadas.length})</p>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {pasadas.map(r => <ReunionCard key={r.documentId} r={r} onDelete={handleDelete} onUpdate={handleUpdate} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
