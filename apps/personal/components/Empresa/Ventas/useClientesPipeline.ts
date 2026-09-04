import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useGetClientes, createCliente, updateCliente, deleteCliente } from "@/api/clienteEmpresa/getClientes"
import { ClienteEmpresa, ClientePayload, FUNNEL_ETAPAS, FunnelEtapa } from "@/types/clienteEmpresa"
import { Cotizacion } from "@/types/cotizacion"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { VentaEmpresa } from "@/types/ventaEmpresa"

export const FECHA_FIELD: Record<FunnelEtapa, keyof ClientePayload> = {
  Lead:      "fechaLead",
  Oferta:    "fechaOferta",
  Pedido:    "fechaPedido",
  Entrega:   "fechaEntrega",
  Rechazada: "fechaRechazada",
}

// Datos y mutaciones compartidas entre Pipeline, Leads y Contactos — una sola
// fuente de verdad para que las 3 pantallas se comporten igual (mismo gate de
// pedido real al pasar a "Pedido", mismos totales, mismas listas de ventas).
export function useClientesPipeline() {
  const { clientes, setClientes, loading } = useGetClientes()
  const { ventas: todasVentas, setVentas: setTodasVentas } = useGetVentas()
  const { cotizaciones: todasCotizaciones, setCotizaciones: setTodasCotizaciones } = useGetAllCotizaciones()
  const [pedidoGateFor, setPedidoGateFor] = useState<ClienteEmpresa | null>(null)

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

  // Valor del cliente: prioriza pedidos reales (no cancelados); si no hay, usa cotizaciones aceptadas
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

  function syncSelected(updated: ClienteEmpresa, selected: ClienteEmpresa | null, setSelected: (c: ClienteEmpresa) => void) {
    if (selected?.documentId === updated.documentId) setSelected(updated)
  }

  const avanzarA = async (c: ClienteEmpresa, destino: FunnelEtapa) => {
    const fechaField = FECHA_FIELD[destino]
    const extra = !(c[fechaField] as string | null) ? { [fechaField]: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { Funnel: destino, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(`→ ${destino}`)
      return updated
    } catch { toast.error("Error al avanzar"); return null }
  }

  // Avanzar de etapa — si el destino es "Pedido" y el cliente no tiene ningún
  // pedido real conectado, abre el gate en vez de solo cambiar el texto del Funnel.
  const avanzar = async (c: ClienteEmpresa) => {
    const idx    = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    const newIdx = Math.min(FUNNEL_ETAPAS.length - 1, idx + 1)
    if (newIdx === idx) return null
    const destino = FUNNEL_ETAPAS[newIdx]
    if (destino === "Pedido" && (ventasActivasPorCliente.get(c.documentId)?.length ?? 0) === 0) {
      setPedidoGateFor(c)
      return null
    }
    return avanzarA(c, destino)
  }

  const handlePedidoCreado = async (v: VentaEmpresa) => {
    // Nunca avanzar la etapa ni tocar el estado si el pedido no se creó de
    // verdad — evita quedar con un cliente marcado "Pedido" sin nada real
    // conectado (y evita romper el resto de la app con un registro vacío).
    if (!v?.documentId) {
      toast.error("El pedido no se pudo crear — el cliente sigue en su etapa actual")
      setPedidoGateFor(null)
      return null
    }
    setTodasVentas(prev => [v, ...prev])
    let updated: ClienteEmpresa | null = null
    // Si ya estaba en Pedido/Entrega (ej. vinculando un pedido despues, desde
    // el boton "+ Nuevo pedido" del panel) no lo regresamos a "Pedido".
    const etapaActualIdx = pedidoGateFor ? FUNNEL_ETAPAS.indexOf(pedidoGateFor.Funnel ?? "Lead") : -1
    const yaEnPedidoOMas = etapaActualIdx >= FUNNEL_ETAPAS.indexOf("Pedido")
    if (pedidoGateFor && !yaEnPedidoOMas) updated = await avanzarA(pedidoGateFor, "Pedido")
    setPedidoGateFor(null)
    return updated
  }

  const retroceder = async (c: ClienteEmpresa) => {
    const idx    = FUNNEL_ETAPAS.indexOf(c.Funnel ?? "Lead")
    const newIdx = Math.max(0, idx - 1)
    if (newIdx === idx) return null
    const destino = FUNNEL_ETAPAS[newIdx]
    try {
      const updated = await updateCliente(c.documentId, { Funnel: destino })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(`← ${destino}`)
      return updated
    } catch { toast.error("Error al actualizar"); return null }
  }

  const rechazar = async (c: ClienteEmpresa) => {
    const extra = !c.fechaRechazada ? { fechaRechazada: new Date().toISOString() } : {}
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
    const extra      = nuevoValor && !c.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    try {
      const updated = await updateCliente(c.documentId, { calificado: nuevoValor, ...extra })
      setClientes(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(nuevoValor ? "Lead calificado ✓" : "Calificación removida")
      return updated
    } catch { toast.error("Error al actualizar"); return null }
  }

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

  // Refresca una venta puntual en la caché compartida (ej. tras editarla desde
  // el modal de detalle en la ficha de cliente) sin tener que recargar todas.
  const actualizarVenta = (updated: VentaEmpresa) => {
    setTodasVentas(prev => prev.map(v => v.documentId === updated.documentId ? updated : v))
  }

  // Igual, pero para una cotización puntual (ej. editada desde su tarjeta
  // en el Pipeline sin pasar por la lista global de Cotizaciones).
  const actualizarCotizacion = (updated: Cotizacion) => {
    setTodasCotizaciones(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
  }

  // La confirmación vive en quien llama (misma fila/tarjeta que el usuario
  // acaba de clicar) — este helper ya no pregunta, solo ejecuta el borrado.
  const borrar = async (c: ClienteEmpresa) => {
    try {
      await deleteCliente(c.documentId)
      setClientes(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Eliminado")
      return true
    } catch { toast.error("Error al eliminar"); return false }
  }

  return {
    clientes, setClientes, loading,
    totalVentas: todasVentas.length,
    ventasPorCliente, ventasActivasPorCliente, cotizacionesPorCliente, valorPorCliente,
    actualizarVenta, actualizarCotizacion,
    avanzar, avanzarA, retroceder, rechazar, recuperar, toggleCalificado, guardarCliente, borrar,
    pedidoGateFor, setPedidoGateFor, handlePedidoCreado,
    syncSelected,
  }
}
