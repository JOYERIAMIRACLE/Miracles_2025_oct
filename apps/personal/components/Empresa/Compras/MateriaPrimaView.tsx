"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Plus, X, Check, Trash2, Pencil, Package, Boxes, Loader2, ScanLine, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { useGetMateriales, createMaterial, updateMaterial, deleteMaterial } from "@/api/material/getMateriales"
import { Material, MaterialPayload } from "@/types/material"
import { fetchCatalogo, fetchSkus } from "@/api/catalogoJoyeria/getCatalogoJoyeria"
import { CatalogoNodo } from "@/types/catalogoJoyeria"
import { SkuEntry } from "@/types/skuCatalogo"
import { SkuBuilder } from "@/components/Shared/SkuBuilder"
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
import { getToken } from "@/lib/auth"
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

type CatalogoProd = { sku: string; nombre: string; categoria: string; material: string; talla: string }
function flattenProductos(nodos: CatalogoNodo[], cat = "", mat = ""): CatalogoProd[] {
  const out: CatalogoProd[] = []
  for (const n of nodos) {
    const m = n.tipo === "material"  ? n.nombre : mat
    const c = n.tipo === "categoria" ? n.nombre : cat
    if (n.tipo === "producto") {
      if (n.modelos && n.modelos.length > 0) {
        for (const mo of n.modelos) {
          out.push({ sku: mo.sku || n.sku, nombre: `${n.nombre} ${mo.nombre}`.trim(), categoria: c, material: m, talla: mo.nombre })
        }
      } else {
        out.push({ sku: n.sku, nombre: n.nombre, categoria: c, material: m, talla: "" })
      }
    }
    out.push(...flattenProductos(n.children, c, m))
  }
  return out
}

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

