"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, X, Globe } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageNode {
  id: string
  segment: string
  title: string
  h1: string
  metaDesc: string
  keywords: string
  hero: string
  sections: string[]
  componentes: string[]
  notas: string
  status: "planning" | "draft" | "live"
  children: PageNode[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

function blank(segment = "nueva-pagina"): PageNode {
  return {
    id: uid(), segment, title: "", h1: "", metaDesc: "", keywords: "",
    hero: "", sections: [], componentes: [], notas: "", status: "planning", children: [],
  }
}

const ROOT: PageNode = { ...blank(""), id: "root" }
const LS = "miracles-sitio-web-v1"

function upd(ns: PageNode[], id: string, p: Partial<PageNode>): PageNode[] {
  return ns.map(n => n.id === id ? { ...n, ...p } : { ...n, children: upd(n.children, id, p) })
}

function del(ns: PageNode[], id: string): PageNode[] {
  return ns.filter(n => n.id !== id).map(n => ({ ...n, children: del(n.children, id) }))
}

function ins(ns: PageNode[], pid: string, c: PageNode): PageNode[] {
  return ns.map(n => n.id === pid ? { ...n, children: [...n.children, c] } : { ...n, children: ins(n.children, pid, c) })
}

function find(ns: PageNode[], id: string): PageNode | null {
  for (const n of ns) {
    if (n.id === id) return n
    const f = find(n.children, id)
    if (f) return f
  }
  return null
}

function pathOf(ns: PageNode[], id: string, pre = ""): string {
  for (const n of ns) {
    const fp = n.segment === "" ? "/" : pre === "/" ? `/${n.segment}` : `${pre}/${n.segment}`
    if (n.id === id) return fp
    const r = pathOf(n.children, id, fp)
    if (r) return r
  }
  return ""
}

function countAll(ns: PageNode[]): number {
  return ns.reduce((s, n) => s + 1 + countAll(n.children), 0)
}

function countSt(ns: PageNode[], st: string): number {
  return ns.reduce((s, n) => s + (n.status === st ? 1 : 0) + countSt(n.children, st), 0)
}

// ─── Status config ────────────────────────────────────────────────────────────

const ST = {
  planning: { dot: "bg-slate-500",   txt: "text-slate-500",   lbl: "Planeando" },
  draft:    { dot: "bg-amber-500",   txt: "text-amber-500",   lbl: "Borrador"  },
  live:     { dot: "bg-emerald-500", txt: "text-emerald-400", lbl: "Live"      },
} as const

// ─── NodeCard ─────────────────────────────────────────────────────────────────

function NodeCard({ node, fp, active, onSel, onAdd, onDel }: {
  node: PageNode; fp: string; active: boolean
  onSel: () => void; onAdd: () => void; onDel: () => void
}) {
  const s = ST[node.status]
  return (
    <div onClick={onSel}
      className={`group w-48 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
        active
          ? "border-blue-500/40 bg-blue-500/10 shadow shadow-blue-500/10"
          : "border-slate-700/60 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/40"
      }`}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-[10px] font-mono text-slate-500 truncate leading-none">{fp}</span>
        </div>
        <p className="text-[12px] font-semibold text-slate-200 truncate leading-snug">
          {node.title || <span className="text-slate-600 font-normal italic">sin título</span>}
        </p>
        {(node.sections.length > 0 || node.componentes.length > 0) && (
          <p className="text-[9px] text-slate-600 mt-1">
            {node.sections.length > 0 && `${node.sections.length} secc.`}
            {node.sections.length > 0 && node.componentes.length > 0 && " · "}
            {node.componentes.length > 0 && `${node.componentes.length} comp.`}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-2 pt-1.5 border-t border-slate-800/50">
        <span className={`text-[9px] font-medium ${s.txt}`}>{s.lbl}</span>
        <div className="flex opacity-0 group-hover:opacity-100 transition">
          <button type="button" title="Sub-página" onClick={e => { e.stopPropagation(); onAdd() }}
            className="p-1 text-slate-600 hover:text-blue-400 rounded transition">
            <Plus size={11} />
          </button>
          {node.id !== "root" && (
            <button type="button" title="Eliminar" onClick={e => { e.stopPropagation(); onDel() }}
              className="p-1 text-slate-600 hover:text-red-400 rounded transition">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TreeRow ──────────────────────────────────────────────────────────────────

function TreeRow({ node, parentFp, selId, onSel, onAdd, onDel }: {
  node: PageNode; parentFp: string; selId: string | null
  onSel: (id: string) => void; onAdd: (pid: string) => void; onDel: (id: string) => void
}) {
  const fp = node.segment === "" ? "/" : parentFp === "/" ? `/${node.segment}` : `${parentFp}/${node.segment}`
  return (
    <div>
      <NodeCard node={node} fp={fp} active={selId === node.id}
        onSel={() => onSel(node.id)} onAdd={() => onAdd(node.id)} onDel={() => onDel(node.id)} />
      {node.children.length > 0 && (
        <div className="ml-6 mt-2 border-l border-slate-800 pl-4 space-y-2">
          {node.children.map(c => (
            <div key={c.id} className="relative">
              <div className="absolute -left-4 top-[42px] w-4 h-px bg-slate-800" />
              <TreeRow node={c} parentFp={fp} selId={selId} onSel={onSel} onAdd={onAdd} onDel={onDel} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ListEditor ───────────────────────────────────────────────────────────────

function ListEditor({ items, onUpdate, ph }: {
  items: string[]; onUpdate: (v: string[]) => void; ph: string
}) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const v = draft.trim()
    if (!v) return
    onUpdate([...items, v])
    setDraft("")
  }
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/40 group">
          <span className="text-[9px] text-slate-600 w-4 font-mono">{i + 1}.</span>
          <span className="flex-1 text-xs text-slate-300 truncate">{item}</span>
          <button type="button" onClick={() => onUpdate(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition">
            <X size={10} />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5 mt-1">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder={ph}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800/60 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-600 transition" />
        <button type="button" onClick={add}
          className="px-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 transition">
          <Plus size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({ node, fp, onUpdate, onClose }: {
  node: PageNode; fp: string
  onUpdate: (p: Partial<PageNode>) => void
  onClose: () => void
}) {
  const ic = "w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800/60 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-600 transition"
  const lc = "block text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1"

  return (
    <div className="w-80 shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col sticky top-4 max-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
        <Globe size={14} className="text-slate-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-slate-500 truncate">{fp}</p>
          <p className="text-sm font-bold text-slate-100 truncate mt-0.5">
            {node.title || "Sin título"}
          </p>
        </div>
        <button type="button" onClick={onClose}
          className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition shrink-0">
          <X size={13} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Status */}
        <div>
          <label className={lc}>Estado</label>
          <div className="flex gap-1.5">
            {(["planning", "draft", "live"] as const).map(s => (
              <button key={s} type="button" onClick={() => onUpdate({ status: s })}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg border transition ${
                  node.status === s
                    ? s === "live"  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : s === "draft" ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                   : "bg-slate-700/40 border-slate-600/30 text-slate-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-600 hover:text-slate-400"
                }`}>{ST[s].lbl}</button>
            ))}
          </div>
        </div>

        {/* URL segment */}
        {node.id !== "root" && (
          <div>
            <label className={lc}>Segmento URL</label>
            <input value={node.segment}
              onChange={e => onUpdate({ segment: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              placeholder="nombre-pagina" className={ic} />
            <p className="text-[9px] text-slate-600 mt-0.5">Ruta completa: <span className="font-mono">{fp}</span></p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className={lc}>Título SEO</label>
          <input value={node.title} onChange={e => onUpdate({ title: e.target.value })}
            placeholder="Título de la página..." className={ic} />
        </div>

        {/* H1 */}
        <div>
          <label className={lc}>H1 principal</label>
          <input value={node.h1} onChange={e => onUpdate({ h1: e.target.value })}
            placeholder="Encabezado principal..." className={ic} />
        </div>

        {/* Hero */}
        <div>
          <label className={lc}>Hero / Tagline</label>
          <textarea value={node.hero} onChange={e => onUpdate({ hero: e.target.value })}
            placeholder="Descripción del hero section..." rows={2}
            className={`${ic} resize-none`} />
        </div>

        {/* Meta desc */}
        <div>
          <label className={lc}>Meta descripción</label>
          <textarea value={node.metaDesc} onChange={e => onUpdate({ metaDesc: e.target.value })}
            placeholder="Descripción para Google ≤160 chars..." rows={2}
            className={`${ic} resize-none`} />
          {node.metaDesc.length > 0 && (
            <p className={`text-[9px] mt-0.5 ${node.metaDesc.length > 160 ? "text-red-400" : "text-slate-600"}`}>
              {node.metaDesc.length}/160
            </p>
          )}
        </div>

        {/* Keywords */}
        <div>
          <label className={lc}>Keywords</label>
          <input value={node.keywords} onChange={e => onUpdate({ keywords: e.target.value })}
            placeholder="keyword1, keyword2, keyword3..." className={ic} />
        </div>

        {/* Sections */}
        <div>
          <label className={lc}>Secciones de la página</label>
          <ListEditor items={node.sections} onUpdate={v => onUpdate({ sections: v })}
            ph="Hero, Features, Testimonios, CTA..." />
        </div>

        {/* Components */}
        <div>
          <label className={lc}>Componentes reutilizables</label>
          <ListEditor items={node.componentes} onUpdate={v => onUpdate({ componentes: v })}
            ph="Navbar, ProductCard, Footer..." />
        </div>

        {/* Notes */}
        <div>
          <label className={lc}>Notas</label>
          <textarea value={node.notas} onChange={e => onUpdate({ notas: e.target.value })}
            placeholder="Referencias, decisiones de diseño..." rows={3}
            className={`${ic} resize-none`} />
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SitioWebView() {
  const [tree,  setTree]  = useState<PageNode[]>([ROOT])
  const [selId, setSelId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(LS)
      if (s) setTree(JSON.parse(s))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify(tree))
  }, [tree])

  const sel   = selId ? find(tree, selId) : null
  const selFp = selId ? pathOf(tree, selId) : "/"
  const total = countAll(tree)
  const nlive = countSt(tree, "live")
  const ndrft = countSt(tree, "draft")

  const handleUpdate = (p: Partial<PageNode>) => {
    if (selId) setTree(t => upd(t, selId, p))
  }

  const handleAdd = (pid: string) => {
    const c = blank()
    setTree(t => ins(t, pid, c))
    setSelId(c.id)
  }

  const handleDel = (id: string) => {
    if (!confirm("¿Eliminar esta página y sus sub-páginas?")) return
    setTree(t => del(t, id))
    if (selId === id) setSelId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sitio web</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} página{total !== 1 ? "s" : ""} ·{" "}
            <span className="text-emerald-400">{nlive} live</span> ·{" "}
            <span className="text-amber-400">{ndrft} borrador</span>
          </p>
        </div>
        <button type="button" onClick={() => handleAdd("root")}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
          <Plus size={14} /> Nueva página
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* Tree */}
        <div className="flex-1 min-w-0 space-y-2">
          {tree.map(node => (
            <TreeRow key={node.id} node={node} parentFp="/" selId={selId}
              onSel={setSelId} onAdd={handleAdd} onDel={handleDel} />
          ))}

          {total === 1 && (
            <div className="mt-6 ml-1">
              <button type="button" onClick={() => handleAdd("root")}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-700 rounded-xl text-slate-600 hover:text-slate-400 hover:border-slate-600 transition text-sm">
                <Plus size={13} /> Agregar primera sub-página
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {sel && (
          <DetailPanel node={sel} fp={selFp} onUpdate={handleUpdate} onClose={() => setSelId(null)} />
        )}
      </div>
    </div>
  )
}
