"use client"

import { useState, useMemo, useCallback } from "react"
import {
  ShoppingBag, Plus, Pencil, Trash2, X, Loader2, Search,
  CheckCircle, PackageCheck, ChevronDown, ChevronUp, BookOpen,
  Truck, WifiOff,
} from "lucide-react"
import { toast } from "sonner"
import {
  useGetOrdenesCompra, createOrden, updateOrden, deleteOrden,
  fetchInventarioRaw, createGastoCompra,
} from "@/api/ordenCompra/getOrdenesCompra"
import { useGetProveedores } from "@/api/proveedor/getProveedores"
import { fetchCatalogo } from "@/api/catalogoJoyeria/getCatalogoJoyeria"
import { createProducto, updateProducto } from "@/api/inventarioEmpresa/getInventario"
import { OrdenCompra, LineaOrden, EstadoOrden, ESTADO_CONFIG, OrdenPayload } from "@/types/ordenCompra"
import { CatalogoNodo } from "@/types/catalogoJoyeria"

const BASE_URL  = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const inp       = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition"
const fmt       = (n: number | null) => n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"
const fmtDate   = (s: string | null) => s ? new Date(s + "T12:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"2-digit" }) : "—"
const uid       = () => crypto.randomUUID()

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

const CAT_MAP: Record<string, string> = {
  "Anillos":"Anillos","Arracadas":"Aretes","Broqueles":"Broqueles",
  "Aretes":"Aretes","Cadenas":"Cadenas","Esclavas":"Esclavas",
  "Pulsos":"Pulsos","Dijes":"Dijes","Rosarios":"Rosarios",
}
const MAT_MAP: Record<string, string> = { "Oro 10k":"Oro 10k","Plata 925":"Plata 925" }

function buildNumero(ordenes: OrdenCompra[]) {
  const n = ordenes.length + 1
  return `OC-${new Date().getFullYear()}-${String(n).padStart(3, "0")}`
}

// ─── OrdenModal ───────────────────────────────────────────────────────────────

function OrdenModal({
  orden, proveedores, onClose, onSaved,
}: {
  orden:       OrdenCompra | null
  proveedores: Array<{ documentId: string; nombre: string }>
  onClose:     () => void
  onSaved:     (o: OrdenCompra) => void
}) {
  const allOrdenes = useGetOrdenesCompra().ordenes
  const [num,      setNum]      = useState(orden?.numero ?? buildNumero(allOrdenes))
  const [fecha,    setFecha]    = useState(orden?.fecha ?? new Date().toISOString().split("T")[0])
  const [fechaEst, setFechaEst] = useState(orden?.fechaEntregaEstimada ?? "")
  const [provDoc,  setProvDoc]  = useState(orden?.proveedor?.documentId ?? "")
  const [estado,   setEstado]   = useState<EstadoOrden>(orden?.estado ?? "borrador")
  const [notas,    setNotas]    = useState(orden?.notas ?? "")
  const [lineas,   setLineas]   = useState<LineaOrden[]>(orden?.lineas ?? [])
  const [saving,   setSaving]   = useState(false)
  const [catalogo,   setCatalogo]   = useState<CatalogoNodo[]>([])
  const [catOpen,    setCatOpen]    = useState(false)
  const [catQ,       setCatQ]       = useState("")
  const [showFormula,setShowFormula] = useState(false)
  const [catMat,     setCatMat]     = useState<string | null>(null)

  const loadCat = useCallback(() => {
    if (catalogo.length === 0) fetchCatalogo().then(setCatalogo).catch(() => {})
  }, [catalogo.length])

  const total = lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0)

  function addFromCat(matN: string, catN: string, prod: CatalogoNodo, modeloNombre: string, sku: string) {
    const nombre = `${prod.nombre}${modeloNombre ? ` ${modeloNombre}` : ""} - ${matN}`
    setLineas(prev => [...prev, {
      id:               uid(),
      sku,
      nombre,
      cantidad:         1,
      cantidadRecibida: 0,
      costoUnitario:    0,
      categoriaJoya:    CAT_MAP[catN] ?? "",
      materialProducto: MAT_MAP[matN] ?? "",
      talla:            modeloNombre || "",
      descripcion:      prod.descripcion || prod.notas || "",
      fotoId:           prod.fotoId ?? null,
    }])
    setCatOpen(false); setCatQ("")
  }

  function updLinea(id: string, patch: Partial<LineaOrden>) {
    setLineas(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  async function handleSave() {
    if (!provDoc) { toast.error("Selecciona un proveedor"); return }
    if (lineas.length === 0) { toast.error("Agrega al menos un producto"); return }
    setSaving(true)
    try {
      const payload: OrdenPayload = {
        numero: num, fecha, fechaEntregaEstimada: fechaEst || null,
        estado,
        lineas, totalEstimado: total || null, notas: notas || null, proveedor: provDoc,
      }
      const saved = orden
        ? await updateOrden(orden.documentId, payload)
        : await createOrden(payload)
      onSaved(saved)
      toast.success(orden ? "Orden actualizada" : "Orden creada")
      onClose()
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">{orden ? "Editar orden" : "Nueva orden de compra"}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded"><X size={15}/></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Número de orden</label>
              <input className={inp} value={num} onChange={e => setNum(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Proveedor *</label>
              <select className={`${inp} cursor-pointer`} value={provDoc} onChange={e => setProvDoc(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {proveedores.map(p => <option key={p.documentId} value={p.documentId}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Fecha de orden</label>
              <input type="date" className={inp} value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Entrega estimada</label>
              <input type="date" className={inp} value={fechaEst} onChange={e => setFechaEst(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 mb-1 block">Estado</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ESTADO_CONFIG) as [EstadoOrden, typeof ESTADO_CONFIG[EstadoOrden]][]).map(([est, cfg]) => (
                  <button key={est} type="button" onClick={() => setEstado(est)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 ${
                      estado === est ? cfg.color : "border-slate-700 text-slate-500 hover:text-slate-300"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 mb-1 block">Notas</label>
              <textarea className={`${inp} h-auto py-2 resize-none`} rows={2} value={notas}
                onChange={e => setNotas(e.target.value)} placeholder="Condiciones, observaciones…" />
            </div>
          </div>

          {/* Líneas de productos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Productos</p>
              <button type="button" onClick={() => { setCatOpen(true); loadCat() }}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/5 rounded-lg px-3 py-1.5 transition">
                <BookOpen size={12}/> Buscar en catálogo
              </button>
            </div>

            {/* Modal catálogo — centrado, grande */}
            {catOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={e => { if (e.target === e.currentTarget) { setCatOpen(false); setCatQ(""); setCatMat(null) } }}>
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-amber-400"/>
                      <p className="text-sm font-semibold text-slate-100">Catálogo de productos</p>
                    </div>
                    <button type="button" title="Cerrar catálogo" onClick={() => { setCatOpen(false); setCatQ(""); setCatMat(null) }}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded"><X size={15}/></button>
                  </div>

                  {/* Fórmula SKU colapsable */}
                  <div className="px-5 pt-3 pb-2 border-b border-slate-800/50 shrink-0">
                    <button type="button" onClick={() => setShowFormula(v => !v)}
                      className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 transition w-full">
                      {showFormula ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                      <span className="font-bold uppercase tracking-widest">Fórmula SKU</span>
                      <span className="ml-2 font-mono text-amber-600">[MAT]-[CAT]-[TIPO]-[VARIANTE]</span>
                    </button>
                    {showFormula && (
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Material</p>
                          {[["O10","Oro 10k"],["P92","Plata 925"]].map(([c,l]) => (
                            <div key={c} className="flex items-center gap-2 text-[10px]">
                              <span className="font-mono text-amber-500 w-8">{c}</span>
                              <span className="text-slate-500">{l}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Categoría</p>
                          {[["ANI","Anillos"],["CAD","Cadenas"],["ARC","Arracadas"],["BRQ","Broqueles"],["ARE","Aretes"],["ESC","Esclavas"],["PUL","Pulsos"],["DIJ","Dijes"],["ROS","Rosarios"]].map(([c,l]) => (
                            <div key={c} className="flex items-center gap-2 text-[10px]">
                              <span className="font-mono text-blue-400 w-8">{c}</span>
                              <span className="text-slate-500">{l}</span>
                            </div>
                          ))}
                        </div>
                        <div className="col-span-2 mt-1 pt-1 border-t border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Ejemplos</p>
                          <div className="flex flex-wrap gap-2">
                            {["O10-ANI-LIS-T6","P92-CAD-CAR-45","O10-DIJ-VIR-MED","P92-ARC-LIS-3CM","O10-ESC-LIS-18"].map(e => (
                              <span key={e} className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">{e}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Búsqueda + filtro material */}
                  <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-800 shrink-0">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600"/>
                      <input autoFocus placeholder="Buscar por nombre, categoría o SKU…" value={catQ}
                        onChange={e => setCatQ(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/40" />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[null, ...catalogo.map(m => m.nombre)].map(m => (
                        <button key={m ?? "todas"} type="button"
                          onClick={() => setCatMat(m)}
                          className={`h-8 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${
                            catMat === m
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "border-slate-700 text-slate-500 hover:text-slate-300"
                          }`}>
                          {m ?? "Todos"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="overflow-y-auto flex-1 p-3 space-y-3">
                    {catalogo.length === 0 && (
                      <div className="py-8 text-center">
                        <Loader2 size={20} className="mx-auto mb-2 text-slate-700 animate-spin"/>
                        <p className="text-xs text-slate-600">Cargando catálogo…</p>
                      </div>
                    )}
                    {catalogo
                      .filter(mat => !catMat || mat.nombre === catMat)
                      .map(mat => mat.children.map(cat => {
                        const prods = cat.children.filter(p =>
                          !catQ ||
                          p.nombre.toLowerCase().includes(catQ.toLowerCase()) ||
                          p.sku.toLowerCase().includes(catQ.toLowerCase()) ||
                          cat.nombre.toLowerCase().includes(catQ.toLowerCase()) ||
                          mat.nombre.toLowerCase().includes(catQ.toLowerCase()) ||
                          p.modelos.some(m => m.sku.toLowerCase().includes(catQ.toLowerCase()))
                        )
                        if (!prods.length) return null
                        return (
                          <div key={`${mat.id}-${cat.id}`}>
                            {/* Grupo header */}
                            <div className="flex items-center gap-2 mb-1.5 px-1">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{mat.nombre}</span>
                              <span className="text-slate-700">›</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{cat.nombre}</span>
                            </div>
                            <div className="bg-slate-800/30 rounded-xl border border-slate-800/60 divide-y divide-slate-800/60 overflow-hidden">
                              {prods.map(prod =>
                                prod.modelos.length > 0
                                  ? prod.modelos.map(mod => (
                                      <button key={mod.id} type="button"
                                        onClick={() => addFromCat(mat.nombre, cat.nombre, prod, mod.nombre, mod.sku || prod.sku)}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors group">
                                        <div className="flex-1 min-w-0">
                                          <span className="text-sm text-slate-200 font-medium">{prod.nombre}</span>
                                          {mod.nombre && <span className="text-slate-400 text-xs ml-1.5">{mod.nombre}</span>}
                                          {mod.variedad && <span className="text-slate-600 text-xs ml-1">· {mod.variedad}</span>}
                                        </div>
                                        <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                          {mod.sku || prod.sku}
                                        </span>
                                        <Plus size={13} className="text-slate-700 group-hover:text-emerald-400 transition-colors shrink-0"/>
                                      </button>
                                    ))
                                  : (
                                    <button key={prod.id} type="button"
                                      onClick={() => addFromCat(mat.nombre, cat.nombre, prod, "", prod.sku)}
                                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors group">
                                      <span className="flex-1 text-sm text-slate-200">{prod.nombre}</span>
                                      <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                        {prod.sku}
                                      </span>
                                      <Plus size={13} className="text-slate-700 group-hover:text-emerald-400 transition-colors shrink-0"/>
                                    </button>
                                  )
                              )}
                            </div>
                          </div>
                        )
                      }))
                    }
                  </div>

                  {/* Footer hint */}
                  <div className="px-5 py-3 border-t border-slate-800 shrink-0 flex items-center justify-between">
                    <p className="text-[10px] text-slate-700">Haz clic en un producto para agregarlo a la orden</p>
                    <button type="button" onClick={() => { setCatOpen(false); setCatQ(""); setCatMat(null) }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition">Cerrar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Cabecera tabla líneas */}
            {lineas.length > 0 && (
              <div className="grid grid-cols-[1fr_2fr_80px_90px_24px] gap-1.5 px-1 mb-1">
                {["SKU","Producto","Cant.","Costo/u",""].map(h => (
                  <span key={h} className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</span>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {lineas.map(l => (
                <div key={l.id} className="grid grid-cols-[1fr_2fr_80px_90px_24px] gap-1.5 items-center">
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="SKU" value={l.sku} onChange={e => updLinea(l.id, { sku: e.target.value })} />
                  <input className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="Nombre" value={l.nombre} onChange={e => updLinea(l.id, { nombre: e.target.value })} />
                  <input type="number" min={1}
                    className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/40"
                    value={l.cantidad} onChange={e => updLinea(l.id, { cantidad: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01"
                    className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                    placeholder="0.00" value={l.costoUnitario || ""} onChange={e => updLinea(l.id, { costoUnitario: Number(e.target.value) })} />
                  <button type="button" onClick={() => setLineas(prev => prev.filter(x => x.id !== l.id))}
                    className="text-slate-700 hover:text-red-400 transition"><X size={12}/></button>
                </div>
              ))}

              <button type="button"
                onClick={() => setLineas(prev => [...prev, { id: uid(), sku: "", nombre: "", cantidad: 1, cantidadRecibida: 0, costoUnitario: 0 }])}
                className="w-full h-8 border border-dashed border-slate-700 rounded-lg text-slate-600 hover:text-slate-400 hover:border-slate-600 text-xs transition flex items-center justify-center gap-1">
                <Plus size={11}/> Agregar línea manual
              </button>
            </div>

            {/* Total */}
            {total > 0 && (
              <div className="flex justify-end mt-3 pt-3 border-t border-slate-800">
                <span className="text-sm font-bold text-amber-400">Total estimado: {fmt(total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800 shrink-0">
          <button type="button" onClick={onClose} className="h-8 px-4 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5">
            {saving && <Loader2 size={11} className="animate-spin"/>}
            {orden ? "Guardar cambios" : "Crear orden"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RecibirModal ─────────────────────────────────────────────────────────────

function RecibirModal({ orden, onClose, onDone }: { orden: OrdenCompra; onClose: () => void; onDone: (o: OrdenCompra) => void }) {
  const [cantidades,    setCantidades]    = useState<Record<string, number>>(
    Object.fromEntries(orden.lineas.map(l => [l.id, l.cantidad]))
  )
  const [costosLocales, setCostosLocales] = useState<Record<string, number>>(
    Object.fromEntries(orden.lineas.map(l => [l.id, l.costoUnitario]))
  )
  const [margen, setMargen] = useState(50)
  const [saving, setSaving] = useState(false)
  const [step,   setStep]   = useState<"form" | "done">("form")

  const pventa = (costo: number) => Math.round(costo * (1 + margen / 100) * 100) / 100
  const getCosto = (id: string) => costosLocales[id] ?? 0

  const totalPiezas  = orden.lineas.reduce((s, l) => s + (cantidades[l.id] ?? 0), 0)
  const totalImporte = orden.lineas.reduce((s, l) => s + (cantidades[l.id] ?? 0) * getCosto(l.id), 0)
  const totalVenta   = orden.lineas.reduce((s, l) => {
    const c = getCosto(l.id)
    return s + (c > 0 ? (cantidades[l.id] ?? 0) * pventa(c) : 0)
  }, 0)

  async function handleRecibir() {
    setSaving(true)
    try {
      const inventario = await fetchInventarioRaw()

      if (process.env.NODE_ENV === "development") {
        console.log("[Recibir] inventario cargado:", inventario.length, "productos")
      }

      for (const linea of orden.lineas) {
        const cant    = cantidades[linea.id] ?? 0
        if (cant <= 0) continue
        const costoReal = getCosto(linea.id)
        const costoOk   = costoReal > 0
        const existing  = inventario.find(i => i.sku != null && i.sku === linea.sku)

        if (process.env.NODE_ENV === "development") {
          console.log("[Recibir] linea:", linea.sku, "| cant:", cant, "| costo:", costoReal, "| pventa:", costoOk ? pventa(costoReal) : null, "| existing:", existing?.documentId ?? "NUEVO")
        }

        if (existing) {
          await updateProducto(existing.documentId, {
            stock: (existing.stock ?? 0) + cant,
            ...(costoOk ? {
              costoProduccion: costoReal,
              costo:           pventa(costoReal),
            } : {}),
          })
        } else {
          await createProducto({
            nombreProducto:   linea.nombre,
            slug:             slugify(linea.nombre),
            sku:              linea.sku || null,
            stock:            cant,
            costoProduccion:  costoOk ? costoReal : null,
            costo:            costoOk ? pventa(costoReal) : null,
            material:         "producto",
            categoriaJoya:    linea.categoriaJoya    || null,
            materialProducto: linea.materialProducto || null,
            talla:            linea.talla             || null,
            descripcion:      linea.descripcion       || null,
            ...(linea.fotoId ? { imagenes: [linea.fotoId] } : {}),
          } as any)
        }
      }

      const totalPedido   = orden.lineas.reduce((s, l) => s + l.cantidad, 0)
      const totalRecibido = orden.lineas.reduce((s, l) => s + (cantidades[l.id] ?? 0), 0)
      const nuevoEstado: EstadoOrden = totalRecibido >= totalPedido ? "recibida" : "recibida_parcial"
      const lineasActualizadas = orden.lineas.map(l => ({ ...l, cantidadRecibida: cantidades[l.id] ?? 0 }))
      const ordenActualizada   = await updateOrden(orden.documentId, { estado: nuevoEstado, lineas: lineasActualizadas })

      if (totalImporte > 0) {
        await createGastoCompra({
          concepto:  `Compra de mercancía - ${orden.numero}`,
          monto:     totalImporte,
          fecha:     new Date().toISOString().split("T")[0],
          proveedor: orden.proveedor?.nombre ?? "",
          factura:   orden.numero,
        }).catch(() => {})
      }

      onDone(ordenActualizada)
      setStep("done")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al recibir mercancía")
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Recibir mercancía</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{orden.numero} · {orden.proveedor?.nombre}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded"><X size={15}/></button>
        </div>

        {step === "done" ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle size={36} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-slate-100 font-semibold mb-1">¡Mercancía recibida!</p>
            <p className="text-slate-500 text-sm">{totalPiezas} piezas · Costo {fmt(totalImporte)} · Venta {fmt(totalVenta)}</p>
            <p className="text-slate-600 text-xs mt-1">Inventario actualizado · Gasto registrado</p>
            <button type="button" onClick={onClose}
              className="mt-5 h-8 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Margen global */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 shrink-0">Margen global</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} max={500} step={5}
                  title="Margen global (%)"
                  placeholder="50"
                  value={margen}
                  onChange={e => setMargen(Math.max(0, Number(e.target.value)))}
                  className="w-16 h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono" />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <span className="text-[11px] text-slate-600">
                P.Venta = Costo × <span className="text-amber-500 font-mono">{(1 + margen / 100).toFixed(2)}</span>
              </span>
            </div>

            {/* Tabla de líneas */}
            <div className="px-5 py-4 space-y-2 max-h-[45vh] overflow-y-auto">
              <div className="grid grid-cols-[2fr_1fr_60px_80px_72px] gap-2 px-1 mb-1">
                {["Producto","SKU","Recibir","Costo/u ✏","P.Venta"].map(h => (
                  <span key={h} className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {orden.lineas.map(l => {
                const c  = getCosto(l.id)
                const pv = c > 0 ? pventa(c) : null
                return (
                  <div key={l.id} className="grid grid-cols-[2fr_1fr_60px_80px_72px] gap-2 items-center">
                    <span className="text-xs text-slate-300 truncate">{l.nombre}</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate">{l.sku || "—"}</span>
                    <input type="number" min={0} max={l.cantidad}
                      title={`Cantidad a recibir: ${l.nombre}`}
                      placeholder="0"
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 text-center"
                      value={cantidades[l.id] ?? l.cantidad}
                      onChange={e => setCantidades(prev => ({ ...prev, [l.id]: Number(e.target.value) }))} />
                    <input type="number" min={0} step="0.01"
                      title={`Costo unitario: ${l.nombre}`}
                      placeholder="0.00"
                      className="bg-slate-800 border border-amber-500/30 rounded px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-500/70 text-right tabular-nums"
                      value={c || ""}
                      onChange={e => setCostosLocales(prev => ({ ...prev, [l.id]: Number(e.target.value) }))} />
                    <span className={`text-xs text-right tabular-nums font-medium ${pv ? "text-emerald-400" : "text-slate-700"}`}>
                      {pv ? fmt(pv) : "—"}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Resumen */}
            <div className="px-5 py-3 bg-slate-800/40 border-y border-slate-800 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>{totalPiezas} piezas</span>
                <div className="flex gap-4">
                  <span>Costo: <span className="text-amber-400 font-medium tabular-nums">{fmt(totalImporte)}</span></span>
                  {totalVenta > 0 && (
                    <span>Venta: <span className="text-emerald-400 font-medium tabular-nums">{fmt(totalVenta)}</span></span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-600">Costo y precio de venta se actualizarán en inventario · Gasto en Finanzas</p>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4">
              <button type="button" onClick={onClose}
                className="h-8 px-4 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleRecibir} disabled={saving}
                className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5">
                {saving ? <Loader2 size={11} className="animate-spin"/> : <PackageCheck size={11}/>}
                Confirmar recepción
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── ComprasView ──────────────────────────────────────────────────────────────

export function ComprasView() {
  const { ordenes, setOrdenes, loading } = useGetOrdenesCompra()
  const { proveedores }                  = useGetProveedores()
  const [filtro,    setFiltro]    = useState<EstadoOrden | "todas">("todas")
  const [search,    setSearch]    = useState("")
  const [modal,     setModal]     = useState<"nueva" | "editar" | "recibir" | null>(null)
  const [selected,  setSelected]  = useState<OrdenCompra | null>(null)
  const [delId,     setDelId]     = useState<string | null>(null)

  const filtradas = useMemo(() => ordenes.filter(o => {
    if (filtro !== "todas" && o.estado !== filtro) return false
    if (search && !o.numero.toLowerCase().includes(search.toLowerCase()) &&
        !(o.proveedor?.nombre ?? "").toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [ordenes, filtro, search])

  const kpis = useMemo(() => ({
    total:      ordenes.length,
    activas:    ordenes.filter(o => o.estado === "enviada" || o.estado === "borrador").length,
    recibidas:  ordenes.filter(o => o.estado === "recibida").length,
    valorTotal: ordenes.filter(o => o.estado === "recibida" || o.estado === "recibida_parcial")
                       .reduce((s, o) => s + (o.totalEstimado ?? 0), 0),
  }), [ordenes])

  function handleSaved(orden: OrdenCompra) {
    setOrdenes(prev => {
      const idx = prev.findIndex(o => o.documentId === orden.documentId)
      return idx >= 0 ? prev.map((o, i) => i === idx ? orden : o) : [orden, ...prev]
    })
  }

  async function handleDelete(documentId: string) {
    try { await deleteOrden(documentId); setOrdenes(prev => prev.filter(o => o.documentId !== documentId)); toast.success("Eliminada") }
    catch { toast.error("No se pudo eliminar") }
    finally { setDelId(null) }
  }

  async function handleEstado(orden: OrdenCompra, estado: EstadoOrden) {
    try {
      const updated = await updateOrden(orden.documentId, { estado })
      handleSaved(updated)
      toast.success(`Estado actualizado: ${ESTADO_CONFIG[estado].label}`)
    } catch { toast.error("Error al actualizar estado") }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ShoppingBag size={18} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Órdenes de Compra</h1>
            <p className="text-[11px] text-slate-500">{ordenes.length} órdenes · {kpis.activas} activas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
              className="pl-7 pr-3 h-8 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40 w-40 transition" />
          </div>
          <button type="button" onClick={() => { setSelected(null); setModal("nueva") }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition">
            <Plus size={13}/> Nueva orden
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total órdenes",  value: kpis.total,          color: "text-slate-200" },
          { label: "Activas",        value: kpis.activas,         color: "text-blue-400"  },
          { label: "Recibidas",      value: kpis.recibidas,       color: "text-emerald-400" },
          { label: "Valor recibido", value: fmt(kpis.valorTotal), color: "text-amber-400"   },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-1.5 flex-wrap">
        <button type="button" onClick={() => setFiltro("todas")}
          className={`h-7 px-3 rounded-lg text-[11px] font-medium border transition-all ${filtro==="todas"?"bg-slate-700 text-slate-100 border-slate-600":"border-slate-700 text-slate-500 hover:text-slate-300"}`}>
          Todas
        </button>
        {(Object.entries(ESTADO_CONFIG) as [EstadoOrden, typeof ESTADO_CONFIG[EstadoOrden]][]).map(([est, cfg]) => (
          <button key={est} type="button" onClick={() => setFiltro(prev => prev === est ? "todas" : est)}
            className={`h-7 px-3 rounded-lg text-[11px] font-medium border transition-all ${filtro===est ? cfg.color : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Orden / Proveedor","Fecha","Entrega est.","Estado","Piezas","Total",""].map(h => (
                  <th key={h} className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({length:4}).map((_,i) => (
                <tr key={i}>{Array.from({length:7}).map((_,j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4"/></td>
                ))}</tr>
              ))}
              {!loading && filtradas.map(o => {
                const cfg  = ESTADO_CONFIG[o.estado]
                const cant = o.lineas.reduce((s, l) => s + l.cantidad, 0)
                return (
                  <tr key={o.documentId} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200 font-mono text-xs">{o.numero}</p>
                      <p className="text-[11px] text-slate-500">{o.proveedor?.nombre ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(o.fecha)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(o.fechaEntregaEstimada)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 w-fit ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{cant} pzs · {o.lineas.length} líneas</td>
                    <td className="px-4 py-3 text-xs font-medium text-amber-400">{fmt(o.totalEstimado)}</td>
                    <td className="px-4 py-3">
                      {delId === o.documentId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(o.documentId)} className="text-[10px] text-red-400 px-1">Sí</button>
                          <button type="button" onClick={() => setDelId(null)} className="text-[10px] text-slate-500 px-1">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(o.estado === "borrador" || o.estado === "enviada") && (
                            <button type="button" title="Recibir mercancía"
                              onClick={() => { setSelected(o); setModal("recibir") }}
                              className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-slate-800 rounded transition">
                              <PackageCheck size={13}/>
                            </button>
                          )}
                          {o.estado === "borrador" && (
                            <button type="button" title="Marcar como enviada"
                              onClick={() => handleEstado(o, "enviada")}
                              className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-slate-800 rounded transition">
                              <Truck size={13}/>
                            </button>
                          )}
                          <button type="button" title="Editar"
                            onClick={() => { setSelected(o); setModal("editar") }}
                            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                            <Pencil size={12}/>
                          </button>
                          <button type="button" title="Eliminar"
                            onClick={() => setDelId(o.documentId)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filtradas.length === 0 && (
            <div className="py-12 text-center">
              <ShoppingBag size={28} className="mx-auto mb-2 text-slate-700"/>
              <p className="text-slate-600 text-sm">{search || filtro !== "todas" ? "Sin resultados." : "Sin órdenes de compra."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {(modal === "nueva" || modal === "editar") && (
        <OrdenModal
          orden={modal === "editar" ? selected : null}
          proveedores={proveedores}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal === "recibir" && selected && (
        <RecibirModal
          orden={selected}
          onClose={() => setModal(null)}
          onDone={updated => { handleSaved(updated); toast.success("Stock actualizado y gasto registrado") }}
        />
      )}
    </div>
  )
}
