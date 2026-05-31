"use client"

import { useState, useMemo } from "react"
import { History, ChevronLeft, ChevronRight, User, TrendingUp } from "lucide-react"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { ClienteEmpresa, FUNNEL_COLOR, FUNNEL_LABEL, FunnelEtapa } from "@/types/clienteEmpresa"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDt = (iso: string | null | undefined) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

const fmtMonth = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })

const isoToYM = (iso: string | null | undefined): { year: number; month: number } | null => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return { year: d.getFullYear(), month: d.getMonth() }
}

const matchYM = (iso: string | null | undefined, year: number, month: number) => {
  const ym = isoToYM(iso)
  return ym !== null && ym.year === year && ym.month === month
}

// ─── Tabla de evolución mensual ───────────────────────────────────────────────
type RowMes = {
  year: number; month: number
  leads: number; calificados: number; ofertas: number; pedidos: number; entregas: number; rechazadas: number
}

function buildMonthRows(clientes: ClienteEmpresa[], yearFilter: number): RowMes[] {
  const rows: RowMes[] = []
  for (let m = 0; m < 12; m++) {
    const leads       = clientes.filter(c => matchYM(c.fechaLead,       yearFilter, m)).length
    const calificados = clientes.filter(c => matchYM(c.fechaCalificado, yearFilter, m)).length
    const ofertas     = clientes.filter(c => matchYM(c.fechaOferta,     yearFilter, m)).length
    const pedidos     = clientes.filter(c => matchYM(c.fechaPedido,     yearFilter, m)).length
    const entregas    = clientes.filter(c => matchYM(c.fechaEntrega,    yearFilter, m)).length
    const rechazadas  = clientes.filter(c => matchYM(c.fechaRechazada,  yearFilter, m)).length
    rows.push({ year: yearFilter, month: m, leads, calificados, ofertas, pedidos, entregas, rechazadas })
  }
  return rows
}

// Bar mini
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-300 w-4 text-right">{value}</span>
    </div>
  )
}

