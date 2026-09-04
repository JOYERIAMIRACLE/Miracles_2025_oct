"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Phone, CheckCircle2, UserSearch } from "lucide-react"
import { toast } from "sonner"
import { ClienteEmpresa, ClientePayload } from "@/types/clienteEmpresa"
import { useClientesPipeline } from "./useClientesPipeline"
import { ClientePanel, ClienteModal, NuevoPedidoGateModal, CanalIcon, fmtDt, numDisplay, emptyCliente } from "./PipelineView"
import { ListToolbar } from "./ListToolbar"

export function LeadsView() {
  const {
    clientes, loading,
    totalVentas,
    ventasPorCliente, cotizacionesPorCliente, actualizarVenta,
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
  } = useClientesPipeline()

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<ClienteEmpresa | null>(null)
  const [form,         setForm]         = useState<ClientePayload>(emptyCliente("Lead"))
  const [guardando,    setGuardando]    = useState(false)
  const [selectedLead, setSelectedLead] = useState<ClienteEmpresa | null>(null)
  const [filtro,       setFiltro]       = useState<"todos" | "calificado" | "sin_calificar">("todos")
  const [search,        setSearch]      = useState("")
  const [delId,         setDelId]       = useState<string | null>(null)

  const leads = useMemo(() => {
    let all = clientes
      .filter(c => (c.Funnel ?? "Lead") === "Lead")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filtro === "calificado")    all = all.filter(c => c.calificado)
    if (filtro === "sin_calificar") all = all.filter(c => !c.calificado)
    if (search.trim()) {
      const q = search.toLowerCase()
      all = all.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono ?? "").includes(q) ||
        (c.canalContacto ?? "").toLowerCase().includes(q)
      )
    }
    return all
  }, [clientes, filtro, search])

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
      tallaAnillo: c.tallaAnillo, ocasionFrecuente: c.ocasionFrecuente, estadoCivil: c.estadoCivil, redesSociales: c.redesSociales,
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
    setDelId(null)
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

  if (selectedLead) {
    return (
      <div className="p-4 md:p-6">
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
          onNuevoPedido={setPedidoGateFor}
          onVentaActualizada={actualizarVenta}
          backLabel="Volver a Leads"
        />

        {modalOpen && (
          <ClienteModal editando={editando} form={form} setForm={setForm}
            onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
        )}

        {pedidoGateFor && (
          <NuevoPedidoGateModal
            cliente={pedidoGateFor}
            cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
            totalVentas={totalVentas}
            onClose={() => setPedidoGateFor(null)}
            onCreated={onPedidoCreado}
          />
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
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo lead
        </button>
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
          { label: "Total leads", value: stats.total },
          { label: "Calificados", value: stats.calificados, colorClass: "text-violet-600 dark:text-violet-400" },
          { label: "Sin calificar", value: stats.total - stats.calificados },
        ]}
      />

      {/* Tabla de leads */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Contacto", "Canal", "Datos de contacto", "Notas", "Calificación", "Fecha", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && leads.map(c => (
                <tr key={c.documentId}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLead(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shrink-0">
                        #{numMap.get(c.documentId) ?? "—"}
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{c.nombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.canalContacto ? (
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                        <CanalIcon canal={c.canalContacto} />{c.canalContacto}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.telefono ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Phone size={10} className="text-slate-400 dark:text-slate-600" />{c.telefono}</p>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.notas ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-[220px] truncate italic">"{c.notas}"</p>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => handleCalificar(c)}
                      className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                        c.calificado
                          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/20"
                          : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}>
                      <CheckCircle2 size={11} className={c.calificado ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-600"} />
                      {c.calificado ? "Calificado" : "Calificar"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs whitespace-nowrap">
                    {c.fechaLead ? fmtDt(c.fechaLead) : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {delId === c.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleBorrar(c)} className="text-[11px] text-red-600 dark:text-red-400 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500 dark:text-slate-500">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => abrirEditar(c)}
                          className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                        <button type="button" onClick={() => setDelId(c.documentId)}
                          className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && leads.length === 0 && (
            <div className="py-14 text-center">
              <UserSearch size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                {filtro === "todos" ? "No hay leads registrados." : "No hay leads con este filtro."}
              </p>
              {filtro === "todos" && (
                <button type="button" onClick={abrirCrear}
                  className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-800/50 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition mx-auto">
                  <Plus size={14} /> Registrar primer lead
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {pedidoGateFor && (
        <NuevoPedidoGateModal
          cliente={pedidoGateFor}
          cotizacionesAceptadas={(cotizacionesPorCliente.get(pedidoGateFor.documentId) ?? []).filter(c => c.estado === "Aceptada")}
          totalVentas={totalVentas}
          onClose={() => setPedidoGateFor(null)}
          onCreated={onPedidoCreado}
        />
      )}
    </div>
  )
}
