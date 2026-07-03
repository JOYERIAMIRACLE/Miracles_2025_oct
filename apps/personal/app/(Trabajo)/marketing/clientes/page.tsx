"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Users, Mail, Phone, Building2 } from "lucide-react"
import { useGetClientesTrabajo }  from "@/api/cliente-trabajo/getClientesTrabajo"
import { createClienteTrabajo, updateClienteTrabajo, deleteClienteTrabajo } from "@/api/cliente-trabajo/mutateClienteTrabajo"
import { ClienteTrabajoType } from "@/types/cliente-trabajo"

function ClienteCard({ c, onToggle, onDelete }: {
  c: ClienteTrabajoType
  onToggle: (c: ClienteTrabajoType) => void
  onDelete: (c: ClienteTrabajoType) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur-sm space-y-3 group transition-all ${c.activo ? "border-slate-700/40" : "border-slate-800/30 opacity-60"}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-cyan-400">{c.nombre.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{c.nombre}</p>
          {c.empresa && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
              <Building2 className="h-3 w-3" />{c.empresa}
            </div>
          )}
        </div>
        <button type="button" onClick={() => onDelete(c)} aria-label="Eliminar cliente"
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {c.email && (
          <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors">
            <Mail className="h-3.5 w-3.5" />{c.email}
          </a>
        )}
        {c.telefono && (
          <a href={`tel:${c.telefono}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors">
            <Phone className="h-3.5 w-3.5" />{c.telefono}
          </a>
        )}
      </div>

      {c.notas && <p className="text-[11px] text-slate-600 line-clamp-2 border-t border-slate-800/40 pt-2">{c.notas}</p>}

      <button type="button" onClick={() => onToggle(c)}
        className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-colors ${c.activo ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" : "border-slate-600 text-slate-500 hover:text-slate-300"}`}>
        {c.activo ? "Activo" : "Inactivo"}
      </button>
    </motion.div>
  )
}

function FormCliente({ onSave, onCancel }: {
  onSave: (c: ClienteTrabajoType) => void
  onCancel: () => void
}) {
  const [nombre,   setNombre]   = useState("")
  const [empresa,  setEmpresa]  = useState("")
  const [email,    setEmail]    = useState("")
  const [telefono, setTelefono] = useState("")
  const [notas,    setNotas]    = useState("")
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const res = await createClienteTrabajo({
      nombre: nombre.trim(), empresa: empresa || null,
      email: email || null, telefono: telefono || null, notas: notas || null,
    })
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-cyan-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Nuevo Cliente</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre *"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
        <input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Empresa"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
        <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
      </div>
      <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas..." rows={2}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 resize-none" />
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!nombre.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Agregar Cliente"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

export default function ClientesPage() {
  const { clientes, setClientes, loading } = useGetClientesTrabajo()
  const [showForm, setShowForm]            = useState(false)
  const [buscar,   setBuscar]              = useState("")

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(buscar.toLowerCase())
  )
  const activos   = filtrados.filter(c => c.activo)
  const inactivos = filtrados.filter(c => !c.activo)

  async function handleToggle(c: ClienteTrabajoType) {
    await updateClienteTrabajo(c.documentId, { activo: !c.activo })
    setClientes(prev => prev.map(x => x.documentId === c.documentId ? { ...x, activo: !x.activo } : x))
  }

  async function handleDelete(c: ClienteTrabajoType) {
    await deleteClienteTrabajo(c.documentId)
    setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar cliente o empresa..."
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <FormCliente
            onSave={c => { setClientes(prev => [c, ...prev]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {clientes.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin clientes. Agrega el primero.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Activos ({activos.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {activos.map(c => <ClienteCard key={c.documentId} c={c} onToggle={handleToggle} onDelete={handleDelete} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {inactivos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Inactivos ({inactivos.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {inactivos.map(c => <ClienteCard key={c.documentId} c={c} onToggle={handleToggle} onDelete={handleDelete} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
