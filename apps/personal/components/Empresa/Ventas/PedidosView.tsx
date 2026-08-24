"use client"

import { useState, useMemo } from "react"
import { Plus, X, Loader2, Package, Pencil, Trash2, Lock } from "lucide-react"
import { toast } from "sonner"
import { useGetVentas, createVenta, updateVenta, deleteVenta } from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { useGetCentrosVenta } from "@/api/centro-venta/getCentrosVenta"
import { useGetInventario } from "@/api/inventarioEmpresa/getInventario"
import { createVentaLinea, updateVentaLinea, deleteVentaLinea } from "@/api/venta-linea/mutateVentaLinea"
import { ProductoSearch } from "./ProductoSearch"
import { ListToolbar } from "./ListToolbar"
import {
  VentaEmpresa, VentaPayload,
  ESTADOS_VENTA, EstadoVenta, ESTADO_VENTA_COLOR,
  METODOS_PAGO, MetodoPago,
} from "@/types/ventaEmpresa"
import { ProductType } from "@/types/product"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const fmtFecha = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })

const ACTIVE_ESTADOS: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]

type LineaForm = {
  documentId?:    string
  productoId:     string
  descripcion:    string
  cantidad:       string
  precioUnitario: string
}
function emptyLinea(): LineaForm {
  return { productoId: "", descripcion: "", cantidad: "1", precioUnitario: "" }
}
const totalLinea = (l: LineaForm) => (Number(l.cantidad) || 0) * (Number(l.precioUnitario) || 0)

// Nivel 2: checkpoint de disponibilidad — no bloquea (a veces sí se vende
// sobre pedido/personalizado), pero avisa con números reales antes de
// confirmar un pedido a un estado que ya descuenta stock.
function calcularFaltantesLineas(lineas: LineaForm[], productos: ProductType[]) {
  const faltantes: { nombre: string; pedido: number; disponible: number }[] = []
  for (const l of lineas) {
    if (!l.productoId) continue
    const producto = productos.find(p => p.documentId === l.productoId)
    if (!producto) continue
    const disponible = producto.stock ?? 0
    const cantidad = Number(l.cantidad) || 0
    if (cantidad > disponible) faltantes.push({ nombre: producto.nombreProducto, pedido: cantidad, disponible })
  }
  return faltantes
}

