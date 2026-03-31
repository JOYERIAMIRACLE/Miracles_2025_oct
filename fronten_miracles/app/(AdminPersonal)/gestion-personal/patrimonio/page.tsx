"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

import { useGetActivos }   from "@/api/activo/getActivos"
import { createActivo }    from "@/api/activo/createActivo"
import { updateActivo }    from "@/api/activo/updateActivo"
import { deleteActivo }    from "@/api/activo/deleteActivo"

import { useGetPasivos }   from "@/api/pasivo/getPasivos"
import { createPasivo }    from "@/api/pasivo/createPasivo"
import { updatePasivo }    from "@/api/pasivo/updatePasivo"
import { deletePasivo }    from "@/api/pasivo/deletePasivo"

import { useGetPrestamos } from "@/api/prestamo-otorgado/getPrestamos"
import { createPrestamo }  from "@/api/prestamo-otorgado/createPrestamo"
import { updatePrestamo }  from "@/api/prestamo-otorgado/updatePrestamo"
import { deletePrestamo }  from "@/api/prestamo-otorgado/deletePrestamo"

import { ActivoType, ActivoPayload, CategoriaActivo }    from "@/types/activo"
import { PasivoType, PasivoPayload, CategoriaPasivo }    from "@/types/pasivo"
import { PrestamoOtorgadoType, PrestamoOtorgadoPayload } from "@/types/prestamo-otorgado"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const CAT_ACTIVO_LABEL: Record<string, string> = {
  efectivo:      "Efectivo / Banco",
  inversion:     "Inversión",
  bien_inmueble: "Bien Inmueble",
  vehiculo:      "Vehículo",
  otros:         "Otros",
}

const CAT_PASIVO_LABEL: Record<string, string> = {
  tdc:              "Tarjeta de Crédito",
  credito_personal: "Crédito Personal",
  hipoteca:         "Hipoteca",
  automotriz:       "Automotriz",
  educativo:        "Educativo",
  otros:            "Otros",
}

const inputCls  = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
const selectCls = `${inputCls} cursor-pointer`

type Tab = "activos" | "pasivos" | "prestamos"

