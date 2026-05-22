"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "sonner"
import { useGetEcosistema } from "@/api/ecosistema-mkt/getEcosistema"
import { createEcosistema, updateEcosistema, deleteEcosistema } from "@/api/ecosistema-mkt/mutateEcosistema"
import { EcosistemaType, EcosistemaPayload, MESES_MKT, MesEcosistema } from "@/types/ecosistema-mkt"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function emptyPayload(): EcosistemaPayload {
  return {
    mes: MESES_MKT[new Date().getMonth()],
    anio: ANIO_ACTUAL,
    canal: null,
    impresiones: 0,
    visitas: 0,
    clics: 0,
    leads: 0,
    contactosNuevos: 0,
    compras: 0,
    montoCompras: 0,
    notas: null,
  }
}

// ─── Tasa badge ───────────────────────────────────────────────────────────────

function TasaBadge({ num, den }: { num: number; den: number }) {
  if (!den) return <span className="text-[10px] text-slate-600">—</span>
  const ratio = num / den
  const color = ratio >= 0.05  ? "text-emerald-400"
              : ratio >= 0.01  ? "text-yellow-400"
              : "text-red-400"
  return <span className={`text-[10px] font-medium ${color}`}>{pct(num, den)}</span>
}

// ─── Celda de métrica ─────────────────────────────────────────────────────────

