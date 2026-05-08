"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X, ShoppingCart, Check, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────
type ItemCompra = {
  id: string
  nombre: string
  cantidadSugerida: number
  unidad: string
  categoria: string
  completado: boolean
  auto: boolean
  ingredienteId?: string
  creadoEn: string
}

type Ingrediente = {
  id: string
  cantidad: number
  cantidadMinima: number
  actualizadoEn: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_COMPRAS  = "miracles_compras"
const STORAGE_DESPENSA = "miracles_despensa"

const CATEGORIAS_EMOJI: Record<string, string> = {
  verduras: "🥬", frutas: "🍎", carnes: "🥩", lácteos: "🥛",
  granos: "🌾", especias: "🌶️", aceites: "🫙", bebidas: "🧃",
  enlatados: "🥫", otros: "📦",
}

const UNIDADES = ["pz","kg","g","L","ml","taza","bolsa","lata","caja","botella"]
const CATEGORIAS_LIST = ["verduras","frutas","carnes","lácteos","granos","especias","aceites","bebidas","enlatados","otros"]

function fmtQty(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(1) }

// ─── Row component ────────────────────────────────────────────────────────────
function CompraRow({ item, onToggle, onDelete }: {
  item: ItemCompra
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        item.completado ? "opacity-40" : "hover:bg-slate-800/30"
      }`}
    >
      <button
        onClick={onToggle}
        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
          item.completado
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            : "border-slate-600 hover:border-emerald-500/50"
        }`}
      >
        {item.completado && <Check className="h-3 w-3" />}
      </button>

      <span className="text-sm shrink-0">
        {CATEGORIAS_EMOJI[item.categoria] ?? "📦"}
      </span>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${item.completado ? "line-through text-slate-600" : "text-slate-200"}`}>
          {item.nombre}
        </span>
        {item.auto && !item.completado && (
          <span className="ml-1.5 text-[9px] text-amber-500/60 font-semibold">sugerido</span>
        )}
      </div>

      <span className="text-xs text-slate-500 tabular-nums shrink-0">
        {fmtQty(item.cantidadSugerida)} {item.unidad}
      </span>

      <button
        onClick={onDelete}
        className="h-5 w-5 rounded text-slate-700 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </motion.div>
  )
}

// ─── Add item inline ──────────────────────────────────────────────────────────
function AddItemInline({ onAdd }: { onAdd: (nombre: string, cantidad: number, unidad: string, categoria: string) => void }) {
  const [open,      setOpen]      = useState(false)
  const [nombre,    setNombre]    = useState("")
  const [cantidad,  setCantidad]  = useState(1)
  const [unidad,    setUnidad]    = useState("pz")
  const [categoria, setCategoria] = useState("otros")

  const handleAdd = () => {
    if (!nombre.trim()) { toast.error("Escribe un nombre"); return }
    onAdd(nombre.trim(), cantidad, unidad, categoria)
    setNombre("")
    setCantidad(1)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-slate-400 hover:border-slate-600 text-xs transition-colors w-full"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar item manualmente
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">Agregar item</p>
        <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        placeholder="Nombre del producto..."
        autoFocus
        className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
      />
      <div className="flex gap-2">
        <input
          type="number" min={0.1} step={0.5} value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          className="w-16 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        />
        <select
          value={unidad}
          onChange={e => setUnidad(e.target.value)}
          className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          {UNIDADES.map(u => <option key={u}>{u}</option>)}
        </select>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          {CATEGORIAS_LIST.map(c => (
            <option key={c} value={c}>{CATEGORIAS_EMOJI[c]} {c}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAdd}
        className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/30 transition-colors"
      >
        Agregar
      </button>
    </motion.div>
  )
}

// ─── Main ComprasTab ──────────────────────────────────────────────────────────
export function ComprasTab() {
  const [items, setItems] = useState<ItemCompra[]>([])

  // Re-read localStorage on every mount (component remounts when switching tabs)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COMPRAS)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const guardar = (lista: ItemCompra[]) => {
    setItems(lista)
    localStorage.setItem(STORAGE_COMPRAS, JSON.stringify(lista))
  }

  const toggleItem = (id: string) =>
    guardar(items.map(i => i.id === id ? { ...i, completado: !i.completado } : i))

  const deleteItem = (id: string) =>
    guardar(items.filter(i => i.id !== id))

  const addItem = (nombre: string, cantidad: number, unidad: string, categoria: string) => {
    const nuevo: ItemCompra = {
      id: crypto.randomUUID(), nombre, cantidadSugerida: cantidad, unidad,
      categoria, completado: false, auto: false, creadoEn: new Date().toISOString(),
    }
    guardar([...items, nuevo])
    toast.success("Item agregado a la lista")
  }

  const limpiarCompletados = () => {
    guardar(items.filter(i => !i.completado))
    toast.success("Lista limpiada")
  }

  // Restore completed items to cantidadMinima in pantry
  const actualizarDespensa = () => {
    const completados = items.filter(i => i.completado && i.ingredienteId)
    if (completados.length === 0) {
      toast.info("Marca items como comprados para actualizar la despensa")
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_DESPENSA)
      const despensa: Ingrediente[] = raw ? JSON.parse(raw) : []
      let actualizados = 0
      const nueva = despensa.map(ing => {
        const comprado = completados.find(c => c.ingredienteId === ing.id)
        if (!comprado) return ing
        actualizados++
        return { ...ing, cantidad: ing.cantidadMinima, actualizadoEn: new Date().toISOString() }
      })
      localStorage.setItem(STORAGE_DESPENSA, JSON.stringify(nueva))
      toast.success(`${actualizados} ingrediente${actualizados !== 1 ? "s" : ""} actualizado${actualizados !== 1 ? "s" : ""} en despensa`)
    } catch {}
  }

  const pendientes  = items.filter(i => !i.completado)
  const completados = items.filter(i =>  i.completado)

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">Lista de Compras</p>
            <p className="text-[10px] text-slate-500">
              {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
              {completados.length > 0 && ` · ${completados.length} comprado${completados.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {completados.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={actualizarDespensa}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <RefreshCcw className="h-3 w-3" />
              Actualizar despensa
            </button>
            <button
              onClick={limpiarCompletados}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold hover:text-slate-300 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Empty */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Lista vacía</p>
          <p className="text-xs text-slate-700 mt-1">
            Genera una lista desde la Despensa o agrega items manualmente
          </p>
        </div>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800/60">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pendientes · {pendientes.length}
            </p>
          </div>
          <div className="p-2 space-y-0.5">
            <AnimatePresence mode="popLayout">
              {pendientes.map(item => (
                <CompraRow
                  key={item.id} item={item}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Completados */}
      {completados.length > 0 && (
        <div className="rounded-xl bg-slate-900/30 border border-slate-700/20 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800/40">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Comprados · {completados.length}
            </p>
          </div>
          <div className="p-2 space-y-0.5">
            <AnimatePresence mode="popLayout">
              {completados.map(item => (
                <CompraRow
                  key={item.id} item={item}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add manual item */}
      <AddItemInline onAdd={addItem} />
    </div>
  )
}
