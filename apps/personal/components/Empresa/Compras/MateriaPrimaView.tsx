"use client"

import { useState, useMemo } from "react"
import { Plus, X, Check, Trash2, Pencil, Package, Boxes, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useGetMateriales, createMaterial, updateMaterial } from "@/api/material/getMateriales"
import { Material, MaterialPayload } from "@/types/material"
import {
  useGetComprasMaterial, createCompraMaterial, updateCompraMaterial, deleteCompraMaterial,
  createCompraMaterialLinea, updateCompraMaterialLinea, deleteCompraMaterialLinea,
} from "@/api/compra-material/getComprasMaterial"
import { CompraMaterial, CompraMaterialLinea } from "@/types/compra-material"
import {
  createMovimientoMaterial, updateMovimientoMaterial, deleteMovimientoMaterial, getMovimientoPorCompraLinea,
} from "@/api/movimiento-material/mutateMovimientoMaterial"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { updateTransaccion } from "@/api/transaccion/updateTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { useGetProveedores } from "@/api/proveedor/getProveedores"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { CalendarioPicker } from "@/components/Shared/CalendarioPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"

const fmt = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const fmtG = (n: number | null) => n != null ? `${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} g` : "—"
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5"
const pill = (active: boolean) => `h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
  active ? "bg-violet-500 text-white border-violet-500" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
}`
function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
function ymdToDate(s: string): Date | null { return s ? new Date(`${s}T00:00:00Z`) : null }

const ESTADO_LABEL: Record<string, string> = { borrador: "Borrador", recibida: "Recibida" }

// ─── Modal: nuevo / editar material ────────────────────────────────────────────

