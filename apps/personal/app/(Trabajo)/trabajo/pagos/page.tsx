"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Wallet, Pencil, Check, Settings2 } from "lucide-react"
import { useGetPagosTrabajo }    from "@/api/pago-trabajo/getPagosTrabajo"
import { useGetClientesTrabajo } from "@/api/cliente-trabajo/getClientesTrabajo"
import { useGetProyectos }       from "@/api/proyecto/getProyectos"
import { useGetCategoriasPago }  from "@/api/categoria-pago/getCategoriasPago"
import { createCategoriaPago, updateCategoriaPago, deleteCategoriaPago } from "@/api/categoria-pago/mutateCategoriasPago"
import { createPagoTrabajo, updatePagoTrabajo, deletePagoTrabajo } from "@/api/pago-trabajo/mutatePagoTrabajo"
import { PagoTrabajoType, EstadoPago } from "@/types/pago-trabajo"
import { CategoriaPagoType } from "@/types/categoria-pago"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

const ESTADO_BADGE: Record<EstadoPago, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pagado:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  parcial:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

const CAT_COLORS = [
  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "bg-pink-500/15 text-pink-400 border-pink-500/20",
]

function catColor(id: number) {
  return CAT_COLORS[id % CAT_COLORS.length] ?? CAT_COLORS[0]
}

