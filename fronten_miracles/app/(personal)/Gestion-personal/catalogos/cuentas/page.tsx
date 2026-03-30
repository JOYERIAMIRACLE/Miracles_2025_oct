"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { useGetGastos } from "@/api/gasto/getGastos"
import { useGetVentas } from "@/api/venta/getVentas"
import { createCuenta } from "@/api/cuenta/createCuenta"
import { updateCuenta } from "@/api/cuenta/updateCuenta"
import { deleteCuenta } from "@/api/cuenta/deleteCuenta"
import { CuentaType, CuentaPayload } from "@/types/cuenta"

const emptyForm: CuentaPayload = {
  nombre: "",
  tipo: null,
  proposito: null,
  saldoInicial: null,
  metaDeCuenta: null,
  color: null,
  activa: true,
}

const getPropositoColor = (proposito: string | null) => {
  switch (proposito) {
    case "Operativa":    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
    case "Ahorro":       return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
    case "Inversión":    return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20"
    case "Apartado":     return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
    case "Presupuesto 1": return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
    default:             return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
  }
}

const inputClass = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
const selectClass = `${inputClass} cursor-pointer`

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"

export default function CuentasPage() {
  // 1. HOOKS
  const { cuentas: dataStrapi, loading, error } = useGetCuentas()
  const { gastos: dataGastos } = useGetGastos()
  const { ventas: dataVentas } = useGetVentas()
  const [cuentas, setCuentas]               = useState<CuentaType[]>([])
  const [search, setSearch]                 = useState("")
  const [modalOpen, setModalOpen]           = useState(false)
  const [editingCuenta, setEditingCuenta]   = useState<CuentaType | null>(null)
  const [form, setForm]                     = useState<CuentaPayload>(emptyForm)
  const [saving, setSaving]                 = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { setCuentas(dataStrapi ?? []) }, [dataStrapi])

  // 2. LOGS
  if (process.env.NODE_ENV === "development") {}

  // ─── Saldo actual por cuenta ─────────────────────────────────────────────
  const calcSaldoActual = (cuentaDocId: string, saldoIni: number) => {
    const gastos = dataGastos ?? []
    const ventas = dataVentas ?? []
    const ingresos = ventas
      .filter(v => v.cuenta?.documentId === cuentaDocId && v.estado !== "Cancelado")
      .reduce((s, v) => s + (v.monto ?? 0), 0)
    const egresos = gastos
      .filter(g => g.cuenta?.documentId === cuentaDocId)
      .reduce((s, g) => s + (g.monto ?? 0), 0)
    return saldoIni + ingresos - egresos
  }

  const filtered = cuentas.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const totalPorProposito = (proposito: string) =>
    cuentas
      .filter(c => c.proposito === proposito && c.activa)
      .reduce((sum, c) => sum + calcSaldoActual(c.documentId, c.saldoInicial ?? 0), 0)

  const handleNuevo = () => { setEditingCuenta(null); setForm(emptyForm); setModalOpen(true) }

  const handleEdit = (cuenta: CuentaType) => {
    setEditingCuenta(cuenta)
    setForm({ nombre: cuenta.nombre, tipo: cuenta.tipo, proposito: cuenta.proposito, saldoInicial: cuenta.saldoInicial, metaDeCuenta: cuenta.metaDeCuenta, color: cuenta.color, activa: cuenta.activa })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editingCuenta) {
        const updated = await updateCuenta(editingCuenta.documentId, form)
        setCuentas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Cuenta actualizada")
      } else {
        const nueva = await createCuenta(form)
        setCuentas(prev => [...prev, nueva])
        toast.success("Cuenta creada")
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
      await deleteCuenta(documentId)
      setCuentas(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Cuenta eliminada")
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

      {/* ── Tarjetas resumen por propósito ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["Operativa", "Ahorro", "Inversión", "Apartado"] as const).map(p => (
          <Card key={p} className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{p}</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{fmt(totalPorProposito(p))}</p>
          </Card>
        ))}
      </div>

      {/* ── Encabezado y acciones ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cuentas</h1>
          <p className="text-sm text-zinc-500">Administra tus cuentas y el capital por propósito.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Buscar cuenta..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 w-[200px] lg:w-[260px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
          <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all">
            <Plus className="h-4 w-4" /> Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Cuenta</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Tipo</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Propósito</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Saldo Actual</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Meta</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="p-5"><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtered.map(cuenta => (
                <tr key={cuenta.documentId} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default">
                  <td className="p-5 align-middle">
                    <div className="flex items-center gap-2">
                      {cuenta.color && <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cuenta.color }} />}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cuenta.nombre}</span>
                    </div>
                  </td>
                  <td className="p-5 align-middle text-sm text-zinc-600 dark:text-zinc-400">{cuenta.tipo ?? "—"}</td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getPropositoColor(cuenta.proposito)}`}>
                      {cuenta.proposito ?? "—"}
                    </span>
                  </td>
                  <td className="p-5 align-middle">
                    {(() => {
                      const saldoActual = calcSaldoActual(cuenta.documentId, cuenta.saldoInicial ?? 0)
                      const delta = saldoActual - (cuenta.saldoInicial ?? 0)
                      return (
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmt(saldoActual)}</p>
                          {delta !== 0 && (
                            <p className={`text-xs ${delta > 0 ? "text-emerald-500" : "text-red-400"}`}>
                              {delta > 0 ? "+" : ""}{fmt(delta)}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="p-5 align-middle text-sm text-zinc-600 dark:text-zinc-400">{fmt(cuenta.metaDeCuenta)}</td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${cuenta.activa ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"}`}>
                      {cuenta.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="p-5 align-middle text-right">
                    {confirmDeleteId === cuenta.documentId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-500">¿Eliminar?</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDelete(cuenta.documentId)}>Sí</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:bg-zinc-100" onClick={() => setConfirmDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" onClick={() => handleEdit(cuenta)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={() => setConfirmDeleteId(cuenta.documentId)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {search ? `Sin resultados para "${search}"` : "No hay cuentas registradas."}
            </div>
          )}
        </div>
      </Card>

      {/* ── Modal Crear / Editar ───────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. BBVA Débito" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
                  <select title="Tipo de cuenta" value={form.tipo ?? ""} onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as any }))} className={selectClass}>
                    <option value="">— Sin tipo —</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Crédito">Crédito</option>
                    <option value="Debito">Débito</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Propósito</label>
                  <select title="Propósito de la cuenta" value={form.proposito ?? ""} onChange={e => setForm(f => ({ ...f, proposito: (e.target.value || null) as any }))} className={selectClass}>
                    <option value="">— Sin propósito —</option>
                    <option value="Operativa">Operativa</option>
                    <option value="Ahorro">Ahorro</option>
                    <option value="Inversión">Inversión</option>
                    <option value="Apartado">Apartado</option>
                    <option value="Presupuesto 1">Presupuesto</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Saldo Inicial ($)</label>
                  <input type="number" placeholder="0.00" value={form.saldoInicial ?? ""} onChange={e => setForm(f => ({ ...f, saldoInicial: e.target.value ? Number(e.target.value) : null }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meta ($)</label>
                  <input type="number" placeholder="0.00" value={form.metaDeCuenta ?? ""} onChange={e => setForm(f => ({ ...f, metaDeCuenta: e.target.value ? Number(e.target.value) : null }))} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Color (hex)</label>
                <input type="text" placeholder="#6366f1" value={form.color ?? ""} onChange={e => setForm(f => ({ ...f, color: e.target.value || null }))} className={inputClass} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activa" checked={form.activa ?? true} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="activa" className="text-sm text-zinc-700 dark:text-zinc-300">Cuenta activa</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCuenta ? "Guardar cambios" : "Crear Cuenta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