// Pill de etapa
function EtapaPill({ etapa }: { etapa: FunnelEtapa | null | undefined }) {
  if (!etapa) return <span className="text-slate-700 text-[10px]">—</span>
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${FUNNEL_COLOR[etapa]}`}>
      {FUNNEL_LABEL[etapa]}
    </span>
  )
}

// ─── HistorialPipelineView ────────────────────────────────────────────────────
export function HistorialPipelineView() {
  const { clientes, loading } = useGetClientes()

  const hoy       = new Date()
  const [año,     setAño]     = useState(hoy.getFullYear())
  const [mesFiltro, setMesFiltro] = useState<number | null>(null)
  const [etapaFiltro, setEtapaFiltro] = useState<FunnelEtapa | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")

  // ─── Años disponibles ───────────────────────────────────────────────────────
  const añosDisponibles = useMemo(() => {
    const set = new Set<number>()
    set.add(hoy.getFullYear())
    for (const c of clientes) {
      for (const f of [c.fechaLead, c.fechaOferta, c.fechaPedido, c.fechaEntrega]) {
        const ym = isoToYM(f)
        if (ym) set.add(ym.year)
      }
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [clientes])

  // ─── Filas mensuales del año seleccionado ──────────────────────────────────
  const rowsMes = useMemo(() => buildMonthRows(clientes, año), [clientes, año])

  const maxLeads = useMemo(() => Math.max(...rowsMes.map(r => r.leads), 1), [rowsMes])

  // ─── Totales del año ───────────────────────────────────────────────────────
  const totalesAño = useMemo(() => ({
    leads:       rowsMes.reduce((s, r) => s + r.leads,       0),
    calificados: rowsMes.reduce((s, r) => s + r.calificados, 0),
    ofertas:     rowsMes.reduce((s, r) => s + r.ofertas,     0),
    pedidos:     rowsMes.reduce((s, r) => s + r.pedidos,     0),
    entregas:    rowsMes.reduce((s, r) => s + r.entregas,    0),
    rechazadas:  rowsMes.reduce((s, r) => s + r.rechazadas,  0),
  }), [rowsMes])

  // Tasas de conversión (respecto a leads del año)
  const conv = useMemo(() => {
    const base = totalesAño.leads || 1
    return {
      cal:  Math.round((totalesAño.calificados / base) * 100),
      of:   Math.round((totalesAño.ofertas     / base) * 100),
      ped:  Math.round((totalesAño.pedidos     / base) * 100),
      ent:  Math.round((totalesAño.entregas    / base) * 100),
    }
  }, [totalesAño])

  // ─── Contactos filtrados ───────────────────────────────────────────────────
  const contactosFiltrados = useMemo(() => {
    return clientes
      .filter(c => {
        // Filtro búsqueda
        if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
        // Filtro etapa final
        if (etapaFiltro !== "todos" && (c.Funnel ?? "Lead") !== etapaFiltro) return false
        // Filtro mes: si hay mesFiltro, el contacto debe tener alguna actividad en ese mes del año
        if (mesFiltro !== null) {
          const tieneActividad =
            matchYM(c.fechaLead,        año, mesFiltro) ||
            matchYM(c.fechaCalificado,  año, mesFiltro) ||
            matchYM(c.fechaOferta,      año, mesFiltro) ||
            matchYM(c.fechaPedido,      año, mesFiltro) ||
            matchYM(c.fechaEntrega,     año, mesFiltro) ||
            matchYM(c.fechaRechazada,   año, mesFiltro)
          if (!tieneActividad) return false
        } else {
          // Sin filtro de mes: mostrar solo los que tienen alguna actividad en el año
          const tieneActividad =
            matchYM(c.fechaLead,        año, 0) || matchYM(c.fechaLead,        año, 1) ||
            matchYM(c.fechaLead,        año, 2) || matchYM(c.fechaLead,        año, 3) ||
            matchYM(c.fechaLead,        año, 4) || matchYM(c.fechaLead,        año, 5) ||
            matchYM(c.fechaLead,        año, 6) || matchYM(c.fechaLead,        año, 7) ||
            matchYM(c.fechaLead,        año, 8) || matchYM(c.fechaLead,        año, 9) ||
            matchYM(c.fechaLead,        año, 10) || matchYM(c.fechaLead,        año, 11) ||
            isoToYM(c.fechaOferta)?.year === año  ||
            isoToYM(c.fechaPedido)?.year === año  ||
            isoToYM(c.fechaEntrega)?.year === año
          if (!tieneActividad) return false
        }
        return true
      })
      .sort((a, b) => {
        const da = new Date(a.fechaLead ?? a.createdAt).getTime()
        const db = new Date(b.fechaLead ?? b.createdAt).getTime()
        return db - da
      })
  }, [clientes, busqueda, etapaFiltro, mesFiltro, año])

  const ETAPAS: FunnelEtapa[] = ["Lead", "Oferta", "Pedido", "Entrega", "Rechazada"]
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <History size={18} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-100">Historial del Pipeline</h1>
          </div>
          <p className="text-sm text-slate-500">
            Rastrea el recorrido de cada contacto desde Lead hasta Entrega
          </p>
        </div>

        {/* Selector de año */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
          <button type="button" title="Año anterior" onClick={() => setAño(a => a - 1)}
            className="p-1 text-slate-600 hover:text-slate-300 rounded transition">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-slate-200 w-12 text-center">{año}</span>
          <button type="button" title="Año siguiente" onClick={() => setAño(a => Math.min(a + 1, hoy.getFullYear()))}
            className={`p-1 rounded transition ${año >= hoy.getFullYear() ? "text-slate-700 cursor-default" : "text-slate-600 hover:text-slate-300"}`}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPIs del año */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Leads",       value: totalesAño.leads,       color: "text-slate-300",   pct: null },
          { label: "Calificados", value: totalesAño.calificados, color: "text-blue-400",    pct: conv.cal },
          { label: "Ofertas",     value: totalesAño.ofertas,     color: "text-amber-400",   pct: conv.of },
          { label: "Pedidos",     value: totalesAño.pedidos,     color: "text-emerald-400", pct: conv.ped },
          { label: "Entregas",    value: totalesAño.entregas,    color: "text-violet-400",  pct: conv.ent },
          { label: "Rechazadas",  value: totalesAño.rechazadas,  color: "text-red-400",     pct: Math.round((totalesAño.rechazadas / (totalesAño.leads || 1)) * 100) },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            {k.pct !== null && (
              <p className="text-[10px] text-slate-600 mt-0.5">{k.pct}% de leads</p>
            )}
          </div>
        ))}
      </div>

      {/* Embudo de conversión */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} className="text-slate-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Conversión {año}</p>
        </div>
        <div className="flex items-end gap-3 h-16">
          {[
            { label: "Leads",      value: totalesAño.leads,       color: "bg-slate-600" },
            { label: "Calific.",   value: totalesAño.calificados, color: "bg-blue-600" },
            { label: "Ofertas",    value: totalesAño.ofertas,     color: "bg-amber-600" },
            { label: "Pedidos",    value: totalesAño.pedidos,     color: "bg-emerald-600" },
            { label: "Entregas",   value: totalesAño.entregas,    color: "bg-violet-600" },
            { label: "Rechaz.",    value: totalesAño.rechazadas,  color: "bg-red-700" },
          ].map((b, i) => {
            const maxVal = totalesAño.leads || 1
            const h = Math.max(4, Math.round((b.value / maxVal) * 56))
            return (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                {i > 0 && <span className="text-[8px] text-slate-700 self-start -ml-1">▶</span>}
                <div className={`w-full rounded-t ${b.color} transition-all`} style={{ height: h }} />
                <span className="text-[9px] text-slate-500 text-center leading-tight">{b.label}</span>
                <span className="text-[10px] font-bold text-slate-300">{b.value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla de evolución mensual */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Evolución mensual {año}</p>
          {mesFiltro !== null && (
            <button type="button" onClick={() => setMesFiltro(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 rounded px-2 py-0.5 transition">
              Limpiar mes
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Mes</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest w-28">Leads</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest w-28">Calificados</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest w-28">Ofertas</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest w-28">Pedidos</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest w-28">Entregas</th>
                <th className="h-9 px-4 text-left text-[10px] font-semibold text-red-800 uppercase tracking-widest w-28">Rechazadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rowsMes.map(row => {
                const esMesFiltrado = mesFiltro === row.month
                const tieneData    = row.leads + row.calificados + row.ofertas + row.pedidos + row.entregas + row.rechazadas > 0
                const esMesActual  = row.year === hoy.getFullYear() && row.month === hoy.getMonth()
                return (
                  <tr key={row.month}
                    onClick={() => setMesFiltro(prev => prev === row.month ? null : row.month)}
                    className={`transition-colors cursor-pointer ${
                      esMesFiltrado
                        ? "bg-violet-500/10 border-l-2 border-l-violet-500"
                        : tieneData
                          ? "hover:bg-slate-800/50"
                          : "opacity-40 hover:opacity-60"
                    }`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{MESES[row.month]}</span>
                        {esMesActual && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">hoy</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.leads}       max={maxLeads} color="bg-slate-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.calificados} max={maxLeads} color="bg-blue-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.ofertas}     max={maxLeads} color="bg-amber-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.pedidos}     max={maxLeads} color="bg-emerald-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.entregas}    max={maxLeads} color="bg-violet-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.rechazadas}  max={maxLeads} color="bg-red-700" />
                    </td>
                  </tr>
                )
              })}

              {/* Fila de totales */}
              <tr className="bg-slate-800/40 font-semibold">
                <td className="px-4 py-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-widest">Total</td>
                {[totalesAño.leads, totalesAño.calificados, totalesAño.ofertas, totalesAño.pedidos, totalesAño.entregas, totalesAño.rechazadas].map((v, i) => (
                  <td key={i} className="px-4 py-2.5">
                    <span className="text-sm font-bold text-slate-200">{v}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Buscador + filtros de etapa */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar contacto…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 min-w-[180px] h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setEtapaFiltro("todos")}
            className={`h-7 px-3 text-xs rounded-full border font-medium transition-all ${
              etapaFiltro === "todos" ? "bg-slate-700 text-slate-100 border-slate-600" : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            Todos
          </button>
          {ETAPAS.map(e => (
            <button key={e} type="button" onClick={() => setEtapaFiltro(prev => prev === e ? "todos" : e)}
              className={`h-7 px-3 text-xs rounded-full border font-medium transition-all ${
                etapaFiltro === e ? FUNNEL_COLOR[e] : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {FUNNEL_LABEL[e]}
            </button>
          ))}
        </div>
        {mesFiltro !== null && (
          <span className="text-[11px] text-violet-400 border border-violet-500/30 rounded-full px-2.5 py-0.5 bg-violet-500/10">
            {MESES[mesFiltro]} {año}
          </span>
        )}
      </div>

      {/* Tabla de contactos con su recorrido completo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Recorrido por contacto
            {contactosFiltrados.length > 0 && (
              <span className="ml-2 text-slate-400 normal-case font-normal">({contactosFiltrados.length})</span>
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Contacto", "Lead", "Calificado", "Oferta", "Pedido", "Entrega", "Rechazada", "Etapa actual"].map(h => (
                  <th key={h} className={`h-9 px-4 text-left text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap ${h === "Rechazada" ? "text-red-800" : "text-slate-500"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 rounded bg-slate-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && contactosFiltrados.map(c => {
                const etapa = c.Funnel ?? "Lead"
                return (
                  <tr key={c.documentId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <User size={10} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-slate-200 leading-snug">{c.nombre}</p>
                          {c.canalContacto && <p className="text-[9px] text-slate-600">{c.canalContacto}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-2.5">
                      {c.fechaLead ? (
                        <div>
                          <p className="text-[11px] text-slate-400">{fmtDt(c.fechaLead)}</p>
                          <div className={`inline-block mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-500`} />
                        </div>
                      ) : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Calificado */}
                    <td className="px-4 py-2.5">
                      {c.calificado ? (
                        <div>
                          <p className="text-[11px] text-blue-400">{fmtDt(c.fechaCalificado) ?? "Sí"}</p>
                          <div className="inline-block mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                      ) : <span className="text-slate-700 text-[10px]">No</span>}
                    </td>

                    {/* Oferta */}
                    <td className="px-4 py-2.5">
                      {c.fechaOferta
                        ? <p className="text-[11px] text-amber-400">{fmtDt(c.fechaOferta)}</p>
                        : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Pedido */}
                    <td className="px-4 py-2.5">
                      {c.fechaPedido
                        ? <p className="text-[11px] text-emerald-400">{fmtDt(c.fechaPedido)}</p>
                        : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Entrega */}
                    <td className="px-4 py-2.5">
                      {c.fechaEntrega
                        ? <p className="text-[11px] text-violet-400">{fmtDt(c.fechaEntrega)}</p>
                        : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Rechazada */}
                    <td className="px-4 py-2.5">
                      {c.fechaRechazada
                        ? <p className="text-[11px] text-red-400">{fmtDt(c.fechaRechazada)}</p>
                        : <span className="text-slate-800">—</span>}
                    </td>

                    {/* Etapa actual */}
                    <td className="px-4 py-2.5">
                      <EtapaPill etapa={etapa} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && contactosFiltrados.length === 0 && (
            <div className="py-12 text-center">
              <History size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-slate-600 text-sm">Sin registros para los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
