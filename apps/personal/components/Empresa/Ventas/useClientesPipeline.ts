import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import { ClienteEmpresa, ClientePayload, FUNNEL_ETAPAS, FunnelEtapa } from "@/types/clienteEmpresa"
import { Cotizacion } from "@/types/cotizacion"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { VentaEmpresa } from "@/types/ventaEmpresa"
import { Lead, LeadPayload } from "@/types/lead"
import { useGetLeads, updateLead, deleteLead } from "@/api/lead/getLead"

export const FECHA_FIELD: Record<FunnelEtapa, keyof ClientePayload> = {
  Lead:      "fechaLead",
  Oferta:    "fechaOferta",
  Pedido:    "fechaPedido",
  Entrega:   "fechaEntrega",
  Rechazada: "fechaRechazada",
}

export const FECHA_FIELD_LEAD: Record<FunnelEtapa, keyof LeadPayload> = {
  Lead:      "fechaLead",
  Oferta:    "fechaOferta",
  Pedido:    "fechaPedido",
  Entrega:   "fechaEntrega",
  Rechazada: "fechaRechazada",
}

export function useClientesPipeline() {
  const { clientes, setClientes, loading } = useGetClientes()
  const { leads, setLeads, loading: leadsLoading } = useGetLeads()
  const { ventas: todasVentas, setVentas: setTodasVentas } = useGetVentas()
  const { cotizaciones: todasCotizaciones, setCotizaciones: setTodasCotizaciones } = useGetAllCotizaciones()
  const [pedidoGateFor,  setPedidoGateFor]  = useState<Lead | null>(null)
  const [ofertaGateFor,  setOfertaGateFor]  = useState<Lead | null>(null)

  const ventasPorCliente = useMemo(() => {
    const m = new Map<string, VentaEmpresa[]>()
    todasVentas.forEach(v => {
      const id = v.cliente?.documentId
      if (!id) return
      if (!m.has(id)) m.set(id, [])
      m.get(id)!.push(v)
    })
    return m
  }, [todasVentas])

  const ventasActivasPorCliente = useMemo(() => {
    const m = new Map<string, VentaEmpresa[]>()
    ventasPorCliente.forEach((ventas, id) => m.set(id, ventas.filter(v => v.estado !== "Cancelado")))
    return m
  }, [ventasPorCliente])

  const cotizacionesPorCliente = useMemo(() => {
    const m = new Map<string, Cotizacion[]>()
    todasCotizaciones.forEach(c => {
      const id = c.cliente?.documentId
      if (!id) return
      if (!m.has(id)) m.set(id, [])
      m.get(id)!.push(c)
    })
    return m
  }, [todasCotizaciones])

  const valorPorCliente = useMemo(() => {
    const m = new Map<string, number>()
    clientes.forEach(c => {
      const ventas = ventasActivasPorCliente.get(c.documentId) ?? []
      if (ventas.length > 0) { m.set(c.documentId, ventas.reduce((s, v) => s + (v.monto ?? 0), 0)); return }
      const cots = (cotizacionesPorCliente.get(c.documentId) ?? []).filter(ct => ct.estado === "Aceptada")
      if (cots.length > 0) m.set(c.documentId, cots.reduce((s, ct) => s + ct.total, 0))
    })
    return m
  }, [clientes, ventasActivasPorCliente, cotizacionesPorCliente])

  // ─── Operaciones sobre Lead (pipeline) ────────────────────────────────────

  const avanzarLead = async (lead: Lead, destino?: FunnelEtapa) => {
    const idx    = FUNNEL_ETAPAS.indexOf(lead.Funnel ?? "Lead")
    const newIdx = destino ? FUNNEL_ETAPAS.indexOf(destino) : Math.min(FUNNEL_ETAPAS.length - 1, idx + 1)
    if (newIdx <= idx && !destino) return null
    const etapa = destino ?? FUNNEL_ETAPAS[newIdx]
    const fechaField = FECHA_FIELD_LEAD[etapa]
    const extra = !(lead[fechaField] as string | null) ? { [fechaField]: new Date().toISOString() } : {}

    if (etapa === "Oferta") {
      const clienteId = lead.cliente?.documentId
      const cots = clienteId ? (cotizacionesPorCliente.get(clienteId) ?? []) : []
      if (cots.length === 0) {
        setOfertaGateFor(lead)
        return null
      }
    }
    if (etapa === "Pedido") {
      const clienteId = lead.cliente?.documentId
      if (clienteId && (ventasActivasPorCliente.get(clienteId)?.length ?? 0) === 0) {
        setPedidoGateFor(lead)
        return null
      }
    }
    try {
      const updated = await updateLead(lead.documentId, { Funnel: etapa, ...extra })
      setLeads(prev => prev.map(l => l.documentId === updated.documentId ? updated : l))
      toast.success(`→ ${etapa}`)
      return updated
    } catch { toast.error("Error al avanzar"); return null }
  }

  const rechazarLead = async (lead: Lead) => {
    const extra = !lead.fechaRechazada ? { fechaRechazada: new Date().toISOString() } : {}
    try {
      const updated = await updateLead(lead.documentId, { Funnel: "Rechazada", ...extra })
      setLeads(prev => prev.map(l => l.documentId === updated.documentId ? updated : l))
      toast.success("Marcado como rechazada")
      return updated
    } catch { toast.error("Error al rechazar"); return null }
  }

  const recuperarLead = async (lead: Lead) => {
    try {
      const updated = await updateLead(lead.documentId, { Funnel: "Lead" })
      setLeads(prev => prev.map(l => l.documentId === updated.documentId ? updated : l))
      toast.success("Recuperado → Lead")
      return updated
    } catch { toast.error("Error al recuperar"); return null }
  }

  const toggleCalificadoLead = async (lead: Lead) => {
    const nuevoValor = !lead.calificado
    const extra = nuevoValor && !lead.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateLead(lead.documentId, { calificado: nuevoValor, ...extra })
      setLeads(prev => prev.map(l => l.documentId === updated.documentId ? updated : l))
      toast.success(nuevoValor ? "Lead calificado ✓" : "Calificación removida")
      return updated
    } catch { toast.error("Error al actualizar"); return null }
  }

  const borrarLead = async (lead: Lead) => {
    try {
      await deleteLead(lead.documentId)
      setLeads(prev => prev.filter(l => l.documentId !== lead.documentId))
      toast.success("Lead eliminado")
      return true
    } catch { toast.error("Error al eliminar"); return false }
  }

  const agregarLead = (lead: Lead) => {
    setLeads(prev => {
      const existe = prev.some(l => l.documentId === lead.documentId)
      return existe ? prev : [lead, ...prev]
    })
  }

  const handlePedidoCreado = async (v: VentaEmpresa) => {
    if (!v?.documentId) {
      toast.error("El pedido no se pudo crear — el lead sigue en su etapa actual")
      setPedidoGateFor(null)
      return null
    }
    setTodasVentas(prev => [v, ...prev])
    let updated: Lead | null = null
    const etapaActualIdx = pedidoGateFor ? FUNNEL_ETAPAS.indexOf(pedidoGateFor.Funnel ?? "Lead") : -1
    const yaEnPedidoOMas = etapaActualIdx >= FUNNEL_ETAPAS.indexOf("Pedido")
    if (pedidoGateFor && !yaEnPedidoOMas) updated = await avanzarLead(pedidoGateFor, "Pedido")
    setPedidoGateFor(null)
    return updated
  }

  // ─── Operaciones sobre ClienteEmpresa (contactos) ─────────────────────────

  const guardarCliente = async (editando: ClienteEmpresa | null, form: ClientePayload) => {
    if (editando) {
      const updated = await updateCliente(editando.documentId, form)
      setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
      return updated
    }
    const nuevo = await createCliente(form)
    setClientes(prev => [...prev, nuevo])
    return nuevo
  }

  const borrarCliente = async (c: ClienteEmpresa) => {
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Contacto eliminado")
      return true
    } catch { toast.error("Error al eliminar"); return false }
  }

  // Operaciones de funnel sobre ClienteEmpresa (para ClientesView/LeadsView)
  const avanzar = async (c: ClienteEmpresa) => {
    const idx = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    if (idx >= FUNNEL_ETAPAS.length - 1) return null
    const etapa = FUNNEL_ETAPAS[idx + 1]
    const fechaField = FECHA_FIELD[etapa]
    const extra = !(c[fechaField] as string | null) ? { [fechaField]: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { Funnel: etapa, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(`→ ${etapa}`)
      return updated
    } catch { toast.error("Error al avanzar"); return null }
  }
  const retroceder = async (c: ClienteEmpresa) => {
    const idx = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    if (idx <= 0) return null
    const etapa = FUNNEL_ETAPAS[idx - 1]
    try {
      const updated = await updateCliente(c.documentId, { Funnel: etapa })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(`← ${etapa}`)
      return updated
    } catch { toast.error("Error al retroceder"); return null }
  }
  const rechazar = async (c: ClienteEmpresa) => {
    const extra = !(c.fechaRechazada) ? { fechaRechazada: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { Funnel: "Rechazada", ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success("Marcado como rechazada")
      return updated
    } catch { toast.error("Error al rechazar"); return null }
  }
  const recuperar = async (c: ClienteEmpresa) => {
    try {
      const updated = await updateCliente(c.documentId, { Funnel: "Lead" })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success("Recuperado → Lead")
      return updated
    } catch { toast.error("Error al recuperar"); return null }
  }
  const toggleCalificado = async (c: ClienteEmpresa) => {
    const nuevoValor = !c.calificado
    const extra = nuevoValor && !c.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { calificado: nuevoValor, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      return updated
    } catch { toast.error("Error al actualizar"); return null }
  }
  const borrar = borrarCliente

  const actualizarVenta = (updated: VentaEmpresa) => {
    setTodasVentas(prev => prev.map(v => v.documentId === updated.documentId ? updated : v))
  }

  const actualizarCotizacion = (updated: Cotizacion) => {
    setTodasCotizaciones(prev => {
      const existe = prev.some(c => c.documentId === updated.documentId)
      return existe
        ? prev.map(c => c.documentId === updated.documentId ? updated : c)
        : [updated, ...prev]
    })
  }

  function syncSelected(updated: ClienteEmpresa, selected: ClienteEmpresa | null, setSelected: (c: ClienteEmpresa) => void) {
    if (selected?.documentId === updated.documentId) setSelected(updated)
  }

  return {
    clientes, setClientes, loading: loading || leadsLoading,
    leads, setLeads,
    totalVentas: todasVentas.length,
    ventasPorCliente, ventasActivasPorCliente, cotizacionesPorCliente, valorPorCliente,
    actualizarVenta, actualizarCotizacion,
    // Lead operations (pipeline board)
    avanzarLead, rechazarLead, recuperarLead, toggleCalificadoLead, borrarLead, agregarLead,
    ofertaGateFor, setOfertaGateFor,
    // ClienteEmpresa operations (contact directory / legacy views)
    avanzar, retroceder, rechazar, recuperar, toggleCalificado, borrar,
    guardarCliente, borrarCliente,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
    syncSelected,
  }
}