function MetricaCell({ value, sub, subDen }: { value: number; sub?: number; subDen?: number }) {
  return (
    <td className="px-3 py-3 text-center whitespace-nowrap">
      <p className="text-sm font-semibold text-slate-100">{fmt(value)}</p>
      {sub !== undefined && subDen !== undefined && (
        <TasaBadge num={sub} den={subDen} />
      )}
    </td>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalEcosistema({ editando, onGuardar, onCerrar }: {
  editando: EcosistemaType | null
  onGuardar: (p: EcosistemaPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm]     = useState<EcosistemaPayload>(
    editando
      ? {
          mes: editando.mes, anio: editando.anio, canal: editando.canal,
          impresiones: editando.impresiones, visitas: editando.visitas, clics: editando.clics,
          leads: editando.leads, contactosNuevos: editando.contactosNuevos,
          compras: editando.compras, montoCompras: editando.montoCompras, notas: editando.notas,
        }
      : emptyPayload()
  )
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    setSaving(true)
    try { await onGuardar(form) } finally { setSaving(false) }
  }

  const num = (key: keyof EcosistemaPayload) => (
    <input
      type="number" min={0}
      value={(form[key] as number) ?? 0}
      onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500"
    />
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg my-8 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">
            {editando ? "Editar registro" : "Nuevo registro"}
          </h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Mes</label>
            <select value={form.mes} aria-label="Mes"
              onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesEcosistema }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100">
              {MESES_MKT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Año</label>
            <input type="number" value={form.anio}
              onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 outline-none focus:border-slate-500" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Canal (opcional)</label>
          <input value={form.canal ?? ""}
            onChange={e => setForm(f => ({ ...f, canal: e.target.value || null }))}
            placeholder="Instagram, Email, Google Ads…"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500" />
        </div>

        {/* Métricas del funnel */}
        <div className="grid grid-cols-2 gap-3">
          {([
            ["Impresiones",      "impresiones"],
            ["Visitas",          "visitas"],
            ["Clics",            "clics"],
            ["Leads",            "leads"],
            ["Contactos nuevos", "contactosNuevos"],
            ["Compras",          "compras"],
          ] as const).map(([label, key]) => (
            <div key={key}>
              <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
              {num(key)}
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Monto de compras (MXN)</label>
            {num("montoCompras")}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Notas</label>
          <textarea value={form.notas ?? ""}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
            rows={2} placeholder="Observaciones del período…"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none resize-none" />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta resumen del funnel ───────────────────────────────────────────────

function FunnelResumen({ r }: { r: EcosistemaType }) {
  const etapas = [
    { label: "Impresiones",  value: r.impresiones,     den: null              },
    { label: "Visitas",      value: r.visitas,          den: r.impresiones     },
    { label: "Clics",        value: r.clics,            den: r.visitas         },
    { label: "Leads",        value: r.leads,            den: r.clics           },
    { label: "Contactos",    value: r.contactosNuevos,  den: r.leads           },
    { label: "Compras",      value: r.compras,          den: r.contactosNuevos },
  ]

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {etapas.map(({ label, value, den }, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className="text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">{label}</p>
            <p className="text-xs font-semibold text-slate-200">{fmt(value)}</p>
            {den !== null && (
              <TasaBadge num={value} den={den} />
            )}
          </div>
          {i < etapas.length - 1 && (
            <span className="text-slate-700 text-[10px] mx-0.5">→</span>
          )}
        </div>
      ))}
      {r.montoCompras > 0 && (
        <>
          <span className="text-slate-700 text-[10px] mx-0.5">·</span>
          <div className="text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">Revenue</p>
            <p className="text-xs font-semibold text-emerald-400">{fmtPeso(r.montoCompras)}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function EcosistemaView() {
  const { registros, setRegistros, loading } = useGetEcosistema()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<EcosistemaType | null>(null)
  const [filtroAnio, setFiltroAnio] = useState<number | "">(ANIO_ACTUAL)

  const aniosUsados = useMemo(
    () => [...new Set(registros.map(r => r.anio))].sort((a, b) => b - a),
    [registros],
  )

  const filtrados = useMemo(
    () => registros
      .filter(r => !filtroAnio || r.anio === filtroAnio)
      .sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio
        return MESES_MKT.indexOf(a.mes) - MESES_MKT.indexOf(b.mes)
      }),
    [registros, filtroAnio],
  )

  const totales = useMemo(() => ({
    impresiones:     filtrados.reduce((s, r) => s + r.impresiones, 0),
    visitas:         filtrados.reduce((s, r) => s + r.visitas, 0),
    clics:           filtrados.reduce((s, r) => s + r.clics, 0),
    leads:           filtrados.reduce((s, r) => s + r.leads, 0),
    contactosNuevos: filtrados.reduce((s, r) => s + r.contactosNuevos, 0),
    compras:         filtrados.reduce((s, r) => s + r.compras, 0),
    montoCompras:    filtrados.reduce((s, r) => s + r.montoCompras, 0),
  }), [filtrados])

  const abrirCrear  = () => { setEditando(null); setModalOpen(true) }
  const abrirEditar = (r: EcosistemaType) => { setEditando(r); setModalOpen(true) }

  const guardar = async (payload: EcosistemaPayload) => {
    try {
      if (editando) {
        const updated = await updateEcosistema(editando.documentId, payload)
        setRegistros(prev => prev.map(r => r.documentId === updated.documentId ? updated : r))
        toast.success("Registro actualizado")
      } else {
        const nuevo = await createEcosistema(payload)
        setRegistros(prev => [...prev, nuevo])
        toast.success("Registro creado")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    }
  }

  const borrar = async (r: EcosistemaType) => {
    if (!confirm(`¿Eliminar registro de ${r.mes} ${r.anio}?`)) return
    try {
      await deleteEcosistema(r.documentId)
      setRegistros(prev => prev.filter(x => x.documentId !== r.documentId))
      toast.success("Eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ecosistema digital</h1>
          <p className="text-sm text-slate-500">Funnel: impresiones → visitas → clics → leads → contactos → compras</p>
        </div>
        <button type="button" onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
          <Plus size={15} /> Registrar período
        </button>
      </div>

      {/* Filtro de año */}
      <div className="flex items-center gap-2 mb-6">
        <select aria-label="Año" value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value ? Number(e.target.value) : "")}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
          <option value="">Todos los años</option>
          {aniosUsados.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500 text-sm">Sin registros. Agrega el primer período para comenzar.</p>
          <button type="button" onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
            <Plus size={14} /> Registrar período
          </button>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-32">Período</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Impresiones</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Visitas</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Clics</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Leads</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contactos</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Compras</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Revenue</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtrados.map(r => (
                  <tr key={r.documentId} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-200">{r.mes} {r.anio}</p>
                      {r.canal && <p className="text-[10px] text-slate-500">{r.canal}</p>}
                      {r.notas && <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">{r.notas}</p>}
                    </td>
                    <MetricaCell value={r.impresiones} />
                    <MetricaCell value={r.visitas}          sub={r.visitas}          subDen={r.impresiones}    />
                    <MetricaCell value={r.clics}            sub={r.clics}            subDen={r.visitas}        />
                    <MetricaCell value={r.leads}            sub={r.leads}            subDen={r.clics}          />
                    <MetricaCell value={r.contactosNuevos}  sub={r.contactosNuevos}  subDen={r.leads}          />
                    <MetricaCell value={r.compras}          sub={r.compras}          subDen={r.contactosNuevos}/>
                    <td className="px-3 py-3 text-center">
                      {r.montoCompras > 0
                        ? <span className="text-sm font-semibold text-emerald-400">{fmtPeso(r.montoCompras)}</span>
                        : <span className="text-slate-700 text-sm">—</span>
                      }
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button type="button" onClick={() => abrirEditar(r)} title="Editar"
                          className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => borrar(r)} title="Eliminar"
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-700 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totales */}
              {filtrados.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-900/80">
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total {filtroAnio || ""}
                      </p>
                    </td>
                    <MetricaCell value={totales.impresiones} />
                    <MetricaCell value={totales.visitas}          sub={totales.visitas}          subDen={totales.impresiones}    />
                    <MetricaCell value={totales.clics}            sub={totales.clics}            subDen={totales.visitas}        />
                    <MetricaCell value={totales.leads}            sub={totales.leads}            subDen={totales.clics}          />
                    <MetricaCell value={totales.contactosNuevos}  sub={totales.contactosNuevos}  subDen={totales.leads}          />
                    <MetricaCell value={totales.compras}          sub={totales.compras}          subDen={totales.contactosNuevos}/>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-emerald-400">{fmtPeso(totales.montoCompras)}</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <p className="text-[11px] text-slate-700 mt-2">
            El porcentaje bajo cada valor es la tasa de conversión respecto a la etapa anterior.
          </p>
        </>
      )}

      {modalOpen && (
        <ModalEcosistema
          editando={editando}
          onGuardar={guardar}
          onCerrar={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
