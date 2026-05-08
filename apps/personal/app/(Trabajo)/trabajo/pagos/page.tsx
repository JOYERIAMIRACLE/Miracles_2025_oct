"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Wallet, TrendingUp } from "lucide-react"
import { useGetPagosTrabajo }      from "@/api/pago-trabajo/getPagosTrabajo"
import { useGetClientesTrabajo }   from "@/api/cliente-trabajo/getClientesTrabajo"
import { useGetProyectos }         from "@/api/proyecto/getProyectos"
import { createPagoTrabajo, updatePagoTrabajo, deletePagoTrabajo } from "@/api/pago-trabajo/mutatePagoTrabajo"
import { PagoTrabajoType, EstadoPago } from "@/types/pago-trabajo"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

const ESTADO_BADGE: Record<EstadoPago, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pagado:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  parcial:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

function FormPago({ clientes, proyectos, onSave, onCancel }: {
  clientes:  { id: number; nombre: string }[]
  proyectos: { id: number; nombre: string }[]
  onSave: (p: PagoTrabajoType) => void
  onCancel: () => void
}) {
  const [concepto,   setConcepto]   = useState("")
  const [monto,      setMonto]      = useState("")
  const [fecha,      setFecha]      = useState(new Date().toISOString().slice(0, 10))
  const [estado,     setEstado]     = useState<EstadoPago>("pendiente")
  const [notas,      setNotas]      = useState("")
  const [clienteId,  setClienteId]  = useState<number | "">("")
  const [proyectoId, setProyectoId] = useState<number | "">("")
  const [saving,     setSaving]     = useState(false)

  async function handleSave() {
    if (!concepto.trim() || !monto) return
    setSaving(true)
    const payload: any = { concepto: concepto.trim(), monto: Number(monto), fecha: fecha || null, estado, notas: notas || null }
    if (clienteId)  payload.clienteTrabajo = { connect: [{ id: clienteId }] }
    if (proyectoId) payload.proyecto       = { connect: [{ id: proyectoId }] }
    const res = await createPagoTrabajo(payload)
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Nuevo Pago</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Concepto *"
          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Monto ($) *"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <select value={estado} onChange={e => setEstado(e.target.value as EstadoPago)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="parcial">Parcial</option>
        </select>
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
        <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas"
          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!concepto.trim() || !monto || saving}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Registrar Pago"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

export default function PagosPage() {
  const { pagos, setPagos, loading } = useGetPagosTrabajo()
  const { clientes }                 = useGetClientesTrabajo()
  const { proyectos }                = useGetProyectos()
  const [showForm, setShowForm]      = useState(false)
  const [filtro,   setFiltro]        = useState<EstadoPago | "todos">("todos")

  const filtrados = filtro === "todos" ? pagos : pagos.filter(p => p.estado === filtro)

  const resumen = useMemo(() => ({
    total:     pagos.reduce((s, p) => s + p.monto, 0),
    cobrado:   pagos.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0),
    pendiente: pagos.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0),
  }), [pagos])

  async function handleEstado(p: PagoTrabajoType, estado: EstadoPago) {
    await updatePagoTrabajo(p.documentId, { estado })
    setPagos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, estado } : x))
  }

  async function handleDelete(p: PagoTrabajoType) {
    await deletePagoTrabajo(p.documentId)
    setPagos(prev => prev.filter(x => x.documentId !== p.documentId))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",     value: resumen.total,     color: "text-slate-200"   },
          { label: "Cobrado",   value: resumen.cobrado,   color: "text-emerald-400" },
          { label: "Pendiente", value: resumen.pendiente, color: "text-amber-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["todos","pendiente","pagado","parcial"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filtro === f ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === "todos" ? `(${pagos.length})` : `(${pagos.filter(p => p.estado === f).length})`}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Registrar Pago
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <FormPago
            clientes={clientes.filter(c => c.activo)}
            proyectos={proyectos.filter(p => p.estado === "activo")}
            onSave={p => { setPagos(prev => [p, ...prev]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin pagos registrados.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Concepto</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Cliente / Proyecto</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtrados.map(p => (
                  <motion.tr
                    key={p.documentId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-800/30 last:border-0 group hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium truncate max-w-[160px]">{p.concepto}</p>
                      {p.notas && <p className="text-[10px] text-slate-600 truncate">{p.notas}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-slate-400 text-xs truncate">{p.clienteTrabajo?.nombre ?? "—"}</p>
                      {p.proyecto && <p className="text-[10px] text-slate-600 truncate">{p.proyecto.nombre}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.fecha ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-200 tabular-nums">{fmt(p.monto)}</td>
                    <td className="px-4 py-3 text-center">
                      <select value={p.estado} onChange={e => handleEstado(p, e.target.value as EstadoPago)}
                        className={`text-[10px] px-2 py-1 rounded-full border font-medium bg-transparent cursor-pointer ${ESTADO_BADGE[p.estado]}`}>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="parcial">Parcial</option>
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <button type="button" onClick={() => handleDelete(p)} aria-label="Eliminar pago"
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
