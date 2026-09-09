"use client"

import { useState } from "react"
import {
  X, Pencil, Phone, Globe, MessageCircle, Mail, Calendar,
  CheckCircle2, Tag, ArrowRight,
} from "lucide-react"
import { Lead, LEAD_COLOR } from "@/types/lead"
import { updateLead } from "@/api/lead/getLead"
import { toast } from "sonner"
import { fmtDt } from "./PipelineView"

interface Props {
  lead:    Lead
  onClose: () => void
  onEdit:  () => void
  onSaved: (updated: Lead) => void
}

function CanalIcon({ canal }: { canal: string | null }) {
  const c = (canal ?? "").toLowerCase()
  if (c.includes("whatsapp"))  return <MessageCircle size={11} className="text-green-500 shrink-0" />
  if (c.includes("instagram")) return <ArrowRight size={11} className="text-pink-500 shrink-0" />
  if (c.includes("facebook"))  return <ArrowRight size={11} className="text-blue-500 shrink-0" />
  if (c.includes("email"))     return <Mail size={11} className="text-slate-400 shrink-0" />
  if (c.includes("web") || c.includes("formulario")) return <Globe size={11} className="text-violet-500 shrink-0" />
  if (c.includes("llamada"))   return <Phone size={11} className="text-slate-400 shrink-0" />
  return <MessageCircle size={11} className="text-slate-400 shrink-0" />
}

export function LeadDetalleModal({ lead: inicial, onClose, onEdit, onSaved }: Props) {
  const [lead, setLead] = useState(inicial)
  const [editNotas, setEditNotas] = useState(false)
  const [notasVal, setNotasVal]   = useState(lead.notas ?? "")
  const [guardando, setGuardando] = useState(false)

  const guardarNotas = async () => {
    setGuardando(true)
    try {
      const updated = await updateLead(lead.documentId, { notas: notasVal.trim() || null })
      setLead(updated)
      onSaved(updated)
      toast.success("Notas actualizadas")
      setEditNotas(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const lbl  = "text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1"
  const val  = "text-[13px] font-medium text-slate-800 dark:text-slate-200"

  const timeline: { label: string; fecha: string | null; color: string }[] = [
    { label: "Lead",      fecha: lead.fechaLead,       color: "bg-slate-400" },
    { label: "Oferta",    fecha: lead.fechaOferta,     color: "bg-violet-400" },
    { label: "Pedido",    fecha: lead.fechaPedido,     color: "bg-violet-500" },
    { label: "Entrega",   fecha: lead.fechaEntrega,    color: "bg-emerald-500" },
    { label: "Rechazada", fecha: lead.fechaRechazada,  color: "bg-red-400" },
    { label: "Calificado",fecha: lead.fechaCalificado, color: "bg-violet-600" },
  ].filter(t => t.fecha)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
              {lead.numero ?? "—"}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${LEAD_COLOR[lead.Funnel ?? "Lead"]}`}>
              {lead.Funnel ?? "Lead"}
            </span>
            {(lead.origen === "Formulario web" || lead.origen === "Carrito" || lead.origenApp === "tienda") && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600 flex items-center gap-1">
                <Globe size={8} /> {lead.origen === "Carrito" ? "Carrito" : "Web"}
              </span>
            )}
            {lead.calificado && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20 flex items-center gap-1">
                <CheckCircle2 size={8} /> Calificado
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border border-slate-300 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition">
              <Pencil size={11} /> Editar
            </button>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Cliente */}
          {lead.cliente && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {lead.cliente.nombre.trim()[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lead.cliente.nombre}</p>
                {lead.cliente.telefono && (
                  <a href={`tel:${lead.cliente.telefono}`}
                    className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition">
                    <Phone size={10} /> {lead.cliente.telefono}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            <div>
              <p className={lbl}>Canal</p>
              <p className={`${val} flex items-center gap-1.5`}>
                {(lead.canal ?? lead.canalContacto) && <CanalIcon canal={lead.canal ?? lead.canalContacto ?? null} />}
                {lead.canal ?? lead.canalContacto ?? "—"}
              </p>
            </div>
            <div>
              <p className={lbl}>Origen</p>
              <p className={val}>{lead.origen ?? lead.origenContacto ?? "—"}</p>
            </div>
            {lead.referidorNombre && (
              <div>
                <p className={lbl}>Referido por</p>
                <p className={val}>{lead.referidorNombre}{lead.referidorTipo === "vendedor_externo" ? " (afiliado)" : ""}</p>
              </div>
            )}
            <div>
              <p className={lbl}>Campaña / Interés</p>
              <p className={val}>{lead.campanaOrigen || "—"}</p>
            </div>
            <div>
              <p className={lbl}>Segmento</p>
              <p className={val}>{lead.segmento || "—"}</p>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <p className={`${lbl} mb-3`}>Historial de etapas</p>
              <div className="relative pl-5">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3">
                  {timeline.map(t => (
                    <div key={t.label} className="flex items-center gap-3">
                      <div className={`absolute left-[5px] w-2.5 h-2.5 rounded-full ${t.color} ring-2 ring-white dark:ring-slate-950`} />
                      <div className="flex items-center gap-3 ml-2">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600">
                          <Calendar size={10} /> {fmtDt(t.fecha)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl}>Notas / Mensaje</p>
              {!editNotas && (
                <button type="button" onClick={() => { setNotasVal(lead.notas ?? ""); setEditNotas(true) }}
                  className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition">
                  <Pencil size={9} /> Editar
                </button>
              )}
            </div>
            {editNotas ? (
              <div className="space-y-2">
                <textarea rows={4} value={notasVal}
                  onChange={e => setNotasVal(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 resize-none"
                  placeholder="Escribe notas del lead…" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditNotas(false)}
                    className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={guardarNotas} disabled={guardando}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition disabled:opacity-50">
                    <CheckCircle2 size={11} /> {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>
            ) : (
              <p className={`${val} whitespace-pre-wrap text-slate-600 dark:text-slate-400 ${!lead.notas ? "italic text-slate-300 dark:text-slate-700" : ""}`}>
                {lead.notas || "Sin notas"}
              </p>
            )}
          </div>

          {/* Fecha de registro */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-300 dark:text-slate-700 flex items-center gap-1.5">
              <Tag size={9} /> Registrado {fmtDt(lead.createdAt)}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