function MaterialModal({ editando, onClose, onSaved }: {
  editando: Material | null; onClose: () => void; onSaved: (m: Material) => void
}) {
  const [form, setForm] = useState<MaterialPayload>({
    nombre: editando?.nombre ?? "",
    precioReferenciaGramo: editando?.precioReferenciaGramo ?? null,
    notas: editando?.notas ?? null,
    activo: editando?.activo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const cerrarSiVacio = useModalBackdropClose(form, onClose)

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      const saved = editando ? await updateMaterial(editando.documentId, form) : await createMaterial(form)
      onSaved(saved)
      toast.success(editando ? "Material actualizado" : "Material creado")
    } catch (e: any) { toast.error(e.message ?? "Error al guardar") } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editando ? "Editar material" : "Nuevo material"}</h2>
          <button type="button" title="Cerrar" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <div>
          <label className={labelCls}>Nombre <span className="text-violet-500">*</span></label>
          <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Plata 925, Oro 10k…" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Precio de referencia por gramo ($)</label>
          <input type="number" min="0" step="0.01" value={form.precioReferenciaGramo ?? ""}
            onChange={e => setForm(f => ({ ...f, precioReferenciaGramo: e.target.value ? Number(e.target.value) : null }))}
            placeholder="0.00" className={fieldCls} />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Se actualiza solo con cada compra recibida — puedes ajustarlo aquí manualmente si lo necesitas.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="mat-activo" checked={form.activo ?? true} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-violet-500 focus:ring-violet-300 dark:bg-slate-800" />
          <label htmlFor="mat-activo" className="text-sm text-slate-600 dark:text-slate-300">Material activo</label>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-vista: catálogo de materiales ─────────────────────────────────────────

function MaterialesTab() {
  const { materiales, setMateriales, loading } = useGetMateriales()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Material | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button type="button" onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
          <Plus size={15} /> Nuevo material
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Material", "Precio/gramo", "Stock disponible", "Estado", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" /></td></tr>
              ))}
              {!loading && materiales.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-600">
                  <Boxes size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin materiales registrados.</p>
                </td></tr>
              )}
              {!loading && materiales.map(m => (
                <tr key={m.documentId}
                  onClick={() => { setEditando(m); setModalOpen(true) }}
                  className={`cursor-pointer transition-colors group ${
                    modalOpen && editando?.documentId === m.documentId
                      ? "bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{m.nombre}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(m.precioReferenciaGramo)}</td>
                  <td className="px-4 py-3 text-violet-600 dark:text-violet-400 font-semibold">{fmtG(m.stockGramos)}</td>
                  <td className="px-4 py-3">
                    {m.activo
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Activo</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600">Inactivo</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Pencil size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <MaterialModal editando={editando} onClose={() => setModalOpen(false)}
          onSaved={m => {
            setMateriales(prev => editando ? prev.map(x => x.documentId === m.documentId ? m : x) : [...prev, m])
            setModalOpen(false)
          }} />
      )}
    </div>
  )
}

// ─── Modal: nueva compra (cabecera + líneas tipo recibo) ───────────────────────

type LineaForm = { documentId?: string; material: string; descripcion: string; gramos: string; precioPorGramo: string }
const emptyLinea = (): LineaForm => ({ material: "", descripcion: "", gramos: "", precioPorGramo: "" })
const lineaFormDe = (l: CompraMaterialLinea): LineaForm => ({
  documentId: l.documentId, material: l.material?.documentId ?? "", descripcion: l.descripcion,
  gramos: String(l.gramos), precioPorGramo: String(l.precioPorGramo),
})

function NuevaCompraModal({ editando, materiales, proveedores, onClose, onSaved }: {
  editando: CompraMaterial | null
  materiales: Material[]; proveedores: { documentId: string; nombre: string }[]
  onClose: () => void; onSaved: (c: CompraMaterial) => void
}) {
  const [proveedor, setProveedor] = useState(editando?.proveedor?.documentId ?? "")
  const [fecha, setFecha] = useState(editando?.fecha ?? toYMD(new Date()))
  const [notas, setNotas] = useState(editando?.notas ?? "")
  const [lineas, setLineas] = useState<LineaForm[]>(editando && editando.lineas.length > 0 ? editando.lineas.map(lineaFormDe) : [emptyLinea()])
  const [eliminadas, setEliminadas] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const cerrarSiVacio = useModalBackdropClose({ proveedor, fecha, notas, lineas }, onClose, editando?.documentId)

  function actualizarLinea(i: number, campo: keyof LineaForm, valor: string) {
    setLineas(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const nueva = { ...l, [campo]: valor }
      if (campo === "material" && !l.precioPorGramo) {
        const mat = materiales.find(m => m.documentId === valor)
        if (mat?.precioReferenciaGramo) nueva.precioPorGramo = String(mat.precioReferenciaGramo)
      }
      return nueva
    }))
  }
  function quitarLinea(i: number) {
    const l = lineas[i]
    if (l?.documentId) setEliminadas(prev => [...prev, l.documentId!])
    setLineas(prev => prev.filter((_, idx) => idx !== i))
  }
  const totalLinea = (l: LineaForm) => (Number(l.gramos) || 0) * (Number(l.precioPorGramo) || 0)
  const totalCompra = lineas.reduce((s, l) => s + totalLinea(l), 0)

  const yaRecibida = editando?.estado === "recibida"

  async function guardar() {
    const validas = lineas.filter(l => l.material && l.descripcion.trim() && Number(l.gramos) > 0 && Number(l.precioPorGramo) > 0)
    if (validas.length === 0) { toast.error("Agrega al menos una línea completa"); return }
    setSaving(true)
    try {
      const compra = editando
        ? await updateCompraMaterial(editando.documentId, { fecha, proveedor: proveedor || null, notas: notas || null })
        : await createCompraMaterial({ fecha, proveedor: proveedor || null, notas: notas || null, estado: "borrador" })

      // Si la compra ya fue recibida, cada línea ya generó su movimiento de
      // entrada (stock ya sumado) — hay que corregir/revertir esos
      // movimientos en vez de solo tocar la línea, o el stock del material
      // se desincroniza de lo que dice el recibo.
      for (const documentId of eliminadas) {
        if (yaRecibida) {
          const mov = await getMovimientoPorCompraLinea(documentId)
          if (mov) await deleteMovimientoMaterial(mov.documentId)
        }
        await deleteCompraMaterialLinea(documentId)
      }

      const lineasFinales: CompraMaterialLinea[] = []
      for (const l of validas) {
        const payload = {
          compra: compra.documentId, material: l.material, descripcion: l.descripcion.trim(),
          gramos: Number(l.gramos), precioPorGramo: Number(l.precioPorGramo), total: totalLinea(l),
        }
        const linea = l.documentId ? await updateCompraMaterialLinea(l.documentId, payload) : await createCompraMaterialLinea(payload)
        lineasFinales.push(linea)

        if (yaRecibida) {
          if (l.documentId) {
            const mov = await getMovimientoPorCompraLinea(l.documentId)
            if (mov) await updateMovimientoMaterial(mov.documentId, { material: l.material, gramos: Number(l.gramos) })
          } else {
            // Línea agregada después de recibida — entra directo al stock,
            // no hay un segundo paso de "recibir" para ella.
            await createMovimientoMaterial({
              tipo: "entrada", material: l.material, gramos: Number(l.gramos),
              fecha: `${fecha}T12:00:00`, compraLinea: linea.documentId,
              notas: `Compra ${compra.numero ?? compra.documentId} · ${l.descripcion.trim()} (agregada tras recepción)`,
            })
          }
          await updateMaterial(l.material, { precioReferenciaGramo: Number(l.precioPorGramo) })
        }
      }

      // El gasto real ya se registró en Finanzas al recibir — si el total
      // cambió con la edición, se ajusta esa transacción para que no quede
      // desfasada del recibo corregido.
      if (yaRecibida && editando?.transaccion) {
        const nuevoTotal = lineasFinales.reduce((s, l) => s + (l.total ?? l.gramos * l.precioPorGramo), 0)
        await updateTransaccion(editando.transaccion.documentId, { monto: nuevoTotal })
      }

      toast.success(editando
        ? yaRecibida ? "Compra corregida — stock y gasto ajustados" : "Compra actualizada"
        : "Compra registrada como borrador — recíbela para actualizar inventario y gasto")
      onSaved({ ...compra, lineas: lineasFinales })
    } catch (e: any) { toast.error(e.message ?? "Error al guardar la compra") } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editando ? "Editar compra de materia prima" : "Nueva compra de materia prima"}</h2>
          <button type="button" title="Cerrar" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        {yaRecibida && (
          <p className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-lg px-3 py-2">
            Esta compra ya fue recibida — al guardar se ajustan automáticamente el stock del material y el gasto ya registrado en Finanzas.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Proveedor</label>
            <DropdownPicker label="Proveedor" value={proveedor} onChange={setProveedor} placeholder="Sin proveedor"
              options={[{ value: "", label: "Sin proveedor" }, ...proveedores.map(p => ({ value: p.documentId, label: p.nombre }))]} />
          </div>
          <div>
            <label className={labelCls}>Fecha</label>
            <CalendarioPicker value={ymdToDate(fecha)} label="Fecha de compra" className="w-full" onChange={d => setFecha(toYMD(d))} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Líneas del recibo</label>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {["Concepto", "Material", "Precio/g", "Gramos", "Total", ""].map(h => (
                    <th key={h} className="px-2.5 py-2 text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineas.map((l, i) => (
                  <tr key={i}>
                    <td className="p-1.5 min-w-[130px]">
                      <input value={l.descripcion} onChange={e => actualizarLinea(i, "descripcion", e.target.value)}
                        placeholder="Ej. Cadena tejido chino" className={`${fieldCls} h-8 text-xs`} />
                    </td>
                    <td className="p-1.5 min-w-[130px]">
                      <DropdownPicker label="Material" value={l.material} onChange={v => actualizarLinea(i, "material", v)}
                        placeholder="—" options={materiales.map(m => ({ value: m.documentId, label: m.nombre }))} />
                    </td>
                    <td className="p-1.5 w-24">
                      <input type="number" min="0" step="0.01" value={l.precioPorGramo} onChange={e => actualizarLinea(i, "precioPorGramo", e.target.value)}
                        placeholder="0.00" className={`${fieldCls} h-8 text-xs`} />
                    </td>
                    <td className="p-1.5 w-20">
                      <input type="number" min="0" step="0.01" value={l.gramos} onChange={e => actualizarLinea(i, "gramos", e.target.value)}
                        placeholder="0" className={`${fieldCls} h-8 text-xs`} />
                    </td>
                    <td className="p-1.5 w-24 text-xs font-semibold text-slate-700 dark:text-slate-200 text-right pr-3">{fmt(totalLinea(l))}</td>
                    <td className="p-1.5 w-8">
                      {lineas.length > 1 && (
                        <button type="button" title="Quitar línea" onClick={() => quitarLinea(i)}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 transition"><X size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={4} className="px-2.5 py-2">
                    <button type="button" onClick={() => setLineas(prev => [...prev, emptyLinea()])}
                      className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition">
                      <Plus size={12} /> Agregar línea
                    </button>
                  </td>
                  <td className="px-2.5 py-2 text-right text-sm font-bold text-slate-900 dark:text-slate-100">{fmt(totalCompra)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notas</label>
          <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Referencia del recibo, folio…" className={fieldCls} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : editando ? "Guardar cambios" : "Guardar como borrador"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: recibir compra (genera movimientos + gasto real) ──────────────────

function RecibirModal({ compra, onClose, onRecibida }: {
  compra: CompraMaterial; onClose: () => void; onRecibida: (c: CompraMaterial) => void
}) {
  const { cuentas } = useGetCuentas("empresa")
  const cuentasDisponibles = useMemo(() => cuentas.filter(c => c.activa !== false && c.tipo !== "Crédito"), [cuentas])
  const [cuentaId, setCuentaId] = useState("")
  const [procesando, setProcesando] = useState(false)
  const total = compra.lineas.reduce((s, l) => s + (l.total ?? l.gramos * l.precioPorGramo), 0)

  async function confirmar() {
    if (!cuentaId) { toast.error("Selecciona la cuenta de la que sale el pago"); return }
    setProcesando(true)
    try {
      for (const linea of compra.lineas) {
        if (!linea.material) continue
        await createMovimientoMaterial({
          tipo: "entrada", material: linea.material.documentId, gramos: linea.gramos,
          fecha: `${compra.fecha}T12:00:00`, compraLinea: linea.documentId,
          notas: `Compra ${compra.numero ?? compra.documentId} · ${linea.descripcion}`,
        })
        await updateMaterial(linea.material.documentId, { precioReferenciaGramo: linea.precioPorGramo })
      }
      const tx = await createTransaccion({
        descripcion: `Compra de materia prima${compra.proveedor ? ` · ${compra.proveedor.nombre}` : ""}`,
        tipo: "gasto", monto: total, fecha: `${compra.fecha}T12:00:00`,
        categoria: "Suministro - Materia prima", cuentaOrigen: cuentaId,
        proveedor: compra.proveedor?.nombre ?? null, notas: compra.notas, ambito: "empresa",
      })
      const actualizada = await updateCompraMaterial(compra.documentId, { estado: "recibida", transaccion: tx.documentId })
      toast.success("Compra recibida — inventario y gasto actualizados")
      onRecibida({ ...actualizada, lineas: compra.lineas })
    } catch (e: any) { toast.error(e.message ?? "Error al recibir la compra") } finally { setProcesando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recibir compra</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{compra.lineas.length} línea{compra.lineas.length !== 1 ? "s" : ""} · {fmt(total)}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
          Al confirmar: se suman los gramos al inventario de cada material y se registra el gasto real en Finanzas.
        </p>
        <div>
          <label className={labelCls}>Cuenta de la que sale el pago *</label>
          <DropdownPicker label="Cuenta" value={cuentaId} onChange={setCuentaId} placeholder="— Seleccionar —"
            options={cuentasDisponibles.map(c => ({ value: c.documentId, label: c.nombre }))} />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={confirmar} disabled={procesando}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
            {procesando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {procesando ? "Procesando..." : "Confirmar recepción"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-vista: compras ────────────────────────────────────────────────────────

function ComprasTab() {
  const { compras, setCompras, loading } = useGetComprasMaterial()
  const { materiales } = useGetMateriales()
  const { proveedores } = useGetProveedores()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CompraMaterial | null>(null)
  const [recibiendo, setRecibiendo] = useState<CompraMaterial | null>(null)
  const [delId, setDelId] = useState<string | null>(null)

  async function handleDelete(compra: CompraMaterial) {
    try {
      if (compra.estado === "recibida") {
        // Deshace por completo lo que aplicó "Recibir": revierte el stock de
        // cada línea (borra su movimiento) y borra el gasto ya registrado en
        // Finanzas — si no, el material y la cuenta quedan con el efecto de
        // una compra que ya no existe.
        for (const linea of compra.lineas) {
          const mov = await getMovimientoPorCompraLinea(linea.documentId)
          if (mov) await deleteMovimientoMaterial(mov.documentId)
        }
        if (compra.transaccion) await deleteTransaccion(compra.transaccion.documentId)
      }
      for (const linea of compra.lineas) await deleteCompraMaterialLinea(linea.documentId)
      await deleteCompraMaterial(compra.documentId)
      setCompras(prev => prev.filter(c => c.documentId !== compra.documentId))
      toast.success(compra.estado === "recibida" ? "Compra eliminada — stock y gasto revertidos" : "Compra eliminada")
    } catch { toast.error("Error al eliminar") } finally { setDelId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button type="button" onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
          <Plus size={15} /> Nueva compra
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Fecha", "Proveedor", "Líneas", "Total", "Estado", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" /></td></tr>
              ))}
              {!loading && compras.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-600">
                  <Package size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin compras registradas.</p>
                </td></tr>
              )}
              {!loading && compras.map(c => {
                const total = c.lineas.reduce((s, l) => s + (l.total ?? l.gramos * l.precioPorGramo), 0)
                const activa = modalOpen && editando?.documentId === c.documentId
                return (
                  <tr key={c.documentId} onClick={() => { setEditando(c); setModalOpen(true) }}
                    className={`cursor-pointer transition-colors group ${
                      activa
                        ? "bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{c.fecha}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.proveedor?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.lineas.length}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{fmt(total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        c.estado === "recibida"
                          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}>{ESTADO_LABEL[c.estado]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button type="button" title="Editar" onClick={() => { setEditando(c); setModalOpen(true) }}
                          className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                          <Pencil size={13} />
                        </button>
                        {c.estado === "borrador" && (
                          <button type="button" onClick={() => setRecibiendo(c)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition">
                            <Check size={11} /> Recibir
                          </button>
                        )}
                        {delId === c.documentId ? (
                          <div className="flex items-center gap-1 px-1">
                            <span className="text-[10px] text-slate-500">{c.estado === "recibida" ? "¿Revertir stock y gasto?" : "¿Eliminar?"}</span>
                            <button type="button" onClick={() => handleDelete(c)} className="text-[11px] text-red-500 font-medium">Sí</button>
                            <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-400">No</button>
                          </div>
                        ) : (
                          <button type="button" title="Eliminar" onClick={() => setDelId(c.documentId)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <NuevaCompraModal editando={editando} materiales={materiales} proveedores={proveedores} onClose={() => setModalOpen(false)}
          onSaved={c => {
            setCompras(prev => editando ? prev.map(x => x.documentId === c.documentId ? c : x) : [c, ...prev])
            setModalOpen(false); setEditando(null)
          }} />
      )}
      {recibiendo && (
        <RecibirModal compra={recibiendo} onClose={() => setRecibiendo(null)}
          onRecibida={c => { setCompras(prev => prev.map(x => x.documentId === c.documentId ? c : x)); setRecibiendo(null) }} />
      )}
    </div>
  )
}

// ─── Vista principal ────────────────────────────────────────────────────────────

export function MateriaPrimaView() {
  const [tab, setTab] = useState<"compras" | "materiales">("compras")

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg p-1 w-fit">
        {([["compras", "Compras"], ["materiales", "Materiales"]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={pill(tab === key)}>{label}</button>
        ))}
      </div>
      {tab === "compras" && <ComprasTab />}
      {tab === "materiales" && <MaterialesTab />}
    </div>
  )
}
