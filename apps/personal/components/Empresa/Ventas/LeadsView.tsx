"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Phone, CheckCircle2, UserSearch } from "lucide-react"
import { toast } from "sonner"
import { ClienteEmpresa, ClientePayload } from "@/types/clienteEmpresa"
import { useClientesPipeline } from "./useClientesPipeline"
import { ClientePanel, ClienteModal, NuevoPedidoGateModal, CanalIcon, fmtDt, numDisplay, emptyCliente } from "./PipelineView"

export function LeadsView() {
  const {
    clientes, loading,
    ventasPorCliente, cotizacionesPorCliente,
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
  } = useClientesPipeline()

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<ClienteEmpresa | null>(null)
  const [form,         setForm]         = useState<ClientePayload>(emptyCliente("Lead"))
  const [guardando,    setGuardando]    = useState(false)
  const [selectedLead, setSelectedLead] = useState<ClienteEmpresa | null>(null)
  const [filtro,       setFiltro]       = useState<"todos" | "calificado" | "sin_calificar">("todos")

  const leads = useMemo(() => {
    const all = clientes
      .filter(c => (c.Funnel ?? "Lead") === "Lead")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filtro === "calificado")    return all.filter(c => c.calificado)
    if (filtro === "sin_calificar") return all.filter(c => !c.calificado)
    return all
  }, [clientes, filtro])

  const numMap = useMemo(() => {
    const all = clientes
      .filter(c => (c.Funnel ?? "Lead") === "Lead")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const m = new Map<string, string>()
    all.forEach((c, i) => m.set(c.documentId, numDisplay("Lead", i)))
    return m
  }, [clientes])

  const stats = useMemo(() => ({
    total:       clientes.filter(c => (c.Funnel ?? "Lead") === "Lead").length,
    calificados: clientes.filter(c => (c.Funnel ?? "Lead") === "Lead" && c.calificado).length,
  }), [clientes])

  const abrirCrear  = () => { setEditando(null); setForm(emptyCliente("Lead")); setModalOpen(true) }
  const abrirEditar = (c: ClienteEmpresa) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: "Lead", calificado: c.calificado,
      canalContacto: c.canalContacto, origenContacto: c.origenContacto, Estado: c.Estado, notas: c.notas,
      fechaLead: c.fechaLead, fechaCalificado: c.fechaCalificado,
      fechaOferta: c.fechaOferta, fechaPedido: c.fechaPedido, fechaEntrega: c.fechaEntrega,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      const saved = await guardarCliente(editando, form)
      if (selectedLead?.documentId === saved.documentId) setSelectedLead(saved)
      toast.success(editando ? "Actualizado" : "Lead registrado")
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const handleBorrar = async (c: ClienteEmpresa) => {
    const ok = await borrar(c)
    if (ok && selectedLead?.documentId === c.documentId) setSelectedLead(null)
  }
  const handleCalificar = async (c: ClienteEmpresa) => {
    const u = await toggleCalificado(c)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(u)
  }
  const handleAvanzar = async (c: ClienteEmpresa) => {
    const u = await avanzar(c)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(null) // avanzó a Oferta, sale de esta lista
  }
  const handleRechazar = async (c: ClienteEmpresa) => {
    const u = await rechazar(c)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(null)
    return u
  }
  const handleRecuperar = async (c: ClienteEmpresa) => {
    const u = await recuperar(c)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(u)
    return u
  }
  const onPedidoCreado = async (v: Parameters<typeof handlePedidoCreado>[0]) => {
    const u = await handlePedidoCreado(v)
    if (u && selectedLead?.documentId === u.documentId) setSelectedLead(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <UserSearch size={18} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-100">Leads</h1>
          </div>
          <p className="text-sm text-slate-500">
            {stats.total} leads · {stats.calificados} calificados
          </p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Total leads</p>
          <p className="text-xl font-bold text-slate-200">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Calificados</p>
          <p className="text-xl font-bold text-violet-400">{stats.calificados}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Sin calificar</p>
          <p className="text-xl font-bold text-slate-500">{stats.total - stats.calificados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5">
        {(["todos", "calificado", "sin_calificar"] as const).map(f => (
          <button key={f} type="button"
            onClick={() => setFiltro(f)}
            className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
              filtro === f
                ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {f === "todos" ? "Todos" : f === "calificado" ? "Calificados" : "Sin calificar"}
          </button>
        ))}
      </div>

      {/* Grid de leads */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center">
          <UserSearch size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-slate-600 text-sm">
            {filtro === "todos" ? "No hay leads registrados." : "No hay leads con este filtro."}
          </p>
          {filtro === "todos" && (
            <button type="button" onClick={abrirCrear}
              className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-violet-400 border border-violet-800/50 rounded-lg hover:bg-violet-500/10 transition mx-auto">
              <Plus size={14} /> Registrar primer lead
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {leads.map(c => (
            <div key={c.documentId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 group hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => setSelectedLead(c)}>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-slate-400 bg-slate-800 border-slate-700">
                  #{numMap.get(c.documentId) ?? "—"}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => abrirEditar(c)}
                    className="p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition"><Pencil size={11} /></button>
                  <button type="button" onClick={() => handleBorrar(c)}
                    className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition"><Trash2 size={11} /></button>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-100 leading-snug">{c.nombre}</p>

              <div className="space-y-1">
                {c.canalContacto && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CanalIcon canal={c.canalContacto} />{c.canalContacto}
                  </span>
                )}
                {c.telefono && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9} />{c.telefono}</p>}
                {c.notas && <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{c.notas}"</p>}
                {c.fechaLead && <p className="text-[9px] text-slate-700">{fmtDt(c.fechaLead)}</p>}
              </div>

              <button type="button"
                onClick={e => { e.stopPropagation(); handleCalificar(c) }}
                className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                  c.calificado
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20"
                    : "bg-slate-800/60 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
                }`}>
                <CheckCircle2 size={11} className={c.calificado ? "text-violet-400" : "text-slate-600"} />
                {c.calificado ? "Calificado" : "Calificar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {selectedLead && (
        <ClientePanel
          cliente={selectedLead}
          num={numMap.get(selectedLead.documentId) ?? "—"}
          ventasDelCliente={ventasPorCliente.get(selectedLead.documentId) ?? []}
          onClose={() => setSelectedLead(null)}
          onUpdate={setSelectedLead}
          onEdit={() => { abrirEditar(selectedLead); setSelectedLead(null) }}
          onAvanzar={handleAvanzar}
          onRetroceder={retroceder}
          onRechazar={handleRechazar}
          onRecuperar={handleRecuperar}
        />
      )}

      {pedidoGateFor && (
        <NuevoPedidoGateModal
          cliente={pedidoGateFor}
          cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
          onClose={() => setPedidoGateFor(null)}
          onCreated={onPedidoCreado}
        />
      )}
    </div>
  )
}
