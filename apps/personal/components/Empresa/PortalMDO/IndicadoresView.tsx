"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, X, Check, BarChart2, TableProperties, Users, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import { CalendarioRango } from "@/components/Shared/CalendarioPicker"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { useGetEcosistema } from "@/api/ecosistema-mkt/getEcosistema"
import { createEcosistema } from "@/api/ecosistema-mkt/mutateEcosistema"
import { EcosistemaType, EcosistemaPayload, MESES_MKT, MesEcosistema } from "@/types/ecosistema-mkt"
import { useGetBoxscore } from "@/api/boxscore-semana/getBoxscore"
import { createBoxscore, updateBoxscore, deleteBoxscore } from "@/api/boxscore-semana/mutateBoxscore"
import { BoxscoreType, BoxscorePayload } from "@/types/boxscore-semana"
import { useGetCdl } from "@/api/cdl-metricas/getCdl"
import { createCdl, updateCdl } from "@/api/cdl-metricas/mutateCdl"
import { CdlType, CdlPayload } from "@/types/cdl-metricas"
import { fieldCls } from "@/lib/styles"

const AMBITO = "empresa" as const
const ANIO_ACTUAL = new Date().getFullYear()

function isoWeekMonday(anio: number, semana: number): Date {
  const jan4 = new Date(Date.UTC(anio, 0, 4))
  const jan4Dow = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow + 1)
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (semana - 1) * 7)
  return monday
}
function isoWeekOfDate(d: Date): { semana: number; anio: number } {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum)
  const anio = dt.getUTCFullYear()
  const jan1 = new Date(Date.UTC(anio, 0, 1))
  const semana = Math.ceil((((dt.getTime() - jan1.getTime()) / 86400000) + 1) / 7)
  return { semana, anio }
}
function pct(num: number, den: number): string {
  if (!den) return "—"
  return `${((num / den) * 100).toFixed(1)}%`
}
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}
function fmtPeso(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
}
function TasaBadge({ num, den }: { num: number; den: number }) {
  if (!den) return <span className="text-[10px] text-slate-400 dark:text-slate-600">—</span>
  const ratio = num / den
  const color = ratio >= 0.05 ? "text-emerald-500" : ratio >= 0.01 ? "text-amber-500" : "text-red-500"
  return <span className={`text-[10px] font-medium ${color}`}>{pct(num, den)}</span>
}
function MetricaCell({ value, sub, subDen }: { value: number; sub?: number; subDen?: number }) {
  return (
    <td className="px-3 py-3 text-center whitespace-nowrap">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmt(value)}</p>
      {sub !== undefined && subDen !== undefined && <TasaBadge num={sub} den={subDen} />}
    </td>
  )
}
const labelCls = "block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
function mesAnioLabel(mes: string, anio: number): string { return `${mes.trim().slice(0, 3)} ${anio}` }
function mesAnioToDate(mes: string, anio: number): Date {
  const idx = MESES_MKT.indexOf(mes.trim() as typeof MESES_MKT[number])
  return new Date(Date.UTC(anio, idx === -1 ? 0 : idx, 1))
}

// ─── Tab selector ─────────────────────────────────────────────────────────────

type Tab = "funnel" | "boxscore" | "cdl"

function SubTabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "funnel",   label: "Funnel",   icon: <BarChart2 size={14} /> },
    { id: "boxscore", label: "BoxScore", icon: <TableProperties size={14} /> },
    { id: "cdl",      label: "CDL",      icon: <Users size={14} /> },
  ]
  return (
    <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 p-1 rounded-lg w-fit border border-slate-300 dark:border-slate-700 shadow-sm">
      {tabs.map(t => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${active === t.id ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Funnel visual ────────────────────────────────────────────────────────────

function FunnelConector({ pct: p }: { pct?: string | null }) {
  return (
    <div className="flex flex-col items-center py-1 gap-0.5">
      {p && <span className="text-[10px] font-semibold text-slate-500">{p}</span>}
      <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

function FunnelVisual({ tot }: { tot: { impresiones: number; visitas: number; clics: number; contactos: number; oportunidades: number; compras: number; revenue: number } }) {
  const pagado = tot.clics
  const organico = Math.max(0, tot.visitas - tot.clics)
  const etapas = [
    { etapa: "Atracción",   metrica: "Tráfico total",                            value: fmt(tot.visitas),       widthPct: 100, prev: tot.impresiones && tot.visitas ? pct(tot.visitas, tot.impresiones) : null },
    { etapa: "Calificados", metrica: "Oportunidades (CDL)",                      value: fmt(tot.oportunidades), widthPct: 86,  prev: tot.visitas && tot.oportunidades ? pct(tot.oportunidades, tot.visitas) : null },
    { etapa: "Convertidos", metrica: `Clientes nuevos · ${fmtPeso(tot.revenue)}`, value: fmt(tot.compras),       widthPct: 72,  prev: tot.oportunidades && tot.compras ? pct(tot.compras, tot.oportunidades) : null },
  ]
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-6">
      <p className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">Funnel de conversión</p>
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm rounded-xl px-4 py-3 text-center">
        <p className="text-[9px] text-slate-500 uppercase tracking-wider">Impresiones</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{fmt(tot.impresiones)}</p>
      </div>
      <FunnelConector />
      <div className="flex gap-3">
        {[{ label: "Tráfico pagado", value: pagado }, { label: "Tráfico orgánico", value: organico }].map(s => (
          <div key={s.label} className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm rounded-xl px-3 py-2.5 text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{fmt(s.value)}</p>
            <p className="text-[9px] text-slate-600 dark:text-slate-400">{pct(s.value, tot.impresiones)} de impresiones</p>
          </div>
        ))}
      </div>
      {etapas.map(s => (
        <div key={s.etapa}>
          <FunnelConector pct={s.prev} />
          <div className="mx-auto flex items-center gap-4 px-5 py-3 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 transition-[width] duration-300" style={{ width: `${s.widthPct}%` }}>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">{s.etapa}</p>
              <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200 mt-0.5">{s.metrica}</p>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 shrink-0">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════ TAB 1 — FUNNEL ══════════

function emptyFunnelPayload(): EcosistemaPayload {
  return { mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL, canal: null, impresiones: 0, visitas: 0, clics: 0, leads: 0, contactosNuevos: 0, compras: 0, montoCompras: 0, notas: null, ambito: AMBITO }
}

function ModalFunnel({ onGuardar, onCerrar }: { onGuardar: (p: EcosistemaPayload) => Promise<void>; onCerrar: () => void }) {
  const [form, setForm] = useState<EcosistemaPayload>(emptyFunnelPayload())
  const [saving, setSaving] = useState(false)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }
  const num = (key: keyof EcosistemaPayload) => (
    <input type="number" min={0} title={String(key)} value={(form[key] as number) ?? 0}
      onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className={fieldCls} />
  )
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nuevo registro</h2>
          <button type="button" title="Cerrar" onClick={onCerrar} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Mes</label>
            <DropdownPicker label="Mes" value={form.mes} onChange={v => setForm(f => ({ ...f, mes: v as MesEcosistema }))} options={MESES_MKT.map(m => ({ value: m, label: m }))} />
          </div>
          <div>
            <label className={labelCls}>Año</label>
            <input type="number" title="Año" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))} className={fieldCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Canal (opcional)</label>
          <input value={form.canal ?? ""} onChange={e => setForm(f => ({ ...f, canal: e.target.value || null }))} placeholder="Instagram, Email, Google Ads…" className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([["Impresiones","impresiones"],["Visitas","visitas"],["Clics","clics"],["Contactos","contactosNuevos"],["Oportunidades","leads"],["Compras","compras"]] as const).map(([label, key]) => (
            <div key={key}><label className={labelCls}>{label}</label>{num(key)}</div>
          ))}
          <div className="col-span-2"><label className={labelCls}>Monto de compras (MXN)</label>{num("montoCompras")}</div>
        </div>
        <div>
          <label className={labelCls}>Notas</label>
          <textarea value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} rows={2} placeholder="Observaciones del período…"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-violet-400 transition-colors shadow-sm resize-none" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition"><Check size={14} />{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  )
}

type FunnelRow = { key: string; mes: string; anio: number; impresiones: number; visitas: number; clics: number; contactos: number; oportunidades: number; compras: number; revenue: number }

function TabFunnel() {
  const { registros: semanas, loading: bsLoading } = useGetBoxscore(AMBITO)
  const { registros: cdlData, loading: cdlLoading } = useGetCdl(AMBITO)
  const { setRegistros: setEcoRegistros } = useGetEcosistema(AMBITO)
  const [desdeDate, setDesdeDate] = useState<Date | null>(null)
  const [hastaDate, setHastaDate] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const mkKey = (mes: string, anio: number) => `${anio}|||${mes.trim()}`
  const mesOrden = (mes: string) => { const idx = MESES_MKT.indexOf(mes.trim() as typeof MESES_MKT[number]); return idx === -1 ? 99 : idx }

  const bsMensual = useMemo(() => {
    const map = new Map<string, { mes: string; anio: number; rows: BoxscoreType[] }>()
    semanas.forEach(s => {
      const key = mkKey(s.mes, s.anio)
      if (!map.has(key)) map.set(key, { mes: s.mes.trim(), anio: s.anio, rows: [] })
      map.get(key)!.rows.push(s)
    })
    return map
  }, [semanas])

  const cdlMensual = useMemo(() => {
    type CdlAgg = { mes: string; anio: number; nuevosLeads: number; clientesNuevos: number; ventasCuentasNuevas: number }
    const map = new Map<string, CdlAgg>()
    cdlData.forEach(c => {
      const key = mkKey(c.mes, c.anio)
      if (!map.has(key)) map.set(key, { mes: c.mes.trim(), anio: c.anio, nuevosLeads: 0, clientesNuevos: 0, ventasCuentasNuevas: 0 })
      const cur = map.get(key)!
      cur.nuevosLeads += c.nuevosLeads ?? 0
      cur.clientesNuevos += c.clientesNuevos ?? 0
      cur.ventasCuentasNuevas += c.ventasCuentasNuevas ?? 0
    })
    return map
  }, [cdlData])

  const merged: FunnelRow[] = useMemo(() => {
    const keys = [...new Set([...bsMensual.keys(), ...cdlMensual.keys()])].sort((a, b) => {
      const [anioA, mesA] = a.split("|||"); const [anioB, mesB] = b.split("|||")
      return anioA !== anioB ? Number(anioA) - Number(anioB) : mesOrden(mesA!) - mesOrden(mesB!)
    })
    return keys.map(key => {
      const bs = bsMensual.get(key), cdl = cdlMensual.get(key)
      const sum = (f: keyof BoxscoreType) => bs ? bs.rows.reduce((s, r) => s + ((r[f] as number) ?? 0), 0) : 0
      return {
        key, mes: bs?.mes ?? cdl?.mes ?? "", anio: bs?.anio ?? cdl?.anio ?? 0,
        impresiones: sum("impresionesCorp") + sum("impresionesStore") + sum("impresionesCYA") + sum("impresionesIC"),
        visitas: sum("traficoGeneral") || (sum("traficoDirectoCorp") + sum("traficoDirectoStore") + sum("traficoOrganicoCorp") + sum("traficoOrganicoStore") + sum("clicsCYA") + sum("clicsIC")),
        clics: sum("clicsCYA") + sum("clicsIC"), contactos: sum("conversionesCYA") + sum("conversionesIC"),
        oportunidades: cdl?.nuevosLeads ?? 0, compras: cdl?.clientesNuevos ?? 0, revenue: cdl?.ventasCuentasNuevas ?? 0,
      }
    })
  }, [bsMensual, cdlMensual])

  const ordenados = useMemo(() => [...merged].sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : mesOrden(a.mes) - mesOrden(b.mes)), [merged])
  const rangoDisponible = useMemo(() => {
    if (!ordenados.length) return { min: null as Date | null, max: null as Date | null }
    return { min: mesAnioToDate(ordenados[0]!.mes, ordenados[0]!.anio), max: mesAnioToDate(ordenados[ordenados.length - 1]!.mes, ordenados[ordenados.length - 1]!.anio) }
  }, [ordenados])
  const defaultDesdeFecha = useMemo(() => {
    if (!ordenados.length) return null
    const inicioAnio = new Date(Date.UTC(ANIO_ACTUAL, 0, 1))
    const primero = ordenados.find(r => mesAnioToDate(r.mes, r.anio) >= inicioAnio) ?? ordenados[0]!
    return mesAnioToDate(primero.mes, primero.anio)
  }, [ordenados])
  const desdeEfectiva = desdeDate ?? defaultDesdeFecha
  const hastaEfectiva = hastaDate ?? rangoDisponible.max

  const filtrados = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return []
    return merged.filter(r => { const d = mesAnioToDate(r.mes, r.anio); return d >= desdeEfectiva && d <= hastaEfectiva })
      .sort((a, b) => a.anio !== b.anio ? b.anio - a.anio : mesOrden(a.mes) - mesOrden(b.mes))
  }, [merged, desdeEfectiva, hastaEfectiva])

  const rangoLabel = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return ""
    const d = mesAnioLabel(MESES_MKT[desdeEfectiva.getUTCMonth()]!, desdeEfectiva.getUTCFullYear())
    const h = mesAnioLabel(MESES_MKT[hastaEfectiva.getUTCMonth()]!, hastaEfectiva.getUTCFullYear())
    return d === h ? d : `${d} – ${h}`
  }, [desdeEfectiva, hastaEfectiva])

  const totales = useMemo(() => ({
    impresiones: filtrados.reduce((s, r) => s + r.impresiones, 0), visitas: filtrados.reduce((s, r) => s + r.visitas, 0),
    clics: filtrados.reduce((s, r) => s + r.clics, 0), contactos: filtrados.reduce((s, r) => s + r.contactos, 0),
    oportunidades: filtrados.reduce((s, r) => s + r.oportunidades, 0), compras: filtrados.reduce((s, r) => s + r.compras, 0),
    revenue: filtrados.reduce((s, r) => s + r.revenue, 0),
  }), [filtrados])

  const chartData = useMemo(() => [...filtrados].sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : mesOrden(a.mes) - mesOrden(b.mes))
    .map(r => ({ label: `${r.mes.slice(0, 3)} ${r.anio}`, Impresiones: r.impresiones, Visitas: r.visitas, Clics: r.clics, Contactos: r.contactos, Oportunidades: r.oportunidades, Compras: r.compras, Revenue: r.revenue })), [filtrados])

  async function guardarFunnel(payload: EcosistemaPayload) {
    try { const nuevo = await createEcosistema(payload); setEcoRegistros(prev => [...prev, nuevo]); toast.success("Registrado"); setModalOpen(false) }
    catch { toast.error("Error al guardar") }
  }

  if (bsLoading || cdlLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />)}</div>
      <div className="h-96 rounded-xl bg-slate-200 dark:bg-slate-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <CalendarioRango desde={desdeEfectiva} hasta={hastaEfectiva} onDesde={setDesdeDate} onHasta={setHastaDate}
          onReset={() => { setDesdeDate(rangoDisponible.min); setHastaDate(rangoDisponible.max) }} limiteMin={rangoDisponible.min} limiteMax={rangoDisponible.max} />
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Datos: BoxScore + CDL</p>
        <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition ml-auto"><Plus size={13} /> Registrar</button>
      </div>

      {merged.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">Sin datos — registra semanas en BoxScore y períodos en CDL.</p>
      ) : (
        <>
          {chartData.length >= 2 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Tendencias</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([{ key: "Impresiones", label: "Impresiones" }, { key: "Visitas", label: "Visitas" }, { key: "Clics", label: "Clics" }, { key: "Contactos", label: "Contactos" },
                   { key: "Oportunidades", label: "Oportunidades" }, { key: "Compras", label: "Compras" }, { key: "Revenue", label: "Revenue (MXN)", fmtFn: fmtPeso }] as { key: string; label: string; fmtFn?: (n: number) => string }[]).map(({ key, label, fmtFn }) => {
                  const vals = chartData.map(d => (d as Record<string, unknown>)[key] as number)
                  const total = vals.reduce((s, v) => s + v, 0)
                  return (
                    <div key={key} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{fmtFn ? fmtFn(total) : fmt(total)}</p>
                      <ResponsiveContainer width="100%" height={56}>
                        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [fmtFn ? fmtFn(v) : fmt(v), label]} labelStyle={{ color: "#94a3b8" }} />
                          <Line type="monotone" dataKey={key} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <FunnelVisual tot={totales} />

          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {[{ h: "Período", cls: "text-left text-slate-500" }, { h: "Impresiones", cls: "text-center text-slate-500" }, { h: "Visitas", cls: "text-center text-slate-500" },
                    { h: "Clics", cls: "text-center text-slate-500" }, { h: "Contactos", cls: "text-center text-slate-500" }, { h: "Oportunidades", cls: "text-center text-violet-600 dark:text-violet-400" },
                    { h: "Compras", cls: "text-center text-violet-600 dark:text-violet-400" }, { h: "Revenue", cls: "text-center text-violet-600 dark:text-violet-400" }].map(({ h, cls }) => (
                    <th key={h} className={`px-3 py-3 ${cls} text-[10px] font-semibold uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {["", "BoxScore", "BoxScore", "BoxScore", "BoxScore", "CDL", "CDL", "CDL"].map((src, i) => (
                    <td key={i} className={`px-3 py-0.5 text-center text-[9px] ${src === "CDL" ? "text-violet-500" : src ? "text-slate-500" : ""}`}>{src}</td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                {filtrados.map(r => (
                  <tr key={r.key} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.mes} {r.anio}</p></td>
                    <MetricaCell value={r.impresiones} />
                    <MetricaCell value={r.visitas} sub={r.visitas} subDen={r.impresiones} />
                    <MetricaCell value={r.clics} sub={r.clics} subDen={r.visitas} />
                    <MetricaCell value={r.contactos} sub={r.contactos} subDen={r.clics} />
                    <MetricaCell value={r.oportunidades} sub={r.oportunidades} subDen={r.contactos} />
                    <MetricaCell value={r.compras} sub={r.compras} subDen={r.oportunidades} />
                    <td className="px-3 py-3 text-center">{r.revenue > 0 ? <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{fmtPeso(r.revenue)}</span> : <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              {filtrados.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total {rangoLabel}</td>
                    <MetricaCell value={totales.impresiones} />
                    <MetricaCell value={totales.visitas} sub={totales.visitas} subDen={totales.impresiones} />
                    <MetricaCell value={totales.clics} sub={totales.clics} subDen={totales.visitas} />
                    <MetricaCell value={totales.contactos} sub={totales.contactos} subDen={totales.clics} />
                    <MetricaCell value={totales.oportunidades} sub={totales.oportunidades} subDen={totales.contactos} />
                    <MetricaCell value={totales.compras} sub={totales.compras} subDen={totales.oportunidades} />
                    <td className="px-3 py-3 text-center"><span className="text-sm font-bold text-violet-600 dark:text-violet-400">{fmtPeso(totales.revenue)}</span></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
      {modalOpen && <ModalFunnel onGuardar={guardarFunnel} onCerrar={() => setModalOpen(false)} />}
    </div>
  )
}

// ══════════ TAB 2 — BOXSCORE ══════════

function emptyBoxscorePayload(): BoxscorePayload {
  return {
    semana: 1, mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL, tasaApertura: 0, tasaClics: 0, tasaRechazos: 0,
    traficoDirectoCorp: 0, traficoDirectoStore: 0, impresionesCorp: 0, impresionesStore: 0, traficoOrganicoCorp: 0, traficoOrganicoStore: 0,
    impresionesSEM: 0, traficoPagaSEM: 0, clicsSEM: 0, conversionesSEM: 0, impresionesCYA: 0, clicsCYA: 0, conversionesCYA: 0,
    impresionesIC: 0, clicsIC: 0, conversionesIC: 0, traficoGeneral: 0, ambito: AMBITO,
  }
}

function Section({ id, label, badge, badgeGreen, openSection, onToggle, children }: {
  id: string; label: string; badge?: string; badgeGreen?: boolean; openSection: string | null; onToggle: (id: string) => void; children: React.ReactNode
}) {
  const open = openSection === id
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button type="button" onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <div className="flex items-center gap-2">
          {badge && <span className={`text-[10px] font-semibold ${badgeGreen ? "text-emerald-500" : "text-violet-500"}`}>{badge}</span>}
          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-3 space-y-3 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  )
}

type BSRow = { label: string; section: string; key: keyof BoxscoreType; color: string; fmt?: (v: number) => string }
type SemanaSlot = BoxscoreType & { placeholder?: boolean }

const BS_ROWS: BSRow[] = [
  { label: "Tasa Apertura",        section: "Nutrimiento",     key: "tasaApertura",         color: "#3b82f6", fmt: v => `${v}%` },
  { label: "Tasa Clics",           section: "Nutrimiento",     key: "tasaClics",            color: "#6366f1", fmt: v => `${v}%` },
  { label: "Tasa Rechazos",        section: "Nutrimiento",     key: "tasaRechazos",         color: "#ef4444", fmt: v => `${v}%` },
  { label: "Tráfico Dir. Corp",    section: "Nutrimiento",     key: "traficoDirectoCorp",   color: "#3b82f6" },
  { label: "Tráfico Dir. Store",   section: "Nutrimiento",     key: "traficoDirectoStore",  color: "#8b5cf6" },
  { label: "Impresiones Corp",     section: "Autoridad (SEO)", key: "impresionesCorp",      color: "#3b82f6" },
  { label: "Impresiones Store",    section: "Autoridad (SEO)", key: "impresionesStore",     color: "#8b5cf6" },
  { label: "Tráf. Orgánico Corp",  section: "Autoridad (SEO)", key: "traficoOrganicoCorp",  color: "#3b82f6" },
  { label: "Tráf. Orgánico Store", section: "Autoridad (SEO)", key: "traficoOrganicoStore", color: "#8b5cf6" },
  { label: "Impresiones",          section: "Visibilidad SEM", key: "impresionesSEM",       color: "#f59e0b" },
  { label: "Tráfico Paga",         section: "Visibilidad SEM", key: "traficoPagaSEM",       color: "#f97316" },
  { label: "Clics",                section: "Visibilidad SEM", key: "clicsSEM",             color: "#eab308" },
  { label: "Conversiones",         section: "Visibilidad SEM", key: "conversionesSEM",      color: "#10b981" },
  { label: "Impresiones",          section: "Visibilidad CYA", key: "impresionesCYA",       color: "#f59e0b" },
  { label: "Clics",                section: "Visibilidad CYA", key: "clicsCYA",             color: "#eab308" },
  { label: "Conversiones",         section: "Visibilidad CYA", key: "conversionesCYA",      color: "#10b981" },
  { label: "Impresiones",          section: "Visibilidad IC",  key: "impresionesIC",        color: "#f59e0b" },
  { label: "Clics",                section: "Visibilidad IC",  key: "clicsIC",              color: "#eab308" },
  { label: "Conversiones",         section: "Visibilidad IC",  key: "conversionesIC",       color: "#10b981" },
  { label: "Tráfico General",      section: "General",         key: "traficoGeneral",       color: "#22d3ee" },
]
const SECTION_COLORS: Record<string, string> = { "Nutrimiento": "#3b82f6", "Autoridad (SEO)": "#8b5cf6", "Visibilidad SEM": "#f59e0b", "Visibilidad CYA": "#f97316", "Visibilidad IC": "#ec4899", "General": "#06b6d4" }

function ModalBoxscore({ editando, prefill, onGuardar, onCerrar }: {
  editando: BoxscoreType | null; prefill: { semana: number; mes: string; anio: number } | null
  onGuardar: (p: BoxscorePayload) => Promise<void>; onCerrar: () => void
}) {
  const [form, setForm] = useState<BoxscorePayload>(() => {
    if (editando) return { ...editando }
    const base = emptyBoxscorePayload()
    return prefill ? { ...base, ...prefill } : base
  })
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>("fechas")
  const toggleSection = (key: string) => setOpenSection(s => s === key ? null : key)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }
  const cerrarSiVacio = useModalBackdropClose(form, onCerrar)

  const numField = (label: string, key: keyof BoxscorePayload, step = 1) => (
    <div key={key}>
      <label className={labelCls}>{label}</label>
      <input type="number" min={0} step={step} title={label} value={(form[key] as number) ?? 0} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className={fieldCls} />
    </div>
  )
  const secciones = useMemo(() => [...new Set(BS_ROWS.map(r => r.section))], [])
  const badgeDe = (rows: BSRow[]) => { const llenos = rows.filter(r => (form[r.key as keyof BoxscorePayload] as number) > 0).length; return { badge: `${llenos}/${rows.length}`, badgeGreen: llenos === rows.length } }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl my-8 p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editando ? "Editar semana" : "Nueva semana"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <Section id="fechas" label="Fechas" badge={`WK${form.semana} · ${form.mes.slice(0, 3)} ${form.anio}`} openSection={openSection} onToggle={toggleSection}>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Semana (WK)</label><input type="number" min={1} max={53} title="Semana WK" value={form.semana} onChange={e => setForm(f => ({ ...f, semana: Number(e.target.value) }))} className={fieldCls} /></div>
            <div><label className={labelCls}>Mes</label><DropdownPicker label="Mes" value={form.mes} onChange={v => setForm(f => ({ ...f, mes: v }))} options={MESES_MKT.map(m => ({ value: m, label: m }))} /></div>
            <div><label className={labelCls}>Año</label><input type="number" title="Año" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))} className={fieldCls} /></div>
          </div>
        </Section>
        {secciones.map(sec => {
          const rows = BS_ROWS.filter(r => r.section === sec)
          const { badge, badgeGreen } = badgeDe(rows)
          return (
            <Section key={sec} id={sec} label={sec} badge={badge} badgeGreen={badgeGreen} openSection={openSection} onToggle={toggleSection}>
              <div className="grid grid-cols-3 gap-3">{rows.map(r => numField(r.label, r.key as keyof BoxscorePayload, r.fmt ? 0.1 : 1))}</div>
            </Section>
          )
        })}
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition"><Check size={14} />{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  )
}

function Sparkline({ data, dataKey, color }: { data: object[]; dataKey: string; color: string }) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}><Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} /></LineChart>
    </ResponsiveContainer>
  )
}

function StatChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function DrilldownModal({ row, semanas, onCerrar, onEditarSemana }: { row: BSRow; semanas: SemanaSlot[]; onCerrar: () => void; onEditarSemana: (s: SemanaSlot) => void }) {
  const [desdeDate, setDesdeDate] = useState<Date | null>(null)
  const [hastaDate, setHastaDate] = useState<Date | null>(null)
  const tablaRef = useRef<HTMLDivElement>(null)
  const rango = useMemo(() => {
    if (!semanas.length) return { min: null as Date | null, max: null as Date | null }
    return { min: isoWeekMonday(semanas[0]!.anio, semanas[0]!.semana), max: isoWeekMonday(semanas[semanas.length - 1]!.anio, semanas[semanas.length - 1]!.semana) }
  }, [semanas])
  const desdeEfectiva = desdeDate ?? rango.min
  const hastaEfectiva = hastaDate ?? rango.max
  const semanasFiltradas = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return semanas
    return semanas.filter(s => { const monday = isoWeekMonday(s.anio, s.semana); return monday >= desdeEfectiva && monday <= hastaEfectiva })
  }, [semanas, desdeEfectiva, hastaEfectiva])
  useEffect(() => { if (tablaRef.current) tablaRef.current.scrollLeft = tablaRef.current.scrollWidth }, [semanasFiltradas])
  const fmtV = (v: number) => row.fmt ? row.fmt(v) : fmt(v)
  const chartData = semanasFiltradas.map(s => ({ label: `WK${s.semana}`, value: s.placeholder ? null : (s[row.key] as number) }))
  const conDatos = semanasFiltradas.filter(s => !s.placeholder)
  const vals = conDatos.map(s => s[row.key] as number)
  const nonZero = vals.filter(v => v > 0)
  const minVal = nonZero.length ? Math.min(...nonZero) : 0
  const maxVal = nonZero.length ? Math.max(...nonZero) : 0
  const avgVal = nonZero.length ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 100) / 100 : 0
  const last = vals[vals.length - 1] ?? 0
  const prev = vals[vals.length - 2] ?? 0
  const delta = last - prev
  const deltaPct = prev ? `${delta >= 0 ? "+" : ""}${((delta / prev) * 100).toFixed(1)}% vs anterior` : undefined

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.section}</p><h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{row.label}</h2></div>
          <button type="button" title="Cerrar" onClick={onCerrar} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={18} /></button>
        </div>
        <CalendarioRango desde={desdeEfectiva} hasta={hastaEfectiva} onDesde={setDesdeDate} onHasta={setHastaDate} onReset={() => { setDesdeDate(null); setHastaDate(null) }} limiteMin={rango.min} limiteMax={rango.max} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Mínimo" value={fmtV(minVal)} /><StatChip label="Máximo" value={fmtV(maxVal)} /><StatChip label="Promedio" value={fmtV(avgVal)} /><StatChip label="Última semana" value={fmtV(last)} sub={deltaPct} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={52} tickFormatter={v => row.fmt ? row.fmt(v) : fmt(v)} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtV(v), row.label]} />
              <Line type="monotone" dataKey="value" stroke={row.color} strokeWidth={2} dot={{ r: 2, fill: row.color }} activeDot={{ r: 5 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div ref={tablaRef} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="text-xs w-full min-w-max">
            <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              {semanasFiltradas.map(s => (
                <th key={s.documentId} className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500">
                  <button type="button" onClick={() => onEditarSemana(s)} title={s.placeholder ? "Registrar esta semana" : "Editar esta semana"} className={s.placeholder ? "text-slate-400 dark:text-slate-600 hover:text-violet-400 transition" : "hover:text-violet-500 transition"}>WK{s.semana}</button>
                </th>
              ))}
            </tr></thead>
            <tbody><tr>
              {semanasFiltradas.map(s => {
                const v = s[row.key] as number
                const isMax = !s.placeholder && nonZero.length > 1 && v === maxVal
                const isMin = !s.placeholder && nonZero.length > 1 && v === minVal && v > 0
                return <td key={s.documentId} className={`px-3 py-2 text-center font-medium ${s.placeholder ? "text-slate-300 dark:text-slate-700" : isMax ? "text-emerald-500" : isMin ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>{s.placeholder ? "—" : fmtV(v)}</td>
              })}
            </tr></tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

type MensualMetrica = { label: string; key: keyof BoxscoreType; color: string; fmt?: (v: number) => string }
const TOTAL_KEY = "__total__"
const TOTAL_COLOR = "#94a3b8"

function MensualTable({ title, accent, semanas, metricas }: { title: string; accent: string; semanas: BoxscoreType[]; metricas: MensualMetrica[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const meses = useMemo(() => {
    const map = new Map<string, { label: string; rows: BoxscoreType[] }>()
    semanas.forEach(s => {
      const key = `${s.anio}-${String(MESES_MKT.indexOf(s.mes as typeof MESES_MKT[number])).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, { label: `${s.mes.slice(0, 3)} ${s.anio}`, rows: [] })
      map.get(key)!.rows.push(s)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  }, [semanas])
  if (!meses.length) return null
  const tableData = meses.map(m => ({ label: m.label, vals: Object.fromEntries(metricas.map(mt => [mt.key, m.rows.reduce((s, r) => s + ((r[mt.key] as number) ?? 0), 0)])) as Record<string, number> }))
  const totalesPorMes = tableData.map(m => ({ label: m.label, total: metricas.reduce((s, mt) => s + (m.vals[String(mt.key)] ?? 0), 0) }))
  const chartData = tableData.map((m, i) => ({ label: m.label, ...m.vals, [TOTAL_KEY]: totalesPorMes[i]!.total }))
  const isTotalSelected = selectedKey === TOTAL_KEY
  const visibleMetricas = isTotalSelected ? [] : selectedKey ? metricas.filter(mt => String(mt.key) === selectedKey) : metricas
  const handleRowClick = (key: string) => setSelectedKey(prev => prev === key ? null : key)
  const selectedLabel = isTotalSelected ? "Total" : metricas.find(m => String(m.key) === selectedKey)?.label

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
      {selectedKey && <p className="text-[10px] text-slate-500">Mostrando: <span className="text-slate-700 dark:text-slate-200">{selectedLabel}</span> · <button type="button" onClick={() => setSelectedKey(null)} className="text-violet-500 hover:text-violet-700">Ver todas</button></p>}
      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
        <table className="text-sm min-w-max w-full">
          <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 sticky left-0 bg-white dark:bg-slate-900 w-44 z-10">Métrica</th>
            {meses.map(m => <th key={m.label} className="px-3 py-2.5 text-center text-[10px] font-semibold text-slate-400 min-w-[80px]">{m.label}</th>)}
          </tr></thead>
          <tbody>
            {metricas.map(mt => {
              const isSelected = selectedKey === String(mt.key)
              return (
                <tr key={String(mt.key)} onClick={() => handleRowClick(String(mt.key))} className={`border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${isSelected ? "bg-slate-100 dark:bg-slate-800" : selectedKey ? "opacity-40 hover:opacity-70 hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <td className={`px-4 py-2.5 sticky left-0 z-10 border-l-2 ${isSelected ? `${accent} bg-white dark:bg-slate-900` : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                    <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mt.color }} /><p className="text-xs text-slate-700 dark:text-slate-300">{mt.label}</p></div>
                  </td>
                  {tableData.map(m => <td key={m.label} className="px-3 py-2.5 text-center"><span className="text-xs font-medium text-slate-800 dark:text-slate-200">{mt.fmt ? mt.fmt(m.vals[String(mt.key)]!) : fmt(m.vals[String(mt.key)]!)}</span></td>)}
                </tr>
              )
            })}
            <tr onClick={() => handleRowClick(TOTAL_KEY)} className={`border-t-2 border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${isTotalSelected ? "bg-slate-100 dark:bg-slate-800" : selectedKey ? "opacity-40 hover:opacity-70 hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              <td className={`px-4 py-2.5 sticky left-0 z-10 border-l-2 ${isTotalSelected ? "border-slate-300/60 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TOTAL_COLOR }} /><p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total</p></div>
              </td>
              {totalesPorMes.map(m => <td key={m.label} className="px-3 py-2.5 text-center"><span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{fmt(m.total)}</span></td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {chartData.length >= 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={44} tickFormatter={v => fmt(v as number)} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} formatter={(v: number, name: string) => { if (name === TOTAL_KEY) return [fmt(v), "Total"]; const mt = metricas.find(m => String(m.key) === name); return [mt?.fmt ? mt.fmt(v) : fmt(v), mt?.label ?? name] }} />
              <Legend wrapperStyle={{ fontSize: 10 }} formatter={(name: string) => name === TOTAL_KEY ? "Total" : (metricas.find(m => String(m.key) === name)?.label ?? name)} />
              {visibleMetricas.map(mt => <Line key={String(mt.key)} type="monotone" dataKey={String(mt.key)} stroke={mt.color} strokeWidth={selectedKey ? 2.5 : 2} dot={false} name={mt.label} />)}
              {(isTotalSelected || !selectedKey) && <Line type="monotone" dataKey={TOTAL_KEY} stroke={TOTAL_COLOR} strokeWidth={isTotalSelected ? 2.5 : 1.5} strokeDasharray={selectedKey ? undefined : "5 3"} dot={false} name="Total" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function TabBoxscore() {
  const { registros, setRegistros, loading } = useGetBoxscore(AMBITO)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<BoxscoreType | null>(null)
  const [selectedRow, setSelectedRow] = useState<BSRow | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [prefill, setPrefill] = useState<{ semana: number; mes: string; anio: number } | null>(null)
  const semanaActual = useMemo(() => isoWeekOfDate(new Date()), [])

  const serieSemanas = useMemo((): SemanaSlot[] => {
    if (!registros.length) return []
    const porClave = new Map(registros.map(r => [`${r.semana}-${r.anio}`, r]))
    const [primero] = [...registros].sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.semana - b.semana)
    const inicio = isoWeekMonday(primero!.anio, primero!.semana)
    const fin = isoWeekMonday(semanaActual.anio, semanaActual.semana)
    const out: SemanaSlot[] = []
    for (let cursor = new Date(inicio); cursor <= fin; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
      const { semana, anio } = isoWeekOfDate(cursor)
      const real = porClave.get(`${semana}-${anio}`)
      if (real) { out.push(real); continue }
      out.push({
        id: -1, documentId: `ph-${semana}-${anio}`, semana, anio, mes: MESES_MKT[cursor.getUTCMonth()]!,
        tasaApertura: 0, tasaClics: 0, tasaRechazos: 0, traficoDirectoCorp: 0, traficoDirectoStore: 0, impresionesCorp: 0, impresionesStore: 0,
        traficoOrganicoCorp: 0, traficoOrganicoStore: 0, impresionesSEM: 0, traficoPagaSEM: 0, clicsSEM: 0, conversionesSEM: 0,
        impresionesCYA: 0, clicsCYA: 0, conversionesCYA: 0, impresionesIC: 0, clicsIC: 0, conversionesIC: 0, traficoGeneral: 0, ambito: null, placeholder: true,
      })
    }
    return out
  }, [registros, semanaActual])

  const rangoDisponible = useMemo(() => {
    if (!serieSemanas.length) return { min: null as Date | null, max: null as Date | null }
    return { min: isoWeekMonday(serieSemanas[0]!.anio, serieSemanas[0]!.semana), max: isoWeekMonday(serieSemanas[serieSemanas.length - 1]!.anio, serieSemanas[serieSemanas.length - 1]!.semana) }
  }, [serieSemanas])
  const [desdeDate, setDesdeDate] = useState<Date | null>(null)
  const [hastaDate, setHastaDate] = useState<Date | null>(null)
  const desdeEfectiva = desdeDate ?? rangoDisponible.min
  const hastaEfectiva = hastaDate ?? rangoDisponible.max
  const semanas = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return serieSemanas
    return serieSemanas.filter(r => { const monday = isoWeekMonday(r.anio, r.semana); return monday >= desdeEfectiva && monday <= hastaEfectiva })
  }, [serieSemanas, desdeEfectiva, hastaEfectiva])
  useEffect(() => { if (tableRef.current && semanas.length) tableRef.current.scrollLeft = tableRef.current.scrollWidth }, [semanas])
  const semanasConDatos = useMemo(() => semanas.filter(s => !s.placeholder), [semanas])
  const sparkData = useMemo(() => semanasConDatos.map(r => ({ label: `WK${r.semana}`, ...r })), [semanasConDatos])

  const abrirEdicion = (s: SemanaSlot) => {
    setSelectedRow(null)
    if (s.placeholder) { setEditando(null); setPrefill({ semana: s.semana, mes: s.mes, anio: s.anio }) } else { setEditando(s); setPrefill(null) }
    setModalOpen(true)
  }
  const guardar = async (payload: BoxscorePayload) => {
    try {
      if (editando) { const u = await updateBoxscore(editando.documentId, payload); setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r)); toast.success("Actualizado") }
      else { const n = await createBoxscore(payload); setRegistros(prev => [...prev, n]); toast.success("Creado") }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700 w-48" /><div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-700" /></div>

  const sections = [...new Set(BS_ROWS.map(r => r.section))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <CalendarioRango desde={desdeEfectiva} hasta={hastaEfectiva} onDesde={setDesdeDate} onHasta={setHastaDate} onReset={() => { setDesdeDate(null); setHastaDate(null) }} limiteMin={rangoDisponible.min} limiteMax={rangoDisponible.max} />
        <button type="button" onClick={() => {
          setEditando(null)
          const siguienteBlanco = serieSemanas.find(s => s.placeholder)
          setPrefill(siguienteBlanco ? { semana: siguienteBlanco.semana, mes: siguienteBlanco.mes, anio: siguienteBlanco.anio } : null)
          setModalOpen(true)
        }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition ml-auto"><Plus size={13} /> Registrar semana</button>
      </div>

      {semanas.length === 0 ? <p className="text-slate-400 text-sm text-center py-12">Sin semanas en el rango seleccionado.</p> : (
        <div ref={tableRef} className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <table className="text-sm min-w-max">
            <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-48 sticky left-0 bg-white dark:bg-slate-900 z-10">Métrica</th>
              {semanas.map(s => (
                <th key={s.documentId} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-400 min-w-[72px]">
                  <button type="button" onClick={() => abrirEdicion(s)} title={s.placeholder ? "Registrar esta semana" : undefined} className={s.placeholder ? "text-slate-300 dark:text-slate-600 hover:text-violet-400 transition" : "hover:text-violet-500 transition"}>WK{s.semana}</button>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">{s.mes.slice(0, 3)}</p>
                </th>
              ))}
              <th className="px-3 py-3 text-[10px] font-semibold text-slate-500 min-w-[88px]">Tendencia</th>
            </tr></thead>
            <tbody>
              {sections.map(sec => {
                const rows = BS_ROWS.filter(r => r.section === sec)
                const accentColor = SECTION_COLORS[sec] ?? "#475569"
                return rows.map((row, ri) => (
                  <tr key={`${sec}-${row.key}`} onClick={() => setSelectedRow(row)} className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${ri === 0 ? "border-t border-slate-200 dark:border-slate-700" : ""}`}>
                    <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900 z-10" style={{ boxShadow: `inset 2px 0 0 0 ${accentColor}99` }}>
                      {ri === 0 && <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{sec}</p>}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-700 dark:text-slate-300">{row.label}</p>
                        <button type="button" title="Ver gráfica" onClick={() => setSelectedRow(row)} className="shrink-0 p-1 -m-1 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition rounded"><BarChart2 size={13} /></button>
                      </div>
                    </td>
                    {semanas.map(s => { const v = s[row.key] as number; return <td key={s.documentId} className="px-3 py-2.5 text-center">{s.placeholder ? <span className="text-xs text-slate-300 dark:text-slate-700">—</span> : <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{row.fmt ? row.fmt(v) : fmt(v)}</span>}</td> })}
                    <td className="px-3 py-2.5"><Sparkline data={sparkData} dataKey={row.key as string} color={row.color} /></td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )}

      {sparkData.length >= 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Tráfico general por semana</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sparkData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={44} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="traficoGeneral" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Tráfico" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {semanasConDatos.length > 0 && (
        <div className="space-y-8 pt-2 border-t border-slate-200 dark:border-slate-700">
          <MensualTable title="Impresiones por mes" accent="border-l-blue-500/60" semanas={semanasConDatos}
            metricas={[{ label: "Impresiones Corp", key: "impresionesCorp", color: "#3b82f6" }, { label: "Impresiones Store", key: "impresionesStore", color: "#8b5cf6" }, { label: "Impresiones CYA", key: "impresionesCYA", color: "#fb923c" }, { label: "Impresiones IC", key: "impresionesIC", color: "#ec4899" }]} />
          <MensualTable title="Tráfico por mes" accent="border-l-violet-500/60" semanas={semanasConDatos}
            metricas={[{ label: "Tráfico Dir. Corp", key: "traficoDirectoCorp", color: "#3b82f6" }, { label: "Tráfico Dir. Store", key: "traficoDirectoStore", color: "#8b5cf6" }, { label: "Tráf. Orgánico Corp", key: "traficoOrganicoCorp", color: "#10b981" }, { label: "Tráf. Orgánico Store", key: "traficoOrganicoStore", color: "#34d399" }, { label: "Clics CYA", key: "clicsCYA", color: "#fb923c" }, { label: "Clics IC", key: "clicsIC", color: "#ec4899" }]} />
          <MensualTable title="Conversiones por mes" accent="border-l-emerald-500/60" semanas={semanasConDatos}
            metricas={[{ label: "Conv. CYA", key: "conversionesCYA", color: "#fb923c" }, { label: "Conv. IC", key: "conversionesIC", color: "#ec4899" }]} />
        </div>
      )}

      {selectedRow && <DrilldownModal row={selectedRow} semanas={serieSemanas} onCerrar={() => setSelectedRow(null)} onEditarSemana={abrirEdicion} />}
      {modalOpen && <ModalBoxscore editando={editando} prefill={prefill} onGuardar={guardar} onCerrar={() => { setModalOpen(false); setPrefill(null) }} />}
    </div>
  )
}

// ══════════ TAB 3 — CDL ══════════

function emptyCdlPayload(): CdlPayload {
  return { semana: null, mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL, nuevosLeads: 0, cantidadCampanas: 0, ventasCuentasNuevas: 0, porcentajeRetencion: 0, clientesNuevos: 0, costoAdquisicion: 0, contenidosNancy: 0, puntajeEncuestaNancy: 0, contenidosRichard: 0, puntajeEncuestaRichard: 0 }
}

type CdlRow = { label: string; key: string; color: string; fmt?: (v: number) => string }
const CDL_SECTIONS: { title: string; color: string; rows: CdlRow[] }[] = [
  { title: "Careabouts generales", color: "#3b82f6", rows: [{ label: "Nuevos leads / contactos", key: "nuevosLeads", color: "#3b82f6" }, { label: "Campañas publicadas", key: "cantidadCampanas", color: "#6366f1" }] },
  { title: "Careabouts financieros", color: "#10b981", rows: [{ label: "Ventas cuentas nuevas", key: "ventasCuentasNuevas", color: "#10b981", fmt: fmtPeso }, { label: "% Retención", key: "porcentajeRetencion", color: "#34d399", fmt: (v: number) => `${v}%` }, { label: "Clientes nuevos", key: "clientesNuevos", color: "#6ee7b7" }, { label: "Costo de adquisición", key: "costoAdquisicion", color: "#f59e0b", fmt: fmtPeso }] },
  { title: "Comportamiento equipo", color: "#8b5cf6", rows: [{ label: "Puntaje encuesta 1", key: "puntajeEncuestaNancy", color: "#a78bfa", fmt: (v: number) => v.toFixed(1) }, { label: "Puntaje encuesta 2", key: "puntajeEncuestaRichard", color: "#fb7185", fmt: (v: number) => v.toFixed(1) }] },
]
const CDL_SUM_KEYS = new Set(["nuevosLeads", "cantidadCampanas", "ventasCuentasNuevas", "clientesNuevos", "contenidosNancy", "contenidosRichard"])
const CDL_AVG_KEYS = new Set(["porcentajeRetencion", "costoAdquisicion", "puntajeEncuestaNancy", "puntajeEncuestaRichard"])
type CdlMes = { key: string; mes: string; anio: number; registros: CdlType[] } & Record<string, number>
type CdlMesSlot = CdlMes & { placeholder?: boolean }

function ModalCdl({ editando, prefill, onGuardar, onCerrar }: { editando: CdlType | null; prefill: { mes: string; anio: number } | null; onGuardar: (p: CdlPayload) => Promise<void>; onCerrar: () => void }) {
  const [form, setForm] = useState<CdlPayload>(() => {
    if (!editando) return { ...emptyCdlPayload(), ...(prefill ?? {}) }
    const { id: _i, documentId: _d, createdAt: _c, updatedAt: _u, ambito: _a, ...rest } = editando
    return rest
  })
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>("fechas")
  const toggleSection = (key: string) => setOpenSection(s => s === key ? null : key)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }
  const cerrarSiVacio = useModalBackdropClose(form, onCerrar)
  const numF = (label: string, key: keyof CdlPayload, step = 1) => (
    <div key={key}><label className={labelCls}>{label}</label><input type="number" min={0} step={step} title={label} value={(form[key] as number) ?? 0} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className={fieldCls} /></div>
  )
  const badgeDe = (rows: { key: string }[]) => { const llenos = rows.filter(r => (form[r.key as keyof CdlPayload] as number) > 0).length; return { badge: `${llenos}/${rows.length}`, badgeGreen: llenos === rows.length } }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={cerrarSiVacio}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editando ? "Editar CDL" : "Nuevo CDL"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <Section id="fechas" label="Fechas" badge={`${form.mes.slice(0, 3)} ${form.anio}`} openSection={openSection} onToggle={toggleSection}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Mes</label><DropdownPicker label="Mes CDL" value={form.mes} onChange={v => setForm(f => ({ ...f, mes: v }))} options={MESES_MKT.map(m => ({ value: m, label: m }))} /></div>
            <div><label className={labelCls}>Año</label><input type="number" title="Año" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))} className={fieldCls} /></div>
          </div>
        </Section>
        {CDL_SECTIONS.map(sec => {
          const { badge, badgeGreen } = badgeDe(sec.rows)
          return (
            <Section key={sec.title} id={sec.title} label={sec.title} badge={badge} badgeGreen={badgeGreen} openSection={openSection} onToggle={toggleSection}>
              <div className="grid grid-cols-2 gap-3">{sec.rows.map(r => numF(r.label, r.key as keyof CdlPayload, r.fmt ? 0.1 : 1))}</div>
            </Section>
          )
        })}
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition"><Check size={14} />{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  )
}

function DrilldownModalCdl({ row, sectionTitle, meses, onCerrar, onEditarMes }: { row: CdlRow; sectionTitle: string; meses: CdlMesSlot[]; onCerrar: () => void; onEditarMes: (m: CdlMesSlot) => void }) {
  const [desdeDate, setDesdeDate] = useState<Date | null>(null)
  const [hastaDate, setHastaDate] = useState<Date | null>(null)
  const tablaRef = useRef<HTMLDivElement>(null)
  const rango = useMemo(() => {
    if (!meses.length) return { min: null as Date | null, max: null as Date | null }
    return { min: mesAnioToDate(meses[0]!.mes, meses[0]!.anio), max: mesAnioToDate(meses[meses.length - 1]!.mes, meses[meses.length - 1]!.anio) }
  }, [meses])
  const desdeEfectiva = desdeDate ?? rango.min
  const hastaEfectiva = hastaDate ?? rango.max
  const mesesFiltrados = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return meses
    return meses.filter(m => { const d = mesAnioToDate(m.mes, m.anio); return d >= desdeEfectiva && d <= hastaEfectiva })
  }, [meses, desdeEfectiva, hastaEfectiva])
  useEffect(() => { if (tablaRef.current) tablaRef.current.scrollLeft = tablaRef.current.scrollWidth }, [mesesFiltrados])
  const fmtV = (v: number) => row.fmt ? row.fmt(v) : fmt(v)
  const chartData = mesesFiltrados.map(m => ({ label: m.mes.slice(0, 3), value: m.placeholder ? null : (m[row.key as string] as number) }))
  const conDatos = mesesFiltrados.filter(m => !m.placeholder)
  const vals = conDatos.map(m => m[row.key as string] as number)
  const nonZero = vals.filter(v => v > 0)
  const minVal = nonZero.length ? Math.min(...nonZero) : 0
  const maxVal = nonZero.length ? Math.max(...nonZero) : 0
  const avgVal = nonZero.length ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 100) / 100 : 0
  const last = vals[vals.length - 1] ?? 0
  const prev = vals[vals.length - 2] ?? 0
  const delta = last - prev
  const deltaPct = prev ? `${delta >= 0 ? "+" : ""}${((delta / prev) * 100).toFixed(1)}% vs anterior` : undefined

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{sectionTitle}</p><h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{row.label}</h2></div>
          <button type="button" title="Cerrar" onClick={onCerrar} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={18} /></button>
        </div>
        <CalendarioRango desde={desdeEfectiva} hasta={hastaEfectiva} onDesde={setDesdeDate} onHasta={setHastaDate} onReset={() => { setDesdeDate(null); setHastaDate(null) }} limiteMin={rango.min} limiteMax={rango.max} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Mínimo" value={fmtV(minVal)} /><StatChip label="Máximo" value={fmtV(maxVal)} /><StatChip label="Promedio" value={fmtV(avgVal)} /><StatChip label="Último mes" value={fmtV(last)} sub={deltaPct} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={52} tickFormatter={v => row.fmt ? row.fmt(v) : fmt(v)} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtV(v), row.label]} />
              <Line type="monotone" dataKey="value" stroke={row.color} strokeWidth={2} dot={{ r: 2, fill: row.color }} activeDot={{ r: 5 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div ref={tablaRef} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="text-xs w-full min-w-max">
            <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              {mesesFiltrados.map(m => (
                <th key={m.key} className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500">
                  <button type="button" onClick={() => onEditarMes(m)} title={m.placeholder ? "Registrar este mes" : "Editar este mes"} className={m.placeholder ? "text-slate-400 dark:text-slate-600 hover:text-violet-400 transition" : "hover:text-violet-500 transition"}>{m.mes.slice(0, 3)}</button>
                </th>
              ))}
            </tr></thead>
            <tbody><tr>
              {mesesFiltrados.map(m => {
                const v = m[row.key as string] as number
                const isMax = !m.placeholder && nonZero.length > 1 && v === maxVal
                const isMin = !m.placeholder && nonZero.length > 1 && v === minVal && v > 0
                return <td key={m.key} className={`px-3 py-2 text-center font-medium ${m.placeholder ? "text-slate-300 dark:text-slate-700" : isMax ? "text-emerald-500" : isMin ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>{m.placeholder ? "—" : fmtV(v)}</td>
              })}
            </tr></tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TabCdl() {
  const { registros, setRegistros, loading } = useGetCdl(AMBITO)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CdlType | null>(null)
  const [desdeDate, setDesdeDate] = useState<Date | null>(null)
  const [hastaDate, setHastaDate] = useState<Date | null>(null)
  const [selectedRow, setSelectedRow] = useState<{ row: CdlRow; sectionTitle: string } | null>(null)
  const [prefillCdl, setPrefillCdl] = useState<{ mes: string; anio: number } | null>(null)

  const ordenadosCdl = useMemo(() => [...registros].sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : MESES_MKT.indexOf(a.mes.trim() as typeof MESES_MKT[number]) - MESES_MKT.indexOf(b.mes.trim() as typeof MESES_MKT[number])), [registros])
  const latestOf = (arr: CdlType[]) => arr.reduce((best, r) => (r.updatedAt ?? "") >= (best.updatedAt ?? "") ? r : best, arr[0]!)
  const mesActualCdl = useMemo(() => { const hoy = new Date(); return { mes: MESES_MKT[hoy.getMonth()]!, anio: hoy.getFullYear() } }, [])

  const serieMesesCdl = useMemo((): CdlMesSlot[] => {
    if (!ordenadosCdl.length) return []
    const map = new Map<string, CdlType[]>()
    registros.forEach(r => { const key = `${r.anio}|||${r.mes.trim()}`; if (!map.has(key)) map.set(key, []); map.get(key)!.push(r) })
    const inicio = mesAnioToDate(ordenadosCdl[0]!.mes, ordenadosCdl[0]!.anio)
    const fin = mesAnioToDate(mesActualCdl.mes, mesActualCdl.anio)
    const out: CdlMesSlot[] = []
    for (let cursor = new Date(inicio); cursor <= fin; cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
      const anio = cursor.getUTCFullYear(), mes = MESES_MKT[cursor.getUTCMonth()]!
      const grupo = map.get(`${anio}|||${mes}`)
      const agg: Record<string, number> = {}
      ;[...CDL_SUM_KEYS, ...CDL_AVG_KEYS].forEach(k => { agg[k] = grupo ? (latestOf(grupo)[k as keyof CdlType] as number) ?? 0 : 0 })
      out.push({ key: `${anio}-${mes}`, mes, anio, registros: grupo ?? [], placeholder: !grupo, ...agg } as CdlMesSlot)
    }
    return out
  }, [registros, ordenadosCdl, mesActualCdl])

  const rangoDisponibleCdl = useMemo(() => {
    if (!serieMesesCdl.length) return { min: null as Date | null, max: null as Date | null }
    return { min: mesAnioToDate(serieMesesCdl[0]!.mes, serieMesesCdl[0]!.anio), max: mesAnioToDate(serieMesesCdl[serieMesesCdl.length - 1]!.mes, serieMesesCdl[serieMesesCdl.length - 1]!.anio) }
  }, [serieMesesCdl])
  const defaultDesdeFechaCdl = useMemo(() => !serieMesesCdl.length ? null : mesAnioToDate(serieMesesCdl[0]!.mes, serieMesesCdl[0]!.anio), [serieMesesCdl])
  const desdeEfectiva = desdeDate ?? defaultDesdeFechaCdl
  const hastaEfectiva = hastaDate ?? rangoDisponibleCdl.max
  const mesesCdl = useMemo(() => {
    if (!desdeEfectiva || !hastaEfectiva) return []
    return serieMesesCdl.filter(m => { const d = mesAnioToDate(m.mes, m.anio); return d >= desdeEfectiva && d <= hastaEfectiva })
  }, [serieMesesCdl, desdeEfectiva, hastaEfectiva])
  const mesesConDatosCdl = useMemo(() => mesesCdl.filter(m => !m.placeholder), [mesesCdl])
  const sparkDataCdl = useMemo(() => mesesConDatosCdl.map(m => ({ label: m.mes.slice(0, 3), ...m })), [mesesConDatosCdl])

  const abrirEdicionCdl = (m: CdlMesSlot) => {
    if (m.placeholder) { setEditando(null); setPrefillCdl({ mes: m.mes, anio: m.anio }) } else { setEditando(latestOf(m.registros)); setPrefillCdl(null) }
    setModalOpen(true)
  }
  const guardar = async (payload: CdlPayload) => {
    try {
      if (editando) { const u = await updateCdl(editando.documentId, payload); setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r)); toast.success("Actualizado") }
      else {
        const existentes = registros.filter(r => r.mes === payload.mes && r.anio === payload.anio)
        if (existentes.length > 0) { const target = latestOf(existentes); const u = await updateCdl(target.documentId, payload); setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r)); toast.success("Período actualizado") }
        else { const n = await createCdl(payload); setRegistros(prev => [...prev, n]); toast.success("Período registrado") }
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700 w-48" /><div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-700" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <CalendarioRango desde={desdeEfectiva} hasta={hastaEfectiva} onDesde={setDesdeDate} onHasta={setHastaDate} onReset={() => { setDesdeDate(rangoDisponibleCdl.min); setHastaDate(rangoDisponibleCdl.max) }} limiteMin={rangoDisponibleCdl.min} limiteMax={rangoDisponibleCdl.max} />
        <button type="button" onClick={() => {
          setEditando(null)
          const siguienteBlanco = serieMesesCdl.find(m => m.placeholder)
          setPrefillCdl(siguienteBlanco ? { mes: siguienteBlanco.mes, anio: siguienteBlanco.anio } : null)
          setModalOpen(true)
        }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition ml-auto"><Plus size={13} /> Registrar período CDL</button>
      </div>

      {mesesCdl.length === 0 ? <p className="text-slate-400 text-sm text-center py-12">Sin registros CDL aún.</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <table className="text-sm min-w-max">
            <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-48 sticky left-0 bg-white dark:bg-slate-900">Careabout</th>
              {mesesCdl.map(m => (
                <th key={m.key} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-400 min-w-[80px]">
                  <button type="button" onClick={() => abrirEdicionCdl(m)} title={m.placeholder ? "Registrar este mes" : undefined} className={m.placeholder ? "text-slate-300 dark:text-slate-600 hover:text-violet-400 transition" : "hover:text-violet-500 transition"}>{m.mes.slice(0, 3)}</button>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">{m.mes.slice(0, 3)} {m.anio}</p>
                </th>
              ))}
              <th className="px-3 py-3 text-[10px] font-semibold text-slate-500 min-w-[88px]">Tendencia</th>
            </tr></thead>
            <tbody>
              {CDL_SECTIONS.map(sec => sec.rows.map((row, ri) => (
                <tr key={`${sec.title}-${row.key}`} onClick={() => setSelectedRow({ row, sectionTitle: sec.title })} className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${ri === 0 ? "border-t border-slate-200 dark:border-slate-700" : ""}`}>
                  <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900" style={{ boxShadow: `inset 2px 0 0 0 ${sec.color}99` }}>
                    {ri === 0 && <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{sec.title}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-700 dark:text-slate-300">{row.label}</p>
                      <button type="button" title="Ver gráfica" onClick={() => setSelectedRow({ row, sectionTitle: sec.title })} className="shrink-0 p-1 -m-1 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition rounded"><BarChart2 size={13} /></button>
                    </div>
                  </td>
                  {mesesCdl.map(m => { const v = m[row.key as string] as number; return <td key={m.key} className="px-3 py-2.5 text-center">{m.placeholder ? <span className="text-xs text-slate-300 dark:text-slate-700">—</span> : <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{row.fmt ? row.fmt(v) : fmt(v)}</span>}</td> })}
                  <td className="px-3 py-2.5"><Sparkline data={sparkDataCdl} dataKey={row.key as string} color={row.color} /></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
      {selectedRow && <DrilldownModalCdl row={selectedRow.row} sectionTitle={selectedRow.sectionTitle} meses={serieMesesCdl} onCerrar={() => setSelectedRow(null)} onEditarMes={abrirEdicionCdl} />}
      {modalOpen && <ModalCdl editando={editando} prefill={prefillCdl} onGuardar={guardar} onCerrar={() => { setModalOpen(false); setPrefillCdl(null) }} />}
    </div>
  )
}

// ══════════ VISTA PRINCIPAL ══════════

export function IndicadoresView() {
  const [tab, setTab] = useState<Tab>("funnel")
  return (
    <div>
      <SubTabBar active={tab} onChange={setTab} />
      {tab === "funnel"   && <TabFunnel />}
      {tab === "boxscore" && <TabBoxscore />}
      {tab === "cdl"       && <TabCdl />}
    </div>
  )
}
