"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Plus, Pencil, Trash2, X, Check,
  BarChart2, TableProperties, Users,
} from "lucide-react"
import { toast } from "sonner"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import { useGetEcosistema } from "@/api/ecosistema-mkt/getEcosistema"
import { createEcosistema, updateEcosistema, deleteEcosistema } from "@/api/ecosistema-mkt/mutateEcosistema"
import { EcosistemaType, EcosistemaPayload, MESES_MKT, MesEcosistema } from "@/types/ecosistema-mkt"
import { useGetBoxscore } from "@/api/boxscore-semana/getBoxscore"
import { createBoxscore, updateBoxscore, deleteBoxscore } from "@/api/boxscore-semana/mutateBoxscore"
import { BoxscoreType, BoxscorePayload } from "@/types/boxscore-semana"
import { useGetCdl } from "@/api/cdl-metricas/getCdl"
import { createCdl, updateCdl, deleteCdl } from "@/api/cdl-metricas/mutateCdl"
import { CdlType, CdlPayload } from "@/types/cdl-metricas"

// ─── Shared helpers ───────────────────────────────────────────────────────────

const ANIO_ACTUAL = new Date().getFullYear()

function pct(num: number, den: number): string {
  if (!den) return "—"
  return `${((num / den) * 100).toFixed(1)}%`
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function fmtPeso(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
}

function TasaBadge({ num, den }: { num: number; den: number }) {
  if (!den) return <span className="text-[10px] text-slate-600">—</span>
  const ratio = num / den
  const color = ratio >= 0.05 ? "text-emerald-400" : ratio >= 0.01 ? "text-yellow-400" : "text-red-400"
  return <span className={`text-[10px] font-medium ${color}`}>{pct(num, den)}</span>
}

function MetricaCell({ value, sub, subDen }: { value: number; sub?: number; subDen?: number }) {
  return (
    <td className="px-3 py-3 text-center whitespace-nowrap">
      <p className="text-sm font-semibold text-slate-100">{fmt(value)}</p>
      {sub !== undefined && subDen !== undefined && <TasaBadge num={sub} den={subDen} />}
    </td>
  )
}

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
const labelCls = "block text-[11px] text-slate-500 mb-1"

// ─── Tab selector ─────────────────────────────────────────────────────────────

type Tab = "funnel" | "boxscore" | "cdl"

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "funnel",   label: "Funnel",    icon: <BarChart2 size={14} /> },
    { id: "boxscore", label: "BoxScore",  icon: <TableProperties size={14} /> },
    { id: "cdl",      label: "CDL",       icon: <Users size={14} /> },
  ]
  return (
    <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
      {tabs.map(t => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${active === t.id ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — FUNNEL
// ══════════════════════════════════════════════════════════════════════════════

function emptyFunnelPayload(): EcosistemaPayload {
  return {
    mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL, canal: null,
    impresiones: 0, visitas: 0, clics: 0, leads: 0,
    contactosNuevos: 0, compras: 0, montoCompras: 0, notas: null,
  }
}

function ModalFunnel({ editando, onGuardar, onCerrar }: {
  editando: EcosistemaType | null
  onGuardar: (p: EcosistemaPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm] = useState<EcosistemaPayload>(
    editando
      ? { mes: editando.mes, anio: editando.anio, canal: editando.canal,
          impresiones: editando.impresiones, visitas: editando.visitas, clics: editando.clics,
          leads: editando.leads, contactosNuevos: editando.contactosNuevos,
          compras: editando.compras, montoCompras: editando.montoCompras, notas: editando.notas }
      : emptyFunnelPayload()
  )
  const [saving, setSaving] = useState(false)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }
  const num = (key: keyof EcosistemaPayload) => (
    <input type="number" min={0} title={String(key)} value={(form[key] as number) ?? 0}
      onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
      className={inputCls} />
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar registro" : "Nuevo registro"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Mes</label>
            <select value={form.mes} aria-label="Mes"
              onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesEcosistema }))}
              className={inputCls}>
              {MESES_MKT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Año</label>
            <input type="number" title="Año" value={form.anio}
              onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Canal (opcional)</label>
          <input value={form.canal ?? ""} onChange={e => setForm(f => ({ ...f, canal: e.target.value || null }))}
            placeholder="Instagram, Email, Google Ads…" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([["Impresiones","impresiones"],["Visitas","visitas"],["Clics","clics"],["Leads","leads"],
             ["Contactos nuevos","contactosNuevos"],["Compras","compras"]] as const).map(([label, key]) => (
            <div key={key}><label className={labelCls}>{label}</label>{num(key)}</div>
          ))}
          <div className="col-span-2">
            <label className={labelCls}>Monto de compras (MXN)</label>{num("montoCompras")}
          </div>
        </div>
        <div>
          <label className={labelCls}>Notas</label>
          <textarea value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
            rows={2} placeholder="Observaciones del período…"
            className={`${inputCls} resize-none`} />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function TabFunnel() {
  const { registros, setRegistros, loading } = useGetEcosistema()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<EcosistemaType | null>(null)
  const [filtroAnio, setFiltroAnio] = useState<number | "">(ANIO_ACTUAL)

  const aniosUsados = useMemo(() => [...new Set(registros.map(r => r.anio))].sort((a,b)=>b-a), [registros])
  const filtrados   = useMemo(() =>
    registros.filter(r => !filtroAnio || r.anio === filtroAnio)
      .sort((a,b) => a.anio !== b.anio ? b.anio - a.anio : MESES_MKT.indexOf(a.mes) - MESES_MKT.indexOf(b.mes)),
    [registros, filtroAnio])

  const totales = useMemo(() => ({
    impresiones: filtrados.reduce((s,r)=>s+r.impresiones,0),
    visitas: filtrados.reduce((s,r)=>s+r.visitas,0),
    clics: filtrados.reduce((s,r)=>s+r.clics,0),
    leads: filtrados.reduce((s,r)=>s+r.leads,0),
    contactosNuevos: filtrados.reduce((s,r)=>s+r.contactosNuevos,0),
    compras: filtrados.reduce((s,r)=>s+r.compras,0),
    montoCompras: filtrados.reduce((s,r)=>s+r.montoCompras,0),
  }), [filtrados])

  const guardar = async (payload: EcosistemaPayload) => {
    try {
      if (editando) {
        const u = await updateEcosistema(editando.documentId, payload)
        setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r))
        toast.success("Actualizado")
      } else {
        const n = await createEcosistema(payload)
        setRegistros(prev => [...prev, n])
        toast.success("Creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  const borrar = async (r: EcosistemaType) => {
    if (!confirm(`¿Eliminar ${r.mes} ${r.anio}?`)) return
    try {
      await deleteEcosistema(r.documentId)
      setRegistros(prev => prev.filter(x => x.documentId !== r.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
  }

  // Gráfica de tendencia
  const chartData = useMemo(() =>
    [...filtrados].reverse().map(r => ({
      label: `${r.mes.slice(0,3)} ${r.anio}`,
      Visitas: r.visitas, Leads: r.leads, Compras: r.compras,
    })), [filtrados])

  if (loading) return <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <select aria-label="Año" value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value ? Number(e.target.value) : "")}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
          <option value="">Todos los años</option>
          {aniosUsados.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button type="button" onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition ml-auto">
          <Plus size={13} /> Registrar período
        </button>
      </div>

      {registros.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">Sin registros aún.</p>
      ) : (
        <>
          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  {["Período","Impresiones","Visitas","Clics","Leads","Contactos","Compras","Revenue",""].map((h,i) => (
                    <th key={i} className={`px-3 py-3 ${i === 0 ? "text-left" : "text-center"} text-[10px] font-semibold uppercase tracking-wider ${i === 7 ? "text-emerald-600" : "text-slate-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtrados.map(r => (
                  <tr key={r.documentId} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-200">{r.mes} {r.anio}</p>
                      {r.canal && <p className="text-[10px] text-slate-500">{r.canal}</p>}
                    </td>
                    <MetricaCell value={r.impresiones} />
                    <MetricaCell value={r.visitas}         sub={r.visitas}         subDen={r.impresiones} />
                    <MetricaCell value={r.clics}           sub={r.clics}           subDen={r.visitas} />
                    <MetricaCell value={r.leads}           sub={r.leads}           subDen={r.clics} />
                    <MetricaCell value={r.contactosNuevos} sub={r.contactosNuevos} subDen={r.leads} />
                    <MetricaCell value={r.compras}         sub={r.compras}         subDen={r.contactosNuevos} />
                    <td className="px-3 py-3 text-center">
                      {r.montoCompras > 0
                        ? <span className="text-sm font-semibold text-emerald-400">{fmtPeso(r.montoCompras)}</span>
                        : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button type="button" onClick={() => { setEditando(r); setModalOpen(true) }} title="Editar"
                          className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition"><Pencil size={13} /></button>
                        <button type="button" onClick={() => borrar(r)} title="Eliminar"
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-700 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtrados.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-900/80">
                    <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total {filtroAnio || ""}</td>
                    <MetricaCell value={totales.impresiones} />
                    <MetricaCell value={totales.visitas}         sub={totales.visitas}         subDen={totales.impresiones} />
                    <MetricaCell value={totales.clics}           sub={totales.clics}           subDen={totales.visitas} />
                    <MetricaCell value={totales.leads}           sub={totales.leads}           subDen={totales.clics} />
                    <MetricaCell value={totales.contactosNuevos} sub={totales.contactosNuevos} subDen={totales.leads} />
                    <MetricaCell value={totales.compras}         sub={totales.compras}         subDen={totales.contactosNuevos} />
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-emerald-400">{fmtPeso(totales.montoCompras)}</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Gráfica tendencia */}
          {chartData.length >= 2 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Tendencia mensual</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={40} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Visitas"  stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Leads"    stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Compras"  stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <ModalFunnel editando={editando} onGuardar={guardar} onCerrar={() => setModalOpen(false)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — BOXSCORE
// ══════════════════════════════════════════════════════════════════════════════

function emptyBoxscorePayload(): BoxscorePayload {
  return {
    semana: 1, mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL,
    tasaApertura: 0, tasaClics: 0, tasaRechazos: 0,
    traficoDirectoCorp: 0, traficoDirectoStore: 0,
    impresionesCorp: 0, impresionesStore: 0,
    traficoOrganicoCorp: 0, traficoOrganicoStore: 0,
    impresionesSEM: 0, traficoPagaSEM: 0, clicsSEM: 0, conversionesSEM: 0,
    impresionesCYA: 0, clicsCYA: 0, conversionesCYA: 0,
    impresionesIC: 0, clicsIC: 0, conversionesIC: 0,
    traficoGeneral: 0,
  }
}

function ModalBoxscore({ editando, onGuardar, onCerrar }: {
  editando: BoxscoreType | null
  onGuardar: (p: BoxscorePayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm] = useState<BoxscorePayload>(
    editando ? { ...editando } : emptyBoxscorePayload()
  )
  const [saving, setSaving] = useState(false)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }

  const numField = (label: string, key: keyof BoxscorePayload, step = 1) => (
    <div key={key}>
      <label className={labelCls}>{label}</label>
      <input type="number" min={0} step={step} title={label} value={(form[key] as number) ?? 0}
        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
        className={inputCls} />
    </div>
  )

  const sections: { title: string; fields: [string, keyof BoxscorePayload, number?][] }[] = [
    { title: "Nutrimiento (Email)", fields: [
      ["Tasa Apertura (%)", "tasaApertura", 0.1],
      ["Tasa Clics (%)",    "tasaClics",    0.1],
      ["Tasa Rechazos (%)", "tasaRechazos", 0.1],
    ]},
    { title: "Autoridad (SEO)", fields: [
      ["Tráfico Directo Corp",    "traficoDirectoCorp"],
      ["Tráfico Directo Store",   "traficoDirectoStore"],
      ["Impresiones Corp",        "impresionesCorp"],
      ["Impresiones Store",       "impresionesStore"],
      ["Tráfico Orgánico Corp",   "traficoOrganicoCorp"],
      ["Tráfico Orgánico Store",  "traficoOrganicoStore"],
    ]},
    { title: "Visibilidad SEM", fields: [
      ["Impresiones SEM",   "impresionesSEM"],
      ["Tráfico Paga SEM",  "traficoPagaSEM"],
      ["Clics SEM",         "clicsSEM"],
      ["Conversiones SEM",  "conversionesSEM"],
    ]},
    { title: "Visibilidad CYA", fields: [
      ["Impresiones CYA",   "impresionesCYA"],
      ["Clics CYA",         "clicsCYA"],
      ["Conversiones CYA",  "conversionesCYA"],
    ]},
    { title: "Visibilidad IC", fields: [
      ["Impresiones IC",    "impresionesIC"],
      ["Clics IC",          "clicsIC"],
      ["Conversiones IC",   "conversionesIC"],
    ]},
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl my-8 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar semana" : "Nueva semana"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Semana (WK)</label>
            <input type="number" min={1} title="Semana WK" value={form.semana}
              onChange={e => setForm(f => ({ ...f, semana: Number(e.target.value) }))}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mes</label>
            <select value={form.mes} aria-label="Mes"
              onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              className={inputCls}>
              {MESES_MKT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Año</label>
            <input type="number" title="Año" value={form.anio}
              onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
              className={inputCls} />
          </div>
        </div>

        {sections.map(sec => (
          <div key={sec.title}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{sec.title}</p>
            <div className="grid grid-cols-3 gap-3">
              {sec.fields.map(([label, key, step]) => numField(label, key, step))}
            </div>
          </div>
        ))}

        <div>
          <label className={labelCls}>Tráfico General</label>
          <input type="number" min={0} title="Tráfico General" value={form.traficoGeneral}
            onChange={e => setForm(f => ({ ...f, traficoGeneral: Number(e.target.value) }))}
            className={inputCls} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mini sparkline inline usando recharts
function Sparkline({ data, dataKey, color }: { data: object[]; dataKey: string; color: string }) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

type BSRow = { label: string; section: string; key: keyof BoxscoreType; color: string; fmt?: (v: number) => string }

const BS_ROWS: BSRow[] = [
  { label: "Tasa Apertura",       section: "Nutrimiento",       key: "tasaApertura",         color: "#3b82f6", fmt: v => `${v}%` },
  { label: "Tasa Clics",          section: "Nutrimiento",       key: "tasaClics",             color: "#6366f1", fmt: v => `${v}%` },
  { label: "Tasa Rechazos",       section: "Nutrimiento",       key: "tasaRechazos",          color: "#ef4444", fmt: v => `${v}%` },
  { label: "Tráfico Dir. Corp",   section: "Nutrimiento",       key: "traficoDirectoCorp",    color: "#3b82f6" },
  { label: "Tráfico Dir. Store",  section: "Nutrimiento",       key: "traficoDirectoStore",   color: "#8b5cf6" },
  { label: "Impresiones Corp",    section: "Autoridad (SEO)",   key: "impresionesCorp",       color: "#3b82f6" },
  { label: "Impresiones Store",   section: "Autoridad (SEO)",   key: "impresionesStore",      color: "#8b5cf6" },
  { label: "Tráf. Orgánico Corp", section: "Autoridad (SEO)",   key: "traficoOrganicoCorp",   color: "#3b82f6" },
  { label: "Tráf. Orgánico Store",section: "Autoridad (SEO)",   key: "traficoOrganicoStore",  color: "#8b5cf6" },
  { label: "Impresiones",         section: "Visibilidad SEM",   key: "impresionesSEM",        color: "#f59e0b" },
  { label: "Tráfico Paga",        section: "Visibilidad SEM",   key: "traficoPagaSEM",        color: "#f97316" },
  { label: "Clics",               section: "Visibilidad SEM",   key: "clicsSEM",              color: "#eab308" },
  { label: "Conversiones",        section: "Visibilidad SEM",   key: "conversionesSEM",       color: "#10b981" },
  { label: "Impresiones",         section: "Visibilidad CYA",   key: "impresionesCYA",        color: "#f59e0b" },
  { label: "Clics",               section: "Visibilidad CYA",   key: "clicsCYA",              color: "#eab308" },
  { label: "Conversiones",        section: "Visibilidad CYA",   key: "conversionesCYA",       color: "#10b981" },
  { label: "Impresiones",         section: "Visibilidad IC",    key: "impresionesIC",         color: "#f59e0b" },
  { label: "Clics",               section: "Visibilidad IC",    key: "clicsIC",               color: "#eab308" },
  { label: "Conversiones",        section: "Visibilidad IC",    key: "conversionesIC",        color: "#10b981" },
  { label: "Tráfico General",     section: "General",           key: "traficoGeneral",        color: "#22d3ee" },
]

const SECTION_COLORS: Record<string, string> = {
  "Nutrimiento":     "border-l-blue-500/60",
  "Autoridad (SEO)": "border-l-violet-500/60",
  "Visibilidad SEM": "border-l-amber-500/60",
  "Visibilidad CYA": "border-l-orange-500/60",
  "Visibilidad IC":  "border-l-pink-500/60",
  "General":         "border-l-cyan-500/60",
}

// ─── Drilldown ────────────────────────────────────────────────────────────────

function StatChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function DrilldownModal({ row, semanas, onCerrar }: {
  row: BSRow; semanas: BoxscoreType[]; onCerrar: () => void
}) {
  const fmtV = (v: number) => row.fmt ? row.fmt(v) : fmt(v)
  const chartData = semanas.map(s => ({ label: `WK${s.semana}`, value: s[row.key] as number }))
  const vals = chartData.map(d => d.value)
  const nonZero = vals.filter(v => v > 0)
  const minVal = nonZero.length ? Math.min(...nonZero) : 0
  const maxVal = nonZero.length ? Math.max(...nonZero) : 0
  const avgVal = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0
  const last = vals[vals.length - 1] ?? 0
  const prev = vals[vals.length - 2] ?? 0
  const delta = last - prev
  const deltaPct = prev ? `${delta >= 0 ? "+" : ""}${((delta / prev) * 100).toFixed(1)}% vs anterior` : undefined

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.section}</p>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">{row.label}</h2>
          </div>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Mínimo"        value={fmtV(minVal)} />
          <StatChip label="Máximo"        value={fmtV(maxVal)} />
          <StatChip label="Promedio"      value={fmtV(avgVal)} />
          <StatChip label="Última semana" value={fmtV(last)} sub={deltaPct} />
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={52}
                tickFormatter={v => row.fmt ? row.fmt(v) : fmt(v)} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmtV(v), row.label]}
              />
              <Line type="monotone" dataKey="value" stroke={row.color} strokeWidth={2}
                dot={{ r: 2, fill: row.color }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="text-xs w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {semanas.map(s => (
                  <th key={s.documentId} className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500">
                    WK{s.semana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {semanas.map(s => {
                  const v = s[row.key] as number
                  const isMax = nonZero.length > 1 && v === maxVal
                  const isMin = nonZero.length > 1 && v === minVal && v > 0
                  return (
                    <td key={s.documentId}
                      className={`px-3 py-2 text-center font-medium ${isMax ? "text-emerald-400" : isMin ? "text-red-400" : "text-slate-300"}`}>
                      {fmtV(v)}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TabBoxscore() {
  const { registros, setRegistros, loading } = useGetBoxscore()
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editando,    setEditando]    = useState<BoxscoreType | null>(null)
  const [selectedRow, setSelectedRow] = useState<BSRow | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Opciones de semana ordenadas cronológicamente
  const weekOptions = useMemo(() =>
    [...registros]
      .sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.semana - b.semana)
      .map(r => ({ value: `${r.semana}-${r.anio}`, label: `WK${r.semana} ${r.mes.slice(0,3)} ${r.anio}` })),
    [registros])

  const [desde, setDesde] = useState("")
  const [hasta,  setHasta]  = useState("")

  // Inicializar rango al cargar
  useEffect(() => {
    if (!weekOptions.length) return
    if (!desde) setDesde(weekOptions[0].value)
    if (!hasta)  setHasta(weekOptions[weekOptions.length - 1].value)
  }, [weekOptions])

  const semanas = useMemo(() => {
    const parse = (v: string) => { const [wk, an] = v.split("-").map(Number); return { wk, an } }
    return [...registros]
      .sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.semana - b.semana)
      .filter(r => {
        if (desde) { const { wk, an } = parse(desde); if (r.anio < an || (r.anio === an && r.semana < wk)) return false }
        if (hasta)  { const { wk, an } = parse(hasta);  if (r.anio > an || (r.anio === an && r.semana > wk)) return false }
        return true
      })
  }, [registros, desde, hasta])

  // Scroll al final para mostrar semanas más recientes
  useEffect(() => {
    if (tableRef.current && semanas.length) {
      tableRef.current.scrollLeft = tableRef.current.scrollWidth
    }
  }, [semanas])

  const sparkData = useMemo(() => semanas.map(r => ({ label: `WK${r.semana}`, ...r })), [semanas])

  const guardar = async (payload: BoxscorePayload) => {
    try {
      if (editando) {
        const u = await updateBoxscore(editando.documentId, payload)
        setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r))
        toast.success("Actualizado")
      } else {
        const n = await createBoxscore(payload)
        setRegistros(prev => [...prev, n])
        toast.success("Creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  const borrar = async (r: BoxscoreType) => {
    if (!confirm(`¿Eliminar WK${r.semana} ${r.mes} ${r.anio}?`)) return
    try {
      await deleteBoxscore(r.documentId)
      setRegistros(prev => prev.filter(x => x.documentId !== r.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error") }
  }

  if (loading) return <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>

  const sections = [...new Set(BS_ROWS.map(r => r.section))]

  return (
    <div className="space-y-6">
      {/* Filtro rango de semanas */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">Desde</span>
          <select aria-label="Desde semana" value={desde} onChange={e => setDesde(e.target.value)}
            className="text-xs bg-transparent text-slate-300 outline-none">
            {weekOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">Hasta</span>
          <select aria-label="Hasta semana" value={hasta} onChange={e => setHasta(e.target.value)}
            className="text-xs bg-transparent text-slate-300 outline-none">
            {weekOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="button"
          onClick={() => { setDesde(weekOptions[0]?.value ?? ""); setHasta(weekOptions[weekOptions.length - 1]?.value ?? "") }}
          className="text-[10px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition">
          Todo
        </button>
        <button type="button" onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition ml-auto">
          <Plus size={13} /> Registrar semana
        </button>
      </div>

      {semanas.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">Sin semanas en el rango seleccionado.</p>
      ) : (
        <div ref={tableRef} className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="text-sm min-w-max">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-48 sticky left-0 bg-slate-900/80 z-10">
                  Métrica
                  <span className="block text-[9px] font-normal normal-case text-slate-600 mt-0.5">doble clic = detalle</span>
                </th>
                {semanas.map(s => (
                  <th key={s.documentId} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-400 min-w-[72px]">
                    <button type="button" onClick={() => { setEditando(s); setModalOpen(true) }}
                      className="hover:text-blue-400 transition">WK{s.semana}</button>
                    <p className="text-[9px] text-slate-600 font-normal">{s.mes.slice(0,3)}</p>
                  </th>
                ))}
                <th className="px-3 py-3 text-[10px] font-semibold text-slate-500 min-w-[88px]">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(sec => {
                const rows = BS_ROWS.filter(r => r.section === sec)
                const accentCls = SECTION_COLORS[sec] ?? "border-l-slate-600"
                return rows.map((row, ri) => (
                  <tr key={`${sec}-${row.key}`}
                    onDoubleClick={() => setSelectedRow(row)}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer select-none
                      ${ri === 0 ? "border-t border-slate-700" : ""}`}>
                    <td className={`px-4 py-2.5 sticky left-0 bg-slate-950 border-l-2 ${accentCls} z-10`}>
                      {ri === 0 && (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{sec}</p>
                      )}
                      <p className="text-xs text-slate-300">{row.label}</p>
                    </td>
                    {semanas.map(s => {
                      const v = s[row.key] as number
                      return (
                        <td key={s.documentId} className="px-3 py-2.5 text-center">
                          <span className="text-xs font-medium text-slate-200">
                            {row.fmt ? row.fmt(v) : fmt(v)}
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5">
                      <Sparkline data={sparkData} dataKey={row.key as string} color={row.color} />
                    </td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )}

      {sparkData.length >= 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Tráfico general por semana</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sparkData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={44} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="traficoGeneral" fill="#22d3ee" radius={[3,3,0,0]} name="Tráfico" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedRow && (
        <DrilldownModal row={selectedRow} semanas={semanas} onCerrar={() => setSelectedRow(null)} />
      )}

      {modalOpen && (
        <ModalBoxscore editando={editando} onGuardar={guardar} onCerrar={() => setModalOpen(false)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — CDL
// ══════════════════════════════════════════════════════════════════════════════

function emtpyCdlPayload(): CdlPayload {
  return {
    semana: null, mes: MESES_MKT[new Date().getMonth()], anio: ANIO_ACTUAL,
    nuevosLeads: 0, cantidadCampanas: 0,
    ventasCuentasNuevas: 0, porcentajeRetencion: 0, clientesNuevos: 0, costoAdquisicion: 0,
    contenidosNancy: 0, puntajeEncuestaNancy: 0,
    contenidosRichard: 0, puntajeEncuestaRichard: 0,
  }
}

function ModalCdl({ editando, onGuardar, onCerrar }: {
  editando: CdlType | null
  onGuardar: (p: CdlPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm] = useState<CdlPayload>(
    editando ? { ...editando } : emtpyCdlPayload()
  )
  const [saving, setSaving] = useState(false)
  const guardar = async () => { setSaving(true); try { await onGuardar(form) } finally { setSaving(false) } }

  const numF = (label: string, key: keyof CdlPayload, step = 1) => (
    <div key={key}>
      <label className={labelCls}>{label}</label>
      <input type="number" min={0} step={step} title={label} value={(form[key] as number) ?? 0}
        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
        className={inputCls} />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar CDL" : "Nuevo CDL"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Semana (opcional)</label>
            <input type="number" min={1} value={form.semana ?? ""}
              onChange={e => setForm(f => ({ ...f, semana: e.target.value ? Number(e.target.value) : null }))}
              placeholder="—" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mes</label>
            <select value={form.mes} aria-label="Mes CDL"
              onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              className={inputCls}>
              {MESES_MKT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Año</label>
            <input type="number" title="Año" value={form.anio}
              onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
              className={inputCls} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Careabouts generales</p>
          <div className="grid grid-cols-2 gap-3">
            {numF("Nuevos leads / contactos", "nuevosLeads")}
            {numF("Cantidad de campañas", "cantidadCampanas")}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Careabouts financieros</p>
          <div className="grid grid-cols-2 gap-3">
            {numF("Ventas cuentas nuevas (MXN)", "ventasCuentasNuevas")}
            {numF("% Retención", "porcentajeRetencion", 0.1)}
            {numF("Clientes nuevos", "clientesNuevos")}
            {numF("Costo de adquisición (MXN)", "costoAdquisicion")}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Comportamiento Nancy</p>
          <div className="grid grid-cols-2 gap-3">
            {numF("Contenidos publicados", "contenidosNancy")}
            {numF("Puntaje encuesta", "puntajeEncuestaNancy", 0.1)}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Comportamiento Richard</p>
          <div className="grid grid-cols-2 gap-3">
            {numF("Contenidos publicados", "contenidosRichard")}
            {numF("Puntaje encuesta", "puntajeEncuestaRichard", 0.1)}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">Cancelar</button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />{saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

const CDL_SECTIONS = [
  {
    title: "Careabouts generales", color: "border-l-blue-500/60",
    rows: [
      { label: "Nuevos leads / contactos", key: "nuevosLeads"      as const, color: "#3b82f6" },
      { label: "Campañas publicadas",       key: "cantidadCampanas" as const, color: "#6366f1" },
    ],
  },
  {
    title: "Careabouts financieros", color: "border-l-emerald-500/60",
    rows: [
      { label: "Ventas cuentas nuevas",   key: "ventasCuentasNuevas"  as const, color: "#10b981", fmt: fmtPeso },
      { label: "% Retención",             key: "porcentajeRetencion"  as const, color: "#34d399", fmt: (v: number) => `${v}%` },
      { label: "Clientes nuevos",         key: "clientesNuevos"       as const, color: "#6ee7b7" },
      { label: "Costo de adquisición",    key: "costoAdquisicion"     as const, color: "#f59e0b", fmt: fmtPeso },
    ],
  },
  {
    title: "Comportamiento Nancy", color: "border-l-violet-500/60",
    rows: [
      { label: "Contenidos publicados",  key: "contenidosNancy"       as const, color: "#8b5cf6" },
      { label: "Puntaje encuesta",       key: "puntajeEncuestaNancy"  as const, color: "#a78bfa", fmt: (v: number) => v.toFixed(1) },
    ],
  },
  {
    title: "Comportamiento Richard", color: "border-l-rose-500/60",
    rows: [
      { label: "Contenidos publicados",  key: "contenidosRichard"       as const, color: "#f43f5e" },
      { label: "Puntaje encuesta",       key: "puntajeEncuestaRichard"  as const, color: "#fb7185", fmt: (v: number) => v.toFixed(1) },
    ],
  },
]

function TabCdl() {
  const { registros, setRegistros, loading } = useGetCdl()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<CdlType | null>(null)
  const [filtroAnio, setFiltroAnio] = useState<number | "">(ANIO_ACTUAL)

  const aniosUsados = useMemo(() => [...new Set(registros.map(r => r.anio))].sort((a,b)=>b-a), [registros])

  const periodos = useMemo(() =>
    registros
      .filter(r => !filtroAnio || r.anio === filtroAnio)
      .sort((a,b) => {
        if (a.anio !== b.anio) return a.anio - b.anio
        if (MESES_MKT.indexOf(a.mes) !== MESES_MKT.indexOf(b.mes))
          return MESES_MKT.indexOf(a.mes) - MESES_MKT.indexOf(b.mes)
        return (a.semana ?? 0) - (b.semana ?? 0)
      }),
    [registros, filtroAnio])

  const colLabel = (r: CdlType) => r.semana ? `WK${r.semana}` : r.mes.slice(0,3)

  const chartData = useMemo(() =>
    periodos.map(r => ({
      label: colLabel(r),
      Leads: r.nuevosLeads,
      Campañas: r.cantidadCampanas,
      "Clientes nuevos": r.clientesNuevos,
      "Nancy contenidos": r.contenidosNancy,
      "Richard contenidos": r.contenidosRichard,
    })), [periodos])

  const guardar = async (payload: CdlPayload) => {
    try {
      if (editando) {
        const u = await updateCdl(editando.documentId, payload)
        setRegistros(prev => prev.map(r => r.documentId === u.documentId ? u : r))
        toast.success("Actualizado")
      } else {
        const n = await createCdl(payload)
        setRegistros(prev => [...prev, n])
        toast.success("Creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
  }

  const borrar = async (r: CdlType) => {
    if (!confirm(`¿Eliminar registro CDL?`)) return
    try {
      await deleteCdl(r.documentId)
      setRegistros(prev => prev.filter(x => x.documentId !== r.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error") }
  }

  if (loading) return <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <select aria-label="Año CDL" value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value ? Number(e.target.value) : "")}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
          <option value="">Todos los años</option>
          {aniosUsados.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button type="button" onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition ml-auto">
          <Plus size={13} /> Registrar período CDL
        </button>
      </div>

      {periodos.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">Sin registros CDL aún.</p>
      ) : (
        <>
          {/* Tabla CDL estilo BoxScore */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="text-sm min-w-max">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-48 sticky left-0 bg-slate-900/80">Careabout</th>
                  {periodos.map(r => (
                    <th key={r.documentId} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-400 min-w-[72px]">
                      <button type="button" onClick={() => { setEditando(r); setModalOpen(true) }}
                        className="hover:text-blue-400 transition">{colLabel(r)}</button>
                      <p className="text-[9px] text-slate-600 font-normal">{r.mes.slice(0,3)} {r.anio}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CDL_SECTIONS.map(sec => (
                  sec.rows.map((row, ri) => (
                    <tr key={`${sec.title}-${row.key}`}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors
                        ${ri === 0 ? "border-t border-slate-700" : ""}`}>
                      <td className={`px-4 py-2.5 sticky left-0 bg-slate-950 border-l-2 ${sec.color}`}>
                        {ri === 0 && (
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{sec.title}</p>
                        )}
                        <p className="text-xs text-slate-300">{row.label}</p>
                      </td>
                      {periodos.map(r => {
                        const v = r[row.key] as number
                        return (
                          <td key={r.documentId} className="px-3 py-2.5 text-center">
                            <span className="text-xs font-medium text-slate-200">
                              {"fmt" in row ? row.fmt!(v) : fmt(v)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>

          {/* Acciones en la tabla — eliminar al hover */}
          <div className="flex flex-wrap gap-2">
            {periodos.map(r => (
              <button key={r.documentId} type="button" onClick={() => borrar(r)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-600 hover:text-red-400 rounded border border-slate-800 hover:border-red-900/40 transition">
                <Trash2 size={10} /> {colLabel(r)} {r.mes.slice(0,3)} {r.anio}
              </button>
            ))}
          </div>

          {/* Gráficas CDL */}
          {chartData.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Leads & Campañas</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={36} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Leads"    fill="#3b82f6" radius={[3,3,0,0]} />
                    <Bar dataKey="Campañas" fill="#6366f1" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Clientes nuevos</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={36} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="Clientes nuevos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Contenidos publicados — Nancy vs Richard</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} width={36} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Nancy contenidos"   fill="#8b5cf6" radius={[3,3,0,0]} />
                    <Bar dataKey="Richard contenidos" fill="#f43f5e" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <ModalCdl editando={editando} onGuardar={guardar} onCerrar={() => setModalOpen(false)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function EcosistemaView() {
  const [tab, setTab] = useState<Tab>("funnel")

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Ecosistema marketing</h1>
        <p className="text-sm text-slate-500">Funnel, BoxScore semanal y métricas CDL</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "funnel"    && <TabFunnel />}
      {tab === "boxscore"  && <TabBoxscore />}
      {tab === "cdl"       && <TabCdl />}
    </div>
  )
}
