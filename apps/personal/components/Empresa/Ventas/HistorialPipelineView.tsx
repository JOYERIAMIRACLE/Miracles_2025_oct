"use client"

import { useState, useMemo } from "react"
import { History, ChevronLeft, ChevronRight, User, TrendingUp, FileText, ShoppingBag, Users, ArrowRight, ArrowLeft, Truck } from "lucide-react"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { ClienteEmpresa, FUNNEL_COLOR, FUNNEL_LABEL, FunnelEtapa } from "@/types/clienteEmpresa"
import { ESTADO_COT_COLOR, ESTADOS_COT, EstadoCotizacion } from "@/types/cotizacion"
import { ESTADO_VENTA_COLOR, ESTADOS_VENTA, EstadoVenta } from "@/types/ventaEmpresa"
import { ListToolbar } from "./ListToolbar"

const fmtMoney = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

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
    const leads       = clientes.filter(c => matchYM(c.fechaLead, yearFilter, m)).length
    // Si tiene fechaCalificado → contar en su mes; si solo tiene calificado:true sin fecha → contar en el mes del lead
    const calificados = clientes.filter(c =>
      c.calificado === true && (
        matchYM(c.fechaCalificado, yearFilter, m) ||
        (!c.fechaCalificado && matchYM(c.fechaLead, yearFilter, m))
      )
    ).length
    const ofertas     = clientes.filter(c => matchYM(c.fechaOferta,    yearFilter, m)).length
    const pedidos     = clientes.filter(c => matchYM(c.fechaPedido,    yearFilter, m)).length
    const entregas    = clientes.filter(c => matchYM(c.fechaEntrega,   yearFilter, m)).length
    const rechazadas  = clientes.filter(c => matchYM(c.fechaRechazada, yearFilter, m)).length
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
type SubTab = "leads" | "cotizaciones" | "pedidos"
const SUB_TABS: { id: SubTab; label: string; icon: typeof Users }[] = [
  { id: "leads",        label: "Leads",        icon: Users },
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "pedidos",      label: "Pedidos",      icon: ShoppingBag },
]

