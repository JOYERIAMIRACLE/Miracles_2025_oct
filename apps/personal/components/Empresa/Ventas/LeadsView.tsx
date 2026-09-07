"use client"

import { useState, useMemo, useRef } from "react"
import { Plus, Pencil, Trash2, Phone, CheckCircle2, UserSearch, CornerDownLeft } from "lucide-react"
import { toast } from "sonner"
import { ClienteEmpresa, ClientePayload, FUNNEL_ALL, FUNNEL_LABEL, FunnelEtapa } from "@/types/clienteEmpresa"
import { Lead, LEAD_COLOR } from "@/types/lead"
import { createLead } from "@/api/lead/getLead"
import { useClientesPipeline } from "./useClientesPipeline"
import { ClientePanel, ClienteModal, CanalIcon, fmtDt, emptyCliente } from "./PipelineView"
import { NuevoLeadWizard } from "./NuevoLeadWizard"
import { ListToolbar } from "./ListToolbar"

export function LeadsView() {
  const {
    clientes, leads, loading,
    ventasPorCliente, actualizarVenta,
    avanzarLead, toggleCalificadoLead, borrarLead, agregarLead,
    guardarCliente,
  } = useClientesPipeline()

  const [wizardOpen,      setWizardOpen]      = useState(false)
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente("Lead"))
  const [guardando,       setGuardando]       = useState(false)
  const [selectedLead,    setSelectedLead]    = useState<Lead | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)
  const [filtroEtapa,     setFiltroEtapa]     = useState<FunnelEtapa | "todos">("Lead")
  const [filtro,          setFiltro]          = useState<"todos" | "calificado" | "sin_calificar">("todos")
  const [search,          setSearch]          = useState("")
  const [delId,           setDelId]           = useState<string | null>(null)

  const [qNombre,   setQNombre]   = useState("")
  const [qTelefono, setQTelefono] = useState("")
  const [qSaving,   setQSaving]   = useState(false)
  const qNombreRef = useRef<HTMLInputElement>(null)

  // Alta rápida — crea ClienteEmpresa + Lead al mismo tiempo
  const altaRapida = async () => {
    if (!qNombre.trim() || qSaving) return
    setQSaving(true)
    try {
      const nuevoCliente = await guardarCliente(null, {
        ...emptyCliente("Lead"),
        nombre: qNombre.trim(),
        telefono: qTelefono.trim() || null,
      })
      const lead = await createLead({
        cliente: nuevoCliente.documentId,
        Funnel: "Lead",
        fechaLead: new Date().toISOString(),
      })
      agregarLead(lead)
      setQNombre(""); setQTelefono("")
      toast.success(`${nuevoCliente.nombre} agregado`)
      qNombreRef.current?.focus()
    } catch { toast.error("Error al agregar") } finally { setQSaving(false) }
  }

  const leadsFiltrados = useMemo(() => {
    let all = leads.slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filtroEtapa !== "todos") all = all.filter(l => l.Funnel === filtroEtapa)
    if (filtro === "calificado")    all = all.filter(l => l.calificado)
    if (filtro === "sin_calificar") all = all.filter(l => !l.calificado)
    if (search.trim()) {
      const q = search.toLowerCase()
      all = all.filter(l =>
        (l.cliente?.nombre ?? "").toLowerCase().includes(q) ||
        (l.cliente?.telefono ?? "").includes(q) ||
        (l.canalContacto ?? "").toLowerCase().includes(q) ||
        (l.numero ?? "").toLowerCase().includes(q)
      )
    }
    return all
  }, [leads, filtroEtapa, filtro, search])

  const numMap = useMemo(() => {
    const m = new Map<string, string>()
    leads.forEach(l => m.set(l.documentId, l.numero ?? "—"))
    return m
  }, [leads])

  const stats = useMemo(() => {
    const base = filtroEtapa === "todos" ? leads : leads.filter(l => l.Funnel === filtroEtapa)
    return {
      total:       base.length,
      calificados: base.filter(l => l.calificado).length,
    }
  }, [leads, filtroEtapa])

  const resolverCliente = (lead: Lead): ClienteEmpresa | null =>
    clientes.find(c => c.documentId === lead.cliente?.documentId) ?? null

  const abrirPanel = (lead: Lead) => {
    const c = resolverCliente(lead)
    if (!c) return
    setSelectedLead(lead)
    setSelectedCliente(c)
  }

  const cerrarPanel = () => { setSelectedLead(null); setSelectedCliente(null) }

  const abrirEditar = (lead: Lead) => {
    const c = resolverCliente(lead)
    if (!c) { toast.error("Contacto no encontrado"); return }
    setEditando(c)
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: c.Funnel ?? "Lead", calificado: c.calificado,
      canalContacto: c.canalContacto, origenContacto: c.origenContacto, campanaOrigen: c.campanaOrigen,
      Estado: c.Estado, notas: c.notas,
      tallaAnillo: c.tallaAnillo, ocasionFrecuente: c.ocasionFrecuente, estadoCivil: c.estadoCivil,
      sexo: c.sexo, fechaNacimiento: c.fechaNacimiento, redesSociales: c.redesSociales,
      fechaLead: c.fechaLead, fechaCalificado: c.fechaCalificado,
      fechaOferta: c.fechaOferta, fechaPedido: c.fechaPedido, fechaEntrega: c.fechaEntrega,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      await guardarCliente(editando, form)
      toast.success(editando ? "Actualizado" : "Contacto creado")
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const handleBorrar = async (lead: Lead) => {
    const ok = await borrarLead(lead)
    if (ok && selectedLead?.documentId === lead.documentId) cerrarPanel()
    setDelId(null)
  }

  const handleCalificar = async (lead: Lead) => {
    const u = await toggleCalificadoLead(lead)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(u)
  }

  if (selectedCliente && selectedLead) {
    return (
      <div className="p-4 md:p-6">
        <ClientePanel
          cliente={selectedCliente}
          num={numMap.get(selectedLead.documentId) ?? "—"}
          ventasDelCliente={ventasPorCliente.get(selectedCliente.documentId) ?? []}
          onClose={cerrarPanel}
          onUpdate={setSelectedCliente}
          onEdit={() => { abrirEditar(selectedLead); cerrarPanel() }}
          onAvanzar={async () => {}}
          onRetroceder={async () => {}}
          onRechazar={async () => null}
          onRecuperar={async () => null}
          onNuevoPedido={() => {}}
          onVentaActualizada={actualizarVenta}
          backLabel="Volver a Leads"
          mostrarAccionesEtapa={false}
        />
        {modalOpen && (
          <ClienteModal editando={editando} form={form} setForm={setForm}
            onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <UserSearch size={18} className="text-violet-600 dark:text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leads</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {stats.total} leads · {stats.calificados} calificados
          </p>
        </div>
        <button type="button" onClick={() => setWizardOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
      </div>

      {/* Alta rápida */}
      <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <Plus size={14} className="text-slate-400 dark:text-slate-600 shrink-0 ml-1" />
        <input ref={qNombreRef} value={qNombre} onChange={e => setQNombre(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") altaRapida() }}
          placeholder="Nombre del contacto…" disabled={qSaving}
          className="flex-1 min-w-0 h-9 px-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none" />
        <input value={qTelefono} onChange={e => setQTelefono(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") altaRapida() }}
          placeholder="Teléfono (opcional)" disabled={qSaving}
          className="w-44 shrink-0 h-9 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-300 dark:focus:border-slate-600" />
        <button type="button" onClick={altaRapida} disabled={!qNombre.trim() || qSaving}
          className="flex items-center gap-1 h-9 px-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition shrink-0">
          <CornerDownLeft size={12} /> {qSaving ? "Agregando…" : "Agregar"}
        </button>
      </div>

      {/* Filtro por etapa */}
      <div className="flex flex-wrap gap-1.5">
        {([["todos", "Todos", leads.length], ...FUNNEL_ALL.map(e => [e, FUNNEL_LABEL[e], leads.filter(l => l.Funnel === e).length])] as [string, string, number][]).map(([v, label, count]) => (
          <button key={v} type="button"
            onClick={() => setFiltroEtapa(v as FunnelEtapa | "todos")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition ${
              filtroEtapa === v
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}>
            {label}
            <span className={`text-[10px] ${filtroEtapa === v ? "opacity-70" : "opacity-50"}`}>{count}</span>
          </button>
        ))}
      </div>

      <ListToolbar
        search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre, teléfono o canal…"
        filtros={[
          { value: "todos", label: "Todos" },
          { value: "calificado", label: "Calificados" },
          { value: "sin_calificar", label: "Sin calificar" },
        ]}
        filtroActivo={filtro} filtroDefault="todos" onFiltroChange={setFiltro}
        metricas={[
          { label: "Total leads",    value: stats.total },
          { label: "Calificados",    value: stats.calificados, colorClass: "text-violet-600 dark:text-violet-400" },
          { label: "Sin calificar",  value: stats.total - stats.calificados },
        ]}
      />

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Contacto", "Etapa", "Canal", "Teléfono", "Notas", "Calificación", "Fecha", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" />
                  </td>
                ))}</tr>
              ))}
              {!loading && leadsFiltrados.map(lead => (
                <tr key={lead.documentId}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => abrirPanel(lead)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shrink-0">
                        #{numMap.get(lead.documentId) ?? "—"}
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{lead.cliente?.nombre ?? "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${LEAD_COLOR[lead.Funnel ?? "Lead"]}`}>
                      {FUNNEL_LABEL[lead.Funnel ?? "Lead"]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.canalContacto ? (
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                        <CanalIcon canal={lead.canalContacto} />{lead.canalContacto}
                      </span>
                    ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.cliente?.telefono ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone size={10} className="text-slate-400 dark:text-slate-600" />{lead.cliente.telefono}
                      </p>
                    ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.notas ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-[220px] truncate italic">"{lead.notas}"</p>
                    ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => handleCalificar(lead)}
                      className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                        lead.calificado
                          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/20"
                          : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}>
                      <CheckCircle2 size={11} className={lead.calificado ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-600"} />
                      {lead.calificado ? "Calificado" : "Calificar"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs whitespace-nowrap">
                    {lead.fechaLead ? fmtDt(lead.fechaLead) : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {delId === lead.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleBorrar(lead)} className="text-[11px] text-red-600 dark:text-red-400 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500 dark:text-slate-500">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => abrirEditar(lead)}
                          className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                        <button type="button" onClick={() => setDelId(lead.documentId)}
                          className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && leadsFiltrados.length === 0 && (
            <div className="py-14 text-center">
              <UserSearch size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                {filtroEtapa !== "todos" || filtro !== "todos" || search
                  ? "No hay leads con este filtro."
                  : "No hay leads registrados."}
              </p>
              {filtroEtapa === "todos" && filtro === "todos" && !search && (
                <button type="button" onClick={() => setWizardOpen(true)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-800/50 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition mx-auto">
                  <Plus size={14} /> Registrar primer lead
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {wizardOpen && (
        <NuevoLeadWizard
          clientes={clientes}
          guardarCliente={guardarCliente}
          onCreado={(lead, _cliente) => { agregarLead(lead) }}
          onCerrar={() => setWizardOpen(false)}
        />
      )}

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

    </div>
  )
}
