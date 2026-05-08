"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useGetMetricas, createMetrica, deleteMetrica } from "@/api/metrica-corporal/getMetricas"
import { MetricaCorporalType } from "@/types/salud"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const MEDIDAS_PRESET = ["cintura","cadera","pecho","brazo_derecho","brazo_izquierdo","muslo_derecho"]

function tendencia(valores: number[]): "up"|"down"|"flat" {
  if (valores.length < 2) return "flat"
  const diff = valores[0] - valores[valores.length - 1]
  if (Math.abs(diff) < 0.3) return "flat"
  return diff < 0 ? "up" : "down"
}

function FormMetrica({ onSave, onCancel }: {
  onSave: (m: MetricaCorporalType) => void
  onCancel: () => void
}) {
  const [fecha,   setFecha]   = useState(new Date().toISOString().slice(0,10))
  const [peso,    setPeso]    = useState("")
  const [grasa,   setGrasa]   = useState("")
  const [musculo, setMusculo] = useState("")
  const [medidas, setMedidas] = useState<Record<string,string>>({})
  const [notas,   setNotas]   = useState("")
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    const medidasNum: Record<string,number> = {}
    Object.entries(medidas).forEach(([k,v]) => { if (v) medidasNum[k] = Number(v) })
    const payload: any = {
      fecha, notas: notas || null,
      peso:    peso    ? Number(peso)    : null,
      grasa:   grasa   ? Number(grasa)   : null,
      musculo: musculo ? Number(musculo) : null,
      medidas: Object.keys(medidasNum).length ? medidasNum : null,
    }
    const res = await createMetrica(payload)
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="p-5 rounded-xl bg-slate-800/80 border border-violet-500/30 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Registro de Métricas</h3>

      <div>
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="met-fecha">Fecha</label>
        <input id="met-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="met-peso">Peso (kg)</label>
          <input id="met-peso" type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} placeholder="70.5"
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="met-grasa">Grasa (%)</label>
          <input id="met-grasa" type="number" step="0.1" value={grasa} onChange={e => setGrasa(e.target.value)} placeholder="18.0"
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="met-musculo">Músculo (%)</label>
          <input id="met-musculo" type="number" step="0.1" value={musculo} onChange={e => setMusculo(e.target.value)} placeholder="42.0"
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Medidas (cm)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MEDIDAS_PRESET.map(m => (
            <div key={m}>
              <label className="text-[10px] text-slate-600 capitalize" htmlFor={`med-${m}`}>{m.replace("_"," ")}</label>
              <input id={`med-${m}`} type="number" step="0.5" value={medidas[m] ?? ""} onChange={e => setMedidas(prev => ({ ...prev, [m]: e.target.value }))} placeholder="—"
                className="mt-0.5 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="met-notas">Notas</label>
        <textarea id="met-notas" value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Observaciones..."
          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none" />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={!fecha || saving}
          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">Cancelar</button>
      </div>
    </motion.div>
  )
}

export default function MetricasPage() {
  const { metricas, setMetricas, loading } = useGetMetricas()
  const [showForm, setShowForm] = useState(false)

  const metricasOrdenadas = [...metricas].sort((a,b) => a.fecha.localeCompare(b.fecha))

  const chartPeso   = metricasOrdenadas.filter(m => m.peso   != null).map(m => ({ name: m.fecha.slice(5), value: m.peso! }))
  const chartGrasa  = metricasOrdenadas.filter(m => m.grasa  != null).map(m => ({ name: m.fecha.slice(5), value: m.grasa! }))
  const chartMusculo= metricasOrdenadas.filter(m => m.musculo != null).map(m => ({ name: m.fecha.slice(5), value: m.musculo! }))

  const ultima   = metricas[0]
  const anterior = metricas[1]

  const pesos   = metricasOrdenadas.map(m => m.peso).filter(Boolean) as number[]
  const tendPeso= tendencia(pesos.slice().reverse())

  async function handleDelete(documentId: string) {
    await deleteMetrica(documentId)
    setMetricas(prev => prev.filter(m => m.documentId !== documentId))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Nuevo registro
        </button>
      </div>

      <AnimatePresence>
        {showForm && <FormMetrica onSave={m => { setMetricas(prev => [m, ...prev]); setShowForm(false) }} onCancel={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Snapshot actual */}
      {ultima && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Peso",    value: ultima.peso,    prev: anterior?.peso,    unit: "kg", good: "down", color: "text-blue-400"    },
            { label: "Grasa",   value: ultima.grasa,   prev: anterior?.grasa,   unit: "%",  good: "down", color: "text-amber-400"   },
            { label: "Músculo", value: ultima.musculo, prev: anterior?.musculo,  unit: "%",  good: "up",   color: "text-emerald-400" },
          ].map(({ label, value, prev, unit, good, color }) => {
            if (value == null) return null
            const diff = prev != null ? value - prev : null
            const isGood = diff == null ? null : (good === "down" ? diff < 0 : diff > 0)
            return (
              <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}<span className="text-xs text-slate-500 ml-1">{unit}</span></p>
                {diff != null && (
                  <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${isGood ? "text-emerald-400" : "text-red-400"}`}>
                    {diff > 0 ? <TrendingUp className="h-3 w-3"/> : diff < 0 ? <TrendingDown className="h-3 w-3"/> : <Minus className="h-3 w-3"/>}
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}{unit} vs anterior
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Gráficas */}
      {chartPeso.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { data: chartPeso,    label: "Peso (kg)",     color: "#60a5fa" },
            { data: chartGrasa,   label: "Grasa (%)",     color: "#fbbf24" },
            { data: chartMusculo, label: "Músculo (%)",   color: "#34d399" },
          ].map(({ data, label, color }) => data.length > 0 && (
            <div key={label} className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={data} margin={{ top:0, right:0, left:0, bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:"#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={["dataMin - 1","dataMax + 1"]} />
                  <Tooltip contentStyle={{ backgroundColor:"#1e293b", border:"1px solid #334155", borderRadius:"8px", fontSize:"11px", color:"#e2e8f0" }}
                    formatter={(v: number) => [`${v}`, ""]} />
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r:3, fill:color }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      {metricas.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin registros aún. Agrega tu primera medición.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Peso</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase hidden sm:table-cell">Grasa</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase hidden sm:table-cell">Músculo</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase hidden md:table-cell">Notas</th>
                <th className="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {metricas.map(m => (
                  <motion.tr key={m.documentId} layout initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="border-b border-slate-800/30 last:border-0 group hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-medium">{m.fecha}</td>
                    <td className="px-4 py-3 text-right text-blue-400 font-bold tabular-nums">{m.peso != null ? `${m.peso} kg` : "—"}</td>
                    <td className="px-4 py-3 text-right text-amber-400 tabular-nums hidden sm:table-cell">{m.grasa != null ? `${m.grasa}%` : "—"}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 tabular-nums hidden sm:table-cell">{m.musculo != null ? `${m.musculo}%` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell truncate max-w-[150px]">{m.notas ?? "—"}</td>
                    <td className="px-2 py-3">
                      <button type="button" onClick={() => handleDelete(m.documentId)} aria-label="Eliminar métrica"
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