function emptyForm(): VentaPayload {
  return {
    concepto: "",
    monto: 0,
    fecha: new Date().toISOString().split("T")[0],
    estado: "Cotizado",
    metodoPago: null,
    notas: null,
    cantidad: 1,
    cliente: null,
    producto: null,
    centro_venta: null,
  }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"

export function PedidosView() {
  const { ventas: raw, setVentas, loading } = useGetVentas()
  const { clientes } = useGetClientes()
  const { centrosVenta } = useGetCentrosVenta()
  const { items: productos } = useGetInventario()

  const [search,    setSearch]    = useState("")
  const [filtroEst, setFiltroEst] = useState<EstadoVenta | "">("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<VentaEmpresa | null>(null)
  const [form,      setForm]      = useState<VentaPayload>(emptyForm())
  const [lineas,      setLineas]      = useState<LineaForm[]>([emptyLinea()])
  const [eliminadas,  setEliminadas]  = useState<string[]>([])
  const [conceptoAuto, setConceptoAuto] = useState(true)
  const [montoAuto,    setMontoAuto]    = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  // Un pedido ya confirmado (no "Cotizado") ya descontó stock — sus líneas
  // quedan de solo lectura para no desincronizar el descuento ya aplicado;
  // solo el estado y los datos de cabecera siguen editables.
  const lineasEditables = !editing || editing.estado === "Cotizado"

  const ventas = useMemo(() => {
    return raw
      .filter(v => {
        const matchSearch = !search ||
          v.concepto.toLowerCase().includes(search.toLowerCase()) ||
          (v.numero ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (v.cliente?.nombre ?? "").toLowerCase().includes(search.toLowerCase())
        const matchEst = !filtroEst || v.estado === filtroEst
        return matchSearch && matchEst
      })
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
  }, [raw, search, filtroEst])

  const totales = useMemo(() => {
    const todos = raw
    const activos = todos.filter(v => ACTIVE_ESTADOS.includes(v.estado as EstadoVenta))
    return {
      total: todos.length,
      activos: activos.length,
      montoActivos: activos.reduce((s, v) => s + (v.monto ?? 0), 0),
      entregados: todos.filter(v => v.estado === "Entregado").length,
    }
  }, [raw])

  function openNuevo() {
    setEditing(null)
    setForm(emptyForm())
    setLineas([emptyLinea()])
    setEliminadas([])
    setConceptoAuto(true)
    setMontoAuto(true)
    setModalOpen(true)
  }

  function openEditar(v: VentaEmpresa) {
    setEditing(v)
    setForm({
      concepto:   v.concepto,
      monto:      v.monto,
      fecha:      v.fecha,
      estado:     v.estado ?? "Cotizado",
      metodoPago: v.metodoPago,
      notas:      v.notas,
      cantidad:   v.cantidad,
      cliente:    v.cliente?.documentId ?? null,
      producto:   v.producto?.documentId ?? null,
      centro_venta: v.centro_venta?.documentId ?? null,
    })
    setLineas(v.lineas?.length
      ? v.lineas.map(l => ({
          documentId: l.documentId, productoId: l.producto?.documentId ?? "",
          descripcion: l.descripcion, cantidad: String(l.cantidad), precioUnitario: String(l.precioUnitario),
        }))
      : [emptyLinea()])
    setEliminadas([])
    setConceptoAuto(false)
    setMontoAuto(false)
    setModalOpen(true)
  }

  function actualizarLinea(i: number, campo: keyof LineaForm, valor: string) {
    setLineas(prev => {
      const next = prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l)
      if (conceptoAuto) aplicarConceptoAuto(next)
      if (montoAuto) aplicarMontoAuto(next)
      return next
    })
  }
  function seleccionarProductoLinea(i: number, p: ProductType) {
    setLineas(prev => {
      const next = prev.map((l, idx) => idx === i
        ? { ...l, productoId: p.documentId, descripcion: p.nombreProducto, precioUnitario: l.precioUnitario || String(p.costo ?? 0) }
        : l)
      if (conceptoAuto) aplicarConceptoAuto(next)
      if (montoAuto) aplicarMontoAuto(next)
      return next
    })
  }
  function agregarLinea() {
    setLineas(prev => [...prev, emptyLinea()])
  }
  function quitarLinea(i: number) {
    const l = lineas[i]
    if (l?.documentId) setEliminadas(prev => [...prev, l.documentId!])
    setLineas(prev => {
      const next = prev.filter((_, idx) => idx !== i)
      if (conceptoAuto) aplicarConceptoAuto(next)
      if (montoAuto) aplicarMontoAuto(next)
      return next
    })
  }
  function aplicarConceptoAuto(ls: LineaForm[]) {
    const validas = ls.filter(l => l.descripcion.trim())
    const concepto = validas.length
      ? validas.map(l => `${l.descripcion.trim()}${Number(l.cantidad) > 1 ? ` ×${l.cantidad}` : ""}`).join(", ")
      : ""
    setForm(f => ({ ...f, concepto }))
  }
  function aplicarMontoAuto(ls: LineaForm[]) {
    const total = ls.reduce((s, l) => s + totalLinea(l), 0)
    if (total > 0) setForm(f => ({ ...f, monto: total }))
  }

  const totalLineas = lineas.reduce((s, l) => s + totalLinea(l), 0)

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.monto)           { toast.error("El monto es obligatorio"); return }

    const lineasValidas = lineas.filter(l => l.descripcion.trim() && Number(l.cantidad) > 0)
    const estadoObjetivo = (editing ? form.estado ?? editing.estado : form.estado) ?? "Cotizado"
    const aplicaStockObjetivo = estadoObjetivo !== "Cotizado" && estadoObjetivo !== "Cancelado"
    if (lineasEditables && aplicaStockObjetivo) {
      const faltantes = calcularFaltantesLineas(lineasValidas, productos)
      if (faltantes.length > 0) {
        const detalle = faltantes.map(f => `• ${f.nombre}: pides ${f.pedido}, disponible ${f.disponible}`).join("\n")
        if (!confirm(`Stock insuficiente para:\n\n${detalle}\n\n¿Continuar de todas formas?`)) return
      }
    }

    setSaving(true)
    try {

      if (editing) {
        if (lineasEditables) {
          for (const documentId of eliminadas) await deleteVentaLinea(documentId)
          for (const l of lineasValidas) {
            const payload = {
              venta: editing.documentId, producto: l.productoId || null,
              descripcion: l.descripcion.trim(), cantidad: Number(l.cantidad),
              precioUnitario: Number(l.precioUnitario) || 0, subtotal: totalLinea(l),
            }
            if (l.documentId) await updateVentaLinea(l.documentId, payload)
            else await createVentaLinea(payload)
          }
        }
        const updated = await updateVenta(editing.documentId, form)
        setVentas(prev => prev.map(v => v.documentId === updated.documentId ? updated : v))
        toast.success("Pedido actualizado")
      } else {
        // Nace como "Cotizado" (sin efecto de stock) para poder crear las líneas
        // antes de aplicar el estado real elegido — evita descontar stock con
        // líneas que todavía no existen.
        const estadoFinal = form.estado ?? "Cotizado"
        const creada = await createVenta({ ...form, numero: `PED-${String(raw.length + 1).padStart(3, "0")}`, estado: "Cotizado" })
        for (const l of lineasValidas) {
          await createVentaLinea({
            venta: creada.documentId, producto: l.productoId || null,
            descripcion: l.descripcion.trim(), cantidad: Number(l.cantidad),
            precioUnitario: Number(l.precioUnitario) || 0, subtotal: totalLinea(l),
          })
        }
        const nueva = estadoFinal !== "Cotizado"
          ? await updateVenta(creada.documentId, { estado: estadoFinal })
          : creada
        setVentas(prev => [nueva, ...prev])
        toast.success("Pedido registrado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Ocurrió un error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteVenta(documentId)
      setVentas(prev => prev.filter(v => v.documentId !== documentId))
      toast.success("Pedido eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <ListToolbar
            search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por número, concepto o cliente…"
            filtros={[
              { value: "", label: "Todos" },
              ...ESTADOS_VENTA.map(e => ({ value: e as string, label: e })),
            ]}
            filtroActivo={filtroEst} filtroDefault="" onFiltroChange={v => setFiltroEst(v as EstadoVenta | "")}
            metricas={[
              { label: "Total pedidos", value: totales.total },
              { label: "En proceso",    value: totales.activos,               colorClass: "text-violet-400" },
              { label: "Monto activo",  value: fmt(totales.montoActivos),     colorClass: "text-violet-400" },
              { label: "Entregados",    value: totales.entregados,            colorClass: "text-violet-400" },
            ]}
          />
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
          <Plus size={15} /> Nuevo pedido
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Concepto", "Cliente", "Canal", "Fecha", "Método pago", "Estado", "Monto", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && ventas.map(v => (
                <tr key={v.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    {v.numero && <p className="text-[10px] font-bold font-mono text-slate-500">{v.numero}</p>}
                    <p className="font-medium text-slate-200 leading-snug">{v.concepto}</p>
                    {v.cotizacionOrigen && (
                      <p className="text-[10px] text-emerald-500/80 mt-0.5">← {v.cotizacionOrigen.numero}</p>
                    )}
                    {v.lineas?.length > 0 ? (
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Package size={10} /> {v.lineas.length} línea{v.lineas.length > 1 ? "s" : ""} de producto
                      </p>
                    ) : v.producto && (
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Package size={10} /> {v.producto.nombreProducto} ×{v.cantidad}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{v.cliente?.nombre ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-slate-400">{v.centro_venta?.nombre ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.fecha ? fmtFecha(v.fecha) : <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3">
                    {v.metodoPago
                      ? <span className="text-xs text-slate-400">{v.metodoPago}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {v.estado
                      ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>{v.estado}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-violet-400 font-semibold">{fmt(v.monto)}</td>
                  <td className="px-4 py-3">
                    {delId === v.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleDelete(v.documentId)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEditar(v)} title="Editar"
                          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => setDelId(v.documentId)} title="Eliminar"
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ventas.length === 0 && (
            <div className="py-14 text-center text-slate-600 text-sm">
              {search || filtroEst ? "Sin resultados para los filtros aplicados." : "No hay pedidos registrados."}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar pedido" : "Nuevo pedido"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Líneas de productos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium text-slate-400 block">
                    Productos del pedido {!lineasEditables && (
                      <span className="inline-flex items-center gap-1 text-violet-400 normal-case ml-1">
                        <Lock size={10} /> confirmado — solo lectura
                      </span>
                    )}
                  </label>
                  {lineasEditables && (
                    <button type="button" onClick={agregarLinea}
                      className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition">
                      <Plus size={11} /> Agregar línea
                    </button>
                  )}
                </div>
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_56px_90px_90px_28px] gap-1.5 px-2 py-1.5 bg-slate-950/50">
                    {["Producto / concepto", "Cant.", "Precio", "Subtotal", ""].map(h => (
                      <span key={h} className="text-[9px] font-semibold uppercase text-slate-600">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-800">
                    {lineas.map((l, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_56px_90px_90px_28px] gap-1.5 items-center px-2 py-1.5">
                        {lineasEditables ? (
                          <div className="relative">
                            <ProductoSearch value={l.descripcion}
                              onChange={v => actualizarLinea(idx, "descripcion", v)}
                              onSelect={p => seleccionarProductoLinea(idx, p)}
                              productos={productos} />
                            {l.productoId && (
                              <span title="Ligado a inventario real — descuenta stock al confirmarse"
                                className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-violet-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 flex items-center gap-1">
                            {l.productoId && <Package size={10} className="text-violet-500 shrink-0" />} {l.descripcion}
                          </span>
                        )}
                        {lineasEditables ? (
                          <input type="number" min="1" title="Cantidad" value={l.cantidad}
                            onChange={e => actualizarLinea(idx, "cantidad", e.target.value)}
                            className="px-2 py-1.5 text-[11px] text-center rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500 w-full" />
                        ) : <span className="text-[11px] text-slate-400 text-center">{l.cantidad}</span>}
                        {lineasEditables ? (
                          <input type="number" min="0" step="0.01" title="Precio unitario" value={l.precioUnitario}
                            onChange={e => actualizarLinea(idx, "precioUnitario", e.target.value)}
                            placeholder="0.00" className="px-2 py-1.5 text-[11px] text-right rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500 w-full" />
                        ) : <span className="text-[11px] text-slate-400 text-right">{fmt(Number(l.precioUnitario) || 0)}</span>}
                        <span className="text-[11px] text-right text-slate-300 font-medium">{fmt(totalLinea(l))}</span>
                        {lineasEditables && lineas.length > 1 ? (
                          <button type="button" title="Quitar línea" onClick={() => quitarLinea(idx)}
                            className="p-1 text-slate-700 hover:text-red-400 rounded transition flex items-center justify-center">
                            <Trash2 size={11} />
                          </button>
                        ) : <span />}
                      </div>
                    ))}
                  </div>
                  {totalLineas > 0 && (
                    <div className="flex justify-end px-3 py-1.5 bg-slate-950/50 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400">Total líneas: <span className="text-slate-200 font-semibold">{fmt(totalLineas)}</span></span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Anillo compromiso oro 14k" value={form.concepto}
                  onChange={e => { setConceptoAuto(false); setForm(f => ({ ...f, concepto: e.target.value })) }} className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($) <span className="text-red-400">*</span></label>
                  <input type="number" placeholder="0" value={form.monto || ""}
                    onChange={e => { setMontoAuto(false); setForm(f => ({ ...f, monto: Number(e.target.value) || 0 })) }} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Canal de venta</label>
                  <select title="Canal de venta" value={form.centro_venta ?? ""}
                    onChange={e => setForm(f => ({ ...f, centro_venta: e.target.value || null }))} className={inp + " cursor-pointer"}>
                    <option value="">— Sin especificar —</option>
                    {centrosVenta.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={form.fecha ?? ""}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Estado</label>
                  <select title="Estado" value={form.estado ?? ""}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoVenta }))} className={inp + " cursor-pointer"}>
                    {ESTADOS_VENTA.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Método de pago</label>
                  <select title="Método de pago" value={form.metodoPago ?? ""}
                    onChange={e => setForm(f => ({ ...f, metodoPago: (e.target.value || null) as MetodoPago | null }))} className={inp + " cursor-pointer"}>
                    <option value="">— Sin especificar —</option>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cliente</label>
                  <select title="Cliente" value={form.cliente ?? ""}
                    onChange={e => setForm(f => ({ ...f, cliente: e.target.value || null }))} className={inp + " cursor-pointer"}>
                    <option value="">— Sin cliente —</option>
                    {clientes.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <textarea placeholder="Observaciones, detalles del pedido…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  rows={2} className={inp + " resize-none h-auto py-2"} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar cambios" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
