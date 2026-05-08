"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Pencil, Trash2, X, Search, ShoppingCart, Package, Minus } from "lucide-react"
import { toast } from "sonner"
import {
  useGetIngredientes, createIngrediente, updateIngrediente, deleteIngrediente,
} from "@/api/ingrediente-despensa/getIngredientes"
import { createItemCompra } from "@/api/item-compra/getItemsCompra"
import { IngredienteType, UnidadMedida, CategoriaIngrediente } from "@/types/recetario"

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS: { key: CategoriaIngrediente; label: string; color: string; emoji: string }[] = [
  { key: "verduras",  label: "Verduras",  color: "green",  emoji: "🥬" },
  { key: "frutas",    label: "Frutas",    color: "orange", emoji: "🍎" },
  { key: "carnes",    label: "Carnes",    color: "red",    emoji: "🥩" },
  { key: "lácteos",   label: "Lácteos",   color: "blue",   emoji: "🥛" },
  { key: "granos",    label: "Granos",    color: "amber",  emoji: "🌾" },
  { key: "especias",  label: "Especias",  color: "purple", emoji: "🌶️" },
  { key: "aceites",   label: "Aceites",   color: "yellow", emoji: "🫙" },
  { key: "bebidas",   label: "Bebidas",   color: "cyan",   emoji: "🧃" },
  { key: "enlatados", label: "Enlatados", color: "slate",  emoji: "🥫" },
  { key: "otros",     label: "Otros",     color: "slate",  emoji: "📦" },
]

const UNIDADES: UnidadMedida[] = ["pz","kg","g","L","ml","taza","bolsa","lata","caja","botella"]

