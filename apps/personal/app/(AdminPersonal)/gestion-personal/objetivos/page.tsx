"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus, Edit, Trash2, X, Loader2, Target, CheckCircle2,
  CreditCard, TrendingDown, ChevronDown, ChevronUp,
  AlertTriangle, Flame, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

import { useGetMetas }         from "@/api/meta-ahorro/getMetas"
import { createMeta }          from "@/api/meta-ahorro/createMeta"
import { updateMeta }          from "@/api/meta-ahorro/updateMeta"
import { deleteMeta }          from "@/api/meta-ahorro/deleteMeta"
import { useGetPartidas }      from "@/api/partida-presupuesto/getPartidas"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetCategorias }    from "@/api/categoria/getCategorias"
import { grupoDe }             from "@/lib/categoria"
import { createTransaccion }   from "@/api/transaccion/createTransaccion"
import { useGetCuentas }       from "@/api/cuenta/getCuentas"

import { MetaAhorroType, MetaAhorroPayload, CategoriaMeta } from "@/types/meta-ahorro"
import { CuentaType }      from "@/types/cuenta"
import { TransaccionType } from "@/types/transaccion"

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

function mesKey(fecha: string) { return fecha.slice(0, 7) }
function mesLabel(key: string) {
  const [y, m] = key.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
}

const CAT_LABEL: Record<CategoriaMeta, string> = {
  emergencia: "Fondo de Emergencia", viaje: "Viaje", equipo: "Equipo / Tecnologia",
  inversion: "Inversion", educacion: "Educacion", otros: "Otros",
}
const CAT_COLOR: Record<CategoriaMeta, { bg: string; text: string; icon: string }> = {
  emergencia: { bg: "bg-red-500/10",     text: "text-red-400",     icon: "🛡️" },
  viaje:      { bg: "bg-sky-500/10",     text: "text-sky-400",     icon: "✈️" },
  equipo:     { bg: "bg-violet-500/10",  text: "text-violet-400",  icon: "💻" },
  inversion:  { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "📈" },
  educacion:  { bg: "bg-amber-500/10",   text: "text-amber-400",   icon: "🎓" },
  otros:      { bg: "bg-zinc-800",       text: "text-zinc-400",    icon: "🎯" },
}

const inputCls  = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
const selectCls = `${inputCls} cursor-pointer`

