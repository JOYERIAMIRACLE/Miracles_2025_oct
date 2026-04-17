"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, X, Loader2, Target, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

import { useGetMetas }    from "@/api/meta-ahorro/getMetas"
import { createMeta }     from "@/api/meta-ahorro/createMeta"
import { updateMeta }     from "@/api/meta-ahorro/updateMeta"
import { deleteMeta }     from "@/api/meta-ahorro/deleteMeta"
import { useGetPartidas }      from "@/api/partida-presupuesto/getPartidas"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { createTransaccion }   from "@/api/transaccion/createTransaccion"
import { useGetCuentas }       from "@/api/cuenta/getCuentas"

import { MetaAhorroType, MetaAhorroPayload, CategoriaMeta } from "@/types/meta-ahorro"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtK = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n).toLocaleString("es-MX")}`

function calcMensual(monto: number, frecuencia: string | null) {
  switch (frecuencia) {
    case "diario":    return monto * 30
    case "semanal":   return monto * 4.33
    case "quincenal": return monto * 2
    case "mensual":   return monto
    case "anual":     return monto / 12
    default:          return 0
  }
}

const CAT_LABEL: Record<CategoriaMeta, string> = {
  emergencia: "Fondo de Emergencia",
  viaje:      "Viaje",
  equipo:     "Equipo / Tecnología",
  inversion:  "Inversión",
  educacion:  "Educación",
  otros:      "Otros",
}

const CAT_COLOR: Record<CategoriaMeta, { bg: string; text: string; icon: string }> = {
  emergencia: { bg: "bg-red-50 dark:bg-red-500/10",     text: "text-red-600 dark:text-red-400",     icon: "🛡️" },
  viaje:      { bg: "bg-sky-50 dark:bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",     icon: "✈️" },
  equipo:     { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", icon: "💻" },
  inversion:  { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", icon: "📈" },
  educacion:  { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: "🎓" },
  otros:      { bg: "bg-zinc-100 dark:bg-zinc-800",     text: "text-zinc-600 dark:text-zinc-400",   icon: "🎯" },
}

const inputCls  = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
const selectCls = `${inputCls} cursor-pointer`

const EMPTY_FORM: MetaAhorroPayload = {
  nombre: "", monto_meta: 0, monto_actual: 0,
  fecha_objetivo: null, categoria: null, descripcion: null, activo: true,
}

// ─── Tarjeta de meta ──────────────────────────────────────────────────────────
function MetaCard({
  meta, ahorroMensual, cuentas,
  onEdit, onDelete, onAbonar,
}: {
  meta: MetaAhorroType
  ahorroMensual: number
  cuentas: { documentId: string; nombre: string }[]
  onEdit: () => void
  onDelete: () => void
  onAbonar: (monto: number, cuentaId: string | null) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [abonoOpen,     setAbonoOpen]     = useState(false)
  const [abono,         setAbono]         = useState<string>("")
  const [abonoCuenta,   setAbonoCuenta]   = useState<string | null>(null)
  const [savingAbono,   setSavingAbono]   = useState(false)

  const pct        = meta.monto_meta > 0 ? Math.min(100, (meta.monto_actual / meta.monto_meta) * 100) : 0
  const falta      = Math.max(0, meta.monto_meta - meta.monto_actual)
  const completado = pct >= 100
  const cat        = meta.categoria ?? "otros"
  const colors     = CAT_COLOR[cat] ?? CAT_COLOR.otros

  // Meses restantes al ritmo de ahorro actual
  const mesesRestantes = ahorroMensual > 0 && falta > 0
    ? Math.ceil(falta / ahorroMensual)
    : null

  // Fecha objetivo
  const fechaLabel = meta.fecha_objetivo
    ? new Date(meta.fecha_objetivo + "T00:00:00").toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : null

  // Meses hasta fecha objetivo
  const mesesHastaObjetivo = meta.fecha_objetivo ? (() => {
    const hoy = new Date()
    const obj  = new Date(meta.fecha_objetivo + "T00:00:00")
    const diff = (obj.getFullYear() - hoy.getFullYear()) * 12 + (obj.getMonth() - hoy.getMonth())
    return diff
  })() : null

  const handleAbonar = async () => {
    const monto = parseFloat(abono)
    if (isNaN(monto) || monto <= 0) { toast.error("Monto inválido"); return }
    setSavingAbono(true)
    try {
      onAbonar(monto, abonoCuenta)
      setAbonoOpen(false)
      setAbono("")
      setAbonoCuenta(null)
    } finally {
      setSavingAbono(false)
    }
  }

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden ${completado ? "ring-2 ring-emerald-400 dark:ring-emerald-500" : ""}`}>
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 ${completado ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{CAT_COLOR[cat]?.icon ?? "🎯"}</span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{meta.nombre}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{CAT_LABEL[cat]}</p>
            </div>
          </div>
          {completado
            ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            : (
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-indigo-600" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></Button>
                {confirmDelete
                  ? <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-400">¿Eliminar?</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600" onClick={onDelete}>Sí</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDelete(false)}>No</Button>
                    </div>
                  : <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDelete(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
                }
              </div>
            )
          }
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{fmt(meta.monto_actual)} ahorrado</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{Math.round(pct)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completado ? "bg-emerald-400" : pct > 75 ? "bg-indigo-500" : pct > 40 ? "bg-indigo-400" : "bg-indigo-300"} w-[var(--meta-pct)]`}
              style={{ "--meta-pct": `${pct}%` } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Meta: {fmt(meta.monto_meta)}</span>
            {!completado && <span className="text-zinc-400">Falta: <span className="font-medium text-zinc-600 dark:text-zinc-300">{fmtK(falta)}</span></span>}
          </div>
        </div>
      </div>

      {/* Info */}
      {!completado && (
        <div className="px-5 pb-4 space-y-2 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {mesesRestantes !== null && (
              <p className="text-xs text-zinc-500">
                Al ritmo actual:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {mesesRestantes === 1 ? "1 mes" : `${mesesRestantes} meses`}
                </span>
              </p>
            )}
            {fechaLabel && (
              <p className="text-xs text-zinc-500">
                Objetivo:{" "}
                <span className={`font-semibold ${mesesHastaObjetivo !== null && mesesHastaObjetivo < (mesesRestantes ?? 999) ? "text-red-500 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                  {fechaLabel}
                  {mesesHastaObjetivo !== null && mesesHastaObjetivo < (mesesRestantes ?? 999) && " ⚠️"}
                </span>
              </p>
            )}
          </div>
          {mesesHastaObjetivo !== null && mesesRestantes !== null && mesesHastaObjetivo < mesesRestantes && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Necesitas ahorrar {fmtK(Math.ceil(falta / Math.max(1, mesesHastaObjetivo)))}/mes para llegar a tiempo.
            </p>
          )}
          {meta.descripcion && <p className="text-xs text-zinc-400 italic">{meta.descripcion}</p>}
        </div>
      )}

      {/* Botón abonar */}
      {!completado && (
        <div className="px-5 pb-4">
          {abonoOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">$</span>
                <input
                  type="number" title="Monto del abono" placeholder="0.00" autoFocus
                  value={abono} onChange={e => setAbono(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAbonar(); if (e.key === "Escape") setAbonoOpen(false) }}
                  className="flex-1 h-8 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-zinc-800 px-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  title="Cuenta origen"
                  className="flex-1 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-700 dark:text-zinc-300"
                  value={abonoCuenta ?? ""}
                  onChange={e => setAbonoCuenta(e.target.value || null)}
                >
                  <option value="">Sin cuenta (solo meta)</option>
                  {cuentas.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                </select>
                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={handleAbonar} disabled={savingAbono}>
                  {savingAbono ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <></>}Abonar
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-zinc-400" onClick={() => setAbonoOpen(false)}>X</Button>
              </div>
              {abonoCuenta && <p className="text-[10px] text-cyan-500">→ Crea transacción de ahorro</p>}
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => setAbonoOpen(true)}>
              + Registrar abono
            </Button>
          )}
        </div>
      )}

      {completado && (
        <div className="px-5 pb-4 text-center">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">¡Meta alcanzada! 🎉</p>
        </div>
      )}
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MetasPage() {
  const { metas: dataMetas,       loading: loadM, error } = useGetMetas()
  const { partidas: dataPartidas, loading: loadP }        = useGetPartidas()
  const { transacciones: dataTx, setTransacciones, loading: loadR } = useGetTransacciones()
  const { cuentas } = useGetCuentas()
  const cuentasActivas = cuentas.filter(c => c.activa)

  const [metas,   setMetas]   = useState<MetaAhorroType[]>([])
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingMeta,  setEditingMeta]  = useState<MetaAhorroType | null>(null)
  const [form,         setForm]         = useState<MetaAhorroPayload>(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { setMetas(dataMetas ?? []) }, [dataMetas])

  // ─── Ritmo de ahorro mensual ──────────────────────────────────────────────
  // Calcula promedio de transacciones tipo transferencia/ahorro de últimos 3 meses
  // Si no hay transacciones, usa el presupuesto planeado
  const transacciones = dataTx ?? []
  const partidas      = dataPartidas ?? []

  const ahorroPlaneado = partidas
    .filter(p => p.activo !== false && p.tipo === "ahorro")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  const hoy = new Date()
  const ultimos3Meses = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

  const ahorrosPorMes = ultimos3Meses.map(mesKey => {
    return transacciones
      .filter(tx => tx.fecha.slice(0, 7) === mesKey && tx.categoria === "ahorro")
      .reduce((s, tx) => s + Number(tx.monto), 0)
  }).filter(m => m > 0)

  const ahorroPromedio = ahorrosPorMes.length > 0
    ? ahorrosPorMes.reduce((s, m) => s + m, 0) / ahorrosPorMes.length
    : ahorroPlaneado

  // ─── Total real ahorrado (desde transacciones) ─────────────────────────
  const totalAhorradoReal = transacciones
    .filter(tx => tx.categoria === "ahorro")
    .reduce((s, tx) => s + Number(tx.monto), 0)

  // ─── Resumen ──────────────────────────────────────────────────────────────
  const metasActivas    = metas.filter(m => m.activo !== false)
  // Distribuir ahorro real proporcionalmente entre metas activas
  const totalMetaObjetivo = metasActivas.reduce((s, m) => s + m.monto_meta, 0)
  const metasConProgreso = metasActivas.map(m => {
    // Proporción de esta meta vs el total de metas
    const proporcion = totalMetaObjetivo > 0 ? m.monto_meta / totalMetaObjetivo : 1
    // Ahorro real asignado a esta meta (proporcional) o el manual si es mayor
    const ahorroAsignado = Math.max(m.monto_actual, Math.round(totalAhorradoReal * proporcion * 100) / 100)
    return { ...m, monto_actual: ahorroAsignado }
  })
  const metasCompletas  = metasConProgreso.filter(m => m.monto_actual >= m.monto_meta)
  const metasEnCurso    = metasConProgreso.filter(m => m.monto_actual < m.monto_meta)
  const totalMeta       = metasEnCurso.reduce((s, m) => s + m.monto_meta, 0)
  const totalAhorrado   = Math.max(totalAhorradoReal, metasEnCurso.reduce((s, m) => s + m.monto_actual, 0))

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleNuevo = () => { setEditingMeta(null); setForm(EMPTY_FORM); setModalOpen(true) }

  const handleEdit = (m: MetaAhorroType) => {
    setEditingMeta(m)
    setForm({ nombre: m.nombre, monto_meta: m.monto_meta, monto_actual: m.monto_actual, fecha_objetivo: m.fecha_objetivo, categoria: m.categoria, descripcion: m.descripcion, activo: m.activo })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim())  { toast.error("El nombre es obligatorio"); return }
    if (!form.monto_meta)     { toast.error("La meta es obligatoria"); return }
    setSaving(true)
    try {
      if (editingMeta) {
        const u = await updateMeta(editingMeta.documentId, form)
        setMetas(prev => prev.map(m => m.documentId === u.documentId ? u : m))
        toast.success("Meta actualizada")
      } else {
        const n = await createMeta(form)
        setMetas(prev => [...prev, n])
        toast.success("Meta creada")
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
      await deleteMeta(documentId)
      setMetas(prev => prev.filter(m => m.documentId !== documentId))
      toast.success("Meta eliminada")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    }
  }

  const handleAbonar = async (meta: MetaAhorroType, abono: number, cuentaId: string | null) => {
    try {
      const nuevoMonto = meta.monto_actual + abono
      const payload: MetaAhorroPayload = {
        nombre: meta.nombre, monto_meta: meta.monto_meta, monto_actual: nuevoMonto,
        fecha_objetivo: meta.fecha_objetivo, categoria: meta.categoria,
        descripcion: meta.descripcion, activo: meta.activo,
      }
      const u = await updateMeta(meta.documentId, payload)
      setMetas(prev => prev.map(m => m.documentId === u.documentId ? u : m))

      // Crear transacción si seleccionó cuenta
      if (cuentaId) {
        const txNueva = await createTransaccion({
          descripcion: `Abono: ${meta.nombre}`,
          tipo: "gasto",
          monto: abono,
          fecha: new Date().toISOString(),
          categoria: "ahorro",
          notas: `Meta: ${meta.nombre}`,
          cuentaOrigen: cuentaId,
          cuentaDestino: null,
        })
        setTransacciones(prev => [txNueva, ...prev])
      }

      if (nuevoMonto >= meta.monto_meta) toast.success("¡Meta alcanzada! 🎉")
      else toast.success(`Abono registrado${cuentaId ? " y transacción creada" : ""}. Falta: ${fmt(Math.max(0, meta.monto_meta - nuevoMonto))}`)
    } catch (err: any) {
      toast.error(err.message ?? "Error al abonar")
    }
  }

  const loading = loadM || loadP || loadR
  if (error) return <div className="text-sm text-red-500 p-8">Error: {error}</div>

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Metas de Ahorro</h1>
          <p className="text-sm text-zinc-500">
            Ritmo actual: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(ahorroPromedio)}/mes</span>
            {ahorrosPorMes.length > 0 ? " (promedio últimos 3 meses)" : " (presupuestado)"}
            {totalAhorradoReal > 0 && <span className="ml-2">· Total registrado: <span className="font-semibold text-emerald-500">{fmt(totalAhorradoReal)}</span></span>}
          </p>
        </div>
        <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full">
          <Plus className="h-4 w-4" /> Nueva Meta
        </Button>
      </div>

      {/* Resumen */}
      {!loading && metasEnCurso.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Metas activas",   value: String(metasEnCurso.length),  color: "text-indigo-600 dark:text-indigo-400" },
            { label: "Total ahorrado",  value: fmt(totalAhorrado),            color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Total restante",  value: fmt(totalMeta - totalAhorrado), color: "text-zinc-700 dark:text-zinc-300" },
          ].map(k => (
            <Card key={k.label} className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Grid de metas en curso */}
      {metasEnCurso.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)
            : metasEnCurso.map(m => (
                <MetaCard
                  key={m.documentId}
                  meta={m}
                  ahorroMensual={ahorroPromedio}
                  cuentas={cuentasActivas}
                  onEdit={() => handleEdit(m)}
                  onDelete={() => handleDelete(m.documentId)}
                  onAbonar={(abono, cuentaId) => handleAbonar(m, abono, cuentaId)}
                />
              ))
          }
        </div>
      )}

      {/* Metas completadas */}
      {metasCompletas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completadas ({metasCompletas.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {metasCompletas.map(m => (
              <MetaCard
                key={m.documentId}
                meta={m}
                ahorroMensual={ahorroPromedio}
                onEdit={() => handleEdit(m)}
                onDelete={() => handleDelete(m.documentId)}
                onAbonar={(abono) => handleAbonar(m, abono)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && metasActivas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="h-12 w-12 text-zinc-200 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-medium">Sin metas de ahorro</p>
          <p className="text-sm text-zinc-400 mt-1">Crea tu primera meta para empezar a dar seguimiento.</p>
          <Button onClick={handleNuevo} className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Nueva Meta
          </Button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {editingMeta ? "Editar Meta" : "Nueva Meta"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Fondo de emergencia, Viaje a Europa..." value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                <select title="Categoría" value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || null) as CategoriaMeta | null }))} className={selectCls}>
                  <option value="">— Sin categoría —</option>
                  {(Object.entries(CAT_LABEL) as [CategoriaMeta, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{CAT_COLOR[v].icon} {l}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meta ($) <span className="text-red-500">*</span></label>
                  <input type="number" placeholder="0.00" min="0" value={form.monto_meta || ""}
                    onChange={e => setForm(f => ({ ...f, monto_meta: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ya ahorrado ($)</label>
                  <input type="number" placeholder="0.00" min="0" value={form.monto_actual || ""}
                    onChange={e => setForm(f => ({ ...f, monto_actual: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha objetivo</label>
                <input type="date" title="Fecha objetivo" value={form.fecha_objetivo ? form.fecha_objetivo.split("T")[0] : ""}
                  onChange={e => setForm(f => ({ ...f, fecha_objetivo: e.target.value ? e.target.value + "T00:00:00.000Z" : null }))} className={inputCls} />
              </div>

              {/* Preview de proyección */}
              {form.monto_meta > 0 && ahorroPromedio > 0 && (
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-3 text-center">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Al ritmo actual ({fmt(ahorroPromedio)}/mes) la alcanzas en{" "}
                    <span className="font-bold">
                      {Math.ceil(Math.max(0, form.monto_meta - (form.monto_actual || 0)) / ahorroPromedio)} meses
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
                <input type="text" placeholder="Notas opcionales..." value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))} className={inputCls} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingMeta ? "Guardar" : "Crear Meta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
