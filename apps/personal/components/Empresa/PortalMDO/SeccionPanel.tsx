"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { SeccionHero, HeroTabs, useHeroImagen } from "./shared"
import type { TabItem } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { useGetLeads } from "@/api/lead/getLead"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import { useVisitasRango } from "@/api/visitas/visitas"
import type { Lead, CanalLead, OrigenLead } from "@/types/lead"
import type { Cotizacion, EstadoCotizacion, OrigenCotizacion } from "@/types/cotizacion"
import type { VentaEmpresa, EstadoVenta } from "@/types/ventaEmpresa"
import type { FunnelEtapa } from "@/types/clienteEmpresa"

/* ─── Demo mode ────────────────────────────────────────────────────────
   USE_DEMO = true  → datos ficticios (ene-sep 2026, meta 45k MXN/mes)
   USE_DEMO = false → datos reales de Strapi                           */
export const USE_DEMO = true

function _s(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

function buildDemoData(): { leads: Lead[]; cots: Cotizacion[]; ventas: VentaEmpresa[] } {
  // Pool fijo de 25 clientes — todos los documentos comparten este pool
  // para que los joins entre leads/cots/ventas funcionen correctamente
  const CLIENTES = [
    {id:1,d:"CLI001",n:"Ana García"},      {id:2,d:"CLI002",n:"Carlos López"},
    {id:3,d:"CLI003",n:"María Martínez"},  {id:4,d:"CLI004",n:"José Hernández"},
    {id:5,d:"CLI005",n:"Laura Rodríguez"}, {id:6,d:"CLI006",n:"Miguel Sánchez"},
    {id:7,d:"CLI007",n:"Rosa Flores"},     {id:8,d:"CLI008",n:"Pedro Ramírez"},
    {id:9,d:"CLI009",n:"Sofía Torres"},    {id:10,d:"CLI010",n:"Diego Morales"},
    {id:11,d:"CLI011",n:"Elena Jiménez"},  {id:12,d:"CLI012",n:"Roberto Vega"},
    {id:13,d:"CLI013",n:"Carmen Ortiz"},   {id:14,d:"CLI014",n:"Fernando Reyes"},
    {id:15,d:"CLI015",n:"Patricia Cruz"},  {id:16,d:"CLI016",n:"Alejandro Núñez"},
    {id:17,d:"CLI017",n:"Verónica Castillo"},{id:18,d:"CLI018",n:"Eduardo Guzmán"},
    {id:19,d:"CLI019",n:"Adriana Mendoza"},{id:20,d:"CLI020",n:"Luis Peña"},
    {id:21,d:"CLI021",n:"Daniela Herrera"},{id:22,d:"CLI022",n:"Ricardo Moreno"},
    {id:23,d:"CLI023",n:"Gabriela Luna"},  {id:24,d:"CLI024",n:"Iván Ramos"},
    {id:25,d:"CLI025",n:"Claudia Delgado"},
  ]
  const CANALES: CanalLead[]     = ["WhatsApp","WhatsApp","WhatsApp","Instagram","Instagram","Mostrador","Formulario","Vendedor","Facebook","Teléfono","WhatsApp","Instagram"]
  const ORIGENES: OrigenLead[]   = ["Formulario web","Referido","Mostrador","Anuncio Meta","Carrito","Prospección","Campaña email","Anuncio Google","Referido","Mostrador"]
  const FUNNELS: FunnelEtapa[]   = ["Lead","Oferta","Pedido","Entrega","Entrega","Entrega","Rechazada","Pedido","Oferta","Entrega"]
  const E_COT: EstadoCotizacion[] = ["Convertida","Convertida","Enviada","Aceptada","Borrador","Rechazada","Convertida","Enviada"]
  const O_COT: OrigenCotizacion[] = ["COT","COT","WEB","CART","ANU","EML","COT","WEB","CART"]
  const E_VEN: EstadoVenta[]     = ["Entregado","Entregado","Entregado","Entregado","Entregado","Enviado","Preparando","Pagado","Cancelado","Entregado"]
  const CONCEPTOS = ["Anillo solitario diamante","Collar de oro 14k","Aretes de perla","Pulsera de plata","Dije de oro","Set aretes y collar","Anillo de compromiso","Cadena de oro 10k","Pulsera de oro tejido","Anillo de boda par","Anillo de graduación","Collar con colgante","Aretes argolla de oro","Brazalete de plata","Dije corazón oro"]
  const CENTROS = ["Tienda Principal","Tienda Principal","Online","Sucursal Norte","Online"]
  const MONTOS  = [8500,6200,3800,2900,4100,7500,12000,4800,5600,18000,6500,5200,4400,3200,4700]
  const MESES   = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"]
  const PLAN    = [[18,12,13],[15,10,11],[21,14,14],[16,11,12],[23,16,15],[19,13,13],[17,11,12],[22,15,14],[14,9,10]]

  const leads: Lead[] = []; const cots: Cotizacion[] = []; const ventas: VentaEmpresa[] = []
  let s = 7

  for (let mi = 0; mi < MESES.length; mi++) {
    const [nL,nC,nV] = PLAN[mi]; const mes = MESES[mi]

    for (let i = 0; i < nL; i++) {
      const day = 1 + Math.floor(_s(s++) * 28)
      const fecha = `${mes}-${String(day).padStart(2,"0")}`
      const id = leads.length + 1
      const cli = CLIENTES[Math.floor(_s(s++) * CLIENTES.length)]
      leads.push({ id, documentId:`LDEMO${id}`, numero:`L-${String(id).padStart(4,"0")}`,
        Funnel: FUNNELS[Math.floor(_s(s++) * FUNNELS.length)],
        canal:  CANALES[Math.floor(_s(s++) * CANALES.length)],
        origen: ORIGENES[Math.floor(_s(s++) * ORIGENES.length)],
        fechaLead:fecha, createdAt:fecha, calificado:_s(s++)>0.4,
        referidorTipo:null,referidorNombre:null,referidorCliente:null,
        campanaOrigen:null,notas:null,segmento:null,
        fechaOferta:null,fechaPedido:null,fechaEntrega:null,fechaRechazada:null,fechaCalificado:null,
        origenApp:null,canalContacto:null,origenContacto:null,
        cliente:{documentId:cli.d,nombre:cli.n,telefono:null},
      } as Lead)
    }

    for (let i = 0; i < nC; i++) {
      const day = 1 + Math.floor(_s(s++) * 28)
      const fecha = `${mes}-${String(day).padStart(2,"0")}`
      const id = cots.length + 1
      const ci = Math.floor(_s(s++) * CONCEPTOS.length)
      const cli = CLIENTES[Math.floor(_s(s++) * CLIENTES.length)]
      cots.push({ id, documentId:`CDEMO${id}`, numero:`COT-${String(id).padStart(4,"0")}`,
        items:[], precioEnvio:0,
        total: Math.round(MONTOS[ci] * (0.85 + _s(s++) * 0.35)),
        estado:           E_COT[Math.floor(_s(s++) * E_COT.length)],
        origenCotizacion: O_COT[Math.floor(_s(s++) * O_COT.length)],
        notas:null, fecha, validoHasta:null, createdAt:fecha, atendidoPor:null,
        cliente:{documentId:cli.d,nombre:cli.n,telefono:null,email:null},
      } as Cotizacion)
    }

    for (let i = 0; i < nV; i++) {
      const day = 1 + Math.floor(_s(s++) * 28)
      const fecha = `${mes}-${String(day).padStart(2,"0")}`
      const id = ventas.length + 1
      const ci = Math.floor(_s(s++) * CONCEPTOS.length)
      const ei = Math.floor(_s(s++) * E_VEN.length)
      const cli = CLIENTES[Math.floor(_s(s++) * CLIENTES.length)]
      ventas.push({ id, documentId:`VDEMO${id}`, numero:`VTA-${String(id).padStart(4,"0")}`,
        concepto:CONCEPTOS[ci],
        monto: Math.round(MONTOS[ci] * (0.88 + _s(s++) * 0.30)),
        fecha, estado:E_VEN[ei], metodoPago:null, notas:null, cantidad:1,
        centro_venta:{id:ei%5+1, documentId:`CV${ei%5}`, nombre:CENTROS[ei%CENTROS.length]},
        cliente:{id:cli.id, documentId:cli.d, nombre:cli.n, telefono:null},
        producto:null, lineas:[], createdAt:fecha,
      } as VentaEmpresa)
    }
  }
  return { leads, cots, ventas }
}

export const DEMO_DATA = buildDemoData()

/* ─── Tokens ────────────────────────────────────────────────────────── */
const T = { gold:"#c8922e",em:"#34c77b",sky:"#4aaed4",rose:"#e05555",violet:"#9b82d4",amber:"#f0a830",muted:"#4a5a7a",text:"#dde3f0",surface:"#0e1530",surf2:"#131a3a",border:"#1c2545",border2:"#283060",bg:"#080d1e" }
const $m = (n:number) => `$${Math.round(n).toLocaleString("es-MX")}`
const dd  = (s:string) => s?s.slice(5,10):"—"
const getMonth = (iso:string) => iso?.slice(5,7)??""
const CANAL_COLOR:Record<string,string> = { WhatsApp:"#25d366",Instagram:"#e1306c",Facebook:"#1877f2",Formulario:T.sky,Mostrador:T.gold,Vendedor:T.violet,Teléfono:T.muted,Correo:T.muted,Distribuidor:T.amber }
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const MI:Record<string,number> = {"01":0,"02":1,"03":2,"04":3,"05":4,"06":5,"07":6,"08":7,"09":8,"10":9,"11":10,"12":11}

/* ─── Kinetic: count-up animation hook ─────────────────────────────── */
function useAnimatedValue(target: number, duration = 700): number {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    let start: number | null = null
    const from = 0
    const tick = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(from + (target - from) * ease))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

/* ─── Tooltip compartido ────────────────────────────────────────────── */
type TipState = {x:number;y:number;title:string;sub?:string}|null
function ChartTip({t}:{t:TipState}){
  if(!t) return null
  return(
    <div className="pointer-events-none absolute z-30 rounded-lg shadow-xl text-[11px] whitespace-nowrap"
      style={{left:t.x,top:t.y-10,transform:"translate(-50%,-100%)",background:"#0f172a",border:"1px solid #334155",color:"#f8fafc",padding:"6px 10px",lineHeight:1.45}}>
      <div className="font-semibold">{t.title}</div>
      {t.sub&&<div style={{color:"#94a3b8",fontSize:10,marginTop:2}}>{t.sub}</div>}
    </div>
  )
}
function useChartTip(ref:React.RefObject<HTMLDivElement|null>){
  const [tip,setTip]=useState<TipState>(null)
  const pos=(e:React.MouseEvent)=>{
    const r=ref.current?.getBoundingClientRect()
    if(!r) return {x:0,y:0}
    return {x:e.clientX-r.left,y:e.clientY-r.top}
  }
  const show=(e:React.MouseEvent,title:string,sub?:string)=>setTip({...pos(e),title,sub})
  const move=(e:React.MouseEvent,title:string,sub?:string)=>setTip({...pos(e),title,sub})
  const hide=()=>setTip(null)
  return {tip,show,move,hide}
}

/* ─── SVG Charts ────────────────────────────────────────────────────── */
function SvgStackedBars({ months, data, colors, labels, onBarClick, activeBar }:{
  months:string[]; data:[number,number][]; colors:[string,string]; labels?:[string,string]; onBarClick?:(i:number)=>void; activeBar?:number
}) {
  const ref=useRef<HTMLDivElement>(null)
  const {tip,show,move,hide}=useChartTip(ref)
  const W=520,H=120,PB=22,PT=14,PL=2,PR=4,cH=H-PB-PT,cW=W-PL-PR
  const totals=data.map(d=>d[0]+d[1])
  const maxV=Math.max(...totals,1)*1.15
  const bW=cW/months.length, bi=bW*0.65
  const ys=(v:number)=>PT+cH*(1-v/maxV)
  const bh=(v:number)=>cH*(v/maxV)
  const lbl=labels??["A","B"]
  // Staggered entrance: each bar animates in with a delay
  const [ready,setReady]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setReady(true),60);return()=>clearTimeout(t)},[])
  return (
    <div ref={ref} style={{position:"relative"}}>
      <ChartTip t={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",overflow:"visible"}}>
        {months.map((m,i)=>{
          const x=+(PL+i*bW+(bW-bi)/2).toFixed(1)
          const tot=totals[i]; let cy=ys(tot)
          const tipTitle=`${m} · ${tot} total`
          const tipSub=data[i].map((v,j)=>v?`${v} ${lbl[j]}`:"").filter(Boolean).join(" · ")
          const delay=`${i*40}ms`
          return (
            <g key={m} style={{cursor:onBarClick?"pointer":undefined,
                opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(8px)",
                transition:`opacity 0.35s ${delay}, transform 0.35s ${delay}`}}
              onClick={()=>onBarClick?.(i)}
              onMouseEnter={e=>show(e,tipTitle,tipSub||undefined)}
              onMouseMove={e=>move(e,tipTitle,tipSub||undefined)}
              onMouseLeave={hide}>
              <rect x={x} y={PT} width={+bi.toFixed(1)} height={cH} fill="transparent"/>
              {data[i].map((v,j)=>{
                if(!v) return null
                const h=bh(v)
                const op=activeBar===undefined||activeBar<0||activeBar===i?0.82:0.35
                const el=<rect key={j} x={x} y={+cy.toFixed(1)} width={+bi.toFixed(1)} height={+h.toFixed(1)} fill={colors[j]} opacity={op} style={{transition:"opacity .15s"}}/>
                cy+=h; return el
              })}
              {tot>0&&<text x={+(x+bi/2).toFixed(1)} y={+(ys(tot)-3).toFixed(1)} textAnchor="middle" fill={T.text} fontFamily="monospace" fontSize={7}>{tot}</text>}
              <text x={+(x+bi/2).toFixed(1)} y={H-5} textAnchor="middle" fill={T.muted} fontFamily="monospace" fontSize={7.5}>{m}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function SvgDonut({ segs, onSegmentClick, active }:{
  segs:{l:string;v:number;c:string}[]; onSegmentClick?:(label:string)=>void; active?:string
}) {
  const ref=useRef<HTMLDivElement>(null)
  const {tip,show,move,hide}=useChartTip(ref)
  const cx=80,cy=80,ro=58,ri=30
  const total=segs.reduce((s,x)=>s+x.v,0)||1
  let a=-Math.PI/2
  const slices=segs.filter(x=>x.v>0).map(x=>{
    const da=(x.v/total)*Math.PI*2
    const x1=+(cx+ro*Math.cos(a)).toFixed(1),y1=+(cy+ro*Math.sin(a)).toFixed(1)
    const x2=+(cx+ro*Math.cos(a+da)).toFixed(1),y2=+(cy+ro*Math.sin(a+da)).toFixed(1)
    const xi1=+(cx+ri*Math.cos(a+da)).toFixed(1),yi1=+(cy+ri*Math.sin(a+da)).toFixed(1)
    const xi2=+(cx+ri*Math.cos(a)).toFixed(1),yi2=+(cy+ri*Math.sin(a)).toFixed(1)
    const laf=da>Math.PI?1:0
    const mid=a+da/2
    const lx=+(cx+(ro+14)*Math.cos(mid)).toFixed(1),ly=+(cy+(ro+14)*Math.sin(mid)).toFixed(1)
    const pct=Math.round(x.v/total*100)
    a+=da
    return {d:`M ${x1} ${y1} A ${ro} ${ro} 0 ${laf} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${laf} 0 ${xi2} ${yi2} Z`,c:x.c,pct,lx,ly,l:x.l,v:x.v}
  })
  // Staggered entrance per segment
  const [ready,setReady]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setReady(true),40);return()=>clearTimeout(t)},[])
  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <ChartTip t={tip}/>
      <svg viewBox="0 0 160 160" style={{width:150,maxWidth:"100%",flexShrink:0,display:"block"}}>
        {slices.map((s,i)=>{
          const isAct=!active||active===s.l
          const baseOp=isAct?0.88:0.2
          const delay=`${i*55}ms`
          return (
            <path key={i} d={s.d} fill={s.c}
              opacity={ready?baseOp:0}
              style={{cursor:onSegmentClick?"pointer":"default",
                transition:`opacity 0.4s ${delay}`}}
              onClick={()=>onSegmentClick?.(s.l)}
              onMouseEnter={e=>{(e.currentTarget as SVGPathElement).style.opacity="1";show(e,`${s.l} · ${s.v}`,`${s.pct}% del total`)}}
              onMouseMove={e=>move(e,`${s.l} · ${s.v}`,`${s.pct}% del total`)}
              onMouseLeave={e=>{(e.currentTarget as SVGPathElement).style.opacity=ready?String(baseOp):"0";hide()}}/>
          )
        })}
        {active&&slices.map((s,i)=>s.l===active?(
          <path key={`hl-${i}`} d={s.d} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} style={{pointerEvents:"none"}}/>
        ):null)}
        {ready&&slices.filter(s=>s.pct>=9).map((s,i)=>(
          <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontFamily="monospace" fontSize={7.5} opacity={!active||active===s.l?1:0.4}>{s.pct}%</text>
        ))}
      </svg>
    </div>
  )
}

function SvgHBars({ items, onBarClick, active }:{
  items:{l:string;v:number;c:string}[]; onBarClick?:(label:string)=>void; active?:string
}) {
  const ref=useRef<HTMLDivElement>(null)
  const {tip,show,move,hide}=useChartTip(ref)
  const H=items.length*20+6,W=260,PL=74,PR=32,PT=2
  const max=Math.max(...items.map(x=>x.v),1)
  const bw=W-PL-PR
  return (
    <div ref={ref} style={{position:"relative"}}>
      <ChartTip t={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W}}>
        {items.map((x,i)=>{
          const y=PT+i*20,w=+(x.v/max*bw).toFixed(1)
          const pct=max>0?Math.round(x.v/max*100):0
          const isAct=!active||active===x.l
          const baseOp=isAct?0.82:0.22
          return (
            <g key={i} style={{cursor:onBarClick?"pointer":undefined,transition:"opacity .2s",opacity:isAct?1:0.45}}
              onClick={()=>onBarClick?.(x.l)}
              onMouseEnter={e=>show(e,`${x.l} · ${x.v}`,`${pct}% del máximo`)}
              onMouseMove={e=>move(e,`${x.l} · ${x.v}`,`${pct}% del máximo`)}
              onMouseLeave={hide}>
              <rect x={PL} y={y} width={bw} height={16} fill="transparent"/>
              <text x={PL-5} y={y+11} textAnchor="end" fill={isAct?T.text:T.muted} fontFamily="sans-serif" fontSize={9}>{x.l}</text>
              <rect x={PL} y={y+2} width={w} height={12} fill={x.c} opacity={baseOp} style={{transition:"opacity .15s"}}
                onMouseEnter={e=>(e.currentTarget.style.opacity="1")}
                onMouseLeave={e=>(e.currentTarget.style.opacity=String(baseOp))}/>
              <text x={PL+w+4} y={y+11} fill={T.text} fontFamily="monospace" fontSize={8}>{x.v}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* Ingresos por mes con línea de meta ───────────────────────────────── */
function SvgRevBars({ data, target, months, onBarClick, activeBar }:{
  data: number[]; target: number; months: string[]; onBarClick?:(i:number)=>void; activeBar?:number
}) {
  const ref=useRef<HTMLDivElement>(null)
  const {tip,show,move,hide}=useChartTip(ref)
  const W=520,H=130,PB=22,PT=18,PL=2,PR=4
  const cH=H-PB-PT, cW=W-PL-PR
  const maxV=Math.max(...data,target)*1.1
  const bW=cW/months.length, bi=bW*0.65
  const ys=(v:number)=>PT+cH*(1-v/maxV)
  const bh=(v:number)=>cH*(v/maxV)
  const ty=+ys(target).toFixed(1)
  // Staggered entrance animation
  const [ready,setReady]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setReady(true),60);return()=>clearTimeout(t)},[])
  return (
    <div ref={ref} style={{position:"relative"}}>
      <ChartTip t={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",overflow:"visible"}}>
        <line x1={PL} y1={ty} x2={W-PR} y2={ty} stroke={T.gold} strokeWidth={1} strokeDasharray="4 3" opacity={0.7}/>
        <text x={W-PR-2} y={ty-3} textAnchor="end" fill={T.gold} fontFamily="monospace" fontSize={7.5}>Meta ${(target/1000).toFixed(0)}k</text>
        {months.map((m,i)=>{
          const v=data[i]
          const x=+(PL+i*bW+(bW-bi)/2).toFixed(1)
          const h=+bh(v).toFixed(1)
          const y=+ys(v).toFixed(1)
          const hit=v>=target
          const op=activeBar===undefined||activeBar<0||activeBar===i?0.78:0.35
          const tipSub=hit?`✓ Meta superada ($${(target/1000).toFixed(0)}k)`:`✗ Bajo la meta · falta $${((target-v)/1000).toFixed(1)}k`
          const delay=`${i*35}ms`
          return (
            <g key={m}
              style={{cursor:onBarClick?"pointer":undefined,
                opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(6px)",
                transition:`opacity 0.35s ${delay}, transform 0.35s ${delay}`}}
              onClick={()=>onBarClick?.(i)}
              onMouseEnter={e=>v>0?show(e,`${m} · $${(v/1000).toFixed(1)}k`,tipSub):undefined}
              onMouseMove={e=>v>0?move(e,`${m} · $${(v/1000).toFixed(1)}k`,tipSub):undefined}
              onMouseLeave={hide}>
              <rect x={x} y={PT} width={+bi.toFixed(1)} height={cH} fill="transparent"/>
              {v>0&&<rect x={x} y={y} width={+bi.toFixed(1)} height={h} fill={hit?T.em:T.sky} opacity={op} style={{transition:"opacity .15s"}}/>}
              {v>0&&<text x={+(x+bi/2).toFixed(1)} y={y-3} textAnchor="middle" fill={hit?T.em:T.text} fontFamily="monospace" fontSize={6.5}>${(v/1000).toFixed(1)}k</text>}
              <text x={+(x+bi/2).toFixed(1)} y={H-5} textAnchor="middle" fill={T.muted} fontFamily="monospace" fontSize={7.5}>{m}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── UI primitives ────────────────────────────────────────────────── */
function ChartLabel({children}:{children:string}){
  return <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{children}</p>
}
function SecLabel({children}:{children:string}){
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 to-transparent"/>
    </div>
  )
}
function LegendDot({color,label,val,active,dimmed,onClick}:{color:string;label:string;val:number;active?:boolean;dimmed?:boolean;onClick?:()=>void}){
  const empty=val===0
  return (
    <div onClick={onClick} className={`flex items-center gap-2 mb-1.5 rounded-md px-1.5 py-0.5 transition-all ${onClick?"cursor-pointer":""} ${active?"ring-1 ring-inset ring-violet-400/50":"hover:bg-slate-100 dark:hover:bg-[#2a1b3d]/40"}`}
      style={{opacity:dimmed?0.28:empty?0.45:1,transition:"opacity .2s"}}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{background:color,opacity:empty?0.5:1}}/>
      <span className="text-[11px] flex-1 text-slate-500 dark:text-slate-400" style={{color:active?color:undefined,fontWeight:active?600:400}}>{label}</span>
      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300" style={{color:empty?"#94a3b8":undefined}}>{val}</span>
    </div>
  )
}
function MetricTile({val,label,color,onClick,formatter}:{val:string|number;label:string;color?:string;onClick?:()=>void;formatter?:(n:number)=>string}){
  const c = color||T.violet
  const isNum = typeof val === "number"
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animVal = useAnimatedValue(isNum ? (val as number) : 0, 700)
  const display = isNum ? (formatter ? formatter(animVal) : animVal.toLocaleString("es-MX")) : val
  return (
    <div onClick={onClick} className={`rounded-xl p-4 text-center transition-all ${onClick?"cursor-pointer hover:scale-[1.02]":""}`}
      style={{background:`${c}12`,border:`1px solid ${c}28`}}>
      <div className="font-mono text-xl font-semibold leading-none" style={{color:c}}>{display}</div>
      <div className="text-[10px] mt-1.5 text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}
function Chip({active,label,onClick}:{active:boolean;label:string;onClick:()=>void}){
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
      active
        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 dark:border-violet-500/25"
        : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
    }`}>
      {label}
    </button>
  )
}
function Card({children,className=""}:{children:React.ReactNode;className?:string}){
  return <div className={`bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 ${className}`}>{children}</div>
}
function KpiCard({title,value,subBadge,subLabel,color,onClick,formatter,badgeFormatter}:{title:string;value:string|number;subBadge:string|number;subLabel:string;color:string;onClick?:()=>void;formatter?:(n:number)=>string;badgeFormatter?:(n:number)=>string}){
  const isNum = typeof value === "number"
  const isBadgeNum = typeof subBadge === "number"
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animVal = useAnimatedValue(isNum ? (value as number) : 0, 800)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animBadge = useAnimatedValue(isBadgeNum ? (subBadge as number) : 0, 650)
  const displayVal = isNum ? (formatter ? formatter(animVal) : animVal.toLocaleString("es-MX")) : value
  const displayBadge = isBadgeNum ? (badgeFormatter ? badgeFormatter(animBadge) : animBadge.toLocaleString("es-MX")) : subBadge
  return(
    <div onClick={onClick}
      className="rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-150 hover:scale-[1.01]"
      style={{background:T.surface,border:`1px solid ${T.border}`}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=color+"55";(e.currentTarget as HTMLDivElement).style.boxShadow=`0 0 22px ${color}10`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border;(e.currentTarget as HTMLDivElement).style.boxShadow="none"}}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{title}</div>
      <div className="font-mono text-4xl font-bold leading-none" style={{color}}>{displayVal}</div>
      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-800">
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>{displayBadge}</span>
        <span className="text-[11px] text-slate-400 leading-tight">{subLabel}</span>
      </div>
    </div>
  )
}
function PipelineBar({e,n,c,go,pct,idx}:{e:string;n:number;c:string;go:()=>void;pct:number;idx:number}){
  const [filled,setFilled]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setFilled(true),idx*70+80);return()=>clearTimeout(t)},[idx])
  return(
    <div onClick={go} className="grid items-center gap-3 cursor-pointer group" style={{gridTemplateColumns:"80px 1fr 28px"}}>
      <div className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">{e}</div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#0f1a2e"}}>
        <div className="h-full rounded-full" style={{width:filled?`${pct}%`:"0%",background:`${c}99`,transition:`width 0.55s cubic-bezier(0.34,1.02,0.64,1)`}}/>
      </div>
      <div className="font-mono text-[11px] text-right" style={{color:c}}>{n}</div>
    </div>
  )
}
function FilterRow({label,options,active,onToggle}:{label:string;options:string[];active:string;onToggle:(v:string)=>void}){
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 min-w-13">{label}</span>
      {options.map(v=><Chip key={v} active={active===v} label={v} onClick={()=>onToggle(v)}/>)}
    </div>
  )
}

/* ─── Tabla ─────────────────────────────────────────────────────────── */
function SimpleTable({ headers, rows, colors, onRowClick, highlightCol }:{
  headers:string[]; rows:string[][]
  colors:(((r:string[])=>string)|null)[]
  onRowClick?:(r:string[],i:number)=>void
  highlightCol?:number
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mt-1">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#2a1b3d]/60">
            {headers.map(h=>(
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length===0?(
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic text-[12px]">
                Sin resultados.
              </td>
            </tr>
          ):rows.map((r,i)=>(
            <tr key={i} className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors ${onRowClick?"cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a1b3d]/40":""}`}
              onClick={()=>onRowClick?.(r,i)}>
              {r.map((cell,j)=>{
                const fn=colors[j]
                const color=typeof fn==="function"?fn(r):undefined
                return (
                  <td key={j} className="px-4 py-2.5 align-middle">
                    <span style={{
                      fontFamily:j===4||j===0?"var(--font-geist-mono),monospace":undefined,
                      fontSize:j===0?10:j===4?12:undefined,
                      fontWeight:j===4?600:undefined,
                      color:color??(j===highlightCol?T.gold:undefined),
                      textDecoration:j===highlightCol&&onRowClick?"underline":undefined,
                    }}>{cell}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Component ─────────────────────────────────────────────────────── */
type View = "dashboard"|"leads"|"cotizaciones"|"pedidos"|"clientes"
type CliFilter = { docId:string; nombre:string } | null

export function SeccionPanel() {
  const { identidad, loading: loadingId, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const heroImg = useHeroImagen("portada_panel", documentId, reload)

  const {leads:_rL,loading:lL}    = useGetLeads()
  const {cotizaciones:_rC,loading:lC} = useGetAllCotizaciones()
  const {ventas:_rV,loading:lV}   = useGetVentas()

  const [demo,setDemo]       = useState(USE_DEMO)
  const rawLeads             = demo?DEMO_DATA.leads:_rL
  const rawCots              = demo?DEMO_DATA.cots:_rC
  const rawVentas            = demo?DEMO_DATA.ventas:_rV
  const loading              = demo?false:(lL||lC||lV)

  const nowFirst = ()=>{const d=new Date();d.setDate(1);return d.toISOString().slice(0,10)}
  const nowLast  = ()=>new Date().toISOString().slice(0,10)

  const [view,setView]       = useState<View>(()=>{
    try{const v=localStorage.getItem("panel_view");return(["dashboard","leads","cotizaciones","pedidos","clientes"].includes(v??"")?v as View:"dashboard")}catch{return"dashboard"}
  })
  const [df,setDf]           = useState(demo?"2026-01-01":nowFirst)
  const [dt,setDt]           = useState(demo?"2026-09-30":nowLast)
  const [cliFilter,setCliFilter] = useState<CliFilter>(null)
  const [cliQ,setCLiQ]       = useState("")
  const [tipoFilter,setTipoFilter] = useState<"todos"|"cliente"|"prospecto"|"usuario">("todos")
  const [mFilter,setMFilter] = useState(-1)   // índice 0-11, -1 = todos los meses

  // Visitas web anónimas (sesiones únicas del sitio público)
  const { total: visitasReales } = useVisitasRango(demo?"":df, demo?"":dt)
  // En demo: ~15 visitantes por cada lead (tasa conv. formulario ~6-7%)
  const visitasWeb = demo
    ? rawLeads.filter(l=>l.canal==="Formulario").length * 15
    : (visitasReales ?? 0)

  // Leads filters
  const [lCanal,setLCanal]   = useState("")
  const [lFunnel,setLFunnel] = useState("")
  const [lOrigen,setLOrigen] = useState("")
  // Cotizaciones filters
  const [cEstado,setCEstado] = useState("")
  const [cOrigen,setCOrigen] = useState("")
  const [cTipo,setCTipo]     = useState("")
  // Ventas filters
  const [vEstado,setVEstado] = useState("")
  const [vCanal,setVCanal]   = useState("")

  function toggleDemo() {
    const next = !demo
    setDemo(next)
    if (!next) { setDf(nowFirst()); setDt(nowLast()) }
    else        { setDf("2026-01-01"); setDt("2026-09-30") }
    setMFilter(-1)
  }

  function lastDayOfMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function clearMonthFilter() {
    setMFilter(-1)
    if (demo) { setDf("2026-01-01"); setDt("2026-09-30") }
    else { const d = new Date(); setDf(`${d.getFullYear()}-01-01`); setDt(d.toISOString().slice(0,10)) }
  }

  function selectMonth(i: number) {
    if (mFilter === i) { clearMonthFilter(); return }
    const year = parseInt(df.slice(0, 4))
    const mm   = String(i + 1).padStart(2, "0")
    const last = String(lastDayOfMonth(year, i)).padStart(2, "0")
    setDf(`${year}-${mm}-01`)
    setDt(`${year}-${mm}-${last}`)
    setMFilter(i)
  }

  // Sync mFilter when df/dt change manually (e.g. user types a date)
  useEffect(() => {
    if (!df || !dt) return
    const d1 = new Date(df + "T12:00:00"), d2 = new Date(dt + "T12:00:00")
    const y1 = d1.getFullYear(), m1 = d1.getMonth(), day1 = d1.getDate()
    const y2 = d2.getFullYear(), m2 = d2.getMonth(), day2 = d2.getDate()
    if (y1 === y2 && m1 === m2 && day1 === 1 && day2 === lastDayOfMonth(y2, m2)) {
      setMFilter(m1)
    } else {
      setMFilter(-1)
    }
  }, [df, dt]) // eslint-disable-line react-hooks/exhaustive-deps

  const inRange = (iso:string|null) => { if(!iso)return false; const d=iso.slice(0,10); return d>=df&&d<=dt }
  const inMonth = (iso:string|null) => mFilter<0 || MI[getMonth(iso??"")] === mFilter

  // Rango de fecha + filtro de cliente global
  const allLeads = useMemo(()=>rawLeads.filter(l=>
    inRange(l.fechaLead??l.createdAt)&&(!cliFilter||l.cliente?.documentId===cliFilter.docId)
  ),[rawLeads,df,dt,cliFilter])

  const allCots = useMemo(()=>rawCots.filter(c=>
    inRange(c.fecha??c.createdAt)&&(!cliFilter||c.cliente?.documentId===cliFilter.docId)
  ),[rawCots,df,dt,cliFilter])

  const allVentas = useMemo(()=>rawVentas.filter(v=>
    inRange(v.fecha??v.createdAt)&&(!cliFilter||v.cliente?.documentId===cliFilter.docId)
  ),[rawVentas,df,dt,cliFilter])

  // Filtros por vista + filtro de mes
  const fLeads = useMemo(()=>allLeads.filter(l=>
    (!lCanal||l.canal===lCanal)&&(!lFunnel||l.Funnel===lFunnel)&&(!lOrigen||l.origen===lOrigen)&&inMonth(l.fechaLead??l.createdAt)
  ),[allLeads,lCanal,lFunnel,lOrigen,mFilter])

  const fCots = useMemo(()=>allCots.filter(c=>
    (!cEstado||c.estado===cEstado)&&
    (!cOrigen||c.origenCotizacion===cOrigen)&&
    (!cTipo||(cTipo==="web"?(c.origenCotizacion==="CART"||c.origenCotizacion==="WEB"):(c.origenCotizacion!=="CART"&&c.origenCotizacion!=="WEB")))&&
    inMonth(c.fecha??c.createdAt)
  ),[allCots,cEstado,cOrigen,cTipo,mFilter])

  const fVentas = useMemo(()=>allVentas.filter(v=>
    (!vEstado||v.estado===vEstado)&&(!vCanal||v.centro_venta?.nombre===vCanal)&&inMonth(v.fecha??v.createdAt)
  ),[allVentas,vEstado,vCanal,mFilter])

  function goView(v:View,extra?:{lCanal?:string;lFunnel?:string;cEstado?:string;cTipo?:string;vEstado?:string}){
    setView(v)
    try{localStorage.setItem("panel_view",v)}catch{}
    setLCanal(extra?.lCanal??""); setLFunnel(extra?.lFunnel??""); setLOrigen("")
    setCEstado(extra?.cEstado??""); setCOrigen(""); setCTipo(extra?.cTipo??"")
    setVEstado(extra?.vEstado??""); setVCanal("")
    setMFilter(-1)
  }
  function clearCli(){setCliFilter(null)}
  function selectCli(docId:string,nombre:string){setCliFilter({docId,nombre}); goView("dashboard")}

  /* ── Mapa de clientes (todas las vistas) ── */
  const clientesMap = useMemo(()=>{
    type CE = {docId:string;nombre:string;leads:number;cots:number;ventas:number;total:number;ultima:string;formulario:boolean}
    const map = new Map<string,CE>()
    const upd = (docId:string,nombre:string,fn:(e:CE)=>void, fecha:string)=>{
      const e = map.get(docId)??{docId,nombre,leads:0,cots:0,ventas:0,total:0,ultima:fecha,formulario:false}
      fn(e)
      if(fecha>e.ultima) e.ultima=fecha
      map.set(docId,e)
    }
    // Usa rawLeads/rawCots/rawVentas (solo rango de fecha, sin cliFilter) → vista Clientes muestra todos
    rawLeads.filter(l=>inRange(l.fechaLead??l.createdAt)).forEach(l=>{
      if(!l.cliente)return
      upd(l.cliente.documentId,l.cliente.nombre,e=>{e.leads++;if(l.canal==="Formulario")e.formulario=true},l.fechaLead??l.createdAt)
    })
    rawCots.filter(c=>inRange(c.fecha??c.createdAt)).forEach(c=>{
      if(!c.cliente)return
      upd(c.cliente.documentId,c.cliente.nombre,e=>{e.cots++;e.total+=c.total},c.fecha??c.createdAt)
    })
    rawVentas.filter(v=>inRange(v.fecha??v.createdAt)).forEach(v=>{
      if(!v.cliente)return
      upd(v.cliente.documentId,v.cliente.nombre,e=>{e.ventas++;if(v.estado==="Entregado")e.total+=v.monto},v.fecha??v.createdAt)
    })
    return [...map.values()].sort((a,b)=>b.total-a.total)
  },[rawLeads,rawCots,rawVentas,df,dt])

  // clientesDash: misma lógica pero desde allLeads/allCots/allVentas (respeta cliFilter)
  // → la tabla del dashboard y el KPI se actualizan al seleccionar cliente o cambiar rango
  const clientesDash = useMemo(()=>{
    type CE = {docId:string;nombre:string;leads:number;cots:number;ventas:number;total:number;ultima:string;formulario:boolean}
    const map = new Map<string,CE>()
    const upd = (docId:string,nombre:string,fn:(e:CE)=>void,fecha:string)=>{
      const e=map.get(docId)??{docId,nombre,leads:0,cots:0,ventas:0,total:0,ultima:fecha,formulario:false}
      fn(e); if(fecha>e.ultima)e.ultima=fecha; map.set(docId,e)
    }
    allLeads.forEach(l=>{if(!l.cliente)return;upd(l.cliente.documentId,l.cliente.nombre,e=>{e.leads++;if(l.canal==="Formulario")e.formulario=true},l.fechaLead??l.createdAt)})
    allCots.forEach(c=>{if(!c.cliente)return;upd(c.cliente.documentId,c.cliente.nombre,e=>{e.cots++;e.total+=c.total},c.fecha??c.createdAt)})
    allVentas.forEach(v=>{if(!v.cliente)return;upd(v.cliente.documentId,v.cliente.nombre,e=>{e.ventas++;if(v.estado==="Entregado")e.total+=v.monto},v.fecha??v.createdAt)})
    return [...map.values()].sort((a,b)=>b.total-a.total)
  },[allLeads,allCots,allVentas])

  const cliFiltered = useMemo(()=>{
    let base = cliQ ? clientesMap.filter(c=>c.nombre.toLowerCase().includes(cliQ.toLowerCase())) : clientesMap
    if(tipoFilter==="cliente")   base = base.filter(c=>c.ventas>0)
    if(tipoFilter==="prospecto") base = base.filter(c=>c.ventas===0)
    if(tipoFilter==="usuario")   base = base.filter(c=>c.formulario)
    return base
  },[clientesMap,cliQ,tipoFilter])

  /* ── Dashboard stats ── */
  const entregados    = allVentas.filter(v=>v.estado==="Entregado")
  const ingresos      = entregados.reduce((s,v)=>s+v.monto,0)
  const tick          = entregados.length?Math.round(ingresos/entregados.length):0
  const cotsConv      = allCots.filter(c=>c.estado==="Convertida")
  const leadsConvPct  = allLeads.length?Math.round(allLeads.filter(l=>allCots.some(c=>c.cliente?.documentId===l.cliente?.documentId)).length/allLeads.length*100):0
  const cotConvPct    = allCots.length?Math.round(cotsConv.length/allCots.length*100):0
  const pedEntPct     = allVentas.length?Math.round(entregados.length/allVentas.length*100):0
  const leadsWeb      = allLeads.filter(l=>l.canal==="Formulario").length
  // Segmentación de contactos: cliente vs prospecto vs usuario web
  const contactosTotal   = clientesDash.length
  const clientesRealesCnt= clientesDash.filter(c=>c.ventas>0).length
  const prospectosCnt    = clientesDash.filter(c=>c.ventas===0).length
  const usuariosWebCnt   = clientesDash.filter(c=>c.formulario).length

  /* ── Leads analysis ── */
  const ALL_CANALES=["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]
  const leadsStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fLeads.forEach(l=>{const m=MI[getMonth(l.fechaLead??l.createdAt)];if(m!==undefined){if(l.Funnel==="Entrega")leadsStk[m][0]++;else if(l.Funnel==="Rechazada")leadsStk[m][1]++}})
  const _canalBase=allLeads.filter(l=>(!lFunnel||l.Funnel===lFunnel)&&inMonth(l.fechaLead??l.createdAt))
  const canalCounts=_canalBase.reduce((a,l)=>{const k=l.canal??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const canalSegs=ALL_CANALES.map(l=>({l,v:canalCounts[l]||0,c:CANAL_COLOR[l]||T.muted})).sort((a,b)=>b.v-a.v)
  const _origenBase=allLeads.filter(l=>(!lCanal||l.canal===lCanal)&&(!lFunnel||l.Funnel===lFunnel)&&inMonth(l.fechaLead??l.createdAt))
  const origenSegs=Object.entries(_origenBase.reduce((a,l)=>{const k=l.origen??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([l,v])=>({l,v,c:T.sky}))
  const pctCot=fLeads.length?Math.round(fLeads.filter(l=>allCots.some(c=>c.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0
  const pctPed=fLeads.length?Math.round(fLeads.filter(l=>allVentas.some(v=>v.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0

  /* ── Cotizaciones analysis ── */
  const ORIGEN_LABEL:Record<string,string>={COT:"Mostrador",WEB:"Formulario web",CART:"Carrito",ANU:"Anuncio",EML:"Email"}
  const cotsStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fCots.forEach(c=>{const m=MI[getMonth(c.fecha??c.createdAt)];if(m!==undefined){if(c.estado==="Convertida")cotsStk[m][0]++;else if(c.estado==="Rechazada")cotsStk[m][1]++}})
  const _cotBase=allCots.filter(c=>(!cOrigen||c.origenCotizacion===cOrigen)&&(!cTipo||(cTipo==="web"?(c.origenCotizacion==="CART"||c.origenCotizacion==="WEB"):(c.origenCotizacion!=="CART"&&c.origenCotizacion!=="WEB")))&&inMonth(c.fecha??c.createdAt))
  const cotEstadoSegs=(["Convertida","Enviada","Aceptada","Borrador","Rechazada"] as const).map(e=>({l:e,v:_cotBase.filter(c=>c.estado===e).length,c:e==="Convertida"?T.em:e==="Rechazada"?T.rose:e==="Aceptada"?T.violet:e==="Enviada"?T.sky:T.muted}))
  const cotOrigenCounts=fCots.reduce((a,c)=>{const k=c.origenCotizacion??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const cotOrigenSegs=(["COT","WEB","CART","ANU","EML"] as const).map(k=>({l:ORIGEN_LABEL[k],v:cotOrigenCounts[k]||0,c:CANAL_COLOR[k]||T.sky})).sort((a,b)=>b.v-a.v)

  /* ── Ventas analysis ── */
  const vStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fVentas.forEach(v=>{const m=MI[getMonth(v.fecha??v.createdAt)];if(m!==undefined){if(v.estado==="Entregado")vStk[m][0]++;else if(v.estado==="Cancelado")vStk[m][1]++}})
  const _ventaBase=allVentas.filter(v=>(!vCanal||v.centro_venta?.nombre===vCanal)&&inMonth(v.fecha??v.createdAt))
  const ventaEstadoSegs=(["Entregado","Enviado","Preparando","Pagado","Cotizado","Cancelado"] as const).map(e=>({l:e,v:_ventaBase.filter(v=>v.estado===e).length,c:e==="Entregado"?T.em:e==="Cancelado"?T.rose:e==="Enviado"?T.sky:e==="Preparando"?T.amber:e==="Pagado"?T.violet:T.muted}))
  const allCanalesVenta=[...new Set(rawVentas.map(v=>v.centro_venta?.nombre).filter(Boolean) as string[])]
  const ventaCanalCounts=fVentas.reduce((a,v)=>{const k=v.centro_venta?.nombre??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const ventaCanalSegs=allCanalesVenta.map(l=>({l,v:ventaCanalCounts[l]||0,c:T.sky})).sort((a,b)=>b.v-a.v)
  const compFilt=fVentas.filter(v=>v.estado==="Entregado")
  const tickFilt=compFilt.length?Math.round(compFilt.reduce((s,v)=>s+v.monto,0)/compFilt.length):0

  // Ingresos mensuales (Entregados) para chart con línea de meta
  const META_MES = 45000
  const revMes:number[]=Array(12).fill(0)
  compFilt.forEach(v=>{const m=MI[getMonth(v.fecha??v.createdAt)];if(m!==undefined)revMes[m]+=v.monto})

  /* ── Shell ── */
  const TABS:TabItem[] = [
    {id:"dashboard",    label:"Dashboard"},
    {id:"leads",        label:"Leads"},
    {id:"cotizaciones", label:"Cotizaciones"},
    {id:"pedidos",      label:"Pedidos"},
    {id:"clientes",     label:"Contactos"},
  ]

  const shell=(content:React.ReactNode)=>(
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      <SeccionHero
        breadcrumb={["Empresa", "Panel de control"]}
        titulo="Actividad comercial"
        descripcion="Leads, cotizaciones y ventas en un solo vistazo — filtra por período o cliente."
        imagenUrl={identidad?.portada_panel?.url}
        imagenOriginalUrl={identidad?.portada_panel_original?.url}
        documentId={documentId}
        puedeEditar={!loadingId}
        uploading={heroImg.uploading}
        inputRef={heroImg.inputRef}
        onTrigger={heroImg.trigger}
        onFileChange={heroImg.handleFile}
        onSaveCrop={heroImg.saveCrop}
      >
        <HeroTabs tabs={TABS} active={view} onChange={v=>goView(v as View)}/>
      </SeccionHero>

      {/* Barra de filtros — siempre visible debajo del hero */}
      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-4 py-2.5">
        <button onClick={toggleDemo}
          className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all shrink-0"
          style={demo?{background:`${T.gold}18`,color:T.gold,border:`1px solid ${T.gold}35`}:{background:"transparent",color:"#94a3b8",border:"1px solid #e2e8f0"}}>
          {demo?"▶ DEMO":"REAL"}
        </button>
        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0"/>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">desde</span>
          <input type="date" value={df} onChange={e=>setDf(e.target.value)}
            className="rounded-md px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-slate-700 bg-transparent focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
            style={{colorScheme:"dark"}}/>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">hasta</span>
          <input type="date" value={dt} onChange={e=>setDt(e.target.value)}
            className="rounded-md px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-slate-700 bg-transparent focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
            style={{colorScheme:"dark"}}/>
        </div>
        {cliFilter&&(
          <>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0"/>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25 shrink-0">
              {cliFilter.nombre}
              <button onClick={clearCli} className="cursor-pointer bg-transparent border-none p-0 leading-none opacity-60 hover:opacity-100 ml-0.5">×</button>
            </span>
          </>
        )}
        {mFilter>=0&&(
          <>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0"/>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono shrink-0"
              style={{background:`${T.sky}15`,border:`1px solid ${T.sky}44`,color:T.sky}}>
              MES: {MESES[mFilter]}
              <button onClick={clearMonthFilter} className="cursor-pointer bg-transparent border-none p-0 leading-none opacity-60 hover:opacity-100 ml-0.5" style={{color:T.sky}}>×</button>
            </span>
          </>
        )}
      </div>

      {loading?(
        <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">Cargando datos…</div>
      ):content}
    </div>
  )

  /* ═══ DASHBOARD ═══════════════════════════════════════════════════ */
  if(view==="dashboard") return shell(
    <>
      {/* KPI — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard title="Leads capturados" value={allLeads.length} subBadge={`${leadsConvPct}%`} subLabel="conv. a cotización" color={T.violet} onClick={()=>goView("leads")}/>
        <KpiCard title="Cotizaciones" value={allCots.length} subBadge={`${cotConvPct}%`} subLabel="convertidas" color={T.amber} onClick={()=>goView("cotizaciones")}/>
        <KpiCard title="Pedidos" value={allVentas.length} subBadge={`${pedEntPct}%`} subLabel="entregados" color={T.sky} onClick={()=>goView("pedidos")}/>
        <KpiCard title="Ingresos MXN" value={ingresos} formatter={$m} subBadge={tick} badgeFormatter={$m} subLabel="ticket promedio" color={T.gold} onClick={()=>goView("pedidos")}/>
        <KpiCard title="Visitantes" value={visitasWeb} subBadge={`${contactosTotal}`} subLabel={`contactos · ${clientesRealesCnt} clientes`} color={T.em} onClick={()=>goView("clientes")}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SecLabel>Embudo · Web</SecLabel>
          {(()=>{
            const leadsForm=allLeads.filter(l=>l.canal==="Formulario").length
            const steps=[
              {l:"Visitantes",n:visitasWeb,  c:T.muted, go:()=>{}, tip:"Sesiones anónimas en el sitio web"},
              {l:"Formulario", n:leadsForm,   c:T.violet,go:()=>goView("leads",{lCanal:"Formulario"}), tip:"Enviaron el formulario de contacto"},
              {l:"Cot. web",   n:allCots.filter(c=>c.origenCotizacion==="WEB"||c.origenCotizacion==="CART").length,c:T.amber,go:()=>goView("cotizaciones",{cTipo:"web"}),tip:"Recibieron cotización web"},
              {l:"Pedidos",    n:allVentas.length,c:T.sky,  go:()=>goView("pedidos"), tip:"Realizaron un pedido"},
              {l:"Entregado",  n:entregados.length,c:T.em,  go:()=>goView("pedidos",{vEstado:"Entregado"}),tip:"Pedido entregado"},
            ]
            const peak=Math.max(...steps.map(s=>s.n),1)
            const base=steps[0].n||1
            return(
              <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${steps.length},1fr)`}}>
                {steps.map((f,i)=>{
                  const barPct=Math.round(f.n/peak*100)
                  const convPct=i===0?100:Math.round(f.n/base*100)
                  const isAnon=i===0
                  return(
                    <div key={i} onClick={f.go} className={`flex flex-col items-center gap-1.5 ${isAnon?"cursor-default":"cursor-pointer"} group`} title={f.tip}>
                      <div className="w-full rounded-t-md overflow-hidden" style={{height:60,background:"#0f1a2e",borderBottom:`2px solid ${f.c}55`,display:"flex",alignItems:"flex-end"}}>
                        <div className="w-full transition-all duration-300 rounded-t-sm" style={{height:`${barPct}%`,background:isAnon?`${f.c}18`:`${f.c}30`}}/>
                      </div>
                      <div className="font-mono text-base font-semibold" style={{color:f.c}}>{f.n}</div>
                      <div className="text-[9px] font-mono" style={{color:isAnon?"#64748b":convPct>=100?T.em:convPct>=50?T.amber:T.rose}}>{isAnon?"—":convPct+"%"}</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-center leading-tight" style={{color:isAnon?"#4a5a7a":T.muted}}>{f.l}</div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </Card>
        <Card>
          <SecLabel>Pipeline de ventas</SecLabel>
          <div className="space-y-2.5">
            {([
              {e:"Lead",       n:allLeads.length,                                      c:T.violet, go:()=>goView("leads")},
              {e:"Cotizado",   n:allCots.length,                                       c:T.muted,  go:()=>goView("cotizaciones")},
              {e:"Pagado",     n:allVentas.filter(v=>v.estado==="Pagado").length,      c:T.violet, go:()=>{goView("pedidos");setVEstado("Pagado")}},
              {e:"Preparando", n:allVentas.filter(v=>v.estado==="Preparando").length,  c:T.amber,  go:()=>{goView("pedidos");setVEstado("Preparando")}},
              {e:"Enviado",    n:allVentas.filter(v=>v.estado==="Enviado").length,     c:T.sky,    go:()=>{goView("pedidos");setVEstado("Enviado")}},
              {e:"Entregado",  n:allVentas.filter(v=>v.estado==="Entregado").length,   c:T.em,     go:()=>{goView("pedidos");setVEstado("Entregado")}},
              {e:"Cancelado",  n:allVentas.filter(v=>v.estado==="Cancelado").length,   c:T.rose,   go:()=>{goView("pedidos");setVEstado("Cancelado")}},
            ] as {e:string;n:number;c:string;go:()=>void}[]).map(({e,n,c,go},idx)=>{
              const max=allLeads.length||1; const pct=Math.round(n/max*100)
              return <PipelineBar key={e} e={e} n={n} c={c} go={go} pct={pct} idx={idx}/>
            })}
          </div>
        </Card>
      </div>

      {/* Ingresos vs meta */}
      <Card>
        <SecLabel>Ingresos mensuales vs meta</SecLabel>
        <ChartLabel>Verde = mes que superó la meta de $45,000 MXN</ChartLabel>
        <SvgRevBars months={MESES} data={revMes} target={META_MES} activeBar={mFilter} onBarClick={selectMonth}/>
      </Card>

      {/* Top clientes en dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <SecLabel>Top clientes · período</SecLabel>
          <button onClick={()=>goView("clientes")} className="text-[10px] font-mono px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-90"
            style={{color:T.gold,background:`${T.gold}12`,border:`1px solid ${T.gold}33`}}>
            ver todos →
          </button>
        </div>
        <SimpleTable
          headers={["Contacto","Leads","Cotiz.","Pedidos","Total MXN"]}
          rows={clientesDash.slice(0,5).map(c=>[c.nombre,String(c.leads),String(c.cots),String(c.ventas),$m(c.total)])}
          colors={[null,null,null,null,()=>T.gold]}
          onRowClick={r=>selectCli(clientesDash.find(c=>c.nombre===r[0])?.docId??"",r[0])}
          highlightCol={0}
        />
      </Card>
    </>
  )

  /* ═══ CLIENTES ════════════════════════════════════════════════════ */
  if(view==="clientes") return shell(
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(()=>{
          const tiles:[string|number,string,string,string|null][]=[
            [clientesMap.length,                                                              "Total contactos",        T.sky,    "todos"],
            [clientesMap.filter(c=>c.ventas>0).length,                                        "Clientes (compraron)",   T.em,     "cliente"],
            [clientesMap.filter(c=>c.ventas===0).length,                                      "Prospectos (sin compra)",T.amber,  "prospecto"],
            [clientesMap.filter(c=>c.formulario).length,                                       "Usuarios web",           T.violet, "usuario"],
            [$m(clientesMap.length?Math.round(clientesMap.reduce((s,c)=>s+c.total,0)/(clientesMap.filter(c=>c.total>0).length||1)):0),"Ticket prom.",T.gold,null],
            [$m(clientesMap.reduce((s,c)=>s+c.total,0)),                                      "Total facturado",        T.gold,   null],
          ]
          return tiles.map(([v,l,c,t],i)=>{
            const active = t && tipoFilter===t
            return(
              <div key={i} onClick={()=>t&&setTipoFilter(prev=>prev===t?"todos":t as typeof tipoFilter)}
                className={`rounded-xl p-4 transition-all ${t?"cursor-pointer":""}`}
                style={{background:active?`${c}22`:`${c}10`,border:`1px solid ${active?c:c+"30"}`}}>
                <div className="font-mono text-xl font-semibold leading-none mb-1.5" style={{color:c}}>{v}</div>
                <div className="text-[11px] leading-tight" style={{color:active?c:"#94a3b8"}}>{l}</div>
              </div>
            )
          })
        })()}
      </div>

      <Card>
        <ChartLabel>Top clientes por ingreso acumulado · clic para filtrar</ChartLabel>
        <SvgHBars
          items={clientesMap.slice(0,8).map(c=>({l:c.nombre.split(" ")[0]+" "+c.nombre.split(" ")[1]?.[0]+".",v:c.total,c:T.gold}))}
          onBarClick={label=>{
            const cli=clientesMap.find(c=>c.nombre.startsWith(label.replace("."," ")))??clientesMap.find(c=>c.nombre.split(" ")[0]===label.split(" ")[0])
            if(cli)selectCli(cli.docId,cli.nombre)
          }}
        />
      </Card>

      <Card className="flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">Buscar</span>
        <input value={cliQ} onChange={e=>setCLiQ(e.target.value)} placeholder="buscar contacto…"
          className="flex-1 bg-transparent border-0 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[12px] outline-none pb-1 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
        {cliQ&&<button onClick={()=>setCLiQ("")} className="text-slate-500 hover:text-slate-300 text-sm bg-transparent border-none cursor-pointer">×</button>}
      </Card>

      <p className="text-[11px] font-mono text-slate-500 px-1 -mt-2">
        {cliFiltered.length} contactos en vista
        {tipoFilter!=="todos"&&<button onClick={()=>setTipoFilter("todos")} className="ml-2 px-1.5 py-0.5 rounded text-[10px] cursor-pointer opacity-60 hover:opacity-100 transition-opacity" style={{background:`${T.sky}18`,color:T.sky,border:`1px solid ${T.sky}33`}}>× limpiar filtro</button>}
      </p>

      <SimpleTable
        headers={["Contacto","Leads","Cotiz.","Pedidos","Total MXN","Tipo"]}
        rows={cliFiltered.map(c=>[c.nombre,String(c.leads),String(c.cots),String(c.ventas),$m(c.total),c.ventas>0?(c.formulario?"Cliente web":"Cliente"):c.formulario?"Usuario web":c.cots>0?"Prospecto":"Solo lead"])}
        colors={[
          null,
          (r)=>+r[1]>0?T.violet:T.muted,
          (r)=>+r[2]>0?T.amber:T.muted,
          (r)=>+r[3]>0?T.em:T.muted,
          ()=>T.gold,
          (r)=>r[5]==="Cliente"||r[5]==="Cliente web"?T.em:r[5]==="Usuario web"?T.violet:r[5]==="Prospecto"?T.amber:T.muted,
        ]}
        onRowClick={r=>selectCli(cliFiltered.find(c=>c.nombre===r[0])?.docId??"",r[0])}
        highlightCol={0}
      />
    </>
  )

  /* ═══ LEADS ═══════════════════════════════════════════════════════ */
  if(view==="leads") return shell(
    <>
      <Card>
        <SecLabel>Resumen de Leads · período seleccionado</SecLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={leadsStk} colors={[T.em,T.rose]} labels={["Entregados","Rechazados"]} activeBar={mFilter} onBarClick={selectMonth}/>
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
              <MetricTile val={`${pctCot}%`} label="c/ cotización" color={T.amber} onClick={()=>goView("cotizaciones")}/>
              <MetricTile val={`${pctPed}%`} label="c/ pedido" color={T.em} onClick={()=>goView("pedidos")}/>
              <MetricTile val={fLeads.length} label="Leads total" color={T.violet}/>
              <MetricTile val={fLeads.filter(l=>l.Funnel==="Entrega").length} label="Convertidos" color={T.em} onClick={()=>goView("leads",{lFunnel:"Entrega"})}/>
            </div>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <FilterRow label="CANAL"  options={["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]} active={lCanal} onToggle={v=>setLCanal(lCanal===v?"":v)}/>
        <FilterRow label="FUNNEL" options={["Lead","Oferta","Pedido","Entrega","Rechazada"]} active={lFunnel} onToggle={v=>setLFunnel(lFunnel===v?"":v)}/>
        {lOrigen&&<FilterRow label="ORIGEN" options={[lOrigen]} active={lOrigen} onToggle={()=>setLOrigen("")}/>}
      </Card>
      <p className="text-[11px] font-mono text-slate-500 px-1 -mt-2">{fLeads.length} leads en vista · {allLeads.length} en rango</p>
      <SimpleTable
        headers={["Fecha","Cliente","Canal","Origen","Funnel"]}
        rows={fLeads.slice(0,100).map(l=>[dd(l.fechaLead??l.createdAt),l.cliente?.nombre??"—",l.canal??"—",l.origen??"—",l.Funnel])}
        colors={[null,null,null,null,(r)=>r[4]==="Entrega"?T.em:r[4]==="Rechazada"?T.rose:T.amber]}
        onRowClick={r=>{const cli=fLeads.find(l=>l.cliente?.nombre===r[1]);if(cli?.cliente)setCliFilter({docId:cli.cliente.documentId,nombre:cli.cliente.nombre})}}
        highlightCol={1}
      />
    </>
  )

  /* ═══ COTIZACIONES ════════════════════════════════════════════════ */
  if(view==="cotizaciones") return shell(
    <>
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <SecLabel>Resumen de Cotizaciones · período seleccionado</SecLabel>
          <div className="flex gap-1">
            {([["","Todo"],["web","Web"],["trad","Tradicional"]] as [string,string][]).map(([k,l])=>(
              <button key={k} onClick={()=>setCTipo(cTipo===k&&k!==""?"":k)}
                className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
                style={cTipo===k?{background:`${T.gold}20`,color:T.gold,border:`1px solid ${T.gold}44`}:{background:"transparent",color:"#64748b",border:"1px solid #1e293b"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <div className="md:col-span-2">
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={cotsStk} colors={[T.em,T.rose]} labels={["Convertidas","Rechazadas"]} activeBar={mFilter} onBarClick={selectMonth}/>
            <div className="flex gap-4 mt-2">
              <LegendDot color={T.em} label="Convertida" val={fCots.filter(c=>c.estado==="Convertida").length} active={cEstado==="Convertida"} onClick={()=>setCEstado(cEstado==="Convertida"?"":"Convertida")}/>
              <LegendDot color={T.rose} label="Rechazada" val={fCots.filter(c=>c.estado==="Rechazada").length} active={cEstado==="Rechazada"} onClick={()=>setCEstado(cEstado==="Rechazada"?"":"Rechazada")}/>
            </div>
          </div>
          <div>
            <ChartLabel>Por estado · clic para filtrar</ChartLabel>
            <div className="flex items-start gap-2 flex-wrap">
              <SvgDonut segs={cotEstadoSegs} active={cEstado||undefined} onSegmentClick={v=>setCEstado(cEstado===v?"":v)}/>
              <div className="flex-1 min-w-20 pt-1">{cotEstadoSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={cEstado===s.l} dimmed={!!cEstado&&cEstado!==s.l} onClick={()=>setCEstado(cEstado===s.l?"":s.l)}/>)}</div>
            </div>
          </div>
        </div>
        <div>
          <ChartLabel>Por origen · clic para filtrar</ChartLabel>
          <SvgHBars items={cotOrigenSegs.length?cotOrigenSegs:[{l:"Sin datos",v:0,c:T.muted}]}
            onBarClick={l=>{const k=Object.entries(ORIGEN_LABEL).find(([,v])=>v===l)?.[0];if(k)setCOrigen(cOrigen===k?"":k)}}/>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <FilterRow label="ESTADO" options={["Borrador","Enviada","Aceptada","Rechazada","Convertida"]} active={cEstado} onToggle={v=>setCEstado(cEstado===v?"":v)}/>
        <FilterRow label="ORIGEN" options={["COT","WEB","CART","ANU","EML"]} active={cOrigen} onToggle={v=>setCOrigen(cOrigen===v?"":v)}/>
      </Card>
      <p className="text-[11px] font-mono text-slate-500 px-1 -mt-2">{fCots.length} cotizaciones en vista · {allCots.length} en rango</p>
      <SimpleTable
        headers={["Folio","Fecha","Cliente","Origen","Total","Estado"]}
        rows={fCots.slice(0,100).map(c=>[c.numero??"—",dd(c.fecha??c.createdAt),c.cliente?.nombre??"—",ORIGEN_LABEL[c.origenCotizacion??""]??c.origenCotizacion??"—",$m(c.total),c.estado??"—"])}
        colors={[null,null,null,null,()=>T.gold,(r)=>r[5]==="Convertida"?T.em:r[5]==="Rechazada"?T.rose:T.amber]}
        onRowClick={r=>{const c=fCots.find(c=>c.cliente?.nombre===r[2]);if(c?.cliente)setCliFilter({docId:c.cliente.documentId,nombre:c.cliente.nombre})}}
        highlightCol={2}
      />
    </>
  )

  /* ═══ PEDIDOS ═════════════════════════════════════════════════════ */
  return shell(
    <>
      <Card>
        <SecLabel>Resumen de Pedidos · período seleccionado</SecLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <div className="md:col-span-2">
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={vStk} colors={[T.em,T.rose]} labels={["Entregados","Cancelados"]} activeBar={mFilter} onBarClick={selectMonth}/>
            <div className="flex gap-4 mt-2">
              <LegendDot color={T.em} label="Entregado" val={fVentas.filter(v=>v.estado==="Entregado").length} active={vEstado==="Entregado"} onClick={()=>setVEstado(vEstado==="Entregado"?"":"Entregado")}/>
              <LegendDot color={T.rose} label="Cancelado" val={fVentas.filter(v=>v.estado==="Cancelado").length} active={vEstado==="Cancelado"} onClick={()=>setVEstado(vEstado==="Cancelado"?"":"Cancelado")}/>
            </div>
          </div>
          <div>
            <ChartLabel>Por estado · clic para filtrar</ChartLabel>
            <div className="flex items-start gap-2 flex-wrap">
              <SvgDonut segs={ventaEstadoSegs} active={vEstado||undefined} onSegmentClick={v=>setVEstado(vEstado===v?"":v)}/>
              <div className="flex-1 min-w-20 pt-1">{ventaEstadoSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={vEstado===s.l} dimmed={!!vEstado&&vEstado!==s.l} onClick={()=>setVEstado(vEstado===s.l?"":s.l)}/>)}</div>
            </div>
          </div>
        </div>
        <div className="grid gap-6 items-start" style={{gridTemplateColumns:"1fr 160px"}}>
          <div>
            <ChartLabel>Por canal / centro de venta · clic para filtrar</ChartLabel>
            <SvgHBars items={ventaCanalSegs.length?ventaCanalSegs:[{l:"Sin datos",v:0,c:T.muted}]}
              onBarClick={l=>setVCanal(vCanal===l?"":l)}/>
          </div>
          <div className="flex flex-col gap-2">
            <ChartLabel>Métricas</ChartLabel>
            <MetricTile val={tickFilt} formatter={$m} label="Ticket promedio" color={T.gold}/>
            <MetricTile val={compFilt.length} label="Entregados" color={T.em} onClick={()=>setVEstado(vEstado==="Entregado"?"":"Entregado")}/>
            <MetricTile val={compFilt.reduce((s,v)=>s+v.monto,0)} formatter={$m} label="Ingresos período" color={T.gold}/>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <FilterRow label="ESTADO" options={["Cotizado","Pagado","Preparando","Enviado","Entregado","Cancelado"]} active={vEstado} onToggle={v=>setVEstado(vEstado===v?"":v)}/>
        <FilterRow label="CANAL"  options={[...new Set(rawVentas.map(v=>v.centro_venta?.nombre).filter(Boolean) as string[])]} active={vCanal} onToggle={v=>setVCanal(vCanal===v?"":v)}/>
      </Card>
      <p className="text-[11px] font-mono text-slate-500 px-1 -mt-2">{fVentas.length} ventas en vista · {allVentas.length} en rango</p>
      <SimpleTable
        headers={["Folio","Fecha","Cliente","Concepto","Monto","Estado"]}
        rows={fVentas.slice(0,100).map(v=>[v.numero??"—",dd(v.fecha??v.createdAt),v.cliente?.nombre??"—",v.concepto??"—",$m(v.monto),v.estado??"—"])}
        colors={[null,null,null,null,()=>T.gold,(r)=>r[5]==="Entregado"?T.em:r[5]==="Cancelado"?T.rose:T.amber]}
        onRowClick={r=>{const v=fVentas.find(v=>v.cliente?.nombre===r[2]);if(v?.cliente)setCliFilter({docId:v.cliente.documentId,nombre:v.cliente.nombre})}}
        highlightCol={2}
      />
    </>
  )
}
