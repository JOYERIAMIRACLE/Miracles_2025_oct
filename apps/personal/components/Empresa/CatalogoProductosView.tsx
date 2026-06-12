"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronRight, ChevronDown, ExternalLink, Loader2, Search, X } from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "live" | "draft" | "planning"

type PageNode = {
  id: string
  segment: string
  title: string
  status: Status
  trafico?: string
  metaDesc?: string
  notas?: string
  children: PageNode[]
}

// ─── Secciones que queremos mostrar como catálogo ─────────────────────────────

const CATALOGO_SEGMENTS = new Set([
  "automatizacion-y-control",
  "manejo-de-materiales",
  "conveyors",
  "computo-industrial",
  "soluciones-y-servicios",
  "marcas-y-aliados-estrategicos",
  "refacciones-industriales-spare-parts",
])

// ─── Status config ────────────────────────────────────────────────────────────

const ST: Record<Status, { dot: string; badge: string; label: string }> = {
  live:     { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", label: "Live"      },
  draft:    { dot: "bg-amber-400",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",       label: "Borrador"  },
  planning: { dot: "bg-slate-500",   badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",       label: "Planeando" },
}

const CAT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "automatizacion-y-control":         { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30"    },
  "manejo-de-materiales":             { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/30"    },
  "conveyors":                        { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30"  },
  "computo-industrial":               { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30"     },
  "soluciones-y-servicios":           { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30"   },
  "marcas-y-aliados-estrategicos":    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "refacciones-industriales-spare-parts": { bg: "bg-rose-500/10", text: "text-rose-400",  border: "border-rose-500/30"    },
}

const DEFAULT_COLOR = { bg: "bg-slate-700/20", text: "text-slate-400", border: "border-slate-700/40" }

function countByStatus(node: PageNode): { live: number; draft: number; planning: number; total: number } {
  let live = 0, draft = 0, planning = 0
  const walk = (n: PageNode) => {
    if (n.status === "live")     live++
    else if (n.status === "draft")    draft++
    else                              planning++
    n.children.forEach(walk)
  }
  node.children.forEach(walk)
  return { live, draft, planning, total: live + draft + planning }
}

function buildPath(segment: string, parentPath = ""): string {
  if (!segment) return "/"
  return parentPath === "/" ? `/${segment}` : `${parentPath}/${segment}`
}

// ─── TreeNode component ───────────────────────────────────────────────────────

function TreeNode({
  node, depth, parentPath, busqueda, catColor,
}: {
  node: PageNode
  depth: number
  parentPath: string
  busqueda: string
  catColor: { bg: string; text: string; border: string }
}) {
  const [open, setOpen] = useState(depth === 0)
  const fp = buildPath(node.segment, parentPath)
  const hasChildren = node.children.length > 0
  const s = ST[node.status]

  const matchesBusqueda = busqueda
    ? node.title.toLowerCase().includes(busqueda.toLowerCase()) ||
      node.segment.toLowerCase().includes(busqueda.toLowerCase())
    : true

  const childrenMatchBusqueda = busqueda
    ? node.children.some(c =>
        c.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.segment.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.children.some(gc => gc.title.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : true

  const show = matchesBusqueda || childrenMatchBusqueda
  if (!show) return null

  // Forzar apertura si la búsqueda tiene resultado en hijos
  const forceOpen = busqueda && childrenMatchBusqueda

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer group transition-colors hover:bg-slate-800/40 ${
          depth === 0 ? "mb-1" : ""
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && setOpen(v => !v)}
      >
        {/* Toggle */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {hasChildren
            ? (open || forceOpen)
              ? <ChevronDown size={12} className="text-slate-500" />
              : <ChevronRight size={12} className="text-slate-500" />
            : <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />
          }
        </span>

        {/* Status dot */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />

        {/* Title */}
        <span className={`flex-1 text-[13px] font-medium truncate ${
          depth === 0 ? "text-slate-200" : "text-slate-400"
        }`}>
          {node.title || node.segment}
        </span>

        {/* Trafico badge */}
        {node.trafico === "alto" && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
            tráfico alto
          </span>
        )}

        {/* Status badge — solo visible en hover */}
        <span className={`text-[9px] px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${s.badge}`}>
          {s.label}
        </span>

        {/* Slug link */}
        <a
          href={`https://sdindustrial.com.mx${fp}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title={`sdindustrial.com.mx${fp}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-blue-400 shrink-0"
        >
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Children */}
      {hasChildren && (open || forceOpen) && (
        <div className={`border-l border-slate-800/60 ml-${depth === 0 ? 5 : 6}`}
          style={{ marginLeft: `${20 + depth * 20}px` }}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              parentPath={fp}
              busqueda={busqueda}
              catColor={catColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Category card ────────────────────────────────────────────────────────────

function CatCard({
  node, isActive, onClick,
}: {
  node: PageNode
  isActive: boolean
  onClick: () => void
}) {
  const stats = countByStatus(node)
  const col = CAT_COLOR[node.segment] ?? DEFAULT_COLOR

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isActive
          ? `${col.bg} ${col.border}`
          : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700/60 hover:bg-slate-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className={`text-sm font-semibold ${isActive ? col.text : "text-slate-300"} leading-snug`}>
          {node.title || node.segment}
        </p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${ST[node.status].badge}`}>
          {ST[node.status].label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-emerald-500">{stats.live} live</span>
        <span className="text-amber-500">{stats.draft} borrador</span>
        <span className="text-slate-600">{stats.planning} plan.</span>
        <span className="ml-auto text-slate-600">{stats.total} págs</span>
      </div>
    </button>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function CatalogoProductosView() {
  const [tree,     setTree]     = useState<PageNode[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${BASE}/api/sitio-web`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.status === 404 ? null : r.json()))
      .then(json => {
        const arbol: PageNode[] = json?.data?.arbol ?? []
        setTree(arbol)
        const first = arbol.find(n => CATALOGO_SEGMENTS.has(n.segment))
        if (first) setSelected(first.segment)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const catalogoNodes = useMemo(
    () => tree.filter(n => CATALOGO_SEGMENTS.has(n.segment)),
    [tree]
  )

  const selectedNode = useMemo(
    () => catalogoNodes.find(n => n.segment === selected) ?? null,
    [catalogoNodes, selected]
  )

  const totalStats = useMemo(() => {
    let live = 0, draft = 0, planning = 0, total = 0
    catalogoNodes.forEach(n => {
      const s = countByStatus(n)
      live     += s.live
      draft    += s.draft
      planning += s.planning
      total    += s.total
      // count the parent itself
      if (n.status === "live") live++
      else if (n.status === "draft") draft++
      else planning++
      total++
    })
    return { live, draft, planning, total }
  }, [catalogoNodes])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={20} className="animate-spin text-slate-500 mr-2" />
      <span className="text-slate-500 text-sm">Cargando catálogo...</span>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Catálogo de productos</h1>
          <p className="text-xs text-slate-500 mt-1">
            {totalStats.total} páginas ·{" "}
            <span className="text-emerald-400">{totalStats.live} live</span> ·{" "}
            <span className="text-amber-400">{totalStats.draft} borrador</span> ·{" "}
            <span className="text-slate-500">{totalStats.planning} planeando</span>
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar página..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40 transition"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

        {/* Panel izquierdo — categorías */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-1 mb-3">
            Categorías
          </p>
          {catalogoNodes.map(node => (
            <CatCard
              key={node.id}
              node={node}
              isActive={selected === node.segment}
              onClick={() => { setSelected(node.segment); setBusqueda("") }}
            />
          ))}
        </div>

        {/* Panel derecho — árbol de la categoría */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden">
          {selectedNode ? (
            <>
              {/* Header categoría */}
              <div className={`px-5 py-4 border-b border-slate-800/60 flex items-center justify-between gap-3 ${
                (CAT_COLOR[selectedNode.segment] ?? DEFAULT_COLOR).bg
              }`}>
                <div>
                  <p className={`text-base font-bold ${(CAT_COLOR[selectedNode.segment] ?? DEFAULT_COLOR).text}`}>
                    {selectedNode.title || selectedNode.segment}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    /sdindustrial.com.mx/{selectedNode.segment}
                  </p>
                </div>
                <a
                  href={`https://sdindustrial.com.mx/${selectedNode.segment}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-400 transition shrink-0"
                >
                  <ExternalLink size={12} /> Ver en sitio
                </a>
              </div>

              {/* Árbol */}
              <div className="p-3">
                {selectedNode.children.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-8">Sin sub-páginas registradas</p>
                ) : (
                  selectedNode.children.map(child => (
                    <TreeNode
                      key={child.id}
                      node={child}
                      depth={0}
                      parentPath={`/${selectedNode.segment}`}
                      busqueda={busqueda}
                      catColor={CAT_COLOR[selectedNode.segment] ?? DEFAULT_COLOR}
                    />
                  ))
                )}
              </div>

              {/* Leyenda */}
              <div className="px-4 py-3 border-t border-slate-800/40 flex items-center gap-4">
                {(["live","draft","planning"] as const).map(st => (
                  <div key={st} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${ST[st].dot}`} />
                    <span className="text-[10px] text-slate-600">{ST[st].label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
              Selecciona una categoría
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
