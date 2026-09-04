"use client"

import { useState } from "react"
import { X, Plus, Trash2, Check, FileText, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import {
  Cotizacion, CotizacionPayload, ItemCotizacion,
  EstadoCotizacion, ESTADO_COT_COLOR, ESTADOS_COT,
} from "@/types/cotizacion"
import { createCotizacion, updateCotizacion } from "@/api/cotizacion/getCotizaciones"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { useGetInventario } from "@/api/inventarioEmpresa/getInventario"
import { ProductType } from "@/types/product"
import { ProductoSearch } from "./ProductoSearch"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyItem(): ItemCotizacion {
  return { sku: "", descripcion: "", cantidad: 1, precio: 0, subtotal: 0, productoId: null }
}

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

// ─── Modal ────────────────────────────────────────────────────────────────────
interface Props {
  cliente:           ClienteEmpresa
  cotizacion:        Cotizacion | null
  totalCotizaciones: number
  onClose:           () => void
  onSaved:           (c: Cotizacion) => void
  // Cuando se abre desde la lista global de Cotizaciones, la fila se
  // convierte en página completa (igual que la ficha de cliente) en vez de
  // modal flotante; desde dentro de un cliente sigue siendo modal rápido.
  fullPage?: boolean
}

export function CotizacionModal({ cliente, cotizacion, totalCotizaciones, onClose, onSaved, fullPage = false }: Props) {
  const [items,       setItems]       = useState<ItemCotizacion[]>(
    cotizacion?.items?.length ? cotizacion.items : [emptyItem()]
  )
  const [precioEnvio, setPrecioEnvio] = useState<number>(cotizacion?.precioEnvio ?? 0)
  const [estado,      setEstado]      = useState<EstadoCotizacion>(cotizacion?.estado ?? "Borrador")
  const [notas,       setNotas]       = useState(cotizacion?.notas ?? "")
  const [validoHasta, setValidoHasta] = useState(cotizacion?.validoHasta ?? "")
  const [guardando,   setGuardando]   = useState(false)

  const { items: productos } = useGetInventario()

  const subtotal = items.reduce((acc, i) => acc + i.cantidad * i.precio, 0)
  const total    = subtotal + Number(precioEnvio)

  const updateItem = (idx: number, field: keyof Omit<ItemCotizacion, "subtotal">, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      // Si tocan la descripción a mano después de haber ligado un producto real, se pierde la liga
      if (field === "descripcion" && item.productoId) updated.productoId = null
      updated.subtotal = updated.cantidad * updated.precio
      return updated
    }))
  }

  const selectProducto = (idx: number, p: ProductType) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const precio = p.costo ?? 0
      return { ...item, sku: p.sku ?? "", descripcion: p.nombreProducto, precio, subtotal: item.cantidad * precio, productoId: p.documentId }
    }))
  }

  const guardar = async () => {
    const itemsValidos = items.filter(i => i.descripcion.trim())
    if (!itemsValidos.length) { toast.error("Agrega al menos un producto"); return }
    setGuardando(true)
    try {
      const numero  = cotizacion?.numero ?? `COT-${String(totalCotizaciones + 1).padStart(3, "0")}`
      const payload: CotizacionPayload = {
        numero,
        cliente:     cliente.documentId,
        items:       itemsValidos,
        precioEnvio: Number(precioEnvio),
        total,
        estado,
        notas:  notas.trim() || null,
        fecha:  cotizacion?.fecha ?? new Date().toISOString(),
        validoHasta: validoHasta || null,
      }
      const saved = cotizacion
        ? await updateCotizacion(cotizacion.documentId, payload)
        : await createCotizacion(payload)
      onSaved(saved)
      toast.success(cotizacion ? "Cotización actualizada" : `${numero} creada`)
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const inp = "px-2 py-1.5 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full"

  const cardCls = fullPage
    ? "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl flex flex-col"
    : "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-2xl flex flex-col max-h-[92vh]"

  const contenido = (
      <div className={cardCls}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {cotizacion ? `Cotización ${cotizacion.numero}` : "Nueva cotización"}
              </h2>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
              <span className="text-slate-800 dark:text-slate-200 font-medium">{cliente.nombre}</span>
              {cliente.telefono  && <span className="text-slate-500 dark:text-slate-500">{cliente.telefono}</span>}
              {cliente.email     && <span className="text-slate-500 dark:text-slate-500">{cliente.email}</span>}
              {cliente.direccion && <span className="text-slate-500 dark:text-slate-500">{cliente.direccion}</span>}
            </div>
          </div>
          {!fullPage && (
            <button type="button" title="Cerrar" onClick={onClose}
              className="p-1.5 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className={fullPage ? "space-y-5 p-5" : "overflow-y-auto flex-1 p-5 space-y-5"}>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">Productos / Servicios</p>
              <button type="button"
                onClick={() => setItems(prev => [...prev, emptyItem()])}
                className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition">
                <Plus size={11} /> Agregar línea
              </button>
            </div>

            <div className="grid grid-cols-[72px_1fr_56px_90px_90px_28px] gap-1.5 px-1 mb-1.5">
              {["SKU", "Descripción", "Cant.", "Precio", "Subtotal", ""].map(h => (
                <span key={h} className="text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-600">{h}</span>
              ))}
            </div>

            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[72px_1fr_56px_90px_90px_28px] gap-1.5 items-center">
                  <input value={item.sku}
                    onChange={e => updateItem(idx, "sku", e.target.value)}
                    placeholder="SKU" className={inp} />
                  <div className="relative">
                    <ProductoSearch
                      value={item.descripcion}
                      onChange={v => updateItem(idx, "descripcion", v)}
                      onSelect={p => selectProducto(idx, p)}
                      productos={productos}
                    />
                    {item.productoId && (
                      <span title="Ligado a inventario real — se descontará stock al convertir a pedido"
                        className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-violet-500" />
                    )}
                  </div>
                  <input type="number" min="1" title="Cantidad"
                    value={item.cantidad}
                    onChange={e => updateItem(idx, "cantidad", Number(e.target.value) || 1)}
                    className={`${inp} text-center`} />
                  <input type="number" min="0" step="0.01" title="Precio unitario"
                    value={item.precio === 0 ? "" : item.precio}
                    onChange={e => updateItem(idx, "precio", Number(e.target.value) || 0)}
                    placeholder="0.00" className={`${inp} text-right`} />
                  <span className="text-[11px] text-right text-slate-700 dark:text-slate-300 font-medium pr-1">
                    {fmt(item.cantidad * item.precio)}
                  </span>
                  <button type="button" title="Eliminar línea"
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-300 dark:text-slate-700 hover:text-red-600 dark:hover:text-red-400 rounded transition flex items-center justify-center">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-end">
            <div className="w-60 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-500">Subtotal</span>
                <span className="text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] text-slate-500 dark:text-slate-500 shrink-0">Envío</label>
                <input type="number" min="0" step="0.01" title="Precio de envío"
                  value={precioEnvio === 0 ? "" : precioEnvio}
                  onChange={e => setPrecioEnvio(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-28 px-2 py-1 text-[11px] text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500" />
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-300 dark:border-slate-700 pt-2">
                <span className="text-slate-800 dark:text-slate-200">Total</span>
                <span className="text-violet-600 dark:text-violet-400">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Estado + Válido hasta + Notas */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-2">Estado</p>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS_COT.map(e => (
                  <button key={e} type="button" onClick={() => setEstado(e)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition ${
                      estado === e ? ESTADO_COT_COLOR[e] : "border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-2">Válido hasta</p>
              <input type="date" value={validoHasta ?? ""} onChange={e => setValidoHasta(e.target.value)}
                className="px-2 py-1.5 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-2">Notas</p>
            <textarea value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Términos, condiciones, observaciones…"
              rows={3}
              className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-400 dark:focus:border-slate-500 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} /> {guardando ? "Guardando..." : "Guardar cotización"}
          </button>
        </div>
      </div>
  )

  if (fullPage) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
          <ArrowLeft size={14} /> Volver a Cotizaciones
        </button>
        {contenido}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      {contenido}
    </div>
  )
}
