"use client"

import { useState, useMemo } from "react"
import { Plus, X, AlertTriangle, Pencil, Archive, Loader2 } from "lucide-react"
import { toast } from "sonner"
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

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"

export function PromocionalesView() {
  const { materiales, setMateriales, loading } = useGetMaterialesTrabajo()

  const [filtro,    setFiltro]    = useState<CategoriaMaterial | "todos">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<MaterialTrabajoType | null>(null)
  const [form,      setForm]      = useState<MaterialTrabajoPayload>({ nombre: "", categoria: "otro", cantidad: 0, minimo: 0, notas: null })
  const [saving,    setSaving]    = useState(false)

  const filtrados = useMemo(() =>
    filtro === "todos" ? materiales : materiales.filter(m => m.categoria === filtro),
    [materiales, filtro]
  )

  const stats = useMemo(() => ({
    total:  materiales.length,
    piezas: materiales.reduce((s, m) => s + m.cantidad, 0),
    bajos:  materiales.filter(m => m.cantidad <= m.minimo && m.minimo > 0).length,
  }), [materiales])

  function openNuevo() {
    setEditing(null)
    setForm({ nombre: "", categoria: "otro", cantidad: 0, minimo: 0, notas: null })
    setModalOpen(true)
  }
  function openEditar(m: MaterialTrabajoType) {
    setEditing(m)
    setForm({ nombre: m.nombre, categoria: m.categoria, cantidad: m.cantidad, minimo: m.minimo, notas: m.notas })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const res = await updateMaterialTrabajo(editing.documentId, form)
        if (res?.data) setMateriales(prev => prev.map(x => x.documentId === editing.documentId ? res.data : x))
        toast.success("Material actualizado")
      } else {
        const res = await createMaterialTrabajo(form)
        if (res?.data) setMateriales(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Material creado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleCantidad(m: MaterialTrabajoType, delta: number) {
    const nueva = Math.max(0, m.cantidad + delta)
    await updateMaterialTrabajo(m.documentId, { cantidad: nueva })
    setMateriales(prev => prev.map(x => x.documentId === m.documentId ? { ...x, cantidad: nueva } : x))
  }

  async function handleDelete(m: MaterialTrabajoType) {
    try {
      await deleteMaterialTrabajo(m.documentId)
      setMateriales(prev => prev.filter(x => x.documentId !== m.documentId))
      toast.success("Material eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Items",      value: stats.total,  color: "text-slate-200" },
          { label: "Piezas",     value: stats.piezas, color: "text-blue-400" },
          { label: "Stock bajo", value: stats.bajos,  color: stats.bajos > 0 ? "text-amber-400" : "text-slate-500" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["todos", "promocional", "folleto", "camisa", "otro"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltro(f)}
              className={`h-7 px-3 text-xs rounded-lg border transition-colors ${
                filtro === f
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {f === "todos" ? `Todos (${materiales.length})` : `${CATEGORIA_LABEL[f as CategoriaMaterial]} (${materiales.filter(m => m.categoria === f).length})`}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo item
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/50">
            <tr>
              {["Nombre", "Categoría", "Cantidad", "Notas", ""].map(h => (
                <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
              ))}</tr>
            ))}
            {!loading && filtrados.map(m => {
              const bajo = m.minimo > 0 && m.cantidad <= m.minimo
              return (
                <tr key={m.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {bajo && <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
                      <span className={`font-medium ${bajo ? "text-amber-200" : "text-slate-200"}`}>{m.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${CATEGORIA_BADGE[m.categoria]}`}>
                      {CATEGORIA_LABEL[m.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleCantidad(m, -1)}
                        className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold transition-colors">−</button>
                      <span className={`w-7 text-center font-bold tabular-nums ${bajo ? "text-amber-400" : "text-slate-200"}`}>{m.cantidad}</span>
                      <button type="button" onClick={() => handleCantidad(m, +1)}
                        className="h-6 w-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold transition-colors">+</button>
                    </div>
                    {m.minimo > 0 && <p className="text-[10px] text-slate-600 mt-0.5 ml-8">mín. {m.minimo}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{m.notas ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => openEditar(m)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={13} /></button>
                      <button type="button" onClick={() => handleDelete(m)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><X size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && filtrados.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <Archive size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin materiales registrados.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar material" : "Nuevo material"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Flyer A5 temporada" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaMaterial }))}
                  className={inp + " cursor-pointer"}>
                  {(Object.keys(CATEGORIA_LABEL) as CategoriaMaterial[]).map(c => (
                    <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Cantidad</label>
                  <input type="number" min={0} value={form.cantidad ?? 0}
                    onChange={e => setForm(f => ({ ...f, cantidad: Number(e.target.value) || 0 }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Mínimo (alerta)</label>
                  <input type="number" min={0} value={form.minimo ?? 0}
                    onChange={e => setForm(f => ({ ...f, minimo: Number(e.target.value) || 0 }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <input type="text" placeholder="Descripción…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