// ── Gestión de categorías ───────────────────────────────────────────────────
function GestionCategorias({ categorias, onRefetch }: {
  categorias: CategoriaPagoType[]
  onRefetch:  () => Promise<void>
}) {
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [newNombre,  setNewNombre]  = useState("")
  const [adding,     setAdding]     = useState(false)
  const [saving,     setSaving]     = useState(false)

  async function handleRename(cat: CategoriaPagoType) {
    if (!editNombre.trim() || editNombre === cat.nombre) { setEditId(null); return }
    setSaving(true)
    await updateCategoriaPago(cat.documentId, editNombre.trim())
    await onRefetch()
    setEditId(null)
    setSaving(false)
  }

  async function handleAdd() {
    if (!newNombre.trim()) return
    setSaving(true)
    await createCategoriaPago(newNombre.trim())
    await onRefetch()
    setNewNombre("")
    setAdding(false)
    setSaving(false)
  }

  async function handleDelete(cat: CategoriaPagoType) {
    await deleteCategoriaPago(cat.documentId)
    await onRefetch()
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Gestionar categorías</p>
      <div className="space-y-1.5">
        {categorias.map(cat => (
          <div key={cat.documentId} className="flex items-center gap-2 group">
            {editId === cat.documentId ? (
              <>
                <input
                  autoFocus
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(cat); if (e.key === "Escape") setEditId(null) }}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
                <button type="button" aria-label="Guardar nombre" onClick={() => handleRename(cat)} disabled={saving}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Cancelar edición" onClick={() => setEditId(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${catColor(cat.id)}`}>
                  {cat.nombre}
                </span>
                <button type="button" aria-label="Renombrar categoría"
                  onClick={() => { setEditId(cat.documentId); setEditNombre(cat.nombre) }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-all">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Eliminar categoría" onClick={() => handleDelete(cat)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all ml-auto">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            autoFocus
            value={newNombre}
            onChange={e => setNewNombre(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewNombre("") } }}
            placeholder="Nombre de categoría"
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
          />
          <button type="button" aria-label="Confirmar nueva categoría" onClick={handleAdd} disabled={!newNombre.trim() || saving}
            className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Cancelar" onClick={() => { setAdding(false); setNewNombre("") }}
            className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2">
          <Plus className="h-3.5 w-3.5" /> Nueva categoría
        </button>
      )}
    </div>
  )
}

// ── Formulario nuevo pago ───────────────────────────────────────────────────
function FormPago({ categorias, clientes, proyectos, onSave, onCancel }: {
  categorias: CategoriaPagoType[]
  clientes:   { id: number; nombre: string }[]
  proyectos:  { id: number; nombre: string }[]
  onSave:     () => void
  onCancel:   () => void
}) {
  const [concepto,    setConcepto]    = useState("")
  const [monto,       setMonto]       = useState("")
  const [fecha,       setFecha]       = useState(new Date().toISOString().slice(0, 10))
  const [estado,      setEstado]      = useState<EstadoPago>("pendiente")
  const [categoriaId, setCategoriaId] = useState<number | "">("")
  const [notas,       setNotas]       = useState("")
  const [clienteId,   setClienteId]   = useState<number | "">("")
  const [proyectoId,  setProyectoId]  = useState<number | "">("")
  const [saving,      setSaving]      = useState(false)

  async function handleSave() {
    if (!concepto.trim() || !monto) return
    setSaving(true)
    const payload: any = {
      concepto: concepto.trim(),
      monto:    Number(monto),
      fecha:    fecha || null,
      estado,
      notas:    notas || null,
    }
    if (categoriaId) payload.categoriaPago  = { connect: [{ id: categoriaId }] }
    if (clienteId)   payload.clienteTrabajo = { connect: [{ id: clienteId }] }
    if (proyectoId)  payload.proyecto       = { connect: [{ id: proyectoId }] }
    await createPagoTrabajo(payload)
    setSaving(false)
    onSave()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Nuevo Pago</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Concepto *"
          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/50" />
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Monto ($) *"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <input type="date" title="Fecha del pago" value={fecha} onChange={e => setFecha(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        <select title="Categoría" value={categoriaId} onChange={e => setCategoriaId(e.target.value ? Number(e.target.value) : "")}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select title="Estado" value={estado} onChange={e => setEstado(e.target.value as EstadoPago)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="parcial">Parcial</option>
        </select>
        {clientes.length > 0 && (
          <select title="Cliente" value={clienteId} onChange={e => setClienteId(e.target.value ? Number(e.target.value) : "")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
            <option value="">Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
        {proyectos.length > 0 && (
          <select title="Proyecto" value={proyectoId} onChange={e => setProyectoId(e.target.value ? Number(e.target.value) : "")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
            <option value="">Sin proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}
        <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas"
          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!concepto.trim() || !monto || saving}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Registrar Pago"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function PagosPage() {
  const { pagos, setPagos, loading, refetch }        = useGetPagosTrabajo()
  const { categorias, refetch: refetchCats, loading: loadingCats } = useGetCategoriasPago()
  const { clientes }                                 = useGetClientesTrabajo()
  const { proyectos }                                = useGetProyectos()

  const [showForm,    setShowForm]    = useState(false)
  const [showGestion, setShowGestion] = useState(false)
  const [filtroEst,   setFiltroEst]   = useState<EstadoPago | "todos">("todos")
  const [filtroCatId, setFiltroCatId] = useState<number | null>(null)

  const filtrados = useMemo(() =>
    pagos
      .filter(p => filtroEst   === "todos" || p.estado === filtroEst)
      .filter(p => filtroCatId === null    || p.categoriaPago?.id === filtroCatId),
    [pagos, filtroEst, filtroCatId]
  )

  const resumen = useMemo(() => ({
    total:     pagos.reduce((s, p) => s + p.monto, 0),
    pagado:    pagos.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0),
    pendiente: pagos.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0),
  }), [pagos])

  const porCategoria = useMemo(() =>
    categorias
      .map(cat => ({
        cat,
        total: pagos.filter(p => p.categoriaPago?.id === cat.id).reduce((s, p) => s + p.monto, 0),
        count: pagos.filter(p => p.categoriaPago?.id === cat.id).length,
      }))
      .filter(x => x.count > 0),
    [pagos, categorias]
  )

  async function handleEstado(p: PagoTrabajoType, estado: EstadoPago) {
    await updatePagoTrabajo(p.documentId, { estado })
    setPagos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, estado } : x))
  }

  async function handleCategoria(p: PagoTrabajoType, catId: number | "") {
    const payload: any = catId
      ? { categoriaPago: { connect: [{ id: catId }] } }
      : { categoriaPago: { disconnect: [] } }
    await updatePagoTrabajo(p.documentId, payload)
    const cat = categorias.find(c => c.id === catId) ?? null
    setPagos(prev => prev.map(x => x.documentId === p.documentId ? { ...x, categoriaPago: cat } : x))
  }

  async function handleDelete(p: PagoTrabajoType) {
    await deletePagoTrabajo(p.documentId)
    setPagos(prev => prev.filter(x => x.documentId !== p.documentId))
  }

  if (loading || loadingCats) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",     value: resumen.total,     color: "text-slate-200"   },
          { label: "Pagado",    value: resumen.pagado,    color: "text-emerald-400" },
          { label: "Pendiente", value: resumen.pendiente, color: "text-amber-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Desglose por categoría */}
      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {porCategoria.map(({ cat, total, count }) => (
            <button
              key={cat.documentId}
              type="button"
              onClick={() => setFiltroCatId(filtroCatId === cat.id ? null : cat.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                filtroCatId === cat.id
                  ? `${catColor(cat.id)} border-current`
                  : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60"
              }`}
            >
              <div>
                <p className={`text-[11px] font-semibold ${filtroCatId === cat.id ? "" : "text-slate-300"}`}>{cat.nombre}</p>
                <p className="text-[10px] text-slate-500">{count} pago{count !== 1 ? "s" : ""}</p>
              </div>
              <p className={`text-sm font-bold tabular-nums ${filtroCatId === cat.id ? "" : "text-slate-300"}`}>{fmt(total)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Gestionar categorías (toggle) */}
      <div>
        <button
          type="button"
          onClick={() => setShowGestion(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {showGestion ? "Ocultar" : "Gestionar categorías"}
        </button>
        <AnimatePresence>
          {showGestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <GestionCategorias categorias={categorias} onRefetch={refetchCats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filtros estado + acción */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["todos","pendiente","pagado","parcial"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltroEst(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filtroEst === f ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
              {f === "todos" ? `Todos (${pagos.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${pagos.filter(p => p.estado === f).length})`}
            </button>
          ))}
          {filtroCatId !== null && (
            <button type="button" onClick={() => setFiltroCatId(null)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X className="h-3 w-3" /> {categorias.find(c => c.id === filtroCatId)?.nombre}
            </button>
          )}
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Registrar Pago
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <FormPago
            categorias={categorias}
            clientes={clientes.filter(c => c.activo)}
            proyectos={proyectos.filter(p => p.estado === "activo")}
            onSave={async () => { setShowForm(false); await refetch() }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin pagos registrados.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Concepto</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Cliente / Proyecto</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtrados.map(p => (
                  <motion.tr
                    key={p.documentId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-800/30 last:border-0 group hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium truncate max-w-[140px]">{p.concepto}</p>
                      {p.notas && <p className="text-[10px] text-slate-600 truncate">{p.notas}</p>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <select
                        title="Categoría del pago"
                        value={p.categoriaPago?.id ?? ""}
                        onChange={e => handleCategoria(p, e.target.value ? Number(e.target.value) : "")}
                        className={`text-[10px] px-2 py-1 rounded-full border font-medium cursor-pointer bg-transparent transition-colors ${
                          p.categoriaPago ? catColor(p.categoriaPago.id) : "text-slate-500 border-slate-700"
                        }`}
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-slate-400 text-xs truncate">{p.clienteTrabajo?.nombre ?? "—"}</p>
                      {p.proyecto && <p className="text-[10px] text-slate-600 truncate">{p.proyecto.nombre}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.fecha ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-200 tabular-nums">{fmt(p.monto)}</td>
                    <td className="px-4 py-3 text-center">
                      <select title="Estado del pago" value={p.estado} onChange={e => handleEstado(p, e.target.value as EstadoPago)}
                        className={`text-[10px] px-2 py-1 rounded-full border font-medium bg-transparent cursor-pointer ${ESTADO_BADGE[p.estado]}`}>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="parcial">Parcial</option>
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <button type="button" onClick={() => handleDelete(p)} aria-label="Eliminar pago"
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