// ─── Componente fila de tabla genérico ────────────────────────────────────────
function FilaSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PatrimonioPage() {
  const [tab, setTab] = useState<Tab>("activos")

  // Datos
  const { activos:   dataActivos,   loading: loadA } = useGetActivos()
  const { pasivos:   dataPasivos,   loading: loadP } = useGetPasivos()
  const { prestamos: dataPrestamos, loading: loadR } = useGetPrestamos()

  const [activos,   setActivos]   = useState<ActivoType[]>([])
  const [pasivos,   setPasivos]   = useState<PasivoType[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoOtorgadoType[]>([])

  useEffect(() => { setActivos(dataActivos     ?? []) }, [dataActivos])
  useEffect(() => { setPasivos(dataPasivos     ?? []) }, [dataPasivos])
  useEffect(() => { setPrestamos(dataPrestamos ?? []) }, [dataPrestamos])

  // Modal
  const [modalOpen,      setModalOpen]      = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Forms
  const emptyActivo:   ActivoPayload            = { nombre: "", categoria: null, valor: null, descripcion: null }
  const emptyPasivo:   PasivoPayload            = { nombre: "", categoria: null, saldo: null, tasa_interes: null, dia_corte: null, descripcion: null }
  const emptyPrestamo: PrestamoOtorgadoPayload  = { beneficiario: "", monto_original: 0, saldo_pendiente: 0, fecha_inicio: null, fecha_vencimiento: null, tasa_interes: null, estado: "activo", notas: null }

  const [editingActivo,   setEditingActivo]   = useState<ActivoType | null>(null)
  const [editingPasivo,   setEditingPasivo]   = useState<PasivoType | null>(null)
  const [editingPrestamo, setEditingPrestamo] = useState<PrestamoOtorgadoType | null>(null)

  const [formActivo,   setFormActivo]   = useState<ActivoPayload>(emptyActivo)
  const [formPasivo,   setFormPasivo]   = useState<PasivoPayload>(emptyPasivo)
  const [formPrestamo, setFormPrestamo] = useState<PrestamoOtorgadoPayload>(emptyPrestamo)

  // ─── Cálculos de balance ─────────────────────────────────────────────────
  const totalActivos   = activos.reduce((s, a) => s + (a.valor ?? 0), 0)
  const totalPrestamos = prestamos.filter(p => p.estado === "activo").reduce((s, p) => s + (p.saldo_pendiente ?? 0), 0)
  const totalPasivos   = pasivos.reduce((s, p) => s + (p.saldo ?? 0), 0)
  const patrimonio     = totalActivos + totalPrestamos - totalPasivos

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleNuevo = () => {
    if (tab === "activos")   { setEditingActivo(null);   setFormActivo(emptyActivo) }
    if (tab === "pasivos")   { setEditingPasivo(null);   setFormPasivo(emptyPasivo) }
    if (tab === "prestamos") { setEditingPrestamo(null); setFormPrestamo(emptyPrestamo) }
    setModalOpen(true)
  }

  const handleEditActivo = (a: ActivoType) => {
    setEditingActivo(a)
    setFormActivo({ nombre: a.nombre, categoria: a.categoria, valor: a.valor, descripcion: a.descripcion })
    setModalOpen(true)
  }
  const handleEditPasivo = (p: PasivoType) => {
    setEditingPasivo(p)
    setFormPasivo({ nombre: p.nombre, categoria: p.categoria, saldo: p.saldo, tasa_interes: p.tasa_interes, dia_corte: p.dia_corte, descripcion: p.descripcion })
    setModalOpen(true)
  }
  const handleEditPrestamo = (p: PrestamoOtorgadoType) => {
    setEditingPrestamo(p)
    setFormPrestamo({ beneficiario: p.beneficiario, monto_original: p.monto_original, saldo_pendiente: p.saldo_pendiente, fecha_inicio: p.fecha_inicio, fecha_vencimiento: p.fecha_vencimiento, tasa_interes: p.tasa_interes, estado: p.estado, notas: p.notas })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (tab === "activos") {
        if (!formActivo.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
        if (editingActivo) {
          const u = await updateActivo(editingActivo.documentId, formActivo)
          setActivos(prev => prev.map(a => a.documentId === u.documentId ? u : a))
          toast.success("Activo actualizado")
        } else {
          const n = await createActivo(formActivo)
          setActivos(prev => [...prev, n])
          toast.success("Activo creado")
        }
      }
      if (tab === "pasivos") {
        if (!formPasivo.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
        if (editingPasivo) {
          const u = await updatePasivo(editingPasivo.documentId, formPasivo)
          setPasivos(prev => prev.map(p => p.documentId === u.documentId ? u : p))
          toast.success("Pasivo actualizado")
        } else {
          const n = await createPasivo(formPasivo)
          setPasivos(prev => [...prev, n])
          toast.success("Pasivo creado")
        }
      }
      if (tab === "prestamos") {
        if (!formPrestamo.beneficiario.trim()) { toast.error("El beneficiario es obligatorio"); return }
        if (editingPrestamo) {
          const u = await updatePrestamo(editingPrestamo.documentId, formPrestamo)
          setPrestamos(prev => prev.map(p => p.documentId === u.documentId ? u : p))
          toast.success("Préstamo actualizado")
        } else {
          const n = await createPrestamo(formPrestamo)
          setPrestamos(prev => [...prev, n])
          toast.success("Préstamo creado")
        }
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
      if (tab === "activos")   { await deleteActivo(documentId);   setActivos(prev => prev.filter(a => a.documentId !== documentId)) }
      if (tab === "pasivos")   { await deletePasivo(documentId);   setPasivos(prev => prev.filter(p => p.documentId !== documentId)) }
      if (tab === "prestamos") { await deletePrestamo(documentId); setPrestamos(prev => prev.filter(p => p.documentId !== documentId)) }
      toast.success("Eliminado correctamente")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const tabLabel = { activos: "Activo", pasivos: "Pasivo", prestamos: "Préstamo" }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Balance general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Activos",     value: totalActivos,             color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Cuentas por Cobrar",value: totalPrestamos,           color: "text-blue-600 dark:text-blue-400" },
          { label: "Total Pasivos",     value: totalPasivos,             color: "text-red-500 dark:text-red-400" },
          { label: "Patrimonio Neto",   value: patrimonio,               color: patrimonio >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400" },
        ].map(k => (
          <Card key={k.label} className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{fmt(k.value)}</p>
          </Card>
        ))}
      </div>

      {/* Tabs + botón */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {(["activos", "pasivos", "prestamos"] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setConfirmDeleteId(null) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
              {t === "activos" ? "Activos" : t === "pasivos" ? "Pasivos" : "Préstamos"}
            </button>
          ))}
        </div>
        <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full">
          <Plus className="h-4 w-4" /> Nuevo {tabLabel[tab]}
        </Button>
      </div>

      {/* ── TAB: ACTIVOS ──────────────────────────────────────────────────── */}
      {tab === "activos" && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden rounded-xl">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoría</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descripción</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor</th>
                  <th className="h-10 px-4" scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {loadA && <FilaSkeleton cols={5} />}
                {!loadA && activos.map(a => (
                  <tr key={a.documentId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{a.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{CAT_ACTIVO_LABEL[a.categoria ?? ""] ?? a.categoria ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{a.descripcion ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(a.valor)}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmDeleteId === a.documentId ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-zinc-400">¿Eliminar?</span>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600" onClick={() => handleDelete(a.documentId)}>Sí</Button>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDeleteId(null)}>No</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-indigo-600" onClick={() => handleEditActivo(a)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDeleteId(a.documentId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadA && activos.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">Sin activos registrados.</p>}
          </div>
        </Card>
      )}

      {/* ── TAB: PASIVOS ──────────────────────────────────────────────────── */}
      {tab === "pasivos" && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden rounded-xl">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoría</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Saldo</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tasa %</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Día corte</th>
                  <th className="h-10 px-4" scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {loadP && <FilaSkeleton cols={6} />}
                {!loadP && pasivos.map(p => (
                  <tr key={p.documentId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{p.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{CAT_PASIVO_LABEL[p.categoria ?? ""] ?? p.categoria ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400">{fmt(p.saldo)}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">{p.tasa_interes != null ? `${p.tasa_interes}%` : "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">{p.dia_corte ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmDeleteId === p.documentId ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-zinc-400">¿Eliminar?</span>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600" onClick={() => handleDelete(p.documentId)}>Sí</Button>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDeleteId(null)}>No</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-indigo-600" onClick={() => handleEditPasivo(p)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDeleteId(p.documentId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadP && pasivos.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">Sin pasivos registrados.</p>}
          </div>
        </Card>
      )}

      {/* ── TAB: PRÉSTAMOS ────────────────────────────────────────────────── */}
      {tab === "prestamos" && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden rounded-xl">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Beneficiario</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Original</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pendiente</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tasa %</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Estado</th>
                  <th className="h-10 px-4" scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {loadR && <FilaSkeleton cols={7} />}
                {!loadR && prestamos.map(p => (
                  <tr key={p.documentId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{p.beneficiario}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">{fmt(p.monto_original)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{fmt(p.saldo_pendiente)}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">{p.tasa_interes != null ? `${p.tasa_interes}%` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{p.fecha_vencimiento ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        p.estado === "activo"    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                        p.estado === "liquidado" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
                        {p.estado ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmDeleteId === p.documentId ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-zinc-400">¿Eliminar?</span>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600" onClick={() => handleDelete(p.documentId)}>Sí</Button>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDeleteId(null)}>No</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-indigo-600" onClick={() => handleEditPrestamo(p)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDeleteId(p.documentId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadR && prestamos.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">Sin préstamos registrados.</p>}
          </div>
        </Card>
      )}

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {tab === "activos"   ? (editingActivo   ? "Editar Activo"   : "Nuevo Activo")   : ""}
                {tab === "pasivos"   ? (editingPasivo   ? "Editar Pasivo"   : "Nuevo Pasivo")   : ""}
                {tab === "prestamos" ? (editingPrestamo ? "Editar Préstamo" : "Nuevo Préstamo") : ""}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* FORM ACTIVO */}
              {tab === "activos" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Ej. BBVA, Auto, Casa..." value={formActivo.nombre}
                      onChange={e => setFormActivo(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                    <select title="Categoría" value={formActivo.categoria ?? ""} onChange={e => setFormActivo(f => ({ ...f, categoria: (e.target.value || null) as CategoriaActivo | null }))} className={selectCls}>
                      <option value="">— Sin categoría —</option>
                      {Object.entries(CAT_ACTIVO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Valor ($)</label>
                    <input type="number" placeholder="0.00" value={formActivo.valor ?? ""}
                      onChange={e => setFormActivo(f => ({ ...f, valor: e.target.value ? Number(e.target.value) : null }))} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
                    <input type="text" placeholder="Notas opcionales..." value={formActivo.descripcion ?? ""}
                      onChange={e => setFormActivo(f => ({ ...f, descripcion: e.target.value || null }))} className={inputCls} />
                  </div>
                </>
              )}

              {/* FORM PASIVO */}
              {tab === "pasivos" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Ej. BBVA TDC, Crédito Personal..." value={formPasivo.nombre}
                      onChange={e => setFormPasivo(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                    <select title="Categoría" value={formPasivo.categoria ?? ""} onChange={e => setFormPasivo(f => ({ ...f, categoria: (e.target.value || null) as CategoriaPasivo | null }))} className={selectCls}>
                      <option value="">— Sin categoría —</option>
                      {Object.entries(CAT_PASIVO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Saldo ($)</label>
                      <input type="number" placeholder="0.00" value={formPasivo.saldo ?? ""}
                        onChange={e => setFormPasivo(f => ({ ...f, saldo: e.target.value ? Number(e.target.value) : null }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tasa interés (%)</label>
                      <input type="number" placeholder="0.00" step="0.01" value={formPasivo.tasa_interes ?? ""}
                        onChange={e => setFormPasivo(f => ({ ...f, tasa_interes: e.target.value ? Number(e.target.value) : null }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Día de corte</label>
                    <input type="number" placeholder="Ej. 15" min={1} max={31} value={formPasivo.dia_corte ?? ""}
                      onChange={e => setFormPasivo(f => ({ ...f, dia_corte: e.target.value ? Number(e.target.value) : null }))} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
                    <input type="text" placeholder="Notas opcionales..." value={formPasivo.descripcion ?? ""}
                      onChange={e => setFormPasivo(f => ({ ...f, descripcion: e.target.value || null }))} className={inputCls} />
                  </div>
                </>
              )}

              {/* FORM PRÉSTAMO */}
              {tab === "prestamos" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Beneficiario <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Nombre de quien recibió el préstamo" value={formPrestamo.beneficiario}
                      onChange={e => setFormPrestamo(f => ({ ...f, beneficiario: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Monto original ($)</label>
                      <input type="number" placeholder="0.00" value={formPrestamo.monto_original || ""}
                        onChange={e => setFormPrestamo(f => ({ ...f, monto_original: Number(e.target.value) }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Saldo pendiente ($)</label>
                      <input type="number" placeholder="0.00" value={formPrestamo.saldo_pendiente || ""}
                        onChange={e => setFormPrestamo(f => ({ ...f, saldo_pendiente: Number(e.target.value) }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha inicio</label>
                      <input type="date" title="Fecha inicio" value={formPrestamo.fecha_inicio ?? ""}
                        onChange={e => setFormPrestamo(f => ({ ...f, fecha_inicio: e.target.value || null }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha vencimiento</label>
                      <input type="date" title="Fecha vencimiento" value={formPrestamo.fecha_vencimiento ?? ""}
                        onChange={e => setFormPrestamo(f => ({ ...f, fecha_vencimiento: e.target.value || null }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tasa interés (%)</label>
                      <input type="number" placeholder="0" step="0.01" value={formPrestamo.tasa_interes ?? ""}
                        onChange={e => setFormPrestamo(f => ({ ...f, tasa_interes: e.target.value ? Number(e.target.value) : null }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
                      <select title="Estado" value={formPrestamo.estado ?? "activo"} onChange={e => setFormPrestamo(f => ({ ...f, estado: e.target.value as any }))} className={selectCls}>
                        <option value="activo">Activo</option>
                        <option value="liquidado">Liquidado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Notas</label>
                    <input type="text" placeholder="Notas opcionales..." value={formPrestamo.notas ?? ""}
                      onChange={e => setFormPrestamo(f => ({ ...f, notas: e.target.value || null }))} className={inputCls} />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
