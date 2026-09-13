"use client"

import { useState, useMemo } from "react"
import { useGetLeads } from "@/api/lead/getLead"
import { useGetAllCotizaciones } from "@/api/cotizacion/getCotizaciones"
import { useGetVentas } from "@/api/ventaEmpresa/getVentas"
import type { Lead, CanalLead, OrigenLead } from "@/types/lead"
import type { Cotizacion, EstadoCotizacion, OrigenCotizacion } from "@/types/cotizacion"
import type { VentaEmpresa, EstadoVenta } from "@/types/ventaEmpresa"
import type { FunnelEtapa } from "@/types/clienteEmpresa"

/* ─── Demo mode ────────────────────────────────────────────────────────
   USE_DEMO = true  → datos ficticios (ene-sep 2026, meta 45k MXN/mes)
   USE_DEMO = false → datos reales de Strapi                           */
const USE_DEMO = true

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

const DEMO_DATA = buildDemoData()

/* ─── Tokens ────────────────────────────────────────────────────────── */
const T = { gold:"#c8922e",em:"#34c77b",sky:"#4aaed4",rose:"#e05555",violet:"#9b82d4",amber:"#f0a830",muted:"#4a5a7a",text:"#dde3f0",surface:"#0e1530",surf2:"#131a3a",border:"#1c2545",border2:"#283060",bg:"#080d1e" }
const $m = (n:number) => `$${Math.round(n).toLocaleString("es-MX")}`
const dd  = (s:string) => s?s.slice(5,10):"—"
const getMonth = (iso:string) => iso?.slice(5,7)??""
const CANAL_COLOR:Record<string,string> = { WhatsApp:"#25d366",Instagram:"#e1306c",Facebook:"#1877f2",Formulario:T.sky,Mostrador:T.gold,Vendedor:T.violet,Teléfono:T.muted,Correo:T.muted,Distribuidor:T.amber }
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const MI:Record<string,number> = {"01":0,"02":1,"03":2,"04":3,"05":4,"06":5,"07":6,"08":7,"09":8,"10":9,"11":10,"12":11}

