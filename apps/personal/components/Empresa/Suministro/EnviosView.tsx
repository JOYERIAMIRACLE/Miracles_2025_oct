"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, Package, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import {
  useGetEnvios, createEnvio, updateEnvio, deleteEnvio,
} from "@/api/envio/getEnvios"
import {
  EnvioType, EstadoEnvio, PaqueteriaEnvio,
  ESTADO_ENVIO_LABELS, ESTADO_ENVIO_COLORS, PAQUETERIA_LABELS,
} from "@/types/envio"
import { cn } from "@/lib/utils"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none transition-all"

const ESTADOS: EstadoEnvio[]    = ["pendiente", "preparando", "enviado", "en_transito", "entregado", "devuelto", "cancelado"]
const PAQUETERIAS: PaqueteriaEnvio[] = ["fedex", "dhl", "estafeta", "ups", "correos_mex", "otro"]

type Form = {
  numero_guia: string; paqueteria: string; estado: string
  cliente: string; concepto: string
  fecha_envio: string; fecha_estimada: string
  costo_envio: string; notas: string
}

function emptyForm(): Form {
  return {
    numero_guia: "", paqueteria: "otro", estado: "pendiente",
    cliente: "", concepto: "",
    fecha_envio: new Date().toISOString().split("T")[0], fecha_estimada: "",
    costo_envio: "", notas: "",
  }
}

const fmt = (n: number | null | undefined) =>
  n ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

