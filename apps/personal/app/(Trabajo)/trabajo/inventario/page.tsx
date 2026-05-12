"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Archive, AlertTriangle, Pencil } from "lucide-react"
import { useGetMaterialesTrabajo }   from "@/api/material-trabajo/getMaterialesTrabajo"
import { createMaterialTrabajo, updateMaterialTrabajo, deleteMaterialTrabajo } from "@/api/material-trabajo/mutateMaterialTrabajo"
import { MaterialTrabajoType, CategoriaMaterial, MaterialTrabajoPayload } from "@/types/material-trabajo"

const CATEGORIA_LABEL: Record<CategoriaMaterial, string> = {
  promocional: "Promocional",
  folleto:     "Folleto",
  camisa:      "Camisa",
  otro:        "Otro",
}

const CATEGORIA_BADGE: Record<CategoriaMaterial, string> = {
  promocional: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  folleto:     "bg-sky-500/15 text-sky-300 border-sky-500/20",
  camisa:      "bg-rose-500/15 text-rose-300 border-rose-500/20",
  otro:        "bg-slate-500/15 text-slate-400 border-slate-500/20",
}

type FormMode = { type: "create" } | { type: "edit"; item: MaterialTrabajoType }

function FormMaterial({ mode, onSave, onCancel }: {
  mode:     FormMode
  onSave:   (m: MaterialTrabajoType) => void
  onCancel: () => void
}) {
  const editing = mode.type === "edit" ? mode.item : null

  const [nombre,    setNombre]    = useState(editing?.nombre    ?? "")
  const [categoria, setCategoria] = useState<CategoriaMaterial>(editing?.categoria ?? "otro")
  const [cantidad,  setCantidad]  = useState(String(editing?.cantidad ?? 0))
  const [minimo,    setMinimo]    = useState(String(editing?.minimo   ?? 0))
  const [notas,     setNotas]     = useState(editing?.notas     ?? "")
  const [saving,    setSaving]    = useState(false)

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const payload: MaterialTrabajoPayload = {
      nombre:    nombre.trim(),
      categoria,
      cantidad:  Number(cantidad) || 0,
      minimo:    Number(minimo)   || 0,
      notas:     notas.trim() || null,
    }
    if (editing) {
      const res = await updateMaterialTrabajo(editing.documentId, payload)
      if (res?.data) onSave(res.data)
    } else {
      const res = await createMaterialTrabajo(payload)
      if (res?.data) onSave(res.data)
    }
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">
        {editing ? "Editar Item" : "Nuevo Item de Inventario"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Nombre *"
          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
        />
        <select
          value={categoria} onChange={e => setCategoria(e.target.value as CategoriaMaterial)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        >
          <option value="promocional">Promocional</option>
          <option value="folleto">Folleto</option>
          <option value="camisa">Camisa</option>
          <option value="otro">Otro</option>
        </select>
        <input
          type="number" value={cantidad} onChange={e => setCantidad(e.target.value)}
          placeholder="Cantidad actual"
          min="0"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        />
        <input
          type="number" value={minimo} onChange={e => setMinimo(e.target.value)}
          placeholder="Mínimo (alerta)"
          min="0"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        />
        <input
          value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Notas"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button" onClick={handleSave}
          disabled={!nombre.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Registrar Item"}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

export default function InventarioPage() {
  const { materiales, setMateriales, loading } = useGetMaterialesTrabajo()
  const [formMode,  setFormMode]  = useState<FormMode | null>(null)
  const [filtro,    setFiltro]    = useState<CategoriaMaterial | "todos">("todos")

  const filtrados = useMemo(() =>
    filtro === "todos" ? materiales : materiales.filter(m => m.categoria === filtro),
    [materiales, filtro]
  )

  const stats = useMemo(() => ({
    total:    materiales.length,
    piezas:   materiales.reduce((s, m) => s + m.cantidad, 0),
    bajos:    materiales.filter(m => m.cantidad <= m.minimo && m.minimo > 0).length,
  }), [materiales])

  async function handleCantidad(m: MaterialTrabajoType, delta: number) {
    const nueva = Math.max(0, m.cantidad + delta)
    await updateMaterialTrabajo(m.documentId, { cantidad: nueva })
    setMateriales(prev => prev.map(x => x.documentId === m.documentId ? { ...x, cantidad: nueva } : x))
  }

  async function handleDelete(m: MaterialTrabajoType) {
    await deleteMaterialTrabajo(m.documentId)
    setMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
  }

  function handleSave(saved: MaterialTrabajoType) {
    if (formMode?.type === "edit") {
      setMateriales(prev => prev.map(x => x.documentId === saved.documentId ? saved : x))
    } else {
      setMateriales(prev => [...prev, saved].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    }
    setFormMode(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Items",      value: stats.total,  color: "text-slate-200",   suffix: "" },
          { label: "Piezas",     value: stats.piezas, color: "text-emerald-400", suffix: "" },
          { label: "Stock bajo", value: stats.bajos,  color: stats.bajos > 0 ? "text-amber-400" : "text-slate-500", suffix: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Acción */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["todos", "promocional", "folleto", "camisa", "otro"] as const).map(f => (
            <button
              key={f} type="button" onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtro === f
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "todos" ? `Todos (${materiales.length})` : `${CATEGORIA_LABEL[f]} (${materiales.filter(m => m.categoria === f).length})`}
            </button>
          ))}
        </div>
        <button
          type="button" onClick={() => setFormMode({ type: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Item
        </button>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {formMode && (
          <FormMaterial
            mode={formMode}
            onSave={handleSave}
            onCancel={() => setFormMode(null)}
          />
        )}
      </AnimatePresence>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin items registrados.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Notas</th>
                <th className="px-2 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtrados.map(m => {
                  const bajo = m.minimo > 0 && m.cantidad <= m.minimo
                  return (
                    <motion.tr
                      key={m.documentId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-slate-800/30 last:border-0 group hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {bajo && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" title="Stock bajo mínimo" />}
                          <span className={`font-medium truncate max-w-[140px] ${bajo ? "text-amber-200" : "text-slate-200"}`}>{m.nombre}</span>
                        </div>
                        <span className={`sm:hidden mt-0.5 inline-flex text-[10px] px-1.5 py-0.5 rounded border ${CATEGORIA_BADGE[m.categoria]}`}>
                          {CATEGORIA_LABEL[m.categoria]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${CATEGORIA_BADGE[m.categoria]}`}>
                          {CATEGORIA_LABEL[m.categoria]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCantidad(m, -1)}
                            className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            −
                          </button>
                          <span className={`w-8 text-center font-bold tabular-nums ${bajo ? "text-amber-400" : "text-slate-200"}`}>
                            {m.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCantidad(m, +1)}
                            className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        {m.minimo > 0 && (
                          <p className="text-center text-[10px] text-slate-600 mt-0.5">mín. {m.minimo}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell max-w-[160px] truncate">
                        {m.notas ?? "—"}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setFormMode({ type: "edit", item: m })}
                            aria-label="Editar"
                            className="text-slate-600 hover:text-emerald-400 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            aria-label="Eliminar"
                            className="text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
