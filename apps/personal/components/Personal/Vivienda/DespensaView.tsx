"use client"

import { useState, useMemo } from "react"
import {
  Plus, X, ShoppingCart, Package, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Loader2, Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  useGetIngredientes, createIngrediente, updateIngrediente, deleteIngrediente,
} from "@/api/ingrediente-despensa/getIngredientes"
import {
  IngredienteDespensa, IngredientePayload,
  UNIDADES, CATEGORIAS_DESPENSA, CATEGORIA_LABEL, CATEGORIA_COLOR,
  CategoriaDespensa, UnidadDespensa,
} from "@/types/ingrediente-despensa"

// ── helpers ──────────────────────────────────────────────────────────────────

function emptyForm(): IngredientePayload {
  return { nombre: "", cantidad: 0, unidad: "pz", categoria: "otros", cantidadMinima: 1, notas: null }
}

function stockPct(ing: IngredienteDespensa) {
  if (ing.cantidadMinima === 0) return 100
  return Math.min(100, Math.round((ing.cantidad / ing.cantidadMinima) * 100))
}

const inp   = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
const label = "block text-[11px] font-medium text-slate-400 mb-1"

// ── Main ─────────────────────────────────────────────────────────────────────

export function DespensaView() {
  const { ingredientes, setIngredientes, loading } = useGetIngredientes()

  const [tab,          setTab]          = useState<"despensa" | "compras">("despensa")
  const [filtroCat,    setFiltrocat]    = useState<CategoriaDespensa | "">("")
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editando,     setEditando]     = useState<IngredienteDespensa | null>(null)
  const [form,         setForm]         = useState<IngredientePayload>(emptyForm())
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [comprando,    setComprando]    = useState<Set<string>>(new Set())

  // ── derived ──────────────────────────────────────────────────────────────

  const filtrados = useMemo(() =>
    ingredientes.filter(i => !filtrocat || i.categoria === filtrocat),
  [ingredientes, filtrocat])

  const listaCompras = useMemo(() =>
    ingredientes.filter(i => i.cantidad < i.cantidadMinima),
  [ingredientes])

  const bajoStock = listaCompras.length

  // ── modal helpers ─────────────────────────────────────────────────────────

  function abrirNuevo() {
    setEditando(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function abrirEditar(ing: IngredienteDespensa) {
    setEditando(ing)
    setForm({
      nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad,
      categoria: ing.categoria, cantidadMinima: ing.cantidadMinima, notas: ing.notas,
    })
    setModalOpen(true)
  }

  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setForm(emptyForm())
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function guardar() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editando) {
        const updated = await updateIngrediente(editando.documentId, form)
        setIngredientes(prev => prev.map(i => i.documentId === editando.documentId ? updated : i))
        toast.success("Ingrediente actualizado")
      } else {
        const nuevo = await createIngrediente(form)
        setIngredientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Ingrediente agregado")
      }
      cerrarModal()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(ing: IngredienteDespensa) {
    setDeletingId(ing.documentId)
    try {
      await deleteIngrediente(ing.documentId)
      setIngredientes(prev => prev.filter(i => i.documentId !== ing.documentId))
      toast.success("Eliminado")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDeletingId(null)
    }
  }

  async function marcarComprado(ing: IngredienteDespensa) {
    setComprando(prev => new Set(prev).add(ing.documentId))
    try {
      const updated = await updateIngrediente(ing.documentId, { cantidad: ing.cantidadMinima })
      setIngredientes(prev => prev.map(i => i.documentId === ing.documentId ? updated : i))
      toast.success(`${ing.nombre} actualizado`)
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setComprando(prev => { const s = new Set(prev); s.delete(ing.documentId); return s })
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Despensa</h1>
          <p className="text-xs text-slate-500 mt-0.5">Controla tu stock e ingredientes por comprar</p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Agregar ingrediente
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        <TabBtn active={tab === "despensa"} onClick={() => setTab("despensa")}>
          <Package size={14} /> Despensa
          {ingredientes.length > 0 && (
            <span className="ml-1 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
              {ingredientes.length}
            </span>
          )}
        </TabBtn>
        <TabBtn active={tab === "compras"} onClick={() => setTab("compras")}>
          <ShoppingCart size={14} /> Lista de compras
          {bajoStock > 0 && (
            <span className="ml-1 text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
              {bajoStock}
            </span>
          )}
        </TabBtn>
      </div>

      {/* ── Tab: Despensa ── */}
      {tab === "despensa" && (
        <div className="space-y-4">
          {/* Filtro categoría */}
          <div className="flex gap-1.5 flex-wrap">
            <CatBtn active={filtrocat === ""} onClick={() => setFiltrocat("")}>Todos</CatBtn>
            {CATEGORIAS_DESPENSA.map(cat => (
              <CatBtn key={cat} active={filtrocat === cat} color={CATEGORIA_COLOR[cat]}
                onClick={() => setFiltrocat(filtrocat === cat ? "" : cat)}>
                {CATEGORIA_LABEL[cat]}
              </CatBtn>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-10 text-center">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-14 text-slate-600">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin ingredientes{filtrocat ? " en esta categoría" : ""}.</p>
              <button onClick={abrirNuevo} className="mt-3 text-xs text-amber-500 hover:text-amber-400">
                + Agregar el primero
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtrados.map(ing => {
                const pct = stockPct(ing)
                const bajo = ing.cantidad < ing.cantidadMinima
                return (
                  <div key={ing.documentId}
                    className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition-colors ${bajo ? "border-amber-500/30" : "border-slate-800"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-100 truncate">{ing.nombre}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORIA_COLOR[ing.categoria]}`}>
                            {CATEGORIA_LABEL[ing.categoria]}
                          </span>
                        </div>
                        {ing.notas && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{ing.notas}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => abrirEditar(ing)} title="Editar"
                          className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => eliminar(ing)} disabled={deletingId === ing.documentId} title="Eliminar"
                          className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-40">
                          {deletingId === ing.documentId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${bajo ? "text-amber-400" : "text-slate-300"}`}>
                          {ing.cantidad} {ing.unidad}
                        </span>
                        <span className="text-slate-600">mín {ing.cantidadMinima} {ing.unidad}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {bajo && (
                        <p className="flex items-center gap-1 text-[10px] text-amber-400">
                          <AlertTriangle size={10} /> Necesitas comprar {ing.cantidadMinima - ing.cantidad} {ing.unidad}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Lista de compras ── */}
      {tab === "compras" && (
        <div className="space-y-3">
          {listaCompras.length === 0 ? (
            <div className="text-center py-14 text-slate-600">
              <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="text-sm text-slate-400">¡Todo en stock! No hay ingredientes por comprar.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">{listaCompras.length} ingrediente{listaCompras.length !== 1 ? "s" : ""} por comprar</p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
                {listaCompras.map(ing => {
                  const falta = ing.cantidadMinima - ing.cantidad
                  const enProceso = comprando.has(ing.documentId)
                  return (
                    <div key={ing.documentId} className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => marcarComprado(ing)}
                        disabled={enProceso}
                        title="Marcar como comprado"
                        className="w-5 h-5 rounded border-2 border-amber-500/50 hover:bg-amber-500/20 flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
                      >
                        {enProceso && <Loader2 size={11} className="animate-spin text-amber-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{ing.nombre}</p>
                        <p className="text-[11px] text-slate-500">
                          Comprar <span className="text-amber-400 font-medium">{falta} {ing.unidad}</span>
                          {" "}· tienes {ing.cantidad} {ing.unidad}
                        </p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${CATEGORIA_COLOR[ing.categoria]}`}>
                        {CATEGORIA_LABEL[ing.categoria]}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-600">
                Toca el círculo de cada ingrediente para marcarlo como comprado (actualiza la cantidad al mínimo).
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Modal agregar / editar ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={cerrarModal}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">
                {editando ? "Editar ingrediente" : "Nuevo ingrediente"}
              </h2>
              <button onClick={cerrarModal} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {/* Nombre */}
              <div>
                <label className={label}>Nombre *</label>
                <input autoFocus value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Arroz" className={inp} />
              </div>

              {/* Categoría */}
              <div>
                <label className={label}>Categoría</label>
                <select value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaDespensa }))}
                  className={inp}>
                  {CATEGORIAS_DESPENSA.map(c => (
                    <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad actual + unidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Cantidad actual</label>
                  <input type="number" min={0} step="0.5" value={form.cantidad}
                    onChange={e => setForm(f => ({ ...f, cantidad: parseFloat(e.target.value) || 0 }))}
                    className={inp} />
                </div>
                <div>
                  <label className={label}>Unidad</label>
                  <select value={form.unidad}
                    onChange={e => setForm(f => ({ ...f, unidad: e.target.value as UnidadDespensa }))}
                    className={inp}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Cantidad mínima */}
              <div>
                <label className={label}>Cantidad mínima (alerta de compra)</label>
                <input type="number" min={0} step="0.5" value={form.cantidadMinima}
                  onChange={e => setForm(f => ({ ...f, cantidadMinima: parseFloat(e.target.value) || 0 }))}
                  className={inp} />
              </div>

              {/* Notas */}
              <div>
                <label className={label}>Notas</label>
                <input value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Marca preferida, dónde comprarlo..." className={inp} />
              </div>
            </div>

            <div className="flex gap-2 px-4 pb-4">
              <button onClick={cerrarModal}
                className="flex-1 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Guardando..." : editando ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
        active ? "bg-slate-800 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-300"
      }`}>
      {children}
    </button>
  )
}

function CatBtn({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick}
      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
        active ? (color ?? "bg-slate-700 border-slate-600 text-slate-200") : "border-slate-700 text-slate-500 hover:text-slate-300"
      }`}>
      {children}
    </button>
  )
}