export function EnviosView() {
  const { envios, setEnvios, loading } = useGetEnvios()
  const [filtro,    setFiltro]    = useState<EstadoEnvio | "todos">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<EnvioType | null>(null)
  const [form,      setForm]      = useState<Form>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const filtrados = useMemo(() => {
    if (filtro === "todos") return envios
    return envios.filter(e => e.estado === filtro)
  }, [envios, filtro])

  const stats = useMemo(() => ({
    total:       envios.length,
    pendiente:   envios.filter(e => e.estado === "pendiente").length,
    en_transito: envios.filter(e => e.estado === "en_transito" || e.estado === "enviado").length,
    entregado:   envios.filter(e => e.estado === "entregado").length,
  }), [envios])

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(e: EnvioType) {
    setEditing(e)
    setForm({
      numero_guia:    e.numero_guia    ?? "",
      paqueteria:     e.paqueteria     ?? "otro",
      estado:         e.estado,
      cliente:        e.cliente        ?? "",
      concepto:       e.concepto       ?? "",
      fecha_envio:    e.fecha_envio    ?? new Date().toISOString().split("T")[0],
      fecha_estimada: e.fecha_estimada ?? "",
      costo_envio:    e.costo_envio != null ? String(e.costo_envio) : "",
      notas:          e.notas          ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.cliente.trim() && !form.concepto.trim()) {
      toast.error("Agrega cliente o concepto")
      return
    }
    setSaving(true)
    try {
      const payload = {
        numero_guia:    form.numero_guia    || null,
        paqueteria:     form.paqueteria     || null,
        estado:         form.estado         || "pendiente",
        cliente:        form.cliente        || null,
        concepto:       form.concepto       || null,
        fecha_envio:    form.fecha_envio    || null,
        fecha_estimada: form.fecha_estimada || null,
        costo_envio:    form.costo_envio    ? Number(form.costo_envio) : null,
        notas:          form.notas          || null,
      }
      if (editing) {
        const updated = await updateEnvio(editing.documentId, payload)
        setEnvios(prev => prev.map(e => e.documentId === editing.documentId ? updated : e))
        toast.success("Envío actualizado")
      } else {
        const nuevo = await createEnvio(payload)
        setEnvios(prev => [nuevo, ...prev])
        toast.success("Envío registrado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteEnvio(documentId)
      setEnvios(prev => prev.filter(e => e.documentId !== documentId))
      toast.success("Envío eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",       value: stats.total,       color: "text-slate-200" },
          { label: "Pendientes",  value: stats.pendiente,   color: "text-violet-400" },
          { label: "En tránsito", value: stats.en_transito, color: "text-violet-400" },
          { label: "Entregados",  value: stats.entregado,   color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button type="button" onClick={() => setFiltro("todos")}
            className={cn("h-8 px-3 text-xs rounded-lg border capitalize transition-colors",
              filtro === "todos" ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
            )}>
            Todos
          </button>
          {ESTADOS.map(e => (
            <button key={e} type="button" onClick={() => setFiltro(e)}
              className={cn("h-8 px-3 text-xs rounded-lg border capitalize transition-colors",
                filtro === e ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {ESTADO_ENVIO_LABELS[e]}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo envío
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
        {!loading && filtrados.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin envíos registrados.</p>
          </div>
        )}
        {!loading && filtrados.map(e => (
          <div key={e.documentId}
            className="group flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {e.cliente ?? "—"}{e.concepto ? ` · ${e.concepto}` : ""}
                </p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", ESTADO_ENVIO_COLORS[e.estado])}>
                  {ESTADO_ENVIO_LABELS[e.estado]}
                </span>
                {e.paqueteria && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-700/50 text-slate-400 border-slate-600/50 shrink-0">
                    {PAQUETERIA_LABELS[e.paqueteria]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {e.numero_guia && (
                  <span className="text-xs text-slate-500 font-mono">{e.numero_guia}</span>
                )}
                {e.fecha_envio && (
                  <span className="text-xs text-slate-600">Envío: {e.fecha_envio}</span>
                )}
                {e.fecha_estimada && (
                  <span className="text-xs text-slate-600">Est: {e.fecha_estimada}</span>
                )}
                {e.costo_envio != null && (
                  <span className="text-xs text-slate-500">{fmt(e.costo_envio)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button type="button" onClick={() => openEditar(e)}
                className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                <Pencil size={13} />
              </button>
              {delId === e.documentId ? (
                <div className="flex items-center gap-1 px-1">
                  <button type="button" onClick={() => handleDelete(e.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                  <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                </div>
              ) : (
                <button type="button" onClick={() => setDelId(e.documentId)}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={ev => { if (ev.target === ev.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar envío" : "Nuevo envío"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select value={form.estado} onChange={ev => setForm(f => ({ ...f, estado: ev.target.value }))} className={inp + " cursor-pointer"}>
                    {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_ENVIO_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Paquetería</label>
                  <select value={form.paqueteria} onChange={ev => setForm(f => ({ ...f, paqueteria: ev.target.value }))} className={inp + " cursor-pointer"}>
                    {PAQUETERIAS.map(p => <option key={p} value={p}>{PAQUETERIA_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">N° de guía</label>
                <input type="text" value={form.numero_guia} onChange={ev => setForm(f => ({ ...f, numero_guia: ev.target.value }))}
                  className={inp} placeholder="Número de rastreo…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cliente</label>
                  <input type="text" value={form.cliente} onChange={ev => setForm(f => ({ ...f, cliente: ev.target.value }))}
                    className={inp} placeholder="Nombre del cliente…" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto</label>
                  <input type="text" value={form.concepto} onChange={ev => setForm(f => ({ ...f, concepto: ev.target.value }))}
                    className={inp} placeholder="Qué se envía…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha de envío</label>
                  <input type="date" value={form.fecha_envio} onChange={ev => setForm(f => ({ ...f, fecha_envio: ev.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha estimada</label>
                  <input type="date" value={form.fecha_estimada} onChange={ev => setForm(f => ({ ...f, fecha_estimada: ev.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Costo de envío ($)</label>
                <input type="number" min="0" step="0.01" value={form.costo_envio}
                  onChange={ev => setForm(f => ({ ...f, costo_envio: ev.target.value }))}
                  className={inp} placeholder="0.00" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <textarea rows={2} value={form.notas} onChange={ev => setForm(f => ({ ...f, notas: ev.target.value }))}
                  className={area} placeholder="Observaciones…" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