export function HistorialPipelineView() {
  const { clientes, loading } = useGetClientes()
  const { cotizaciones, loading: cotLoading } = useGetAllCotizaciones()
  const { ventas, loading: ventasLoading } = useGetVentas()

  const [subTab, setSubTab] = useState<SubTab>("leads")
  const [buscaCot, setBuscaCot] = useState("")
  const [buscaPed, setBuscaPed] = useState("")
  const [filtroCot, setFiltroCot] = useState<EstadoCotizacion | "todas">("todas")
  const [filtroPed, setFiltroPed] = useState<EstadoVenta | "todos">("todos")

  // De dónde viene cada cliente — no todos pasan por "Lead": el alta directo
  // en la columna "Oferta" del Pipeline no marca fechaLead, así que ese
  // campo distingue de verdad "llegó como lead de marketing" de "se dio de
  // alta ya cotizando". Comparando cotizaciones vs. pedidos reales por
  // cliente se ve además quién se saltó la cotización.
  const origenClientes = useMemo(() => {
    const cotizacionesPorCliente = new Map<string, number>()
    cotizaciones.forEach(c => {
      const id = c.cliente?.documentId
      if (id) cotizacionesPorCliente.set(id, (cotizacionesPorCliente.get(id) ?? 0) + 1)
    })
    const ventasPorCliente = new Map<string, number>()
    ventas.forEach(v => {
      const id = v.cliente?.documentId
      if (id && v.estado !== "Cancelado") ventasPorCliente.set(id, (ventasPorCliente.get(id) ?? 0) + 1)
    })
    return {
      deLead:  clientes.filter(c => !!c.fechaLead).length,
      soloCotizaron: clientes.filter(c =>
        (cotizacionesPorCliente.get(c.documentId) ?? 0) > 0 && (ventasPorCliente.get(c.documentId) ?? 0) === 0
      ).length,
      directoAPedido: clientes.filter(c =>
        (ventasPorCliente.get(c.documentId) ?? 0) > 0 && (cotizacionesPorCliente.get(c.documentId) ?? 0) === 0
      ).length,
    }
  }, [clientes, cotizaciones, ventas])

  const cotizacionesFiltradas = useMemo(() => {
    const q = buscaCot.trim().toLowerCase()
    return cotizaciones.filter(c => {
      if (filtroCot !== "todas" && c.estado !== filtroCot) return false
      if (!q) return true
      return (c.numero ?? "").toLowerCase().includes(q) || (c.cliente?.nombre ?? "").toLowerCase().includes(q)
    })
  }, [cotizaciones, buscaCot, filtroCot])

  const pedidosFiltrados = useMemo(() => {
    const q = buscaPed.trim().toLowerCase()
    return ventas.filter(v => {
      if (filtroPed !== "todos" && v.estado !== filtroPed) return false
      if (!q) return true
      return (v.numero ?? "").toLowerCase().includes(q) || v.concepto.toLowerCase().includes(q) || (v.cliente?.nombre ?? "").toLowerCase().includes(q)
    })
  }, [ventas, buscaPed, filtroPed])

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
            <h1 className="text-2xl font-bold text-slate-100">Métricas</h1>
          </div>
          <p className="text-sm text-slate-500">
            El trayecto completo de cada lead, cotización y pedido
          </p>
        </div>

        {/* Selector de año — solo aplica al trayecto de leads */}
        {subTab === "leads" && (
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
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {SUB_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              subTab === t.id ? "bg-slate-800 text-violet-400" : "text-slate-500 hover:text-slate-300"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* De dónde vienen los clientes — no todos entran por Lead */}
      {subTab === "leads" && (
        <p className="text-[11px] text-slate-600">
          De {clientes.length} clientes en total:{" "}
          <span className="text-violet-400 font-semibold">{origenClientes.deLead} llegaron de lead</span> (marketing) ·{" "}
          <span className="text-slate-400">{origenClientes.soloCotizaron} solo cotizaron</span> (sin pedido todavía) ·{" "}
          <span className="text-slate-400">{origenClientes.directoAPedido} fueron directo a pedido</span> (sin cotizar)
        </p>
      )}

      {subTab === "leads" && (
      <>
      {/* KPIs del año */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Leads",       value: totalesAño.leads,       color: "text-slate-300",   pct: null },
          { label: "Calificados", value: totalesAño.calificados, color: "text-violet-400",    pct: conv.cal },
          { label: "Ofertas",     value: totalesAño.ofertas,     color: "text-violet-400",   pct: conv.of },
          { label: "Pedidos",     value: totalesAño.pedidos,     color: "text-violet-400", pct: conv.ped },
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
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-slate-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Conversión {año}</p>
        </div>
        {/* Barras — separadas de labels para que no desborden sobre el título */}
        <div className="flex items-end gap-2 h-14">
          {[
            { label: "Leads",    value: totalesAño.leads,       color: "bg-slate-600" },
            { label: "Calific.", value: totalesAño.calificados, color: "bg-violet-600" },
            { label: "Ofertas",  value: totalesAño.ofertas,     color: "bg-violet-600" },
            { label: "Pedidos",  value: totalesAño.pedidos,     color: "bg-violet-600" },
            { label: "Entregas", value: totalesAño.entregas,    color: "bg-violet-600" },
            { label: "Rechaz.",  value: totalesAño.rechazadas,  color: "bg-red-700" },
          ].map((b) => {
            const maxVal = totalesAño.leads || 1
            const h = Math.max(4, Math.round((b.value / maxVal) * 52))
            return (
              <div key={b.label} className="flex-1">
                <div className={`w-full rounded-t ${b.color} transition-all`} style={{ height: h }} />
              </div>
            )
          })}
        </div>
        {/* Labels y valores debajo de las barras */}
        <div className="flex gap-2 mt-1.5">
          {[
            { label: "Leads",    value: totalesAño.leads },
            { label: "Calific.", value: totalesAño.calificados },
            { label: "Ofertas",  value: totalesAño.ofertas },
            { label: "Pedidos",  value: totalesAño.pedidos },
            { label: "Entregas", value: totalesAño.entregas },
            { label: "Rechaz.",  value: totalesAño.rechazadas },
          ].map((b) => (
            <div key={b.label} className="flex-1 text-center">
              <div className="text-[9px] text-slate-500 truncate">{b.label}</div>
              <div className="text-[10px] font-bold text-slate-300">{b.value}</div>
            </div>
          ))}
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
                      <MiniBar value={row.calificados} max={maxLeads} color="bg-violet-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.ofertas}     max={maxLeads} color="bg-violet-500" />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <MiniBar value={row.pedidos}     max={maxLeads} color="bg-violet-500" />
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

      {/* Buscador + filtro de etapa */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <ListToolbar
            search={busqueda} onSearchChange={setBusqueda} searchPlaceholder="Buscar contacto…"
            filtros={[
              { value: "todos", label: "Todos" },
              ...ETAPAS.map(e => ({ value: e as string, label: FUNNEL_LABEL[e] })),
            ]}
            filtroActivo={etapaFiltro} filtroDefault="todos" onFiltroChange={v => setEtapaFiltro(v as FunnelEtapa | "todos")}
          />
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
                          <p className="text-[11px] text-violet-400">{fmtDt(c.fechaCalificado) ?? "Sí"}</p>
                          <div className="inline-block mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                        </div>
                      ) : <span className="text-slate-700 text-[10px]">No</span>}
                    </td>

                    {/* Oferta */}
                    <td className="px-4 py-2.5">
                      {c.fechaOferta
                        ? <p className="text-[11px] text-violet-400">{fmtDt(c.fechaOferta)}</p>
                        : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Pedido */}
                    <td className="px-4 py-2.5">
                      {c.fechaPedido
                        ? <p className="text-[11px] text-violet-400">{fmtDt(c.fechaPedido)}</p>
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
      </>
      )}

      {/* Trayecto de cotizaciones — no hay fechas por etapa como en leads
          (solo se guarda el estado actual), así que el "trayecto" aquí es
          el estado + hacia dónde se conectó (pedido generado, si aplica). */}
      {subTab === "cotizaciones" && (
        <>
          <ListToolbar search={buscaCot} onSearchChange={setBuscaCot} searchPlaceholder="Buscar por número o cliente…"
            filtros={[
              { value: "todas", label: "Todas" },
              ...ESTADOS_COT.map(e => ({ value: e as string, label: e })),
            ]}
            filtroActivo={filtroCot} filtroDefault="todas" onFiltroChange={v => setFiltroCot(v as EstadoCotizacion | "todas")}
            metricas={[
              { label: "Total",      value: cotizaciones.length },
              { label: "Aceptadas",  value: cotizaciones.filter(c => c.estado === "Aceptada").length,  colorClass: "text-violet-400" },
              { label: "Convertidas", value: cotizaciones.filter(c => c.estado === "Convertida").length, colorClass: "text-emerald-400" },
              { label: "Rechazadas", value: cotizaciones.filter(c => c.estado === "Rechazada").length, colorClass: "text-red-400" },
            ]}
          />
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    {["#", "Cliente", "Fecha", "Estado", "Total", "Trayecto"].map(h => (
                      <th key={h} className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cotLoading && Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td></tr>
                  ))}
                  {!cotLoading && cotizacionesFiltradas.map(c => (
                    <tr key={c.documentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-[11px] font-bold font-mono text-slate-300">{c.numero ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{c.cliente?.nombre ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{fmtDt(c.fecha ?? c.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${ESTADO_COT_COLOR[c.estado]}`}>{c.estado}</span>
                      </td>
                      <td className="px-4 py-2.5 text-violet-400 font-semibold text-xs">{fmtMoney(c.total)}</td>
                      <td className="px-4 py-2.5">
                        {c.ventaGenerada ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <ArrowRight size={11} /> {c.ventaGenerada.numero ?? c.ventaGenerada.concepto}
                          </span>
                        ) : <span className="text-slate-700 text-[11px]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!cotLoading && cotizacionesFiltradas.length === 0 && (
                <div className="py-12 text-center">
                  <FileText size={28} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-slate-600 text-sm">Sin cotizaciones para los filtros seleccionados.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Trayecto de pedidos — estado actual + de dónde vino (cotización
          origen, si se convirtió de una) + envíos conectados. */}
      {subTab === "pedidos" && (
        <>
          <ListToolbar search={buscaPed} onSearchChange={setBuscaPed} searchPlaceholder="Buscar por número, concepto o cliente…"
            filtros={[
              { value: "todos", label: "Todos" },
              ...ESTADOS_VENTA.map(e => ({ value: e as string, label: e })),
            ]}
            filtroActivo={filtroPed} filtroDefault="todos" onFiltroChange={v => setFiltroPed(v as EstadoVenta | "todos")}
            metricas={[
              { label: "Total",      value: ventas.length },
              { label: "Pagados",    value: ventas.filter(v => v.estado === "Pagado").length,    colorClass: "text-violet-400" },
              { label: "Entregados", value: ventas.filter(v => v.estado === "Entregado").length, colorClass: "text-violet-400" },
              { label: "Cancelados", value: ventas.filter(v => v.estado === "Cancelado").length, colorClass: "text-red-400" },
            ]}
          />
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    {["#", "Cliente", "Fecha", "Estado", "Monto", "Trayecto"].map(h => (
                      <th key={h} className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {ventasLoading && Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td></tr>
                  ))}
                  {!ventasLoading && pedidosFiltrados.map(v => (
                    <tr key={v.documentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-[11px] font-bold font-mono text-slate-300">{v.numero ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{v.cliente?.nombre ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{v.fecha ? fmtDt(v.fecha) : "—"}</td>
                      <td className="px-4 py-2.5">
                        {v.estado && <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${ESTADO_VENTA_COLOR[v.estado as EstadoVenta]}`}>{v.estado}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-violet-400 font-semibold text-xs">{fmtMoney(v.monto)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {v.cotizacionOrigen && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <ArrowLeft size={11} /> {v.cotizacionOrigen.numero}
                            </span>
                          )}
                          {v.envios && v.envios.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-violet-400">
                              <Truck size={11} /> {v.envios.length} envío{v.envios.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {!v.cotizacionOrigen && (!v.envios || v.envios.length === 0) && (
                            <span className="text-slate-700 text-[11px]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!ventasLoading && pedidosFiltrados.length === 0 && (
                <div className="py-12 text-center">
                  <ShoppingBag size={28} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-slate-600 text-sm">Sin pedidos para los filtros seleccionados.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
