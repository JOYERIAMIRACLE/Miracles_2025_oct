"use client"

import { useState, useMemo } from "react"
import { Plus, Phone, Mail, Pencil, Trash2, User, UserCheck, FileText, DollarSign } from "lucide-react"
import { toast } from "sonner"
import {
  ClienteEmpresa, ClientePayload,
  FUNNEL_ALL, FUNNEL_LABEL, FUNNEL_COLOR, FunnelEtapa,
} from "@/types/clienteEmpresa"
import { useClientesPipeline } from "./useClientesPipeline"
import { ClientePanel, ClienteModal, NuevoPedidoGateModal, numDisplay, emptyCliente, fmtMoney } from "./PipelineView"

export function ClientesView() {
  const {
    clientes, loading,
    ventasPorCliente, cotizacionesPorCliente, valorPorCliente,
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
  } = useClientesPipeline()

  const [modalOpen,       setModalOpen]       = useState(false)
  const [editando,        setEditando]        = useState<ClienteEmpresa | null>(null)
  const [form,            setForm]            = useState<ClientePayload>(emptyCliente())
  const [guardando,       setGuardando]       = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresa | null>(null)
  const [filtroEtapa,     setFiltroEtapa]     = useState<FunnelEtapa | "todos">("todos")
  const [search,          setSearch]          = useState("")

  // Directorio completo — todo contacto que alguna vez entró al embudo,
  // desde Lead hasta Entrega (o Rechazada). Antes se excluían Lead/Rechazada.
  const todos = useMemo(() =>
    clientes.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [clientes]
  )

  const clientesFiltrados = useMemo(() => {
    const base = filtroEtapa === "todos" ? todos : todos.filter(c => (c.Funnel ?? "Lead") === filtroEtapa)
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    )
  }, [todos, filtroEtapa, search])

  const numMap = useMemo(() => {
    const porFunnel = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ALL.forEach(e => porFunnel.set(e, []))
    clientes.slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(c => porFunnel.get(c.Funnel ?? "Lead")?.push(c))
    const m = new Map<string, string>()
    FUNNEL_ALL.forEach(etapa => porFunnel.get(etapa)?.forEach((c, i) => m.set(c.documentId, numDisplay(etapa, i))))
    return m
  }, [clientes])

  const cotPorCliente = useMemo(() => {
    const m = new Map<string, number>()
    cotizacionesPorCliente.forEach((cots, id) => m.set(id, cots.length))
    return m
  }, [cotizacionesPorCliente])

  const stats = useMemo(() => ({
    total:     todos.length,
    leads:     todos.filter(c => (c.Funnel ?? "Lead") === "Lead").length,
    enProceso: todos.filter(c => c.Funnel === "Oferta" || c.Funnel === "Pedido").length,
    entrega:   todos.filter(c => c.Funnel === "Entrega").length,
  }), [todos])

  const abrirCrear  = () => { setEditando(null); setForm(emptyCliente("Lead")); setModalOpen(true) }
  const abrirEditar = (c: ClienteEmpresa) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, direccion: c.direccion,
      segmento: c.segmento, Funnel: c.Funnel ?? "Lead", calificado: c.calificado,
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
      if (selectedCliente?.documentId === saved.documentId) setSelectedCliente(saved)
      toast.success(editando ? "Actualizado" : "Contacto creado")
      setModalOpen(false)
    } catch { toast.error("Error al guardar") } finally { setGuardando(false) }
  }

  const handleBorrar = async (c: ClienteEmpresa) => {
    const ok = await borrar(c)
    if (ok && selectedCliente?.documentId === c.documentId) setSelectedCliente(null)
  }
  const handleAvanzar = async (c: ClienteEmpresa) => {
    const u = await avanzar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
  }
  const handleRechazar = async (c: ClienteEmpresa) => {
    const u = await rechazar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
    return u
  }
  const handleRecuperar = async (c: ClienteEmpresa) => {
    const u = await recuperar(c)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
    return u
  }
  const onPedidoCreado = async (v: Parameters<typeof handlePedidoCreado>[0]) => {
    const u = await handlePedidoCreado(v)
    if (u && selectedCliente?.documentId === u.documentId) setSelectedCliente(u)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <UserCheck size={18} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-100">Contactos</h1>
          </div>
          <p className="text-sm text-slate-500">
            Directorio completo — todo el que entró al embudo, desde el primer contacto hasta la entrega.
          </p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
          <Plus size={15} /> Nuevo contacto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: stats.total,     color: "text-slate-200" },
          { label: "Leads",      value: stats.leads,      color: "text-slate-400" },
          { label: "En proceso", value: stats.enProceso,  color: "text-violet-400" },
          { label: "Entregado",  value: stats.entrega,    color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda + Filtro */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" placeholder="Buscar por nombre, teléfono o correo…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setFiltroEtapa("todos")}
            className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
              filtroEtapa === "todos" ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            Todos
          </button>
          {FUNNEL_ALL.map(e => (
            <button key={e} type="button" onClick={() => setFiltroEtapa(prev => prev === e ? "todos" : e)}
              className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
                filtroEtapa === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {FUNNEL_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Contacto", "Etapa", "Valor", "Cotizaciones", "Datos de contacto", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && clientesFiltrados.map(c => {
                const numCot = cotPorCliente.get(c.documentId) ?? 0
                const etapa  = c.Funnel ?? "Lead"
                const valor  = valorPorCliente.get(c.documentId) ?? null
                return (
                  <tr key={c.documentId}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCliente(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <User size={12} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{c.nombre}</p>
                          {c.segmento && <p className="text-[10px] text-slate-600">{c.segmento}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>
                        {FUNNEL_LABEL[etapa]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {valor != null ? (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-violet-400 font-mono">
                          <DollarSign size={10} />{fmtMoney(valor)}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {numCot > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-violet-400">
                          <FileText size={11} />{numCot}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {c.telefono && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} className="text-slate-600" />{c.telefono}</p>}
                        {c.email    && <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} className="text-slate-600" />{c.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => abrirEditar(c)}
                          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                        <button type="button" onClick={() => handleBorrar(c)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && clientesFiltrados.length === 0 && (
            <div className="py-14 text-center">
              <UserCheck size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-600 text-sm">
                {search || filtroEtapa !== "todos" ? "Sin resultados para este filtro." : "No hay contactos registrados."}
              </p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ClienteModal editando={editando} form={form} setForm={setForm}
          onGuardar={guardar} onCerrar={() => setModalOpen(false)} guardando={guardando} />
      )}

      {selectedCliente && (
        <ClientePanel
          cliente={selectedCliente}
          num={numMap.get(selectedCliente.documentId) ?? "—"}
          ventasDelCliente={ventasPorCliente.get(selectedCliente.documentId) ?? []}
          onClose={() => setSelectedCliente(null)}
          onUpdate={setSelectedCliente}
          onEdit={() => { abrirEditar(selectedCliente); setSelectedCliente(null) }}
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
