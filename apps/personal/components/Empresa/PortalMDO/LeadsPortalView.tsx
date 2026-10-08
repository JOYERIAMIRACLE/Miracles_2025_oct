"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Pencil, Trash2, CheckCircle2, Eye } from "lucide-react"
import { toast } from "sonner"
import { useGetLeads, updateLead, deleteLead } from "@/api/lead/getLead"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { useGetClientes, createCliente, updateCliente } from "@/api/clienteEmpresa/getClientes"
import type { Lead } from "@/types/lead"
import type { ClienteEmpresa, ClientePayload, FunnelEtapa } from "@/types/clienteEmpresa"
import { FUNNEL_ALL } from "@/types/clienteEmpresa"
import { NuevoLeadWizard } from "@/components/Empresa/Ventas/NuevoLeadWizard"
import { ClienteModal, emptyCliente, ClientePanel, numDisplay } from "@/components/Empresa/Ventas/PipelineView"
import {
  USE_DEMO, DEMO_DATA, T, dd, CANAL_COLOR, AGRUPACION_LABEL,
  claveBucket, nivelBase, calcularGrupoNiveles, etiquetaBucketCompleta, rangoDeBucket, generarBuckets, dateToIso,
  SvgStackedBars, SvgDonut, SvgHBars, ChartLabel, SecLabel, LegendDot, MetricTile, Card, FilterRow, ActionBtn,
  SimpleTable, formDesdeCliente, BarraFiltrosPanel, leerPresetLeads, borrarPresetLeads, irAVentas,
} from "./SeccionVentas"
import type { Agrupacion, CliFilter } from "./SeccionVentas"

const DEMO_DESDE = "2026-01-01"
const DEMO_HASTA = "2026-09-30"
const primeroDelMes = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const hoy = () => new Date().toISOString().slice(0, 10)

/** Pestaña Leads de CRM — la misma que vivía en Ventas, con estado propio:
    rango, demo y filtros ya no se comparten con las otras pestañas de Ventas.
    `leadFoco`: documentId de un lead (tarjeta del Pipeline) a mostrar resaltado. */