const EMPTY_FORM: MetaAhorroPayload = {
  nombre: "", monto_meta: 0, monto_actual: 0,
  fecha_objetivo: null, categoria: null, descripcion: null, activo: true,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TARJETA DE META DE AHORRO
// ═══════════════════════════════════════════════════════════════════════════════
function MetaCard({
  meta, ahorroMensual, cuentas, aportes, onEdit, onDelete, onAbonar,
}: {
  meta: MetaAhorroType; ahorroMensual: number
  cuentas: { documentId: string; nombre: string }[]
  aportes: { fecha: string; monto: number; descripcion: string; cuenta?: string }[]
  onEdit: () => void; onDelete: () => void
  onAbonar: (monto: number, cuentaId: string | null) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [abonoOpen, setAbonoOpen] = useState(false)
  const [abono, setAbono] = useState("")
  const [abonoCuenta, setAbonoCuenta] = useState<string | null>(null)
  const [savingAbono, setSavingAbono] = useState(false)

  const pct = meta.monto_meta > 0 ? Math.min(100, (meta.monto_actual / meta.monto_meta) * 100) : 0
  const falta = Math.max(0, meta.monto_meta - meta.monto_actual)
  const completado = pct >= 100
  const cat = meta.categoria ?? "otros"
  const mesesRestantes = ahorroMensual > 0 && falta > 0 ? Math.ceil(falta / ahorroMensual) : null
  const fechaLabel = meta.fecha_objetivo
    ? new Date(meta.fecha_objetivo + "T00:00:00").toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : null
  const mesesHastaObjetivo = meta.fecha_objetivo ? (() => {
    const h = new Date(); const o = new Date(meta.fecha_objetivo + "T00:00:00")
    return (o.getFullYear() - h.getFullYear()) * 12 + (o.getMonth() - h.getMonth())
  })() : null

  const handleAbonar = async () => {
    const monto = parseFloat(abono)
    if (isNaN(monto) || monto <= 0) { toast.error("Monto invalido"); return }
    setSavingAbono(true)
    try { onAbonar(monto, abonoCuenta); setAbonoOpen(false); setAbono(""); setAbonoCuenta(null) }
    finally { setSavingAbono(false) }
  }

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden ${completado ? "ring-2 ring-emerald-400 dark:ring-emerald-500" : ""}`}>
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
                      <span className="text-xs text-zinc-400">Eliminar?</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600" onClick={onDelete}>Si</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDelete(false)}>No</Button>
                    </div>
                  : <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDelete(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
                }
              </div>
            )
          }
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{fmt(meta.monto_actual)} ahorrado</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{Math.round(pct)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completado ? "bg-emerald-400" : pct > 75 ? "bg-indigo-500" : pct > 40 ? "bg-indigo-400" : "bg-indigo-300"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Meta: {fmt(meta.monto_meta)}</span>
            {!completado && <span className="text-zinc-400">Falta: <span className="font-medium text-zinc-600 dark:text-zinc-300">{fmtK(falta)}</span></span>}
          </div>
        </div>
      </div>

      {!completado && (
        <div className="px-5 pb-4 space-y-2 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {mesesRestantes !== null && (
              <p className="text-xs text-zinc-500">Al ritmo actual: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{mesesRestantes === 1 ? "1 mes" : `${mesesRestantes} meses`}</span></p>
            )}
            {fechaLabel && (
              <p className="text-xs text-zinc-500">Objetivo: <span className={`font-semibold ${mesesHastaObjetivo !== null && mesesHastaObjetivo < (mesesRestantes ?? 999) ? "text-red-500 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"}`}>{fechaLabel}</span></p>
            )}
          </div>
          {mesesHastaObjetivo !== null && mesesRestantes !== null && mesesHastaObjetivo < mesesRestantes && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Necesitas ahorrar {fmtK(Math.ceil(falta / Math.max(1, mesesHastaObjetivo)))}/mes para llegar a tiempo.</p>
          )}
          {meta.descripcion && <p className="text-xs text-zinc-400 italic">{meta.descripcion}</p>}
        </div>
      )}

      {aportes.length > 0 && (
        <div className="px-5 pb-3 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Aportes registrados</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {aportes.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-400">{new Date(a.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                  <span className="text-zinc-500 truncate">{a.descripcion}</span>
                </div>
                <span className="font-semibold text-emerald-500 shrink-0">+{fmt(a.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!completado && (
        <div className="px-5 pb-4">
          {abonoOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">$</span>
                <input type="number" title="Monto" placeholder="0.00" autoFocus value={abono}
                  onChange={e => setAbono(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAbonar(); if (e.key === "Escape") setAbonoOpen(false) }}
                  className="flex-1 h-8 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-zinc-800 px-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-2">
                <select title="Cuenta" className="flex-1 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-700 dark:text-zinc-300"
                  value={abonoCuenta ?? ""} onChange={e => setAbonoCuenta(e.target.value || null)}>
                  <option value="">Sin cuenta (solo meta)</option>
                  {cuentas.map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                </select>
                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={handleAbonar} disabled={savingAbono}>Abonar</Button>
                <Button variant="ghost" size="sm" className="h-8 text-zinc-400" onClick={() => setAbonoOpen(false)}>X</Button>
              </div>
              {abonoCuenta && <p className="text-[10px] text-cyan-500">→ Crea transaccion de ahorro</p>}
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
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Meta alcanzada!</p>
        </div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TARJETA DE CREDITO
// ═══════════════════════════════════════════════════════════════════════════════
function CreditoCard({ cuenta, pagos, pagosMes, totalPagado }: {
  cuenta: CuentaType; pagos: TransaccionType[]; pagosMes: number; totalPagado: number
}) {
  const [histOpen, setHistOpen] = useState(false)
  const deuda = cuenta.saldoActual ?? 0
  const limite = cuenta.metaDeCuenta ?? 0
  const utilizado = limite > 0 ? Math.min(100, (deuda / limite) * 100) : 0
  const disponible = limite > 0 ? Math.max(0, limite - deuda) : 0
  const liquidado = deuda <= 0
  const riesgo = utilizado > 80 ? "alto" : utilizado > 50 ? "medio" : "bajo"
  const riesgoColor = {
    alto:  { bar: "bg-red-500",     text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30" },
    medio: { bar: "bg-amber-500",   text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
    bajo:  { bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/30" },
  }[riesgo]

  const pagosPorMes = useMemo(() => {
    const map: Record<string, number> = {}
    pagos.forEach(tx => { const k = mesKey(tx.fecha); map[k] = (map[k] ?? 0) + Number(tx.monto) })
    return Object.keys(map).sort().slice(-6).map(k => ({ mes: k, monto: map[k] }))
  }, [pagos])

  const promedioPago = pagosPorMes.length > 0
    ? pagosPorMes.reduce((s, p) => s + p.monto, 0) / pagosPorMes.length : 0
  const mesesParaLiquidar = promedioPago > 0 && deuda > 0 ? Math.ceil(deuda / promedioPago) : null

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden ${liquidado ? "ring-2 ring-emerald-400 dark:ring-emerald-500" : ""}`}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: (cuenta.color ?? "#ef4444") + "20" }}>
              <CreditCard className="h-5 w-5" style={{ color: cuenta.color ?? "#ef4444" }} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{cuenta.nombre}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{cuenta.proposito ?? "Credito"}{limite > 0 && ` · Limite: ${fmt(limite)}`}</p>
            </div>
          </div>
          {liquidado ? (
            <div className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" /><span className="text-xs font-semibold">Liquidado</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${riesgoColor.bg} ${riesgoColor.text} border ${riesgoColor.border}`}>
              {riesgo === "alto" ? <Flame className="h-3 w-3" /> : riesgo === "medio" ? <AlertTriangle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {utilizado.toFixed(0)}% usado
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{fmt(deuda)}</span>
            {limite > 0 && !liquidado && <span className="text-xs text-zinc-400">Disponible: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{fmtK(disponible)}</span></span>}
          </div>
          {limite > 0 && (
            <div className="mt-2 space-y-1">
              <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${riesgoColor.bar}`} style={{ width: `${utilizado}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400"><span>$0</span><span>{fmtK(limite)}</span></div>
            </div>
          )}
        </div>
      </div>

      {!liquidado && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <div><p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pagado este mes</p><p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(pagosMes)}</p></div>
          <div><p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pago promedio</p><p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{fmt(promedioPago)}/mes</p></div>
          {mesesParaLiquidar !== null && (
            <div className="col-span-2"><p className="text-xs text-zinc-500">Al ritmo actual: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{mesesParaLiquidar === 1 ? "1 mes" : `${mesesParaLiquidar} meses`}</span> para liquidar</p></div>
          )}
        </div>
      )}

      {pagosPorMes.length > 0 && (
        <div className="px-5 pb-3 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pagos mensuales</p>
          <div className="flex items-end gap-1 h-12">
            {pagosPorMes.map(p => {
              const max = Math.max(...pagosPorMes.map(x => x.monto))
              const h = max > 0 ? (p.monto / max) * 100 : 0
              return (
                <div key={p.mes} className="flex-1 flex flex-col items-center gap-0.5" title={`${mesLabel(p.mes)}: ${fmt(p.monto)}`}>
                  <div className="w-full rounded-t bg-emerald-400/80 dark:bg-emerald-500/60 transition-all" style={{ height: `${Math.max(4, h)}%` }} />
                  <span className="text-[8px] text-zinc-400">{mesLabel(p.mes)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pagos.length > 0 && (
        <div className="border-t border-zinc-50 dark:border-zinc-800/60">
          <button type="button" className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            onClick={() => setHistOpen(!histOpen)}>
            <span className="font-semibold uppercase tracking-wider">Historial ({pagos.length})</span>
            {histOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {histOpen && (
            <div className="px-5 pb-3 space-y-1 max-h-40 overflow-y-auto">
              {pagos.slice(0, 20).map((tx, i) => (
                <div key={tx.documentId ?? i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-400">{new Date(tx.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                    <span className="text-zinc-500 truncate">{tx.descripcion}</span>
                  </div>
                  <span className="font-semibold text-emerald-500 shrink-0">-{fmt(Number(tx.monto))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {liquidado && totalPagado > 0 && (
        <div className="px-5 pb-4 text-center border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Deuda liquidada</p>
          <p className="text-xs text-zinc-400 mt-0.5">Total pagado: {fmt(totalPagado)}</p>
        </div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGINA PRINCIPAL — OBJETIVOS (METAS + CREDITOS)
// ═══════════════════════════════════════════════════════════════════════════════
type Tab = "metas" | "creditos"

export default function ObjetivosPage() {
  const [tab, setTab] = useState<Tab>("metas")

  // Data
  const { metas: dataMetas, loading: loadM, error }      = useGetMetas()
  const { partidas: dataPartidas, loading: loadP }        = useGetPartidas()
  const { transacciones: dataTx, setTransacciones, loading: loadT } = useGetTransacciones()
  const { cuentas, loading: loadC } = useGetCuentas()
  const { categorias } = useGetCategorias()
  const cuentasActivas = cuentas.filter(c => c.activa)

  const [metas, setMetas] = useState<MetaAhorroType[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<MetaAhorroType | null>(null)
  const [form, setForm] = useState<MetaAhorroPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setMetas(dataMetas ?? []) }, [dataMetas])

  const transacciones = dataTx ?? []
  const partidas = dataPartidas ?? []
  const loading = loadM || loadP || loadT || loadC

  // ─── METAS: Ritmo de ahorro ──────────────────────────────────────────
  const ahorroPlaneado = partidas
    .filter(p => p.activo !== false && p.tipo === "ahorro")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  const hoy = new Date()
  const ultimos3 = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const ahorrosPorMes = ultimos3.map(k =>
    transacciones.filter(tx => tx.fecha.slice(0, 7) === k && grupoDe(tx.categoria, categorias) === "ahorro")
      .reduce((s, tx) => s + Number(tx.monto), 0)
  ).filter(m => m > 0)
  const ahorroPromedio = ahorrosPorMes.length > 0
    ? ahorrosPorMes.reduce((s, m) => s + m, 0) / ahorrosPorMes.length
    : ahorroPlaneado

  const txAhorro = transacciones
    .filter(tx => grupoDe(tx.categoria, categorias) === "ahorro")
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  const totalAhorradoReal = txAhorro.reduce((s, tx) => s + Number(tx.monto), 0)

  const metasActivas = metas.filter(m => m.activo !== false)
  const totalMetaObj = metasActivas.reduce((s, m) => s + m.monto_meta, 0)
  const metasConProgreso = metasActivas.map(m => {
    const prop = totalMetaObj > 0 ? m.monto_meta / totalMetaObj : 1
    return { ...m, monto_actual: Math.max(m.monto_actual, Math.round(totalAhorradoReal * prop * 100) / 100) }
  })
  const metasCompletas = metasConProgreso.filter(m => m.monto_actual >= m.monto_meta)
  const metasEnCurso = metasConProgreso.filter(m => m.monto_actual < m.monto_meta)
  const totalMeta = metasEnCurso.reduce((s, m) => s + m.monto_meta, 0)
  const totalAhorrado = Math.max(totalAhorradoReal, metasEnCurso.reduce((s, m) => s + m.monto_actual, 0))

  // ─── CREDITOS ─────────────────────────────────────────────────────────
  const creditos = cuentas.filter(c => c.activa && c.tipo === "Credito" || c.activa && c.tipo === "Crédito")
  const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const pagosPorCredito = useMemo(() => {
    const map: Record<string, TransaccionType[]> = {}
    creditos.forEach(c => { map[c.documentId] = [] })
    transacciones.forEach(tx => {
      const destId = tx.cuentaDestino?.documentId
      if (destId && map[destId] !== undefined && tx.tipo === "transferencia") map[destId].push(tx)
    })
    return map
  }, [creditos, transacciones])

  const totalDeuda = creditos.reduce((s, c) => s + (c.saldoActual ?? 0), 0)
  const totalLimite = creditos.reduce((s, c) => s + (c.metaDeCuenta ?? 0), 0)
  const creditosActivos = creditos.filter(c => (c.saldoActual ?? 0) > 0)
  const creditosLiquidados = creditos.filter(c => (c.saldoActual ?? 0) <= 0)

  // ─── CRUD METAS ──────────────────────────────────────────────────────
  const handleNuevo = () => { setEditingMeta(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const handleEdit = (m: MetaAhorroType) => {
    setEditingMeta(m)
    setForm({ nombre: m.nombre, monto_meta: m.monto_meta, monto_actual: m.monto_actual, fecha_objetivo: m.fecha_objetivo, categoria: m.categoria, descripcion: m.descripcion, activo: m.activo })
    setModalOpen(true)
  }
  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    if (!form.monto_meta) { toast.error("La meta es obligatoria"); return }
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
    } catch (err: any) { toast.error(err.message ?? "Error") }
    finally { setSaving(false) }
  }
  const handleDelete = async (documentId: string) => {
    try { await deleteMeta(documentId); setMetas(prev => prev.filter(m => m.documentId !== documentId)); toast.success("Meta eliminada") }
    catch (err: any) { toast.error(err.message ?? "Error") }
  }
  const handleAbonar = async (meta: MetaAhorroType, abono: number, cuentaId: string | null) => {
    try {
      const nuevoMonto = meta.monto_actual + abono
      const u = await updateMeta(meta.documentId, { nombre: meta.nombre, monto_meta: meta.monto_meta, monto_actual: nuevoMonto, fecha_objetivo: meta.fecha_objetivo, categoria: meta.categoria, descripcion: meta.descripcion, activo: meta.activo })
      setMetas(prev => prev.map(m => m.documentId === u.documentId ? u : m))
      if (cuentaId) {
        const txN = await createTransaccion({ descripcion: `Abono: ${meta.nombre}`, tipo: "gasto", monto: abono, fecha: new Date().toISOString(), categoria: "ahorro", notas: `Meta: ${meta.nombre}`, cuentaOrigen: cuentaId, cuentaDestino: null })
        setTransacciones(prev => [txN, ...prev])
      }
      if (nuevoMonto >= meta.monto_meta) toast.success("Meta alcanzada!")
      else toast.success(`Abono registrado${cuentaId ? " y transaccion creada" : ""}`)
    } catch (err: any) { toast.error(err.message ?? "Error al abonar") }
  }

  if (error) return <div className="text-sm text-red-500 p-8">Error: {error}</div>

  // ─── RESUMEN GLOBAL ────────────────────────────────────────────────────
  const progresoAhorro = totalMeta > 0 ? (totalAhorrado / totalMeta) * 100 : 0
  const progresoDeuda = totalLimite > 0 ? ((totalLimite - totalDeuda) / totalLimite) * 100 : 0

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Target className="h-6 w-6 text-amber-400" /> Objetivos
          </h1>
          <p className="text-sm text-zinc-500">Metas de ahorro y gestion de deudas en un solo lugar.</p>
        </div>
        {tab === "metas" && (
          <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full">
            <Plus className="h-4 w-4" /> Nueva Meta
          </Button>
        )}
      </div>

      {/* Resumen cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Ahorrado</p>
            <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{fmt(totalAhorrado)}</p>
            {totalMeta > 0 && <p className="text-[10px] text-zinc-400 mt-0.5">{Math.round(progresoAhorro)}% de {fmtK(totalMeta)}</p>}
          </Card>
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Deuda Total</p>
            <p className={`text-xl font-bold mt-1 ${totalDeuda > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmt(totalDeuda)}</p>
            {totalLimite > 0 && <p className="text-[10px] text-zinc-400 mt-0.5">{Math.round(100 - progresoDeuda)}% utilizado</p>}
          </Card>
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Metas Activas</p>
            <p className="text-xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{metasEnCurso.length}</p>
            {metasCompletas.length > 0 && <p className="text-[10px] text-emerald-500 mt-0.5">{metasCompletas.length} completada{metasCompletas.length > 1 ? "s" : ""}</p>}
          </Card>
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Ritmo Ahorro</p>
            <p className="text-xl font-bold mt-1 text-zinc-700 dark:text-zinc-300">{fmt(ahorroPromedio)}<span className="text-sm font-normal">/mes</span></p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{ahorrosPorMes.length > 0 ? "promedio 3 meses" : "presupuestado"}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {([
          { key: "metas" as Tab,    label: "Metas de Ahorro", icon: Target,     count: metasActivas.length },
          { key: "creditos" as Tab, label: "Creditos",         icon: CreditCard, count: creditos.length },
        ]).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: METAS ─────────────────────────────────────────────────────── */}
      {tab === "metas" && (
        <>
          {metasEnCurso.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)
                : metasEnCurso.map(m => (
                    <MetaCard key={m.documentId} meta={m} ahorroMensual={ahorroPromedio}
                      cuentas={cuentasActivas} aportes={txAhorro.map(tx => ({ fecha: tx.fecha, monto: Number(tx.monto), descripcion: tx.descripcion, cuenta: tx.cuentaOrigen?.nombre ?? tx.cuentaDestino?.nombre ?? undefined }))}
                      onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.documentId)}
                      onAbonar={(abono, cId) => handleAbonar(m, abono, cId)} />
                  ))
              }
            </div>
          )}
          {metasCompletas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completadas ({metasCompletas.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {metasCompletas.map(m => (
                  <MetaCard key={m.documentId} meta={m} ahorroMensual={ahorroPromedio}
                    cuentas={cuentasActivas} aportes={[]}
                    onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.documentId)}
                    onAbonar={(abono) => handleAbonar(m, abono, null)} />
                ))}
              </div>
            </div>
          )}
          {!loading && metasActivas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Target className="h-12 w-12 text-zinc-200 dark:text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-medium">Sin metas de ahorro</p>
              <p className="text-sm text-zinc-400 mt-1">Crea tu primera meta para empezar a dar seguimiento.</p>
              <Button onClick={handleNuevo} className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Nueva Meta</Button>
            </div>
          )}
        </>
      )}

      {/* ── TAB: CREDITOS ──────────────────────────────────────────────────── */}
      {tab === "creditos" && (
        <>
          {totalLimite > 0 && totalDeuda > 0 && (
            <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deuda global vs Limite</p>
                <p className="text-sm text-zinc-500">{fmt(totalDeuda)} / {fmt(totalLimite)}</p>
              </div>
              <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${(totalDeuda / totalLimite) > 0.8 ? "bg-red-500" : (totalDeuda / totalLimite) > 0.5 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (totalDeuda / totalLimite) * 100)}%` }} />
              </div>
            </Card>
          )}

          {creditosActivos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {creditosActivos.map(c => {
                const pagos = pagosPorCredito[c.documentId] ?? []
                const pagosMesAct = pagos.filter(tx => mesKey(tx.fecha) === mesActualKey).reduce((s, tx) => s + Number(tx.monto), 0)
                const totalPag = pagos.reduce((s, tx) => s + Number(tx.monto), 0)
                return <CreditoCard key={c.documentId} cuenta={c} pagos={pagos} pagosMes={pagosMesAct} totalPagado={totalPag} />
              })}
            </div>
          )}

          {creditosLiquidados.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Liquidados ({creditosLiquidados.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-80">
                {creditosLiquidados.map(c => {
                  const pagos = pagosPorCredito[c.documentId] ?? []
                  return <CreditoCard key={c.documentId} cuenta={c} pagos={pagos} pagosMes={0} totalPagado={pagos.reduce((s, tx) => s + Number(tx.monto), 0)} />
                })}
              </div>
            </div>
          )}

          {!loading && creditos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CreditCard className="h-12 w-12 text-zinc-200 dark:text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-medium">Sin cuentas de credito</p>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                Agrega una cuenta tipo <span className="font-semibold text-emerald-500">&quot;Credito&quot;</span> en{" "}
                <a href="/gestion-personal/cuentas" className="text-emerald-500 hover:underline">Inventario</a>{" "}
                para ver el seguimiento aqui.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Modal de meta ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{editingMeta ? "Editar Meta" : "Nueva Meta"}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Fondo de emergencia..." value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
                <select title="Categoria" value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || null) as CategoriaMeta | null }))} className={selectCls}>
                  <option value="">— Sin categoria —</option>
                  {(Object.entries(CAT_LABEL) as [CategoriaMeta, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{CAT_COLOR[v].icon} {l}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meta ($) <span className="text-red-500">*</span></label>
                  <input type="number" placeholder="0.00" min="0" value={form.monto_meta || ""} onChange={e => setForm(f => ({ ...f, monto_meta: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ya ahorrado ($)</label>
                  <input type="number" placeholder="0.00" min="0" value={form.monto_actual || ""} onChange={e => setForm(f => ({ ...f, monto_actual: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha objetivo</label>
                <input type="date" title="Fecha objetivo" value={form.fecha_objetivo ? form.fecha_objetivo.split("T")[0] : ""} onChange={e => setForm(f => ({ ...f, fecha_objetivo: e.target.value ? e.target.value + "T00:00:00.000Z" : null }))} className={inputCls} />
              </div>
              {form.monto_meta > 0 && ahorroPromedio > 0 && (
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-3 text-center">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Al ritmo actual ({fmt(ahorroPromedio)}/mes) la alcanzas en{" "}
                    <span className="font-bold">{Math.ceil(Math.max(0, form.monto_meta - (form.monto_actual || 0)) / ahorroPromedio)} meses</span>
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripcion</label>
                <input type="text" placeholder="Notas opcionales..." value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))} className={inputCls} />
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
