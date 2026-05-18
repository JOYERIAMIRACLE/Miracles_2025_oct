"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X, Pencil, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useGetGastos }  from "@/api/gasto/getGastos"
import { createGasto }   from "@/api/gasto/createGasto"
import { updateGasto }   from "@/api/gasto/updateGasto"
import { deleteGasto }   from "@/api/gasto/deleteGasto"
import { GastoType, GastoPayload } from "@/types/gasto"

const fmt = (n: number | null) => n != null ? `$${Math.round(n).toLocaleString("es-MX")}` : "—"
const fmtFecha = (iso: string | null) =>
  iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }) : "—"

function emptyForm(): GastoPayload {
  return { concepto: "", monto: null, fecha: new Date().toISOString().split("T")[0], cuenta: null, centro_costo: null, notas: null }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"

export function GastosEmpresaView() {
  const { gastos: raw, loading } = useGetGastos()

  const [gastos,    setGastos]    = useState<GastoType[]>([])
  const [search,    setSearch]    = useState("")
  const [periodo,   setPeriodo]   = useState<"mes" | "todo">("mes")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<GastoType | null>(null)
  const [form,      setForm]      = useState<GastoPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  useMemo(() => { setGastos(raw ?? []) }, [raw])

  const hoy    = new Date()
  const mesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const filtrados = useMemo(() => {
    return gastos
      .filter(g => {
        const matchSearch = !search || g.concepto.toLowerCase().includes(search.toLowerCase())
        const matchPeriodo = periodo === "todo" || (g.fecha?.startsWith(mesStr) ?? false)
        return matchSearch && matchPeriodo
      })
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
  }, [gastos, search, periodo, mesStr])

  const totalFiltrado = filtrados.reduce((s, g) => s + (g.monto ?? 0), 0)

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(g: GastoType) {
    setEditing(g)
    setForm({ concepto: g.concepto, monto: g.monto, fecha: g.fecha, cuenta: null, centro_costo: null, notas: g.notas })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateGasto(editing.documentId, form)
        setGastos(prev => prev.map(g => g.documentId === updated.documentId ? updated : g))
        toast.success("Gasto actualizado")
      } else {
        const nuevo = await createGasto(form)
        setGastos(prev => [nuevo, ...prev])
        toast.success("Gasto registrado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteGasto(documentId)
      setGastos(prev => prev.filter(g => g.documentId !== documentId))
      toast.success("Gasto eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total filtrado",      value: fmt(totalFiltrado),    color: "text-red-400" },
          { label: "Registros",           value: filtrados.length,      color: "text-slate-200" },
          { label: "Gasto este mes",      value: fmt(gastos.filter(g => g.fecha?.startsWith(mesStr)).reduce((s, g) => s + (g.monto ?? 0), 0)), color: "text-amber-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar gasto…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div className="flex gap-1">
          {([["mes", "Este mes"], ["todo", "Todos"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setPeriodo(key)}
              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                periodo === key ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo gasto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Concepto", "Fecha", "Notas", "Monto", ""].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(g => (
                <tr key={g.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3 font-medium text-slate-200">{g.concepto}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtFecha(g.fecha)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{g.notas ?? "—"}</td>
                  <td className="px-4 py-3 text-red-400 font-semibold tabular-nums">{fmt(g.monto)}</td>
                  <td className="px-4 py-3">
                    {delId === g.documentId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleDelete(g.documentId)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelId(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-300">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEditar(g)}
                          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => setDelId(g.documentId)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtrados.length === 0 && (
            <div className="py-14 text-center text-slate-600">
              <Wallet size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? "Sin resultados." : "Sin gastos registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar gasto" : "Nuevo gasto"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Concepto <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Boost de publicación Instagram" value={form.concepto}
                  onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Monto ($)</label>
                  <input type="number" placeholder="0" value={form.monto ?? ""}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value ? Number(e.target.value) : null }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={form.fecha ?? ""}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value || null }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <input type="text" placeholder="Descripción adicional…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
