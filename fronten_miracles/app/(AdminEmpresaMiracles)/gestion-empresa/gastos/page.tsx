"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useGetGastos } from "@/api/gasto/getGastos"
import { createGasto } from "@/api/gasto/createGasto"
import { updateGasto } from "@/api/gasto/updateGasto"
import { deleteGasto } from "@/api/gasto/deleteGasto"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { useGetCentrosCosto } from "@/api/centro-costo/getCentrosCosto"
import { GastoType, GastoPayload } from "@/types/gasto"

const emptyForm: GastoPayload = {
  concepto: "",
  monto: null,
  fecha: null,
  cuenta: null,
  centro_costo: null,
  notas: null,
}

const inputClass = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
const selectClass = `${inputClass} cursor-pointer`

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

export default function GastosPage() {
  // 1. HOOKS
  const { gastos: dataStrapi, loading, error } = useGetGastos()
  const { cuentas }       = useGetCuentas()
  const { centrosCosto }  = useGetCentrosCosto()

  const [gastos, setGastos]                   = useState<GastoType[]>([])
  const [search, setSearch]                   = useState("")
  const [periodo, setPeriodo]                 = useState<"todo" | "mes" | "anio" | "custom">("mes")
  const [fechaDesde, setFechaDesde]           = useState("")
  const [fechaHasta, setFechaHasta]           = useState("")
  const [modalOpen, setModalOpen]             = useState(false)
  const [editing, setEditing]                 = useState<GastoType | null>(null)
  const [form, setForm]                       = useState<GastoPayload>(emptyForm)
  const [saving, setSaving]                   = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { setGastos(dataStrapi ?? []) }, [dataStrapi])

  // 2. LOGS
  if (process.env.NODE_ENV === "development") {}

  // ─── Rango de fechas según periodo ─────────────────────────────────────────
  const getRango = () => {
    const hoy   = new Date()
    const hasta = hoy.toISOString().split("T")[0]
    if (periodo === "mes")  return { desde: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`, hasta }
    if (periodo === "anio") return { desde: `${hoy.getFullYear()}-01-01`, hasta }
    if (periodo === "custom") return { desde: fechaDesde, hasta: fechaHasta }
    return { desde: "", hasta: "" }
  }

  const { desde, hasta } = getRango()

  const filtered = gastos.filter(g => {
    const matchSearch = g.concepto.toLowerCase().includes(search.toLowerCase()) ||
      (g.cuenta?.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.centro_costo?.nombre ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFecha = !desde || !hasta || !g.fecha ? true : g.fecha >= desde && g.fecha <= hasta
    return matchSearch && matchFecha
  })

  const totalGastos = filtered.reduce((sum, g) => sum + (g.monto ?? 0), 0)

  const handleNuevo = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const handleEdit = (g: GastoType) => {
    setEditing(g)
    setForm({
      concepto:     g.concepto,
      monto:        g.monto,
      fecha:        g.fecha,
      cuenta:       g.cuenta?.documentId ?? null,
      centro_costo: g.centro_costo?.documentId ?? null,
      notas:        g.notas,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.concepto.trim()) { toast.error("El concepto es obligatorio"); return }
    if (!form.monto)           { toast.error("El monto es obligatorio"); return }
    if (!form.fecha)           { toast.error("La fecha es obligatoria"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateGasto(editing.documentId, form)
        setGastos(prev => prev.map(g => g.documentId === updated.documentId ? updated : g))
        toast.success("Gasto actualizado")
      } else {
        const nuevo = await createGasto(form)
        setGastos(prev => [...prev, nuevo])
        toast.success("Gasto registrado")
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deleteGasto(documentId)
      setGastos(prev => prev.filter(g => g.documentId !== documentId))
      toast.success("Gasto eliminado")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  // 3. GUARDS
  if (error) return <div className="flex items-center justify-center min-h-[400px] text-sm text-red-500">Error: {error}</div>

  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">

      {/* ── Resumen ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Gastos</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalGastos)}</p>
        </Card>
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Registros</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{filtered.length}</p>
        </Card>
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Promedio por Gasto</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {fmt(filtered.length > 0 ? totalGastos / filtered.length : null)}
          </p>
        </Card>
      </div>

      {/* ── Filtro de periodo ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {(["todo", "mes", "anio", "custom"] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-all ${
              periodo === p
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            {p === "todo" ? "Todo" : p === "mes" ? "Este mes" : p === "anio" ? "Este año" : "Personalizado"}
          </button>
        ))}
        {periodo === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <input type="date" title="Fecha desde" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-zinc-400 text-xs">—</span>
            <input type="date" title="Fecha hasta" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
      </div>

      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gastos</h1>
          <p className="text-sm text-zinc-500">Registra y categoriza todos tus egresos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Buscar gasto..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 w-[200px] lg:w-[280px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
          <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all">
            <Plus className="h-4 w-4" /> Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Concepto</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Fecha</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Centro de Costo</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Cuenta</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Monto</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="p-5"><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtered.map(g => (
                <tr key={g.documentId} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default">
                  <td className="p-5 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{g.concepto}</div>
                    {g.notas && <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[180px]">{g.notas}</div>}
                  </td>
                  <td className="p-5 align-middle text-sm text-zinc-600 dark:text-zinc-400">{g.fecha ?? "—"}</td>
                  <td className="p-5 align-middle">
                    {g.centro_costo ? (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        {g.centro_costo.nombre}
                      </span>
                    ) : <span className="text-zinc-400 text-xs">—</span>}
                  </td>
                  <td className="p-5 align-middle text-sm text-zinc-600 dark:text-zinc-400">{g.cuenta?.nombre ?? "—"}</td>
                  <td className="p-5 align-middle text-right font-semibold text-red-600 dark:text-red-400">{fmt(g.monto)}</td>
                  <td className="p-5 align-middle text-right">
                    {confirmDeleteId === g.documentId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-500">¿Eliminar?</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(g.documentId)}>Sí</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:bg-zinc-100" onClick={() => setConfirmDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" onClick={() => handleEdit(g)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => setConfirmDeleteId(g.documentId)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {search ? `Sin resultados para "${search}"` : "No hay gastos registrados."}
            </div>
          )}
        </div>
      </Card>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{editing ? "Editar Gasto" : "Registrar Gasto"}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Concepto <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Materiales para producción" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Monto ($) <span className="text-red-500">*</span></label>
                  <input type="number" placeholder="0.00" value={form.monto ?? ""} onChange={e => setForm(f => ({ ...f, monto: e.target.value ? Number(e.target.value) : null }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha <span className="text-red-500">*</span></label>
                  <input type="date" value={form.fecha ?? ""} onChange={e => setForm(f => ({ ...f, fecha: e.target.value || null }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cuenta</label>
                  <select title="Cuenta del gasto" value={form.cuenta ?? ""} onChange={e => setForm(f => ({ ...f, cuenta: e.target.value || null }))} className={selectClass}>
                    <option value="">— Sin cuenta —</option>
                    {cuentas.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Centro de Costo</label>
                  <select title="Centro de costo del gasto" value={form.centro_costo ?? ""} onChange={e => setForm(f => ({ ...f, centro_costo: e.target.value || null }))} className={selectClass}>
                    <option value="">— Sin categoría —</option>
                    {centrosCosto.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Notas</label>
                <input type="text" placeholder="Observaciones opcionales..." value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} className={inputClass} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar cambios" : "Registrar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