function MaterialesTab({ triggerNuevo }: { triggerNuevo: number }) {
  const { materiales, setMateriales, loading } = useGetMateriales()
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editando,   setEditando]   = useState<Material | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { if (triggerNuevo > 0) { setEditando(null); setModalOpen(true) } }, [triggerNuevo])

  async function handleDelete(m: Material) {
    try {
      await deleteMaterial(m.documentId)
      setMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
      toast.success("Material eliminado")
    } catch { toast.error("Error al eliminar") } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-4">
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
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Pencil size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition" onClick={() => { setEditando(m); setModalOpen(true) }} />
                      {deletingId === m.documentId ? (
                        <span className="flex items-center gap-1 text-[10px]">
                          <span className="text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(m)} className="text-red-500 font-medium">Sí</button>
                          <button type="button" onClick={() => setDeletingId(null)} className="text-slate-400">No</button>
                        </span>
                      ) : (
                        <button type="button" title="Eliminar" onClick={() => setDeletingId(m.documentId)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition rounded">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
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

// ─── Combobox de material con creación rápida ─────────────────────────────────

function MaterialCombobox({ value, materiales, onChange, onCreated }: {
  value: string
  materiales: Material[]
  onChange: (docId: string) => void
  onCreated: (m: Material) => void
}) {
  const [open,     setOpen]     = useState(false)
  const [text,     setText]     = useState("")
  const [creating, setCreating] = useState(false)
  const [rect,     setRect]     = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const m = materiales.find(m => m.documentId === value)
    setText(m?.nombre ?? "")
  }, [value, materiales])

  useEffect(() => {
    function h(e: MouseEvent) {
      const t = e.target as Node
      if (!inputRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function abrirConPos() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 2, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  const filtrados   = text.trim() ? materiales.filter(m => m.nombre.toLowerCase().includes(text.toLowerCase())) : materiales
  const exactMatch  = materiales.some(m => m.nombre.toLowerCase() === text.trim().toLowerCase())
  const puedeCrear  = text.trim().length > 0 && !exactMatch

  async function crear() {
    if (!text.trim() || creating) return
    setCreating(true)
    try {
      const m = await createMaterial({ nombre: text.trim(), unidadMedida: "gramo", precioReferenciaGramo: null, activo: true, notas: null })
      onCreated(m)
      onChange(m.documentId)
      setOpen(false)
      toast.success(`Material "${m.nombre}" creado`)
    } catch (e: any) { toast.error(e.message ?? "Error al crear material") }
    finally { setCreating(false) }
  }

  return (
    <div className="relative">
      <input ref={inputRef} value={text}
        onChange={e => { setText(e.target.value); abrirConPos() }}
        onFocus={abrirConPos}
        placeholder="Material…"
        className={`${fieldCls} h-8 text-xs`} />
      {open && rect && createPortal(
        <div ref={panelRef}
          style={{ position: "fixed", top: rect.top, left: rect.left, width: Math.max(rect.width, 160), zIndex: 9999 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtrados.map(m => (
            <button key={m.documentId} type="button"
              onClick={() => { onChange(m.documentId); setText(m.nombre); setOpen(false) }}
              className={`w-full px-3 py-2 text-xs text-left transition ${m.documentId === value ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
              {m.nombre}
            </button>
          ))}
          {filtrados.length === 0 && !puedeCrear && (
            <p className="px-3 py-2 text-xs text-slate-500">Sin materiales</p>
          )}
          {puedeCrear && (
            <button type="button" onClick={crear} disabled={creating}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition text-left border-t border-slate-100 dark:border-slate-700 disabled:opacity-50">
              {creating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {creating ? "Creando…" : `Crear "${text.trim()}"`}
            </button>
          )}
        </div>,
        document.body
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
  const [mats, setMats] = useState<Material[]>(materiales)
  const cerrarSiVacio = useModalBackdropClose({ proveedor, fecha, notas, lineas }, onClose, editando?.documentId)

  function actualizarLinea(i: number, campo: keyof LineaForm, valor: string) {
    setLineas(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const nueva = { ...l, [campo]: valor }
      if (campo === "material" && !l.precioPorGramo) {
        const mat = mats.find(m => m.documentId === valor)
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
                      <ConceptoCombobox value={l.descripcion} onChange={v => actualizarLinea(i, "descripcion", v)} />
                    </td>
                    <td className="p-1.5 min-w-[130px]">
                      <MaterialCombobox value={l.material} materiales={mats}
                        onChange={v => actualizarLinea(i, "material", v)}
                        onCreated={m => setMats(prev => [...prev, m])} />
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
        const existing = await getMovimientoPorCompraLinea(linea.documentId)
        if (!existing) {
          await createMovimientoMaterial({
            tipo: "entrada", material: linea.material.documentId, gramos: linea.gramos,
            fecha: `${compra.fecha}T12:00:00`, compraLinea: linea.documentId,
            notas: `Compra ${compra.numero ?? compra.documentId} · ${linea.descripcion}`,
          })
        }
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

// ─── Combobox de concepto/tipo de producto ────────────────────────────────────

const TIPOS_CONCEPTO = ["Anillos","Cadenas","Esclavas","Dijes","Broqueles","Aretes","Pulsos","Rosarios","Argollas","Arracadas","Pulseras","Collares"] as const

function ConceptoCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [text, setText]     = useState(value)
  const [rect, setRect]     = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setText(value) }, [value])

  useEffect(() => {
    function h(e: MouseEvent) {
      const t = e.target as Node
      if (!inputRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function abrirConPos() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 2, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  const filtrados = text.trim()
    ? TIPOS_CONCEPTO.filter(c => c.toLowerCase().includes(text.toLowerCase()))
    : [...TIPOS_CONCEPTO]
  const exacto = TIPOS_CONCEPTO.some(c => c.toLowerCase() === text.trim().toLowerCase())
  const esNuevo = text.trim().length > 0 && !exacto

  return (
    <div className="relative">
      <input ref={inputRef} value={text}
        onChange={e => { setText(e.target.value); onChange(e.target.value); abrirConPos() }}
        onFocus={abrirConPos}
        placeholder="Tipo de producto…"
        className={`${fieldCls} h-8 text-xs`} />
      {open && rect && (filtrados.length > 0 || esNuevo) && createPortal(
        <div ref={panelRef}
          style={{ position: "fixed", top: rect.top, left: rect.left, width: Math.max(rect.width, 160), zIndex: 9999 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtrados.map(c => (
            <button key={c} type="button"
              onClick={() => { setText(c); onChange(c); setOpen(false) }}
              className={`w-full px-3 py-2 text-xs text-left transition ${
                value.toLowerCase() === c.toLowerCase()
                  ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              {c}
            </button>
          ))}
          {esNuevo && (
            <button type="button"
              onClick={() => { onChange(text.trim()); setOpen(false) }}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition text-left border-t border-slate-100 dark:border-slate-700">
              <Plus size={11} /> Usar &ldquo;{text.trim()}&rdquo;
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Modal: inspección de piezas ──────────────────────────────────────────────

const CATEGORIAS_JOYA = ["Anillos","Cadenas","Esclavas","Dijes","Broqueles","Aretes","Pulsos","Rosarios","Argollas"] as const
type CategoriaJoya = typeof CATEGORIAS_JOYA[number]

type PiezaForm = { nombre: string; categoriaJoya: CategoriaJoya | ""; talla: string; pesoGramos: string; cantidad: string }
const emptyPieza = (): PiezaForm => ({ nombre: "", categoriaJoya: "", talla: "", pesoGramos: "", cantidad: "1" })

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function crearProductoDesdeInspeccion(data: {
  nombreProducto: string; categoriaJoya: CategoriaJoya; materialProducto: string
  talla: string; pesoGramos: number; stock: number; costoProduccion: number
  materialInsumoId: string
}): Promise<string> {
  const r = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ data: {
      nombreProducto: data.nombreProducto, categoriaJoya: data.categoriaJoya,
      materialProducto: data.materialProducto, talla: data.talla || null,
      pesoGramos: data.pesoGramos, stock: data.stock, costoProduccion: data.costoProduccion,
      material: "producto", activo: false,
      materialInsumo: { connect: [{ documentId: data.materialInsumoId }] },
    }}),
  })
  if (!r.ok) throw new Error("Error al crear producto en inventario")
  return ((await r.json()).data as { documentId: string }).documentId
}

function InspeccionCompraModal({ compra, materiales, onClose, onDone }: {
  compra: CompraMaterial; materiales: Material[]
  onClose: () => void; onDone: () => void
}) {
  type LineaState = { piezas: PiezaForm[]; agregando: boolean }
  const [lineasState,    setLineasState]    = useState<LineaState[]>(
    () => compra.lineas.map(() => ({ piezas: [], agregando: false }))
  )
  const [guardando,       setGuardando]       = useState(false)
  const [catalogoProds,   setCatalogoProds]   = useState<CatalogoProd[]>([])
  const [busquedaCat,     setBusquedaCat]     = useState("")
  const [lineaBuscando,   setLineaBuscando]   = useState<number | null>(null)
  const [skuBuilderLinea, setSkuBuilderLinea] = useState<number | null>(null)
  const searchRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    // Carga árbol legacy + SKUs planos y los fusiona en la lista buscable
    Promise.all([
      fetchCatalogo().catch(() => [] as import("@/types/catalogoJoyeria").CatalogoNodo[]),
      fetchSkus().catch(() => [] as SkuEntry[]),
    ]).then(([arbol, skuEntries]) => {
      const fromTree = flattenProductos(arbol)
      const fromSkus: CatalogoProd[] = skuEntries.map(s => ({
        sku: s.sku, nombre: s.nombre, categoria: s.tipoCategoria, material: s.matLabel, talla: s.talla,
      }))
      // Merge: SKUs planos tienen prioridad (deduplicar por sku)
      const seen = new Set<string>()
      const merged: CatalogoProd[] = []
      for (const p of [...fromSkus, ...fromTree]) {
        if (!seen.has(p.sku)) { seen.add(p.sku); merged.push(p) }
      }
      setCatalogoProds(merged)
    })
  }, [])

  function guessCat(desc: string): CategoriaJoya | "" {
    const d = desc.toLowerCase()
    return CATEGORIAS_JOYA.find(c => d.includes(c.toLowerCase())) ?? ""
  }

  const prodsFiltrados = busquedaCat.trim()
    ? catalogoProds.filter(p =>
        p.nombre.toLowerCase().includes(busquedaCat.toLowerCase()) ||
        p.sku.toLowerCase().includes(busquedaCat.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busquedaCat.toLowerCase())
      ).slice(0, 8)
    : []
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (lineaBuscando === null) return
      const dentroInput = searchRefs.current[lineaBuscando]?.contains(e.target as Node)
      if (!dentroInput) setLineaBuscando(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [lineaBuscando])

  function setPiezas(li: number, fn: (prev: PiezaForm[]) => PiezaForm[]) {
    setLineasState(prev => prev.map((s, i) => i === li ? { ...s, piezas: fn(s.piezas) } : s))
  }
  function setAgregando(li: number, v: boolean) {
    setLineasState(prev => prev.map((s, i) => i === li ? { ...s, agregando: v } : s))
  }
  function updatePieza(li: number, pi: number, campo: keyof PiezaForm, valor: string) {
    setPiezas(li, prev => prev.map((p, i) => i === pi ? { ...p, [campo]: valor } : p))
  }

  const gramosAsignados = (li: number) =>
    lineasState[li]?.piezas.reduce((s, p) => s + (Number(p.pesoGramos) || 0) * (Number(p.cantidad) || 0), 0) ?? 0

  const totalPiezas = lineasState.reduce((s, l) => s + l.piezas.length, 0)

  async function confirmar() {
    // Validar antes de guardar
    const incompletas = lineasState.flatMap(l => l.piezas).filter(
      p => p.nombre.trim() && (!p.categoriaJoya || !Number(p.pesoGramos))
    )
    if (incompletas.length > 0) {
      toast.error(`${incompletas.length} pieza${incompletas.length > 1 ? "s" : ""} incompleta${incompletas.length > 1 ? "s" : ""} — verifica categoría y gramos`)
      return
    }

    setGuardando(true)
    let creadas = 0
    try {
      for (let li = 0; li < compra.lineas.length; li++) {
        const linea = compra.lineas[li]!
        const estado = lineasState[li]!
        const matObj = linea.material ? materiales.find(m => m.documentId === linea.material!.documentId) : null

        for (const pieza of estado.piezas) {
          if (!pieza.nombre.trim() || !pieza.categoriaJoya || !Number(pieza.pesoGramos) || !Number(pieza.cantidad)) continue
          const pesoG = Number(pieza.pesoGramos)
          const cant  = Number(pieza.cantidad)
          const costo = pesoG * (linea.precioPorGramo ?? matObj?.precioReferenciaGramo ?? 0)

          const prodId = await crearProductoDesdeInspeccion({
            nombreProducto: pieza.nombre.trim(),
            categoriaJoya: pieza.categoriaJoya as CategoriaJoya,
            materialProducto: linea.material?.nombre ?? "",
            talla: pieza.talla.trim(),
            pesoGramos: pesoG, stock: cant, costoProduccion: costo,
            materialInsumoId: linea.material?.documentId ?? "",
          })
          creadas++

          // Movimiento salida: descuenta gramos del stock del material
          if (linea.material) {
            await createMovimientoMaterial({
              tipo: "salida", material: linea.material.documentId,
              gramos: pesoG * cant, fecha: `${compra.fecha}T12:00:00`,
              producto: prodId,
              notas: `Inspección · ${pieza.nombre.trim()} × ${cant} · ${compra.numero ?? compra.documentId}`,
            })
          }
        }
      }
      toast.success(`Inspección completa — ${creadas} grupo${creadas !== 1 ? "s" : ""} de piezas creados en inventario`)
      onDone()
    } catch (e: any) { toast.error(e.message ?? "Error al guardar la inspección") }
    finally { setGuardando(false) }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ScanLine size={16} className="text-violet-500" /> Inspección de piezas
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {compra.fecha} · {compra.proveedor?.nombre ?? "Sin proveedor"} · {compra.lineas.length} línea{compra.lineas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <p className="px-6 py-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
          Clasifica pieza por pieza lo que entró en cada línea. Al confirmar se crean como productos en el inventario (no publicados en tienda).
        </p>

        {/* Líneas */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {compra.lineas.map((linea, li) => {
            const asignados = gramosAsignados(li)
            const pct = linea.gramos > 0 ? Math.min(100, (asignados / linea.gramos) * 100) : 0
            const merma = linea.gramos - asignados
            const estado = lineasState[li]!

            return (
              <div key={linea.documentId} className="border border-slate-200 dark:border-slate-700 rounded-xl">
                {/* Cabecera línea */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4 flex-wrap rounded-t-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{linea.descripcion}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{linea.material?.nombre ?? "—"} · {fmtG(linea.gramos)} · {fmt(linea.precioPorGramo)}/g</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{fmtG(asignados)} / {fmtG(linea.gramos)}</p>
                    <p className={`text-[10px] font-medium ${merma > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                      {merma > 0 ? `merma: ${merma.toLocaleString("es-MX", { maximumFractionDigits: 2 })}g` : "✓ completo"}
                    </p>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
                </div>

                {/* Tabla de piezas */}
                <div className="p-4 space-y-2">
                  {estado.piezas.length > 0 && (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden mb-2">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60">
                          <tr>
                            {["Categoría","Nombre/descripción","G/pz","Cant.","Talla","Total g",""].map(h => (
                              <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {estado.piezas.map((p, pi) => {
                            const incompleta = p.nombre.trim() && (!p.categoriaJoya || !Number(p.pesoGramos))
                            const numInp = "w-full h-9 px-1 text-center text-base font-bold rounded-lg border-2 border-violet-500/60 bg-slate-800 text-violet-200 placeholder:text-slate-600 outline-none focus:border-violet-400 focus:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            return (
                            <tr key={pi} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${incompleta ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                              <td className="px-2 py-1 min-w-[110px]">
                                <select value={p.categoriaJoya} onChange={e => updatePieza(li, pi, "categoriaJoya", e.target.value)}
                                  className={`${fieldCls} h-7 text-xs`}>
                                  <option value="">—</option>
                                  {CATEGORIAS_JOYA.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </td>
                              <td className="px-2 py-1">
                                <input value={p.nombre} onChange={e => updatePieza(li, pi, "nombre", e.target.value)}
                                  placeholder="Ej. Esclava Cubana" className={`${fieldCls} h-7 text-xs`} />
                              </td>
                              <td className="px-2 py-1 w-16">
                                <input type="number" min="0" step="0.1" value={p.pesoGramos} onChange={e => updatePieza(li, pi, "pesoGramos", e.target.value)}
                                  placeholder="0.0" className={numInp} />
                              </td>
                              <td className="px-2 py-1 w-14">
                                <input type="number" min="1" step="1" value={p.cantidad} onChange={e => updatePieza(li, pi, "cantidad", e.target.value)}
                                  placeholder="1" className={numInp} />
                              </td>
                              <td className="px-2 py-1 w-20">
                                <input value={p.talla} onChange={e => updatePieza(li, pi, "talla", e.target.value)}
                                  placeholder="20cm" className={`${fieldCls} h-7 text-xs`} />
                              </td>
                              <td className="px-2 py-1 w-16 font-semibold text-slate-700 dark:text-slate-200 text-right">
                                {((Number(p.pesoGramos) || 0) * (Number(p.cantidad) || 0)).toLocaleString("es-MX", { maximumFractionDigits: 2 })}g
                              </td>
                              <td className="px-2 py-1 w-8">
                                <button type="button" title="Quitar" onClick={() => setPiezas(li, prev => prev.filter((_, i) => i !== pi))}
                                  className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 transition"><X size={12} /></button>
                              </td>
                            </tr>
                          )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-start gap-3 flex-wrap">
                    <button type="button" onClick={() => setPiezas(li, prev => [...prev, { ...emptyPieza(), categoriaJoya: guessCat(linea.descripcion) }])}
                      className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition mt-0.5">
                      <Plus size={13} /> Agregar pieza
                    </button>
                    <div ref={el => { searchRefs.current[li] = el }} className="flex-1 max-w-xs space-y-1">
                      <div className="relative">
                        <input value={lineaBuscando === li ? busquedaCat : ""}
                          onFocus={() => setLineaBuscando(li)}
                          onChange={e => { setLineaBuscando(li); setBusquedaCat(e.target.value) }}
                          placeholder="Buscar en catálogo (nombre o SKU)…"
                          className={`${fieldCls} h-7 text-xs pr-6`} />
                        {lineaBuscando === li && busquedaCat && (
                          <button type="button" onClick={() => { setBusquedaCat(""); setLineaBuscando(null) }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={11} />
                          </button>
                        )}
                      </div>
                      {lineaBuscando === li && prodsFiltrados.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-y-auto max-h-56">
                          {prodsFiltrados.map(p => (
                            <button key={p.sku} type="button"
                              onClick={() => {
                                const cat = CATEGORIAS_JOYA.find(c => c.toLowerCase() === p.categoria.toLowerCase()) ?? guessCat(linea.descripcion)
                                setPiezas(li, prev => [...prev, { ...emptyPieza(), nombre: p.nombre, categoriaJoya: cat as CategoriaJoya | "", talla: p.talla }])
                                setBusquedaCat("")
                                setLineaBuscando(null)
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left border-b border-slate-100 dark:border-slate-700 last:border-0">
                              <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{p.nombre}</span>
                              <span className="text-slate-400 text-[10px] shrink-0 ml-2 font-mono">{p.sku}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Cuando no hay resultados y hay texto buscado → ofrecer constructor */}
                      {lineaBuscando === li && busquedaCat.trim() && prodsFiltrados.length === 0 && skuBuilderLinea !== li && (
                        <button type="button"
                          onClick={() => { setSkuBuilderLinea(li); setLineaBuscando(null) }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 rounded-lg bg-violet-500/5 transition w-full">
                          <Wand2 size={12} />
                          <span>&quot;{busquedaCat}&quot; no está en catálogo — Crear con constructor</span>
                        </button>
                      )}
                      {/* SkuBuilder inline cuando está abierto para esta línea */}
                      {skuBuilderLinea === li && (
                        <div className="mt-2">
                          <SkuBuilder
                            defaultTipo={undefined}
                            onClose={() => setSkuBuilderLinea(null)}
                            onAdd={(entry: SkuEntry) => {
                              const cat = CATEGORIAS_JOYA.find(
                                c => c.toLowerCase() === entry.tipoCategoria.toLowerCase()
                              ) ?? guessCat(linea.descripcion)
                              setCatalogoProds(prev => [
                                ...prev.filter(p => p.sku !== entry.sku),
                                { sku: entry.sku, nombre: entry.nombre, categoria: entry.tipoCategoria, material: entry.matLabel, talla: entry.talla },
                              ])
                              setPiezas(li, prev => [...prev, {
                                ...emptyPieza(),
                                nombre: entry.nombre,
                                categoriaJoya: cat as CategoriaJoya | "",
                                talla: entry.talla,
                              }])
                              setBusquedaCat("")
                              setSkuBuilderLinea(null)
                              toast.success(`SKU ${entry.sku} guardado en catálogo`)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {totalPiezas} grupo{totalPiezas !== 1 ? "s" : ""} de piezas · se crearán en inventario como no publicados
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} disabled={guardando || totalPiezas === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {guardando ? "Creando productos..." : `Confirmar inspección`}
            </button>
          </div>
        </div>
      </div>
    </div>

</>
  )
}

// ─── Sub-vista: compras ────────────────────────────────────────────────────────

function ComprasTab({ triggerNuevo }: { triggerNuevo: number }) {
  const { compras, setCompras, loading } = useGetComprasMaterial()
  const { materiales } = useGetMateriales()
  const { proveedores } = useGetProveedores()
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editando,       setEditando]       = useState<CompraMaterial | null>(null)
  const [recibiendo,     setRecibiendo]     = useState<CompraMaterial | null>(null)
  const [inspeccionando, setInspeccionando] = useState<CompraMaterial | null>(null)
  const [delId,          setDelId]          = useState<string | null>(null)

  useEffect(() => { if (triggerNuevo > 0) { setEditando(null); setModalOpen(true) } }, [triggerNuevo])

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {["Fecha", "Concepto", "Material", "Gramos", "Precio/g", "Total", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-3/4" /></td></tr>
              ))}
              {!loading && compras.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-600">
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
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      {c.lineas.map((l, i) => <div key={i}>{l.descripcion || "—"}</div>)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {c.lineas.map((l, i) => <div key={i}>{l.material?.nombre ?? "—"}</div>)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {c.lineas.map((l, i) => <div key={i}>{l.gramos} g</div>)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {c.lineas.map((l, i) => <div key={i}>{fmt(l.precioPorGramo)}</div>)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-xs">{fmt(total)}</td>
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
                        {c.estado === "recibida" && (
                          <button type="button" onClick={() => setInspeccionando(c)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
                            <ScanLine size={11} /> Inspeccionar
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
      {inspeccionando && (
        <InspeccionCompraModal compra={inspeccionando} materiales={materiales}
          onClose={() => setInspeccionando(null)}
          onDone={() => setInspeccionando(null)} />
      )}
    </div>
  )
}

// ─── Vista principal ────────────────────────────────────────────────────────────

export function MateriaPrimaView() {
  const [triggerNuevo, setTriggerNuevo] = useState(0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button type="button" onClick={() => setTriggerNuevo(t => t + 1)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
          <Plus size={15} /> Nueva compra
        </button>
      </div>
      <ComprasTab triggerNuevo={triggerNuevo} />
    </div>
  )
}
