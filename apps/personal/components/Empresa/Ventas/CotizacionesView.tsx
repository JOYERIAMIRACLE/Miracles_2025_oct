"use client"

import { useState, useMemo, useRef } from "react"
import {
  FileText, X, ArrowRight, ArrowLeft, Loader2,
  User, Trash2, Paperclip, ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useGetAllCotizaciones, deleteCotizacion, updateCotizacion } from "@/api/cotizacion/getCotizaciones"
import { createVenta, updateVenta, useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { createVentaLinea } from "@/api/venta-linea/mutateVentaLinea"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { useGetInventario } from "@/api/inventarioEmpresa/getInventario"
import { uploadMedia } from "@/lib/upload"
import { EstadoVenta } from "@/types/ventaEmpresa"
import { ProductType } from "@/types/product"
import {
  Cotizacion, ItemCotizacion, EstadoCotizacion, ESTADOS_COT, ESTADO_COT_COLOR,
} from "@/types/cotizacion"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { CotizacionModal } from "./CotizacionModal"
import { ListToolbar } from "./ListToolbar"
import { confirmDialog } from "../ConfirmDialog"

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const fmtDt = (iso: string | null | undefined) => {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

// Nivel 2: checkpoint de disponibilidad antes de pasar a Pedido — no bloquea
// (a veces sí se vende sobre pedido/personalizado), pero avisa con números
// reales para que la decisión de continuar sea consciente, no accidental.
function calcularFaltantes(items: ItemCotizacion[], productos: ProductType[]) {
  const faltantes: { nombre: string; pedido: number; disponible: number }[] = []
  for (const item of items) {
    if (!item.productoId) continue
    const producto = productos.find(p => p.documentId === item.productoId)
    if (!producto) continue
    const disponible = producto.stock ?? 0
    if ((item.cantidad || 0) > disponible) {
      faltantes.push({ nombre: producto.nombreProducto, pedido: item.cantidad, disponible })
    }
  }
  return faltantes
}

// ─── Modal convertir a pedido ─────────────────────────────────────────────────
function ConvertirPedidoModal({ cotizacion, totalVentas, onClose, onConverted }: {
  cotizacion: Cotizacion
  totalVentas: number
  onClose: () => void
  onConverted: (cotizacionActualizada: Cotizacion) => void
}) {
  const clienteNombre = cotizacion.cliente?.nombre ?? ""
  const clienteId     = cotizacion.cliente?.documentId ?? null
  const { items: productos } = useGetInventario()

  const concepto = cotizacion.items?.length
    ? cotizacion.items.map(i => `${i.descripcion} ×${i.cantidad}`).join(", ")
    : cotizacion.numero ?? "Pedido desde cotización"

  const [form, setForm] = useState<{
    concepto: string; fecha: string; estado: EstadoVenta; notas: string
  }>({
    concepto,
    fecha: new Date().toISOString().split("T")[0],
    estado: "Pagado",
    notas: cotizacion.notas ?? "",
  })
  const [comprobante, setComprobante] = useState<File | null>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const inp = "w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"

  const handleConvert = async () => {
    const faltantes = calcularFaltantes(cotizacion.items ?? [], productos)
    if (faltantes.length > 0) {
      const detalle = faltantes.map(f => `• ${f.nombre}: pides ${f.pedido}, disponible ${f.disponible}`)
      const ok = await confirmDialog({
        title: "Stock insuficiente",
        message: detalle,
        confirmLabel: "Continuar de todas formas",
        variant: "action",
      })
      if (!ok) return
    }
    setSaving(true)
    try {
      // Nace "Cotizado" (sin efecto de stock) para poder copiar las líneas
      // reales de la cotización antes de aplicar el estado elegido — mismo
      // patrón de 2 pasos que "Nuevo pedido" en PedidosView.
      const creada = await createVenta({
        numero:    `PED-${String(totalVentas + 1).padStart(3, "0")}`,
        concepto:  form.concepto,
        // El monto lo define la cotización, no se vuelve a capturar aquí —
        // así no puede quedar "diferente" del precio ya acordado.
        monto:     cotizacion.total,
        fecha:     form.fecha,
        estado:    "Cotizado",
        notas:     form.notas || null,
        cantidad:  1,
        cliente:   clienteId,
      })
      const items = cotizacion.items ?? []
      for (const item of items) {
        if (!item.descripcion.trim()) continue
        await createVentaLinea({
          venta: creada.documentId,
          producto: item.productoId || null,
          descripcion: item.descripcion.trim(),
          cantidad: item.cantidad || 1,
          precioUnitario: item.precio || 0,
          subtotal: item.subtotal,
        })
      }
      const patch: { estado?: EstadoVenta; comprobantePago?: number } = {}
      if (form.estado !== "Cotizado") patch.estado = form.estado
      if (comprobante) patch.comprobantePago = (await uploadMedia(comprobante)).id
      if (Object.keys(patch).length > 0) await updateVenta(creada.documentId, patch)
      // Marca la cotización como Convertida y la liga al pedido real que
      // acaba de nacer — antes este hilo se perdía por completo (la
      // cotización se quedaba "Aceptada" para siempre, sin rastro de que
      // ya se había vuelto un pedido).
      const cotizacionActualizada = await updateCotizacion(cotizacion.documentId, {
        estado: "Convertida",
        ventaGenerada: { connect: [{ id: creada.id }] },
      })
      toast.success("Pedido creado desde cotización")
      onConverted(cotizacionActualizada)
      onClose()
    } catch {
      toast.error("Error al crear el pedido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Convertir a Pedido</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">Cotización {cotizacion.numero}</p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {clienteNombre && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
              <User size={13} className="text-slate-500 dark:text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{clienteNombre}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Concepto</label>
            <input value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Monto a pagar</label>
              <div className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 px-3 flex items-center text-sm font-semibold text-violet-600 dark:text-violet-400">
                {fmt(cotizacion.total)}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className={inp} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Evidencia de pago (opcional)</label>
            <input ref={comprobanteRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => setComprobante(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => comprobanteRef.current?.click()}
              className="w-full flex items-center gap-2 h-9 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 px-3 text-sm text-slate-500 dark:text-slate-400 hover:border-violet-500/50 hover:text-slate-800 dark:hover:text-slate-200 transition-all">
              <Paperclip size={13} className="shrink-0" />
              <span className="truncate">{comprobante ? comprobante.name : "Adjuntar foto o archivo del comprobante…"}</span>
            </button>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Estado inicial</label>
            <select value={form.estado} title="Estado"
              onChange={e => setForm(f => ({ ...f, estado: e.target.value as typeof form.estado }))}
              className={inp + " cursor-pointer"}>
              <option value="Pagado">Pagado</option>
              <option value="Preparando">Preparando</option>
              <option value="Cotizado">Cotizado</option>
            </select>
          </div>

          {form.notas !== undefined && (
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Notas</label>
              <textarea value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={2}
                className={inp + " resize-none h-auto py-2"} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={onClose} disabled={saving}
            className="h-8 px-4 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="button" onClick={handleConvert} disabled={saving}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {saving ? "Creando…" : "Crear pedido"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CotizacionesView ─────────────────────────────────────────────────────────
export function CotizacionesView() {
  const { cotizaciones, setCotizaciones, loading } = useGetAllCotizaciones()
  const { clientes } = useGetClientes()
  const { ventas: todasVentas } = useGetVentas()

  const [search,          setSearch]          = useState("")
  const [filtroEstado,    setFiltroEstado]     = useState<EstadoCotizacion | "">("")
  const [convertiendo,    setConvertiendo]     = useState<Cotizacion | null>(null)
  const [editando,        setEditando]         = useState<Cotizacion | null>(null)
  const [clienteParaEdit, setClienteParaEdit]  = useState<ClienteEmpresa | null>(null)
  const [delId,           setDelId]            = useState<string | null>(null)
  const [clienteView,     setClienteView]      = useState<string | null>(null)

  type GrupoCot = { key: string; nombre: string; cotizaciones: Cotizacion[]; totalAceptado: number; ultimaFecha: string; estadoPrincipal: EstadoCotizacion }

  const grupos: GrupoCot[] = useMemo(() => {
    const PRIORIDAD: EstadoCotizacion[] = ["Aceptada","Enviada","Borrador","Convertida","Rechazada"]
    const map = new Map<string, GrupoCot>()
    for (const cot of cotizaciones) {
      const key = cot.cliente?.documentId ?? "__sin_cliente__"
      if (!map.has(key)) map.set(key, { key, nombre: cot.cliente?.nombre ?? "Sin cliente", cotizaciones: [], totalAceptado: 0, ultimaFecha: "", estadoPrincipal: "Borrador" })
      const g = map.get(key)!
      g.cotizaciones.push(cot)
      if (cot.estado === "Aceptada") g.totalAceptado += cot.total
      const fecha = cot.fecha ?? cot.createdAt ?? ""
      if (!g.ultimaFecha || fecha > g.ultimaFecha) g.ultimaFecha = fecha
    }
    return Array.from(map.values())
      .map(g => ({ ...g, estadoPrincipal: PRIORIDAD.find(e => g.cotizaciones.some(c => c.estado === e)) ?? "Borrador" }))
      .sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha))
  }, [cotizaciones])

  const gruposFiltrados = useMemo(() => {
    const q = search.toLowerCase()
    return grupos.filter(g =>
      !search ||
      g.nombre.toLowerCase().includes(q) ||
      g.cotizaciones.some(c => (c.numero ?? "").toLowerCase().includes(q))
    )
  }, [grupos, search])

  const cotizacionesDeCliente = useMemo(() => {
    if (!clienteView) return []
    return cotizaciones
      .filter(c => (c.cliente?.documentId ?? "__sin_cliente__") === clienteView && (!filtroEstado || c.estado === filtroEstado))
      .sort((a, b) => (b.fecha ?? b.createdAt ?? "").localeCompare(a.fecha ?? a.createdAt ?? ""))
  }, [cotizaciones, clienteView, filtroEstado])

  const stats = useMemo(() => ({
    total:    cotizaciones.length,
    borrador: cotizaciones.filter(c => c.estado === "Borrador").length,
    enviada:  cotizaciones.filter(c => c.estado === "Enviada").length,
    aceptada: cotizaciones.filter(c => c.estado === "Aceptada").length,
    rechazada: cotizaciones.filter(c => c.estado === "Rechazada").length,
    totalValor: cotizaciones
      .filter(c => c.estado === "Aceptada")
      .reduce((s, c) => s + c.total, 0),
  }), [cotizaciones])

  const handleEditarCotizacion = (cot: Cotizacion) => {
    const cliente = cot.cliente?.documentId
      ? clientes.find(cl => cl.documentId === cot.cliente!.documentId) ?? null
      : null
    setClienteParaEdit(cliente)
    setEditando(cot)
  }

  const handleCotizacionSaved = (saved: Cotizacion) => {
    setCotizaciones(prev => {
      const exists = prev.find(c => c.documentId === saved.documentId)
      return exists
        ? prev.map(c => c.documentId === saved.documentId ? saved : c)
        : [saved, ...prev]
    })
    setEditando(null)
    setClienteParaEdit(null)
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deleteCotizacion(documentId)
      setCotizaciones(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Cotización eliminada")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  if (editando && clienteParaEdit) {
    return (
      <div className="p-4 md:p-6">
        <CotizacionModal
          fullPage
          cliente={clienteParaEdit}
          cotizacion={editando}
          totalCotizaciones={cotizaciones.filter(c => c.cliente?.documentId === clienteParaEdit.documentId).length}
          onClose={() => { setEditando(null); setClienteParaEdit(null) }}
          onSaved={handleCotizacionSaved}
        />
      </div>
    )
  }

  // ── Vista drill-down: cotizaciones de un cliente específico ────────────────
  if (clienteView) {
    const nombreCliente = grupos.find(g => g.key === clienteView)?.nombre ?? "Cliente"
    return (
      <div className="p-4 md:p-6 space-y-5">
        <button type="button" onClick={() => { setClienteView(null); setFiltroEstado("") }}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
          <ArrowLeft size={14} /> Volver a Cotizaciones
        </button>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <User size={16} className="text-violet-600 dark:text-violet-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{nombreCliente}</h1>
            <span className="text-sm text-slate-500 dark:text-slate-500">· {cotizacionesDeCliente.length} cotizacion{cotizacionesDeCliente.length !== 1 ? "es" : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            {ESTADOS_COT.map(e => (
              <button key={e} type="button" onClick={() => setFiltroEstado(filtroEstado === e ? "" : e)}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition ${filtroEstado === e ? ESTADO_COT_COLOR[e] : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  {["#", "Items", "Total", "Estado", "Fecha", ""].map(h => (
                    <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {cotizacionesDeCliente.map(cot => (
                  <tr key={cot.documentId} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => handleEditarCotizacion(cot)}>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{cot.numero ?? "—"}</td>
                    <td className="px-4 py-3">
                      {cot.items?.length
                        ? <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-40 truncate">{cot.items.map(i => i.descripcion).filter(Boolean).join(", ")}</p>
                        : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-violet-600 dark:text-violet-400 font-semibold">{fmt(cot.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[cot.estado]}`}>{cot.estado}</span>
                      {cot.ventaGenerada && <span className="block text-[10px] text-emerald-600 dark:text-emerald-500/80 mt-1">→ {cot.ventaGenerada.numero ?? cot.ventaGenerada.concepto}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs whitespace-nowrap">
                      {fmtDt(cot.fecha ?? cot.createdAt)}
                      {cot.validoHasta && <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Vence {fmtDt(cot.validoHasta)}</p>}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {delId === cot.documentId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(cot.documentId)} className="text-[11px] text-red-600 dark:text-red-400 font-medium">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500 dark:text-slate-500">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(cot.estado === "Aceptada" || cot.estado === "Enviada") && (
                            <button type="button" onClick={() => setConvertiendo(cot)}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-800/50 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition">
                              <ArrowRight size={11} /> Pedido
                            </button>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => setDelId(cot.documentId)}
                              className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {cotizacionesDeCliente.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-600 text-sm">Sin cotizaciones{filtroEstado ? ` con estado "${filtroEstado}"` : ""}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {convertiendo && (
          <ConvertirPedidoModal cotizacion={convertiendo} totalVentas={todasVentas.length}
            onClose={() => setConvertiendo(null)}
            onConverted={cot => { handleCotizacionSaved(cot); setConvertiendo(null) }} />
        )}
      </div>
    )
  }

  // ── Vista principal: 1 fila por cliente ────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5">

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FileText size={18} className="text-violet-600 dark:text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cotizaciones</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {stats.aceptada} aceptadas · {fmt(stats.totalValor)} en valor aceptado
          </p>
        </div>
      </div>

      <ListToolbar
        search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por cliente o número de cotización…"
        filtros={[{ value: "", label: "Todos los clientes" }]}
        filtroActivo="" filtroDefault="" onFiltroChange={() => {}}
        metricas={[
          { label: "Clientes", value: grupos.length },
          { label: "Cotizaciones", value: stats.total },
          { label: "Aceptadas",  value: stats.aceptada, colorClass: "text-violet-600 dark:text-violet-400" },
          { label: "Rechazadas", value: stats.rechazada, colorClass: "text-red-600 dark:text-red-400" },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Cliente", "Cotizaciones", "Estado", "Valor aceptado", "Última actividad", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && gruposFiltrados.map(g => (
                <tr key={g.key} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => setClienteView(g.key)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-slate-400 dark:text-slate-600 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{g.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{g.cotizaciones.length}</span>
                      cotización{g.cotizaciones.length !== 1 ? "es" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[g.estadoPrincipal]}`}>
                      {g.estadoPrincipal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.totalAceptado > 0
                      ? <span className="text-violet-600 dark:text-violet-400 font-semibold">{fmt(g.totalAceptado)}</span>
                      : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs whitespace-nowrap">
                    {g.ultimaFecha ? fmtDt(g.ultimaFecha) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && gruposFiltrados.length === 0 && (
            <div className="py-14 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-slate-400 dark:text-slate-600 text-sm">{search ? "Sin clientes para esa búsqueda." : "No hay cotizaciones registradas."}</p>
              <p className="text-[11px] text-slate-300 dark:text-slate-700 mt-1">Crea cotizaciones desde el módulo de Clientes o Leads.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