export function LeadsPortalView({ leadFoco = null, onFocoConsumido }: { leadFoco?: string | null; onFocoConsumido?: () => void } = {}) {
  // Cuando se llega desde Ventas, el modo, rango y filtros viajan en sessionStorage.
  const [preset] = useState(leerPresetLeads)
  useEffect(() => { borrarPresetLeads() }, [])

  const { leads: _rL, setLeads: setRawLeadsFetch, loading: lL } = useGetLeads()
  const { cotizaciones: _rC, loading: lC } = useGetAllCotizaciones()
  const { ventas: _rV, setVentas: setRawVentasFetch, loading: lV } = useGetVentas()
  const { clientes: clientesReales, setClientes: setClientesReales } = useGetClientes()

  const [demo, setDemo] = useState(leadFoco ? false : (preset?.demo ?? USE_DEMO))
  const rawLeads  = demo ? DEMO_DATA.leads  : _rL
  const rawCots   = demo ? DEMO_DATA.cots   : _rC
  const rawVentas = demo ? DEMO_DATA.ventas : _rV
  const loading   = demo ? false : (lL || lC || lV)
  // En demo no se puede crear/editar/borrar — los documentId son ficticios.
  const puedeEditar = !demo

  const [df, setDf] = useState(() => preset?.df ?? (demo ? DEMO_DESDE : primeroDelMes()))
  const [dt, setDt] = useState(() => preset?.dt ?? (demo ? DEMO_HASTA : hoy()))
  const [cliFilter, setCliFilter] = useState<CliFilter>(preset?.cli ?? null)
  const [clienteDetalle, setClienteDetalle] = useState<ClienteEmpresa | null>(null)
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("mes")
  const [bucketFilter, setBucketFilter] = useState("")
  const [lCanal, setLCanal]   = useState(preset?.lCanal ?? "")
  const [lFunnel, setLFunnel] = useState("")
  const [lOrigen, setLOrigen] = useState("")

  const [wizardOpen,       setWizardOpen]       = useState(false)
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [clienteEditando,  setClienteEditando]  = useState<ClienteEmpresa | null>(null)
  const [clienteForm,      setClienteForm]      = useState<ClientePayload>(emptyCliente())
  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [delLeadId,        setDelLeadId]        = useState<string | null>(null)
  const [filaResaltada,    setFilaResaltada]    = useState<string | null>(null)

  // Llegar desde una tarjeta del Pipeline: el lead es real, así que se sale del
  // demo y se quitan los filtros y el rango que lo puedan esconder.
  useEffect(() => {
    if (!leadFoco) return
    if (demo) { setDemo(false); setDf(primeroDelMes()); setDt(hoy()); setBucketFilter(""); return }
    if (lL) return
    onFocoConsumido?.()
    const lead = _rL.find(l => l.documentId === leadFoco)
    if (!lead) { toast.error("No encontré ese lead en la lista"); return }
    setLCanal(""); setLFunnel(""); setLOrigen(""); setBucketFilter(""); setCliFilter(null)
    const f = (lead.fechaLead ?? lead.createdAt).slice(0, 10)
    if (f < df) setDf(`${f.slice(0, 8)}01`)
    if (f > dt) setDt(f)
    setFilaResaltada(leadFoco)
  }, [leadFoco, demo, lL, _rL, df, dt, onFocoConsumido])

  // Misma receta que NotasMejora: esperar a que la fila exista, centrarla y resaltarla un momento.
  useEffect(() => {
    if (!filaResaltada) return
    let cancelado = false
    const inicio = performance.now()
    const buscar = () => {
      if (cancelado) return
      const fila = document.getElementById(`lead-fila-${filaResaltada}`)
      if (fila) {
        fila.scrollIntoView({ behavior: "smooth", block: "center" })
        setTimeout(() => { if (!cancelado) setFilaResaltada(null) }, 2200)
        return
      }
      if (performance.now() - inicio < 5000) requestAnimationFrame(buscar)
      else setFilaResaltada(null)
    }
    requestAnimationFrame(buscar)
    return () => { cancelado = true }
  }, [filaResaltada])

  async function guardarClienteLocal(editando: ClienteEmpresa | null, form: ClientePayload): Promise<ClienteEmpresa> {
    if (editando) {
      const updated = await updateCliente(editando.documentId, form)
      setClientesReales(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
      return updated
    }
    const nuevo = await createCliente(form)
    setClientesReales(prev => [...prev, nuevo])
    return nuevo
  }
  function abrirEditarCliente(c: ClienteEmpresa) {
    setClienteEditando(c)
    setClienteForm(formDesdeCliente(c))
    setClienteModalOpen(true)
  }
  async function guardarClienteModal() {
    if (!clienteForm.nombre.trim()) return
    setGuardandoCliente(true)
    try { await guardarClienteLocal(clienteEditando, clienteForm); setClienteModalOpen(false) }
    finally { setGuardandoCliente(false) }
  }

  async function toggleCalificarLead(lead: Lead) {
    const nuevoValor = !lead.calificado
    const extra = nuevoValor && !lead.fechaCalificado ? { fechaCalificado: new Date().toISOString() } : {}
    const updated = await updateLead(lead.documentId, { calificado: nuevoValor, ...extra })
    setRawLeadsFetch(prev => prev.map(l => l.documentId === updated.documentId ? updated : l))
  }
  async function borrarLeadRow(lead: Lead) {
    await deleteLead(lead.documentId)
    setRawLeadsFetch(prev => prev.filter(l => l.documentId !== lead.documentId))
    setDelLeadId(null)
  }
  function abrirEditarLead(lead: Lead) {
    const c = clientesReales.find(c => c.documentId === lead.cliente?.documentId)
    if (!c) return
    abrirEditarCliente(c)
  }

  function toggleDemo() {
    const next = !demo
    setDemo(next)
    if (!next) { setDf(primeroDelMes()); setDt(hoy()) }
    else        { setDf(DEMO_DESDE); setDt(DEMO_HASTA) }
    setBucketFilter("")
  }
  function clearBucketFilter() {
    setBucketFilter("")
    if (demo) { setDf(DEMO_DESDE); setDt(DEMO_HASTA) }
    else { const d = new Date(); setDf(`${d.getFullYear()}-01-01`); setDt(d.toISOString().slice(0, 10)) }
  }
  function selectBucket(key: string) {
    if (bucketFilter === key) { clearBucketFilter(); return }
    const [ini, fin] = rangoDeBucket(key, agrupacion)
    setDf(ini)
    setDt(fin)
    setBucketFilter(key)
  }

  const inRange  = (iso: string | null) => { if (!iso) return false; const d = iso.slice(0, 10); return d >= df && d <= dt }
  const inBucket = (iso: string | null) => !bucketFilter || (!!iso && claveBucket(iso, agrupacion) === bucketFilter)

  const allLeads = useMemo(() => rawLeads.filter(l =>
    inRange(l.fechaLead ?? l.createdAt) && (!cliFilter || l.cliente?.documentId === cliFilter.docId)
  ), [rawLeads, df, dt, cliFilter])
  const allCots = useMemo(() => rawCots.filter(c =>
    inRange(c.fecha ?? c.createdAt) && (!cliFilter || c.cliente?.documentId === cliFilter.docId)
  ), [rawCots, df, dt, cliFilter])
  const allVentas = useMemo(() => rawVentas.filter(v =>
    inRange(v.fecha ?? v.createdAt) && (!cliFilter || v.cliente?.documentId === cliFilter.docId)
  ), [rawVentas, df, dt, cliFilter])
  const fLeads = useMemo(() => allLeads.filter(l =>
    (!lCanal || l.canal === lCanal) && (!lFunnel || l.Funnel === lFunnel) && (!lOrigen || l.origen === lOrigen) && inBucket(l.fechaLead ?? l.createdAt)
  ), [allLeads, lCanal, lFunnel, lOrigen, bucketFilter, agrupacion])

  // Número de posición dentro de su etapa del funnel, para el badge de ClientePanel.
  const numMap = useMemo(() => {
    const porFunnel = new Map<FunnelEtapa, ClienteEmpresa[]>()
    FUNNEL_ALL.forEach(e => porFunnel.set(e, []))
    clientesReales.slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(c => porFunnel.get(c.Funnel ?? "Lead")?.push(c))
    const m = new Map<string, string>()
    FUNNEL_ALL.forEach(etapa => porFunnel.get(etapa)?.forEach((c, i) => m.set(c.documentId, numDisplay(etapa, i))))
    return m
  }, [clientesReales])
  const ventasDelClienteDetalle = useMemo(
    () => clienteDetalle ? rawVentas.filter(v => v.cliente?.documentId === clienteDetalle.documentId) : [],
    [rawVentas, clienteDetalle]
  )

  /* ── Buckets de período activos (día/semana/mes/año) ── */
  const buckets = useMemo(() => generarBuckets(df, dt, agrupacion), [df, dt, agrupacion])
  const bucketIdxMap = useMemo(() => { const m = new Map<string, number>(); buckets.forEach((k, i) => m.set(k, i)); return m }, [buckets])
  const bucketIdxActivo = bucketFilter ? (bucketIdxMap.get(bucketFilter) ?? -1) : -1
  const bucketLabelsRaw = useMemo(() => buckets.map(k => nivelBase(k, agrupacion)), [buckets, agrupacion])
  const bucketGroupLevels = useMemo(() => calcularGrupoNiveles(buckets, agrupacion), [buckets, agrupacion])
  const bucketTipLabels = useMemo(() => buckets.map(k => etiquetaBucketCompleta(k, agrupacion)), [buckets, agrupacion])

  /* ── Leads analysis ── */
  const ALL_CANALES=["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]
  const leadsStk:[number,number][]=buckets.map(()=>[0,0])
  fLeads.forEach(l=>{const idx=bucketIdxMap.get(claveBucket(l.fechaLead??l.createdAt,agrupacion));if(idx!==undefined){if(l.Funnel==="Entrega"||l.Funnel==="Rechazada")leadsStk[idx][1]++;else leadsStk[idx][0]++}})
  const _canalBase=allLeads.filter(l=>(!lFunnel||l.Funnel===lFunnel)&&inBucket(l.fechaLead??l.createdAt))
  const canalCounts=_canalBase.reduce((a,l)=>{const k=l.canal??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const canalSegs=ALL_CANALES.map(l=>({l,v:canalCounts[l]||0,c:CANAL_COLOR[l]||T.muted})).sort((a,b)=>b.v-a.v)
  const _origenBase=allLeads.filter(l=>(!lCanal||l.canal===lCanal)&&(!lFunnel||l.Funnel===lFunnel)&&inBucket(l.fechaLead??l.createdAt))
  const origenSegs=Object.entries(_origenBase.reduce((a,l)=>{const k=l.origen??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([l,v])=>({l,v,c:T.sky}))
  // Origen medido de los leads: primer y último contacto (de la Tienda) y lo que la persona declaró.
  const contarOrigen=(campo:(l:typeof fLeads[number])=>string|null|undefined)=>Object.entries(fLeads.reduce((a,l)=>{const k=campo(l);if(k)a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([l,v])=>({l:l.slice(0,14),v,c:T.violet}))
  const ftSegs=contarOrigen(l=>l.ftFuente), ltSegs=contarOrigen(l=>l.ltFuente), comoSegs=contarOrigen(l=>l.comoNosConocio)
  const hayOrigenMedido=ftSegs.length>0||ltSegs.length>0||comoSegs.length>0
  const pctCot=fLeads.length?Math.round(fLeads.filter(l=>allCots.some(c=>c.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0
  const pctPed=fLeads.length?Math.round(fLeads.filter(l=>allVentas.some(v=>v.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0
  // La tabla muestra 100 filas; si el lead resaltado queda más abajo, se amplía hasta incluirlo.
  const idxResaltada = filaResaltada ? fLeads.findIndex(l => l.documentId === filaResaltada) : -1
  const filas = fLeads.slice(0, Math.max(100, idxResaltada + 1))

  if (clienteDetalle) return (
    <ClientePanel
      cliente={clienteDetalle}
      num={numMap.get(clienteDetalle.documentId) ?? "—"}
      ventasDelCliente={ventasDelClienteDetalle}
      onClose={()=>setClienteDetalle(null)}
      onUpdate={u=>{ setClienteDetalle(u); setClientesReales(prev=>prev.map(x=>x.documentId===u.documentId?u:x)) }}
      onEdit={()=>{ abrirEditarCliente(clienteDetalle); setClienteDetalle(null) }}
      onAvanzar={()=>{}}
      onRetroceder={async()=>null}
      onRechazar={async()=>null}
      onRecuperar={async()=>null}
      onNuevoPedido={()=>{}}
      onVentaActualizada={v=>setRawVentasFetch(prev=>prev.map(x=>x.documentId===v.documentId?v:x))}
      backLabel="Volver a Leads"
      mostrarAccionesEtapa={false}
    />
  )

  return (
    <>
      <BarraFiltrosPanel
        demo={demo} onToggleDemo={toggleDemo}
        df={df} dt={dt}
        onDesde={d=>{setDf(dateToIso(d));setBucketFilter("")}}
        onHasta={d=>{setDt(dateToIso(d));setBucketFilter("")}}
        onReset={()=>{
          setBucketFilter("")
          if (demo) { setDf(DEMO_DESDE); setDt(DEMO_HASTA) }
          else { const d=new Date(); setDf(`${d.getFullYear()}-01-01`); setDt(d.toISOString().slice(0,10)) }
        }}
        agrupacion={agrupacion} onAgrupacion={v=>{setAgrupacion(v);setBucketFilter("")}}
        cliFilter={cliFilter} onClearCli={()=>setCliFilter(null)}
        bucketFilter={bucketFilter} onClearBucket={clearBucketFilter}
      />
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">Cargando datos…</div>
      ) : (
        <>
          <Card>
            <SecLabel>Resumen de Leads · período seleccionado</SecLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div className="md:col-span-2">
                <ChartLabel>{`Por ${AGRUPACION_LABEL[agrupacion].toLowerCase()} · clic para filtrar`}</ChartLabel>
                <SvgStackedBars months={bucketLabelsRaw} tipLabels={bucketTipLabels} data={leadsStk} colors={[T.violet,T.muted]} labels={["Activos","Cerrados"]} activeBar={bucketIdxActivo} groupLevels={bucketGroupLevels} onBarClick={i=>selectBucket(buckets[i])}/>
                <div className="flex gap-4 mt-2">
                  <LegendDot color={T.em} label="Entregado" val={fLeads.filter(l=>l.Funnel==="Entrega").length} active={lFunnel==="Entrega"} onClick={()=>setLFunnel(lFunnel==="Entrega"?"":"Entrega")}/>
                  <LegendDot color={T.rose} label="Rechazada" val={fLeads.filter(l=>l.Funnel==="Rechazada").length} active={lFunnel==="Rechazada"} onClick={()=>setLFunnel(lFunnel==="Rechazada"?"":"Rechazada")}/>
                </div>
              </div>
              <div>
                <ChartLabel>Por canal · clic para filtrar</ChartLabel>
                <div className="flex items-center gap-3">
                  <SvgDonut segs={canalSegs} active={lCanal||undefined} onSegmentClick={v=>setLCanal(lCanal===v?"":v)}/>
                  <div className="flex-1">{canalSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={lCanal===s.l} dimmed={!!lCanal&&lCanal!==s.l} onClick={()=>setLCanal(lCanal===s.l?"":s.l)}/>)}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ChartLabel>Por origen · clic para filtrar</ChartLabel>
                <SvgHBars items={origenSegs.length?origenSegs:[{l:"Sin datos",v:0,c:T.muted}]} active={lOrigen||undefined} onBarClick={l=>setLOrigen(lOrigen===l?"":l)}/>
              </div>
              <div>
                <ChartLabel>Métricas de conversión</ChartLabel>
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile val={`${pctCot}%`} label="c/ cotización" color={T.amber} onClick={()=>irAVentas("cotizaciones")}/>
                  <MetricTile val={`${pctPed}%`} label="c/ pedido" color={T.em} onClick={()=>irAVentas("pedidos")}/>
                  <MetricTile val={fLeads.length} label="Leads total" color={T.violet}/>
                  <MetricTile val={fLeads.filter(l=>l.Funnel==="Entrega").length} label="Convertidos" color={T.em} onClick={()=>{setLCanal("");setLFunnel("Entrega");setLOrigen("");setBucketFilter("")}}/>
                </div>
              </div>
            </div>
            {!demo && (
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <ChartLabel>Origen medido de la Tienda</ChartLabel>
                {hayOrigenMedido ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {([["Primer contacto",ftSegs],["Último contacto",ltSegs],["Cómo nos conoció",comoSegs]] as const).map(([titulo,segs])=>(
                      <div key={titulo}>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{titulo}</p>
                        <SvgHBars items={segs.length?[...segs]:[{l:"Sin datos",v:0,c:T.muted}]}/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Aún no hay leads con origen medido: aparecerán cuando alguien deje sus datos en la Tienda o los captures con «¿Cómo nos conoció?».</p>
                )}
              </div>
            )}
          </Card>
          <Card className="flex flex-col gap-3">
            <FilterRow label="CANAL"  options={["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]} active={lCanal} onToggle={v=>setLCanal(lCanal===v?"":v)}/>
            <FilterRow label="FUNNEL" options={["Lead","Oferta","Pedido","Entrega","Rechazada"]} active={lFunnel} onToggle={v=>setLFunnel(lFunnel===v?"":v)}/>
            {lOrigen&&<FilterRow label="ORIGEN" options={[lOrigen]} active={lOrigen} onToggle={()=>setLOrigen("")}/>}
          </Card>
          <div className="flex items-center justify-between -mt-2 px-1">
            <p className="text-[11px] font-mono text-slate-500">{fLeads.length} leads en vista · {allLeads.length} en rango</p>
            {puedeEditar && (
              <button type="button" onClick={()=>setWizardOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
                <Plus size={13}/> Nuevo lead
              </button>
            )}
          </div>
          <SimpleTable
            headers={["Fecha","Cliente","Canal","Origen","Funnel"]}
            rows={filas.map(l=>[dd(l.fechaLead??l.createdAt),l.cliente?.nombre??"—",l.canal??"—",l.origen??"—",l.Funnel])}
            rowId={i=>`lead-fila-${filas[i].documentId}`}
            rowClassName={i=>filas[i].documentId===filaResaltada?"bg-violet-500/15 dark:bg-violet-500/20":""}
            tonos={[null,null,null,null,(r)=>r[4]==="Entrega"?"acento":r[4]==="Rechazada"?null:"normal"]}
            onRowClick={r=>{const cli=fLeads.find(l=>l.cliente?.nombre===r[1]);if(cli?.cliente)setCliFilter({docId:cli.cliente.documentId,nombre:cli.cliente.nombre})}}
            highlightCol={1}
            renderActions={puedeEditar ? (i)=>{
              const lead = filas[i]
              const c = lead.cliente ? clientesReales.find(x=>x.documentId===lead.cliente!.documentId) : null
              return delLeadId===lead.documentId ? (
                <span className="flex items-center gap-1.5 whitespace-nowrap" onClick={e=>e.stopPropagation()}>
                  <span className="text-[10px] text-slate-500">¿Borrar?</span>
                  <button className="text-[10px] text-red-600 dark:text-red-400 font-medium" onClick={()=>borrarLeadRow(lead)}>Sí</button>
                  <button className="text-[10px] text-slate-500" onClick={()=>setDelLeadId(null)}>No</button>
                </span>
              ) : (
                <>
                  {c && <ActionBtn title="Ver cliente" onClick={()=>setClienteDetalle(c)}><Eye size={13}/></ActionBtn>}
                  <ActionBtn title={lead.calificado?"Quitar calificación":"Calificar"} onClick={()=>toggleCalificarLead(lead)}>
                    <CheckCircle2 size={13} className={lead.calificado?"text-violet-600 dark:text-violet-400":undefined}/>
                  </ActionBtn>
                  <ActionBtn title="Editar contacto" onClick={()=>abrirEditarLead(lead)}><Pencil size={13}/></ActionBtn>
                  <ActionBtn title="Eliminar lead" tone="danger" onClick={()=>setDelLeadId(lead.documentId)}><Trash2 size={13}/></ActionBtn>
                </>
              )
            } : undefined}
          />
        </>
      )}
      {wizardOpen && (
        <NuevoLeadWizard
          clientes={clientesReales}
          guardarCliente={guardarClienteLocal}
          onCreado={(lead)=>{ setRawLeadsFetch(prev=>[lead,...prev]) }}
          onCerrar={()=>setWizardOpen(false)}
        />
      )}
      {clienteModalOpen && (
        <ClienteModal editando={clienteEditando} form={clienteForm} setForm={setClienteForm}
          onGuardar={guardarClienteModal} onCerrar={()=>setClienteModalOpen(false)} guardando={guardandoCliente}
        />
      )}
    </>
  )
}