const CAT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  orange: { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30"  },
  red:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30"     },
  blue:   { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30"    },
  amber:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30"   },
  purple: { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30"  },
  yellow: { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30"  },
  cyan:   { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/30"    },
  slate:  { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30"   },
}

const STATUS_STYLE = {
  ok:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-400",   cardBorder: "border-slate-700/40", label: "OK"      },
  bajo:    { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   bar: "bg-amber-400",     cardBorder: "border-amber-500/30", label: "Bajo"    },
  agotado: { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     bar: "bg-red-400",       cardBorder: "border-red-500/30",   label: "Agotado" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function catStyle(categoria: CategoriaIngrediente) {
  const found = CATEGORIAS.find(c => c.key === categoria)
  return CAT_STYLE[found?.color ?? "slate"]
}

function catEmoji(categoria: CategoriaIngrediente) {
  return CATEGORIAS.find(c => c.key === categoria)?.emoji ?? "📦"
}

function getStatus(i: IngredienteType): "ok" | "bajo" | "agotado" {
  if (i.cantidad <= 0) return "agotado"
  if (i.cantidadMinima > 0 && i.cantidad < i.cantidadMinima) return "bajo"
  return "ok"
}

function fmtQty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

type IngredienteForm = Omit<IngredienteType, "id" | "documentId">
const FORM_EMPTY: IngredienteForm = {
  nombre: "", cantidad: 1, unidad: "pz", categoria: "otros", cantidadMinima: 1, notas: null,
}

// ─── Ingredient Card ──────────────────────────────────────────────────────────
function IngredienteCard({ ing, onEdit, onDelete, onAddToCompras, onQtyChange }: {
  ing: IngredienteType
  onEdit: () => void
  onDelete: () => void
  onAddToCompras: () => void
  onQtyChange: (delta: number) => void
}) {
  const status = getStatus(ing)
  const st = STATUS_STYLE[status]
  const cs = catStyle(ing.categoria)
  const pct = ing.cantidadMinima > 0 ? Math.min(100, (ing.cantidad / ing.cantidadMinima) * 100) : 100

  return (
    <div className={`relative rounded-xl bg-slate-900/60 border backdrop-blur-sm p-3 flex flex-col gap-2 ${st.cardBorder}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none">{catEmoji(ing.categoria)}</span>
          <p className="text-sm font-semibold text-slate-200 truncate">{ing.nombre}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${st.text} ${st.bg} ${st.border}`}>
            {st.label}
          </span>
          <button type="button" aria-label="Editar" onClick={onEdit}  className="h-5 w-5 rounded text-slate-600 hover:text-cyan-400 flex items-center justify-center transition-colors"><Pencil className="h-3 w-3" /></button>
          <button type="button" aria-label="Eliminar" onClick={onDelete} className="h-5 w-5 rounded text-slate-600 hover:text-red-400 flex items-center justify-center transition-colors"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      <span className={`self-start text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cs.text} ${cs.bg} ${cs.border}`}>
        {ing.categoria}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Reducir cantidad"
          onClick={() => onQtyChange(-0.5)}
          className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 flex items-center justify-center transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-lg font-bold text-slate-200">{fmtQty(ing.cantidad)}</span>
          <span className="text-xs text-slate-500 ml-1">{ing.unidad}</span>
        </div>
        <button
          type="button"
          aria-label="Aumentar cantidad"
          onClick={() => onQtyChange(0.5)}
          className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 flex items-center justify-center transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {ing.cantidadMinima > 0 && (
        <div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${st.bar}`}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5 text-right">mín: {fmtQty(ing.cantidadMinima)} {ing.unidad}</p>
        </div>
      )}

      {status !== "ok" && (
        <button
          type="button"
          onClick={onAddToCompras}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
        >
          <ShoppingCart className="h-3 w-3" />
          Agregar a compras
        </button>
      )}

      {ing.notas && (
        <p className="text-[10px] text-slate-600 truncate">{ing.notas}</p>
      )}
    </div>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function FormModal({ initial, onSave, onClose, saving }: {
  initial: IngredienteForm
  onSave: (data: IngredienteForm) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<IngredienteForm>(initial)
  const set = <K extends keyof IngredienteForm>(key: K, val: IngredienteForm[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error("El nombre es requerido"); return }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              {initial.nombre ? "Editar ingrediente" : "Nuevo ingrediente"}
            </h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              placeholder="Ej: Leche entera"
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Categoría</label>
            <div className="grid grid-cols-5 gap-1">
              {CATEGORIAS.map(cat => {
                const cs = CAT_STYLE[cat.color]
                const active = form.categoria === cat.key
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => set("categoria", cat.key)}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] font-semibold transition-all ${
                      active ? `${cs.bg} ${cs.text} ${cs.border}` : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-sm leading-none">{cat.emoji}</span>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="ing-cantidad" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cantidad actual</label>
              <input
                id="ing-cantidad"
                type="number" min={0} step={0.1} value={form.cantidad}
                onChange={e => set("cantidad", Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unidad</label>
              <select
                value={form.unidad}
                aria-label="Unidad de medida"
                onChange={e => set("unidad", e.target.value as UnidadMedida)}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="ing-minimo" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Stock mínimo <span className="normal-case text-slate-600">(activa alerta cuando baje de aquí)</span>
            </label>
            <input
              id="ing-minimo"
              type="number" min={0} step={0.1} value={form.cantidadMinima}
              onChange={e => set("cantidadMinima", Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notas</label>
            <input
              value={form.notas ?? ""}
              onChange={e => set("notas", e.target.value || null)}
              placeholder="Marca, ubicación, etc."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
          >
            {saving ? "Guardando..." : initial.nombre ? "Guardar cambios" : "Agregar ingrediente"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main DespensaTab ─────────────────────────────────────────────────────────
export function DespensaTab({ onSwitchToCompras }: { onSwitchToCompras: () => void }) {
  const { ingredientes, setIngredientes, loading } = useGetIngredientes()
  const [busqueda,  setBusqueda]  = useState("")
  const [catFiltro, setCatFiltro] = useState<CategoriaIngrediente | "todas">("todas")
  const [formModal, setFormModal] = useState<{ open: boolean; editando: IngredienteType | null }>({ open: false, editando: null })
  const [saving, setSaving] = useState(false)

  const handleSave = async (data: IngredienteForm) => {
    setSaving(true)
    try {
      if (formModal.editando) {
        const res = await updateIngrediente(formModal.editando.documentId, data)
        if (res?.data) {
          setIngredientes(prev => prev.map(i => i.documentId === formModal.editando!.documentId ? res.data : i))
          toast.success("Ingrediente actualizado")
        }
      } else {
        const res = await createIngrediente(data)
        if (res?.data) {
          setIngredientes(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
          toast.success("Ingrediente agregado a la despensa")
        }
      }
      setFormModal({ open: false, editando: null })
    } finally { setSaving(false) }
  }

  const handleDelete = async (documentId: string) => {
    await deleteIngrediente(documentId)
    setIngredientes(prev => prev.filter(i => i.documentId !== documentId))
    toast.success("Ingrediente eliminado")
  }

  const handleQtyChange = async (ing: IngredienteType, delta: number) => {
    const nuevaCantidad = Math.max(0, Math.round((ing.cantidad + delta) * 10) / 10)
    setIngredientes(prev => prev.map(i => i.documentId === ing.documentId ? { ...i, cantidad: nuevaCantidad } : i))
    await updateIngrediente(ing.documentId, { cantidad: nuevaCantidad })
  }

  const addToCompras = async (ing: IngredienteType) => {
    const falta = Math.max(0.5, ing.cantidadMinima - ing.cantidad)
    const res = await createItemCompra({
      nombre: ing.nombre,
      cantidadSugerida: Math.round(falta * 10) / 10,
      unidad: ing.unidad,
      categoria: ing.categoria,
      completado: false,
      auto: true,
      ingredienteRef: ing.documentId,
    })
    if (res?.data) {
      toast.success(`${ing.nombre} agregado a lista de compras`)
    } else {
      toast.error("Error al agregar a compras")
    }
  }

  const generarListaCompleta = async () => {
    const bajos = ingredientes.filter(i => getStatus(i) !== "ok")
    if (bajos.length === 0) { toast.info("Todo el stock está completo 👌"); return }

    let agregados = 0
    await Promise.all(bajos.map(async (ing) => {
      const res = await createItemCompra({
        nombre: ing.nombre,
        cantidadSugerida: Math.max(0.5, Math.round((ing.cantidadMinima - ing.cantidad) * 10) / 10),
        unidad: ing.unidad,
        categoria: ing.categoria,
        completado: false,
        auto: true,
        ingredienteRef: ing.documentId,
      })
      if (res?.data) agregados++
    }))
    toast.success(`${agregados} items agregados a la lista`)
    onSwitchToCompras()
  }

  const filtrados = useMemo(() =>
    ingredientes.filter(i => {
      const matchCat  = catFiltro === "todas" || i.categoria === catFiltro
      const matchBusq = !busqueda || i.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchCat && matchBusq
    })
  , [ingredientes, catFiltro, busqueda])

  const stats = useMemo(() => ({
    total:   ingredientes.length,
    bajo:    ingredientes.filter(i => getStatus(i) === "bajo").length,
    agotado: ingredientes.filter(i => getStatus(i) === "agotado").length,
  }), [ingredientes])

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "En despensa", value: stats.total,   color: "text-slate-300"  },
          { label: "Stock bajo",  value: stats.bajo,    color: "text-amber-400"  },
          { label: "Agotados",    value: stats.agotado, color: "text-red-400"    },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar ingrediente..."
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
          />
        </div>
        {(stats.bajo + stats.agotado) > 0 && (
          <button
            type="button"
            onClick={generarListaCompleta}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors shrink-0"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Lista de compras ({stats.bajo + stats.agotado})
          </button>
        )}
        <button
          type="button"
          onClick={() => setFormModal({ open: true, editando: null })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCatFiltro("todas")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
            catFiltro === "todas"
              ? "bg-slate-700/60 text-slate-200 border-slate-600"
              : "bg-slate-900/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
          }`}
        >
          📦 Todas
        </button>
        {CATEGORIAS.map(cat => {
          const cs = CAT_STYLE[cat.color]
          const active = catFiltro === cat.key
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCatFiltro(cat.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                active ? `${cs.bg} ${cs.text} ${cs.border}` : "bg-slate-900/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            {ingredientes.length === 0 ? "Despensa vacía" : "Sin resultados"}
          </p>
          <p className="text-xs text-slate-700 mt-1">
            {ingredientes.length === 0 ? "Registra los ingredientes que tienes en casa" : "Prueba con otro filtro"}
          </p>
          {ingredientes.length === 0 && (
            <button
              type="button"
              onClick={() => setFormModal({ open: true, editando: null })}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar primer ingrediente
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filtrados.map(ing => (
              <motion.div
                key={ing.documentId} layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <IngredienteCard
                  ing={ing}
                  onEdit={() => setFormModal({ open: true, editando: ing })}
                  onDelete={() => handleDelete(ing.documentId)}
                  onAddToCompras={() => addToCompras(ing)}
                  onQtyChange={delta => handleQtyChange(ing, delta)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {formModal.open && (
          <FormModal
            initial={formModal.editando
              ? { nombre: formModal.editando.nombre, cantidad: formModal.editando.cantidad, unidad: formModal.editando.unidad, categoria: formModal.editando.categoria, cantidadMinima: formModal.editando.cantidadMinima, notas: formModal.editando.notas }
              : FORM_EMPTY}
            onSave={handleSave}
            onClose={() => setFormModal({ open: false, editando: null })}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