/* ─── SVG Charts ────────────────────────────────────────────────────── */
function SvgStackedBars({ months, data, colors, onBarClick, activeBar }:{
  months:string[]; data:[number,number][]; colors:[string,string]; onBarClick?:(i:number)=>void; activeBar?:number
}) {
  const W=520,H=120,PB=22,PT=14,PL=2,PR=4,cH=H-PB-PT,cW=W-PL-PR
  const totals=data.map(d=>d[0]+d[1])
  const maxV=Math.max(...totals,1)*1.15
  const bW=cW/months.length, bi=bW*0.65
  const ys=(v:number)=>PT+cH*(1-v/maxV)
  const bh=(v:number)=>cH*(v/maxV)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",overflow:"visible"}}>
      {months.map((m,i)=>{
        const x=+(PL+i*bW+(bW-bi)/2).toFixed(1)
        const tot=totals[i]; let cy=ys(tot)
        return (
          <g key={m} style={{cursor:onBarClick?"pointer":undefined}} onClick={()=>onBarClick?.(i)}>
            {data[i].map((v,j)=>{
              if(!v) return null
              const h=bh(v)
              const op=activeBar===undefined||activeBar<0||activeBar===i?0.82:0.35
              const el=<rect key={j} x={x} y={+cy.toFixed(1)} width={+bi.toFixed(1)} height={+h.toFixed(1)} fill={colors[j]} opacity={op}/>
              cy+=h; return el
            })}
            {tot>0&&<text x={+(x+bi/2).toFixed(1)} y={+(ys(tot)-3).toFixed(1)} textAnchor="middle" fill={T.text} fontFamily="monospace" fontSize={7}>{tot}</text>}
            <text x={+(x+bi/2).toFixed(1)} y={H-5} textAnchor="middle" fill={T.muted} fontFamily="monospace" fontSize={7.5}>{m}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SvgDonut({ segs, onSegmentClick }:{
  segs:{l:string;v:number;c:string}[]; onSegmentClick?:(label:string)=>void
}) {
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
    return {d:`M ${x1} ${y1} A ${ro} ${ro} 0 ${laf} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${laf} 0 ${xi2} ${yi2} Z`,c:x.c,pct,lx,ly,l:x.l}
  })
  return (
    <svg viewBox="0 0 160 160" style={{width:150,maxWidth:"100%",flexShrink:0}}>
      {slices.map((s,i)=>(
        <path key={i} d={s.d} fill={s.c} opacity={0.82}
          style={{cursor:onSegmentClick?"pointer":"default",transition:"opacity .15s"}}
          onClick={()=>onSegmentClick?.(s.l)}
          onMouseEnter={e=>(e.currentTarget.style.opacity="1")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="0.82")}/>
      ))}
      {slices.filter(s=>s.pct>=9).map((s,i)=>(
        <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontFamily="monospace" fontSize={7.5}>{s.pct}%</text>
      ))}
    </svg>
  )
}

function SvgHBars({ items, onBarClick }:{
  items:{l:string;v:number;c:string}[]; onBarClick?:(label:string)=>void
}) {
  const H=items.length*20+6,W=260,PL=74,PR=32,PT=2
  const max=Math.max(...items.map(x=>x.v),1)
  const bw=W-PL-PR
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W}}>
      {items.map((x,i)=>{
        const y=PT+i*20,w=+(x.v/max*bw).toFixed(1)
        return (
          <g key={i} style={{cursor:onBarClick?"pointer":undefined}} onClick={()=>onBarClick?.(x.l)}>
            <text x={PL-5} y={y+11} textAnchor="end" fill={T.muted} fontFamily="sans-serif" fontSize={9}>{x.l}</text>
            <rect x={PL} y={y+2} width={w} height={12} fill={x.c} opacity={0.75}/>
            <text x={PL+parseFloat(w)+4} y={y+11} fill={T.text} fontFamily="monospace" fontSize={8}>{x.v}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* Ingresos por mes con línea de meta ───────────────────────────────── */
function SvgRevBars({ data, target, months }:{
  data: number[]; target: number; months: string[]
}) {
  const W=520,H=130,PB=22,PT=18,PL=2,PR=4
  const cH=H-PB-PT, cW=W-PL-PR
  const maxV=Math.max(...data,target)*1.1
  const bW=cW/months.length, bi=bW*0.65
  const ys=(v:number)=>PT+cH*(1-v/maxV)
  const bh=(v:number)=>cH*(v/maxV)
  const ty=+ys(target).toFixed(1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",overflow:"visible"}}>
      {/* Línea de meta */}
      <line x1={PL} y1={ty} x2={W-PR} y2={ty} stroke={T.gold} strokeWidth={1} strokeDasharray="4 3" opacity={0.7}/>
      <text x={W-PR-2} y={ty-3} textAnchor="end" fill={T.gold} fontFamily="monospace" fontSize={7.5}>Meta ${(target/1000).toFixed(0)}k</text>
      {months.map((m,i)=>{
        const v=data[i]
        const x=+(PL+i*bW+(bW-bi)/2).toFixed(1)
        const h=+bh(v).toFixed(1)
        const y=+ys(v).toFixed(1)
        const hit=v>=target
        return (
          <g key={m}>
            <rect x={x} y={y} width={+bi.toFixed(1)} height={h} fill={hit?T.em:T.sky} opacity={0.75}/>
            {v>0&&<text x={+(x+bi/2).toFixed(1)} y={y-3} textAnchor="middle" fill={hit?T.em:T.text} fontFamily="monospace" fontSize={6.5}>${(v/1000).toFixed(1)}k</text>}
            <text x={+(x+bi/2).toFixed(1)} y={H-5} textAnchor="middle" fill={T.muted} fontFamily="monospace" fontSize={7.5}>{m}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── UI primitives ────────────────────────────────────────────────── */
function ChartLabel({children}:{children:string}){return<div style={{fontFamily:"monospace",fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>{children}</div>}
function SecLabel({children}:{children:string}){return<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:".16em",textTransform:"uppercase",color:T.gold,fontWeight:600,marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}>{children}</div>}
function LegendDot({color,label,val,active,onClick}:{color:string;label:string;val:number;active?:boolean;onClick?:()=>void}){
  const empty=val===0
  return<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,cursor:onClick?"pointer":undefined,opacity:empty?0.45:1,borderBottom:active?`1px solid ${color}55`:"1px solid transparent",paddingBottom:1}}>
    <span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,opacity:empty?0.5:1}}/>
    <span style={{fontSize:10,color:active?color:T.muted,flex:1,fontWeight:active?600:400}}>{label}</span>
    <span style={{fontFamily:"monospace",fontSize:10,color:empty?T.muted:T.text}}>{val}</span>
  </div>
}
function MetricTile({val,label,color,onClick}:{val:string|number;label:string;color?:string;onClick?:()=>void}){
  return<div onClick={onClick} style={{background:T.surf2,border:`1px solid ${T.border}`,padding:"10px 14px",textAlign:"center",cursor:onClick?"pointer":undefined}}><div style={{fontFamily:"monospace",fontSize:20,fontWeight:500,color:color||T.text}}>{val}</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>{label}</div></div>
}
function Chip({active,label,onClick}:{active:boolean;label:string;onClick:()=>void}){return<button onClick={onClick} style={{fontFamily:"monospace",fontSize:10,letterSpacing:".06em",padding:"3px 10px",borderRadius:1,cursor:"pointer",outline:"none",border:`1px solid ${active?T.gold:T.border2}`,background:active?T.gold+"22":"transparent",color:active?T.gold:T.muted,transition:"all .15s"}}>{label}</button>}
function NavTab({active,label,onClick}:{active:boolean;label:string;onClick:()=>void}){return<button onClick={onClick} style={{fontFamily:"monospace",fontSize:10,letterSpacing:".08em",textTransform:"uppercase",padding:"9px 15px",border:"none",cursor:"pointer",whiteSpace:"nowrap",outline:"none",background:active?T.surface:"transparent",color:active?T.gold:T.muted,borderBottom:`2px solid ${active?T.gold:"transparent"}`,marginBottom:-1,transition:"color .15s"}}>{label}</button>}
function Card({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return<div style={{background:T.surface,border:`1px solid ${T.border}`,padding:18,marginBottom:20,...style}}>{children}</div>}
function FilterRow({label,options,active,onToggle}:{label:string;options:string[];active:string;onToggle:(v:string)=>void}){return<div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:10,color:T.muted,letterSpacing:".06em",fontFamily:"monospace",whiteSpace:"nowrap"}}>{label}</span>{options.map(v=><Chip key={v} active={active===v} label={v} onClick={()=>onToggle(v)}/>)}</div>}

/* ─── Tabla ─────────────────────────────────────────────────────────── */
function SimpleTable({ headers, rows, colors, onRowClick, highlightCol }:{
  headers:string[]; rows:string[][]
  colors:(((r:string[])=>string)|null)[]
  onRowClick?:(r:string[],i:number)=>void
  highlightCol?:number
}) {
  return (
    <div style={{overflowX:"auto",marginTop:4}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr>{headers.map(h=><th key={h} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:T.muted,fontWeight:600,textAlign:"left",padding:"7px 12px 7px 0",borderBottom:`1px solid ${T.border2}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length===0?(
            <tr><td colSpan={headers.length} style={{padding:"24px 0",color:T.muted,fontStyle:"italic"}}>Sin resultados.</td></tr>
          ):rows.map((r,i)=>(
            <tr key={i} style={{transition:"background .1s",cursor:onRowClick?"pointer":undefined}}
              onClick={()=>onRowClick?.(r,i)}
              onMouseEnter={e=>(e.currentTarget.style.background=T.surf2)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              {r.map((cell,j)=>{
                const fn=colors[j]
                const color=typeof fn==="function"?fn(r):undefined
                return (
                  <td key={j} style={{padding:"8px 12px 8px 0",borderBottom:`1px solid ${T.border}`,verticalAlign:"middle"}}>
                    <span style={{
                      fontFamily:j===4||j===0?"monospace":undefined,
                      fontSize:j===0?10:j===4?12:undefined,
                      fontWeight:j===4?500:undefined,
                      color:color??(j===highlightCol?T.gold:j===0||j===1?T.muted:T.text),
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

  const [view,setView]       = useState<View>("dashboard")
  const [df,setDf]           = useState(demo?"2026-01-01":nowFirst)
  const [dt,setDt]           = useState(demo?"2026-09-30":nowLast)
  const [cliFilter,setCliFilter] = useState<CliFilter>(null)
  const [cliQ,setCLiQ]       = useState("")
  const [mFilter,setMFilter] = useState(-1)   // índice 0-11, -1 = todos los meses

  // Leads filters
  const [lCanal,setLCanal]   = useState("")
  const [lFunnel,setLFunnel] = useState("")
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
    (!lCanal||l.canal===lCanal)&&(!lFunnel||l.Funnel===lFunnel)&&inMonth(l.fechaLead??l.createdAt)
  ),[allLeads,lCanal,lFunnel,mFilter])

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
    setLCanal(extra?.lCanal??""); setLFunnel(extra?.lFunnel??"")
    setCEstado(extra?.cEstado??""); setCOrigen(""); setCTipo(extra?.cTipo??"")
    setVEstado(extra?.vEstado??""); setVCanal("")
    setMFilter(-1)
  }
  function clearCli(){setCliFilter(null)}
  function selectCli(docId:string,nombre:string){setCliFilter({docId,nombre}); goView("dashboard")}

  /* ── Mapa de clientes (todas las vistas) ── */
  const clientesMap = useMemo(()=>{
    type CE = {docId:string;nombre:string;leads:number;cots:number;ventas:number;total:number;ultima:string}
    const map = new Map<string,CE>()
    const upd = (docId:string,nombre:string,fn:(e:CE)=>void, fecha:string)=>{
      const e = map.get(docId)??{docId,nombre,leads:0,cots:0,ventas:0,total:0,ultima:fecha}
      fn(e)
      if(fecha>e.ultima) e.ultima=fecha
      map.set(docId,e)
    }
    // Usa rawLeads/rawCots/rawVentas (solo rango de fecha, sin cliFilter) → vista Clientes muestra todos
    rawLeads.filter(l=>inRange(l.fechaLead??l.createdAt)).forEach(l=>{
      if(!l.cliente)return
      upd(l.cliente.documentId,l.cliente.nombre,e=>e.leads++,l.fechaLead??l.createdAt)
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
    type CE = {docId:string;nombre:string;leads:number;cots:number;ventas:number;total:number;ultima:string}
    const map = new Map<string,CE>()
    const upd = (docId:string,nombre:string,fn:(e:CE)=>void,fecha:string)=>{
      const e=map.get(docId)??{docId,nombre,leads:0,cots:0,ventas:0,total:0,ultima:fecha}
      fn(e); if(fecha>e.ultima)e.ultima=fecha; map.set(docId,e)
    }
    allLeads.forEach(l=>{if(!l.cliente)return;upd(l.cliente.documentId,l.cliente.nombre,e=>e.leads++,l.fechaLead??l.createdAt)})
    allCots.forEach(c=>{if(!c.cliente)return;upd(c.cliente.documentId,c.cliente.nombre,e=>{e.cots++;e.total+=c.total},c.fecha??c.createdAt)})
    allVentas.forEach(v=>{if(!v.cliente)return;upd(v.cliente.documentId,v.cliente.nombre,e=>{e.ventas++;if(v.estado==="Entregado")e.total+=v.monto},v.fecha??v.createdAt)})
    return [...map.values()].sort((a,b)=>b.total-a.total)
  },[allLeads,allCots,allVentas])

  const cliFiltered = useMemo(()=>
    cliQ ? clientesMap.filter(c=>c.nombre.toLowerCase().includes(cliQ.toLowerCase())) : clientesMap
  ,[clientesMap,cliQ])

  /* ── Dashboard stats ── */
  const entregados  = allVentas.filter(v=>v.estado==="Entregado")
  const ingresos    = entregados.reduce((s,v)=>s+v.monto,0)
  const tick        = entregados.length?Math.round(ingresos/entregados.length):0
  const cotsConv    = allCots.filter(c=>c.estado==="Convertida")
  const kpis = [
    {v:allLeads.length,                                        l:"Leads capturados",    c:T.violet, go:()=>goView("leads")},
    {v:allCots.length,                                         l:"Cotizaciones",        c:T.amber,  go:()=>goView("cotizaciones")},
    {v:cotsConv.length,                                        l:"Cotiz. convertidas",  c:T.em,     go:()=>goView("cotizaciones",{cEstado:"Convertida"})},
    {v:allVentas.filter(v=>v.estado==="Cotizado").length,      l:"Ofertas abiertas",    c:T.sky,    go:()=>goView("pedidos",{vEstado:"Cotizado"})},
    {v:allVentas.filter(v=>v.estado==="Preparando").length,    l:"En preparación",      c:T.amber,  go:()=>goView("pedidos",{vEstado:"Preparando"})},
    {v:allVentas.filter(v=>v.estado==="Enviado").length,       l:"Enviados",            c:T.sky,    go:()=>goView("pedidos",{vEstado:"Enviado"})},
    {v:entregados.length,                                      l:"Entregados",          c:T.em,     go:()=>goView("pedidos",{vEstado:"Entregado"})},
    {v:$m(ingresos),                                           l:"Ingresos MXN",        c:T.gold,   go:()=>goView("pedidos")},
    {v:$m(tick),                                               l:"Ticket promedio",     c:T.gold,   go:()=>goView("pedidos")},
    {v:clientesDash.length,                                    l:"Clientes registrados",c:T.sky,    go:()=>goView("clientes")},
  ]

  /* ── Leads analysis ── */
  const ALL_CANALES=["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]
  const leadsStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fLeads.forEach(l=>{const m=MI[getMonth(l.fechaLead??l.createdAt)];if(m!==undefined){if(l.Funnel==="Entrega")leadsStk[m][0]++;else if(l.Funnel==="Rechazada")leadsStk[m][1]++}})
  const canalCounts=fLeads.reduce((a,l)=>{const k=l.canal??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const canalSegs=ALL_CANALES.map(l=>({l,v:canalCounts[l]||0,c:CANAL_COLOR[l]||T.muted})).sort((a,b)=>b.v-a.v)
  const origenSegs=Object.entries(fLeads.reduce((a,l)=>{const k=l.origen??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([l,v])=>({l,v,c:T.sky}))
  const pctCot=fLeads.length?Math.round(fLeads.filter(l=>allCots.some(c=>c.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0
  const pctPed=fLeads.length?Math.round(fLeads.filter(l=>allVentas.some(v=>v.cliente?.documentId===l.cliente?.documentId)).length/fLeads.length*100):0

  /* ── Cotizaciones analysis ── */
  const ORIGEN_LABEL:Record<string,string>={COT:"Mostrador",WEB:"Formulario web",CART:"Carrito",ANU:"Anuncio",EML:"Email"}
  const cotsStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fCots.forEach(c=>{const m=MI[getMonth(c.fecha??c.createdAt)];if(m!==undefined){if(c.estado==="Convertida")cotsStk[m][0]++;else if(c.estado==="Rechazada")cotsStk[m][1]++}})
  const cotEstadoSegs=(["Convertida","Enviada","Aceptada","Borrador","Rechazada"] as const).map(e=>({l:e,v:fCots.filter(c=>c.estado===e).length,c:e==="Convertida"?T.em:e==="Rechazada"?T.rose:e==="Aceptada"?T.violet:e==="Enviada"?T.sky:T.muted}))
  const cotOrigenCounts=fCots.reduce((a,c)=>{const k=c.origenCotizacion??"—";a[k]=(a[k]||0)+1;return a},{}as Record<string,number>)
  const cotOrigenSegs=(["COT","WEB","CART","ANU","EML"] as const).map(k=>({l:ORIGEN_LABEL[k],v:cotOrigenCounts[k]||0,c:CANAL_COLOR[k]||T.sky})).sort((a,b)=>b.v-a.v)

  /* ── Ventas analysis ── */
  const vStk:[number,number][]=Array(12).fill(null).map(()=>[0,0])
  fVentas.forEach(v=>{const m=MI[getMonth(v.fecha??v.createdAt)];if(m!==undefined){if(v.estado==="Entregado")vStk[m][0]++;else if(v.estado==="Cancelado")vStk[m][1]++}})
  const ventaEstadoSegs=(["Entregado","Enviado","Preparando","Pagado","Cotizado","Cancelado"] as const).map(e=>({l:e,v:fVentas.filter(v=>v.estado===e).length,c:e==="Entregado"?T.em:e==="Cancelado"?T.rose:e==="Enviado"?T.sky:e==="Preparando"?T.amber:e==="Pagado"?T.violet:T.muted}))
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
  const TAB_LABELS:Record<View,string> = {dashboard:"Dashboard",leads:"Leads",cotizaciones:"Cotizaciones",pedidos:"Pedidos",clientes:"Clientes"}

  const shell=(content:React.ReactNode)=>(
    <div style={{background:T.bg,minHeight:"100%",padding:24,margin:-24,fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:13,color:T.text,lineHeight:1.55}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12,borderBottom:`1px solid ${T.gold}`,paddingBottom:14,marginBottom:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:T.gold,fontWeight:600,marginBottom:4}}>
            Medalla de Oro · Panel de control
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,lineHeight:1.15}}>Actividad comercial</div>
            {cliFilter&&(
              <div style={{display:"flex",alignItems:"center",gap:6,background:T.gold+"1a",border:`1px solid ${T.gold}55`,padding:"2px 8px 2px 10px"}}>
                <span style={{fontFamily:"monospace",fontSize:10,color:T.gold}}>{cliFilter.nombre}</span>
                <button onClick={clearCli} style={{fontFamily:"monospace",fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",padding:"0 2px",lineHeight:1}}>×</button>
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button onClick={toggleDemo} style={{fontFamily:"monospace",fontSize:9,letterSpacing:".07em",padding:"3px 10px",border:`1px solid ${demo?"#f0a830":"#283060"}`,background:demo?"#f0a83022":"transparent",color:demo?"#f0a830":"#4a5a7a",cursor:"pointer",outline:"none",borderRadius:1}}>{demo?"▶ DEMO":"REAL"}</button>
          <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>DESDE</span>
          <input type="date" value={df} onChange={e=>setDf(e.target.value)} style={{background:T.surface,border:`1px solid ${T.border2}`,color:T.text,padding:"4px 6px",fontFamily:"monospace",fontSize:11,outline:"none",colorScheme:"dark"}}/>
          <span style={{fontSize:10,color:T.muted,fontFamily:"monospace"}}>HASTA</span>
          <input type="date" value={dt} onChange={e=>setDt(e.target.value)} style={{background:T.surface,border:`1px solid ${T.border2}`,color:T.text,padding:"4px 6px",fontFamily:"monospace",fontSize:11,outline:"none",colorScheme:"dark"}}/>
        </div>
      </div>
      {/* Nav tabs */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,overflowX:"auto",marginBottom:24,marginTop:16}}>
        {(["dashboard","leads","cotizaciones","pedidos","clientes"] as View[]).map(v=>(
          <NavTab key={v} active={view===v} label={TAB_LABELS[v]} onClick={()=>goView(v)}/>
        ))}
      </div>
      {mFilter>=0&&(
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.sky+"1a",border:`1px solid ${T.sky}55`,padding:"2px 8px 2px 10px"}}>
            <span style={{fontFamily:"monospace",fontSize:10,color:T.sky}}>MES: {MESES[mFilter]}</span>
            <button onClick={()=>setMFilter(-1)} style={{fontFamily:"monospace",fontSize:11,color:T.sky,background:"none",border:"none",cursor:"pointer",padding:"0 2px",lineHeight:1}}>×</button>
          </div>
        </div>
      )}
      {loading?(
        <div style={{textAlign:"center",padding:60,color:T.muted,fontFamily:"monospace",fontSize:12}}>Cargando datos…</div>
      ):content}
    </div>
  )

  /* ═══ DASHBOARD ═══════════════════════════════════════════════════ */
  if(view==="dashboard") return shell(
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:1,background:T.border,border:`1px solid ${T.border}`,marginBottom:24}}>
        {kpis.map((k,i)=>(
          <div key={i} onClick={k.go}
            style={{background:T.surface,padding:"16px 14px",display:"flex",flexDirection:"column",gap:4,cursor:"pointer",transition:"background .15s"}}
            onMouseEnter={e=>(e.currentTarget.style.background=T.surf2)}
            onMouseLeave={e=>(e.currentTarget.style.background=T.surface)}>
            <div style={{fontFamily:"monospace",fontSize:26,fontWeight:500,lineHeight:1,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:T.muted}}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:".16em",textTransform:"uppercase",color:T.sky,fontWeight:600,marginBottom:14}}>Embudo · Web</div>
          {(()=>{
            const steps=[
              {l:"Formulario",n:allLeads.filter(l=>l.canal==="Formulario").length,c:T.violet,go:()=>goView("leads",{lCanal:"Formulario"})},
              {l:"Cot. web",n:allCots.filter(c=>c.origenCotizacion==="WEB"||c.origenCotizacion==="CART").length,c:T.amber,go:()=>goView("cotizaciones",{cTipo:"web"})},
              {l:"Pedidos",n:allVentas.length,c:T.sky,go:()=>goView("pedidos")},
              {l:"Entregado",n:entregados.length,c:T.em,go:()=>goView("pedidos",{vEstado:"Entregado"})},
            ]
            const peak=Math.max(...steps.map(s=>s.n),1)
            const base=steps[0].n||1
            return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {steps.map((f,i)=>{
                  const barPct=Math.round(f.n/peak*100)
                  const convPct=i===0?100:Math.round(f.n/base*100)
                  return(
                    <div key={i} onClick={f.go} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
                      <div style={{width:"100%",background:T.surf2,height:56,display:"flex",alignItems:"flex-end",overflow:"hidden",borderBottom:`2px solid ${f.c}44`}}>
                        <div style={{width:"100%",height:`${barPct}%`,background:`${f.c}33`,transition:"height .3s"}}/>
                      </div>
                      <div style={{fontFamily:"monospace",fontSize:16,fontWeight:500,color:f.c}}>{f.n}</div>
                      <div style={{fontSize:9,color:i===0?T.muted:convPct>=100?T.em:convPct>=50?T.amber:T.rose,fontFamily:"monospace"}}>{convPct}%</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,textTransform:"uppercase",color:T.muted,textAlign:"center"}}>{f.l}</div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </Card>
        <Card>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:".16em",textTransform:"uppercase",color:T.gold,fontWeight:600,marginBottom:14}}>Pipeline de ventas</div>
          {(["Cotizado","Pagado","Preparando","Enviado","Entregado","Cancelado"] as const).map(e=>{
            const n=allVentas.filter(v=>v.estado===e).length; const max=allVentas.length||1; const pct=Math.round(n/max*100)
            const c=e==="Entregado"?T.em:e==="Cancelado"?T.rose:e==="Enviado"?T.sky:e==="Preparando"?T.amber:e==="Pagado"?T.violet:T.muted
            return(
              <div key={e} onClick={()=>{goView("pedidos");setVEstado(e)}} style={{display:"grid",gridTemplateColumns:"82px 1fr 30px",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer"}}>
                <div style={{fontSize:11,color:T.muted}}>{e}</div>
                <div style={{height:5,background:T.surf2,borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`${c}88`}}/></div>
                <div style={{fontFamily:"monospace",fontSize:11,textAlign:"right",color:T.text}}>{n}</div>
              </div>
            )
          })}
        </Card>
      </div>
      {/* Top clientes en dashboard */}
      <Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <SecLabel>Top clientes · período</SecLabel>
          <button onClick={()=>goView("clientes")} style={{fontFamily:"monospace",fontSize:9,color:T.gold,background:"none",border:`1px solid ${T.gold}44`,padding:"2px 10px",cursor:"pointer"}}>ver todos →</button>
        </div>
        <SimpleTable
          headers={["Cliente","Leads","Cotiz.","Ventas","Total MXN"]}
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:1,background:T.border,border:`1px solid ${T.border}`,marginBottom:20}}>
        {[
          {v:clientesMap.length,l:"Total clientes",c:T.sky},
          {v:clientesMap.filter(c=>c.ventas>0).length,l:"Con pedido",c:T.em},
          {v:clientesMap.filter(c=>c.cots>0&&c.ventas===0).length,l:"Solo cotización",c:T.amber},
          {v:clientesMap.filter(c=>c.leads>0&&c.cots===0).length,l:"Solo lead",c:T.violet},
          {v:$m(clientesMap.length?Math.round(clientesMap.reduce((s,c)=>s+c.total,0)/clientesMap.filter(c=>c.total>0).length||0):0),l:"Ticket prom.",c:T.gold},
          {v:$m(clientesMap.reduce((s,c)=>s+c.total,0)),l:"Total facturado",c:T.gold},
        ].map((k,i)=>(
          <div key={i} style={{background:T.surface,padding:"16px 14px",display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontFamily:"monospace",fontSize:22,fontWeight:500,lineHeight:1,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:T.muted}}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Top 8 por ingresos */}
      <Card>
        <ChartLabel>Top clientes por ingreso acumulado</ChartLabel>
        <SvgHBars
          items={clientesMap.slice(0,8).map(c=>({l:c.nombre.split(" ")[0]+" "+c.nombre.split(" ")[1]?.[0]+".",v:c.total,c:T.gold}))}
          onBarClick={label=>{
            const cli=clientesMap.find(c=>c.nombre.startsWith(label.replace("."," ")))??clientesMap.find(c=>c.nombre.split(" ")[0]===label.split(" ")[0])
            if(cli)selectCli(cli.docId,cli.nombre)
          }}
        />
      </Card>

      {/* Buscador */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,padding:"10px 14px",background:T.surface,border:`1px solid ${T.border}`}}>
        <span style={{fontFamily:"monospace",fontSize:10,color:T.muted,whiteSpace:"nowrap"}}>BUSCAR</span>
        <input value={cliQ} onChange={e=>setCLiQ(e.target.value)} placeholder="nombre…"
          style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${T.border2}`,color:T.text,fontFamily:"monospace",fontSize:12,outline:"none",padding:"2px 4px"}}/>
        {cliQ&&<button onClick={()=>setCLiQ("")} style={{color:T.muted,background:"none",border:"none",cursor:"pointer",fontSize:13}}>×</button>}
      </div>

      <div style={{fontFamily:"monospace",fontSize:12,color:T.muted,marginBottom:8}}>{cliFiltered.length} clientes en vista</div>

      <SimpleTable
        headers={["Cliente","Leads","Cotiz.","Pedidos","Total MXN","Última actividad"]}
        rows={cliFiltered.map(c=>[c.nombre,String(c.leads),String(c.cots),String(c.ventas),$m(c.total),dd(c.ultima)])}
        colors={[null,(r)=>+r[1]>0?T.violet:T.muted,(r)=>+r[2]>0?T.amber:T.muted,(r)=>+r[3]>0?T.em:T.muted,()=>T.gold,null]}
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={leadsStk} colors={[T.em,T.rose]} activeBar={mFilter} onBarClick={i=>setMFilter(mFilter===i?-1:i)}/>
            <div style={{display:"flex",gap:14,marginTop:6}}>
              <LegendDot color={T.em} label="Entregado" val={fLeads.filter(l=>l.Funnel==="Entrega").length} active={lFunnel==="Entrega"} onClick={()=>setLFunnel(lFunnel==="Entrega"?"":"Entrega")}/>
              <LegendDot color={T.rose} label="Rechazada" val={fLeads.filter(l=>l.Funnel==="Rechazada").length} active={lFunnel==="Rechazada"} onClick={()=>setLFunnel(lFunnel==="Rechazada"?"":"Rechazada")}/>
            </div>
          </div>
          <div>
            <ChartLabel>Por canal · clic para filtrar</ChartLabel>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <SvgDonut segs={canalSegs} onSegmentClick={v=>setLCanal(lCanal===v?"":v)}/>
              <div style={{flex:1}}>{canalSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={lCanal===s.l} onClick={()=>setLCanal(lCanal===s.l?"":s.l)}/>)}</div>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <ChartLabel>Por origen · clic para filtrar</ChartLabel>
            <SvgHBars items={origenSegs.length?origenSegs:[{l:"Sin datos",v:0,c:T.muted}]} onBarClick={()=>{}}/>
          </div>
          <div>
            <ChartLabel>Métricas de conversión</ChartLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <MetricTile val={`${pctCot}%`} label="c/ cotización" color={T.amber} onClick={()=>goView("cotizaciones")}/>
              <MetricTile val={`${pctPed}%`} label="c/ pedido" color={T.em} onClick={()=>goView("pedidos")}/>
              <MetricTile val={fLeads.length} label="Leads total" color={T.violet}/>
              <MetricTile val={fLeads.filter(l=>l.Funnel==="Entrega").length} label="Convertidos" color={T.em} onClick={()=>goView("leads",{lFunnel:"Entrega"})}/>
            </div>
          </div>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,padding:"12px 14px",background:T.surface,border:`1px solid ${T.border}`}}>
        <FilterRow label="CANAL"  options={["WhatsApp","Instagram","Formulario","Mostrador","Vendedor","Teléfono"]} active={lCanal} onToggle={v=>setLCanal(lCanal===v?"":v)}/>
        <FilterRow label="FUNNEL" options={["Lead","Oferta","Pedido","Entrega","Rechazada"]} active={lFunnel} onToggle={v=>setLFunnel(lFunnel===v?"":v)}/>
      </div>
      <div style={{fontFamily:"monospace",fontSize:12,color:T.muted,paddingBottom:8}}>{fLeads.length} leads en vista · {allLeads.length} en rango</div>
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <SecLabel>Resumen de Cotizaciones · período seleccionado</SecLabel>
          <div style={{display:"flex",gap:0,marginTop:-6}}>
            {([["","Todo"],["web","Web"],["trad","Tradicional"]] as [string,string][]).map(([k,l])=>(
              <button key={k} onClick={()=>setCTipo(cTipo===k&&k!==""?"":k)} style={{fontFamily:"monospace",fontSize:9,letterSpacing:".06em",textTransform:"uppercase",padding:"4px 12px",cursor:"pointer",outline:"none",border:`1px solid ${cTipo===k?T.gold:T.border2}`,background:cTipo===k?T.gold+"22":"transparent",color:cTipo===k?T.gold:T.muted}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={cotsStk} colors={[T.em,T.rose]} activeBar={mFilter} onBarClick={i=>setMFilter(mFilter===i?-1:i)}/>
            <div style={{display:"flex",gap:14,marginTop:6}}>
              <LegendDot color={T.em} label="Convertida" val={fCots.filter(c=>c.estado==="Convertida").length} active={cEstado==="Convertida"} onClick={()=>setCEstado(cEstado==="Convertida"?"":"Convertida")}/>
              <LegendDot color={T.rose} label="Rechazada" val={fCots.filter(c=>c.estado==="Rechazada").length} active={cEstado==="Rechazada"} onClick={()=>setCEstado(cEstado==="Rechazada"?"":"Rechazada")}/>
            </div>
          </div>
          <div>
            <ChartLabel>Por estado · clic para filtrar</ChartLabel>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
              <SvgDonut segs={cotEstadoSegs} onSegmentClick={v=>setCEstado(cEstado===v?"":v)}/>
              <div style={{flex:1,minWidth:80,paddingTop:4}}>{cotEstadoSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={cEstado===s.l} onClick={()=>setCEstado(cEstado===s.l?"":s.l)}/>)}</div>
            </div>
          </div>
        </div>
        <div>
          <ChartLabel>Por origen · clic para filtrar</ChartLabel>
          <SvgHBars items={cotOrigenSegs.length?cotOrigenSegs:[{l:"Sin datos",v:0,c:T.muted}]}
            onBarClick={l=>{const k=Object.entries(ORIGEN_LABEL).find(([,v])=>v===l)?.[0];if(k)setCOrigen(cOrigen===k?"":k)}}/>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,padding:"12px 14px",background:T.surface,border:`1px solid ${T.border}`}}>
        <FilterRow label="ESTADO" options={["Borrador","Enviada","Aceptada","Rechazada","Convertida"]} active={cEstado} onToggle={v=>setCEstado(cEstado===v?"":v)}/>
        <FilterRow label="ORIGEN" options={["COT","WEB","CART","ANU","EML"]} active={cOrigen} onToggle={v=>setCOrigen(cOrigen===v?"":v)}/>
      </div>
      <div style={{fontFamily:"monospace",fontSize:12,color:T.muted,paddingBottom:8}}>{fCots.length} cotizaciones en vista · {allCots.length} en rango</div>
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
        <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <ChartLabel>Por mes · clic para filtrar mes</ChartLabel>
            <SvgStackedBars months={MESES} data={vStk} colors={[T.em,T.rose]} activeBar={mFilter} onBarClick={i=>setMFilter(mFilter===i?-1:i)}/>
            <div style={{display:"flex",gap:14,marginTop:6}}>
              <LegendDot color={T.em} label="Entregado" val={fVentas.filter(v=>v.estado==="Entregado").length} active={vEstado==="Entregado"} onClick={()=>setVEstado(vEstado==="Entregado"?"":"Entregado")}/>
              <LegendDot color={T.rose} label="Cancelado" val={fVentas.filter(v=>v.estado==="Cancelado").length} active={vEstado==="Cancelado"} onClick={()=>setVEstado(vEstado==="Cancelado"?"":"Cancelado")}/>
            </div>
          </div>
          <div>
            <ChartLabel>Por estado · clic para filtrar</ChartLabel>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
              <SvgDonut segs={ventaEstadoSegs} onSegmentClick={v=>setVEstado(vEstado===v?"":v)}/>
              <div style={{flex:1,minWidth:80,paddingTop:4}}>{ventaEstadoSegs.map(s=><LegendDot key={s.l} color={s.c} label={s.l} val={s.v} active={vEstado===s.l} onClick={()=>setVEstado(vEstado===s.l?"":s.l)}/>)}</div>
            </div>
          </div>
        </div>
        {/* Ingresos por mes vs meta */}
        <div style={{marginBottom:20}}>
          <ChartLabel>Ingresos mensuales vs meta $45,000 MXN · verde = mes cumplido</ChartLabel>
          <SvgRevBars months={MESES} data={revMes} target={META_MES}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"start"}}>
          <div>
            <ChartLabel>Por canal / centro de venta · clic para filtrar</ChartLabel>
            <SvgHBars items={ventaCanalSegs.length?ventaCanalSegs:[{l:"Sin datos",v:0,c:T.muted}]}
              onBarClick={l=>setVCanal(vCanal===l?"":l)}/>
          </div>
          <div style={{minWidth:140}}>
            <ChartLabel>Métricas</ChartLabel>
            <MetricTile val={$m(tickFilt)} label="Ticket promedio" color={T.gold}/>
            <div style={{marginTop:8}}><MetricTile val={compFilt.length} label="Entregados" color={T.em} onClick={()=>setVEstado(vEstado==="Entregado"?"":"Entregado")}/></div>
            <div style={{marginTop:8}}><MetricTile val={$m(compFilt.reduce((s,v)=>s+v.monto,0))} label="Ingresos período" color={T.gold}/></div>
          </div>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,padding:"12px 14px",background:T.surface,border:`1px solid ${T.border}`}}>
        <FilterRow label="ESTADO" options={["Cotizado","Pagado","Preparando","Enviado","Entregado","Cancelado"]} active={vEstado} onToggle={v=>setVEstado(vEstado===v?"":v)}/>
        <FilterRow label="CANAL"  options={[...new Set(rawVentas.map(v=>v.centro_venta?.nombre).filter(Boolean) as string[])]} active={vCanal} onToggle={v=>setVCanal(vCanal===v?"":v)}/>
      </div>
      <div style={{fontFamily:"monospace",fontSize:12,color:T.muted,paddingBottom:8}}>{fVentas.length} ventas en vista · {allVentas.length} en rango</div>
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
