"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, X, Download, Globe, Loader2, CloudOff } from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

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

function upd(ns: PageNode[], id: string, p: Partial<PageNode>): PageNode[] {
  return ns.map(n => n.id === id ? { ...n, ...p } : { ...n, children: upd(n.children, id, p) })
}

function del(ns: PageNode[], id: string): PageNode[] {
  return ns.filter(n => n.id !== id).map(n => ({ ...n, children: del(n.children, id) }))
}

function ins(ns: PageNode[], pid: string, c: PageNode): PageNode[] {
  return ns.map(n =>
    n.id === pid ? { ...n, children: [...n.children, c] } : { ...n, children: ins(n.children, pid, c) }
  )
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

// ─── Status ───────────────────────────────────────────────────────────────────

const ST = {
  planning: { dot: "bg-slate-500",   txt: "text-slate-500",   lbl: "Planeando" },
  draft:    { dot: "bg-amber-500",   txt: "text-amber-500",   lbl: "Borrador"  },
  live:     { dot: "bg-emerald-500", txt: "text-emerald-400", lbl: "Live"      },
} as const

// ─── ListEditor ───────────────────────────────────────────────────────────────

function ListEditor({ items, onUpdate, ph }: {
  items: string[]
  onUpdate: (v: string[]) => void
  ph: string
}) {
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const v = draft.trim()
    if (!v) { inputRef.current?.focus(); return }
    onUpdate([...items, v])
    setDraft("")
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 group">
          <span className="text-[10px] text-slate-600 font-mono w-5 shrink-0">{i + 1}.</span>
          <span className="flex-1 text-sm text-slate-300">{item}</span>
          <button
            type="button"
            title="Quitar"
            onClick={() => onUpdate(items.filter((_, j) => j !== i))}
            className="shrink-0 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
            <X size={12} />
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={ph}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition"
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/10 transition shrink-0">
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  )
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────

function NodeCard({ node, fp, onEdit, onAddChild, onDel }: {
  node: PageNode; fp: string
  onEdit: () => void; onAddChild: () => void; onDel: () => void
}) {
  const s = ST[node.status]
  return (
    <div
      onClick={onEdit}
      className="group w-52 rounded-xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-sm hover:border-blue-500/40 hover:bg-blue-500/5 cursor-pointer transition-all duration-150 select-none">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-[10px] font-mono text-slate-500 truncate leading-none">{fp}</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-200 truncate">
          {node.title || <span className="text-slate-600 font-normal italic">sin título</span>}
        </p>
        {(node.sections.length > 0 || node.componentes.length > 0) && (
          <p className="text-[9px] text-slate-600 mt-1 leading-none">
            {[
              node.sections.length   > 0 && `${node.sections.length} secc.`,
              node.componentes.length > 0 && `${node.componentes.length} comp.`,
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 border-t border-slate-800/50">
        <span className={`text-[9px] font-medium ${s.txt}`}>{s.lbl}</span>
        <div className="flex opacity-0 group-hover:opacity-100 transition">
          <button
            type="button"
            title="Agregar sub-página"
            onClick={e => { e.stopPropagation(); onAddChild() }}
            className="p-1 text-slate-600 hover:text-blue-400 rounded transition">
            <Plus size={12} />
          </button>
          {node.id !== "root" && (
            <button
              type="button"
              title="Eliminar"
              onClick={e => { e.stopPropagation(); onDel() }}
              className="p-1 text-slate-600 hover:text-red-400 rounded transition">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TreeRow ──────────────────────────────────────────────────────────────────

function TreeRow({ node, parentFp, onEdit, onAddChild, onDel }: {
  node: PageNode; parentFp: string
  onEdit: (id: string, fp: string) => void
  onAddChild: (pid: string) => void
  onDel: (id: string) => void
}) {
  const fp = node.segment === "" ? "/" : parentFp === "/" ? `/${node.segment}` : `${parentFp}/${node.segment}`
  return (
    <div>
      <NodeCard
        node={node} fp={fp}
        onEdit={() => onEdit(node.id, fp)}
        onAddChild={() => onAddChild(node.id)}
        onDel={() => onDel(node.id)}
      />
      {node.children.length > 0 && (
        <div className="ml-6 mt-2 border-l border-slate-800 pl-5 space-y-2">
          {node.children.map(c => (
            <div key={c.id} className="relative">
              <div className="absolute -left-5 top-[42px] w-5 h-px bg-slate-800" />
              <TreeRow node={c} parentFp={fp} onEdit={onEdit} onAddChild={onAddChild} onDel={onDel} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalPagina({ node, fp, onUpdate, onClose }: {
  node: PageNode; fp: string
  onUpdate: (p: Partial<PageNode>) => void
  onClose: () => void
}) {
  const ic = "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-800/60 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition"
  const lc = "block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5"

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 shrink-0">
          <Globe size={15} className="text-slate-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-slate-500 truncate">{fp}</p>
            <p className="text-base font-bold text-slate-100 mt-0.5 truncate">
              {node.title || "Sin título"}
            </p>
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 shrink-0">
            {(["planning", "draft", "live"] as const).map(s => (
              <button
                key={s} type="button"
                onClick={() => onUpdate({ status: s })}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded-full border transition ${
                  node.status === s
                    ? s === "live"  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : s === "draft" ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                   : "bg-slate-600/30 border-slate-500/30 text-slate-300"
                    : "border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-600"
                }`}>
                {ST[s].lbl}
              </button>
            ))}
          </div>

          <button
            type="button" title="Cerrar" onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">

            {/* ── Columna izquierda ── */}

            {node.id !== "root" && (
              <div className="col-span-1">
                <label className={lc}>Segmento URL</label>
                <input
                  value={node.segment}
                  onChange={e => onUpdate({ segment: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="nombre-pagina"
                  className={ic}
                />
                <p className="text-[9px] font-mono text-slate-600 mt-1">{fp}</p>
              </div>
            )}

            <div className={node.id !== "root" ? "col-span-1" : "col-span-2"}>
              <label className={lc}>Título SEO</label>
              <input value={node.title} onChange={e => onUpdate({ title: e.target.value })}
                placeholder="Título de la página para Google..." className={ic} />
            </div>

            <div className="col-span-1">
              <label className={lc}>H1 principal</label>
              <input value={node.h1} onChange={e => onUpdate({ h1: e.target.value })}
                placeholder="Encabezado principal de la página..." className={ic} />
            </div>

            <div className="col-span-1">
              <label className={lc}>Keywords</label>
              <input value={node.keywords} onChange={e => onUpdate({ keywords: e.target.value })}
                placeholder="vfd monterrey, plc siemens, automatizacion..." className={ic} />
            </div>

            <div className="col-span-2">
              <label className={lc}>Hero / Tagline</label>
              <textarea value={node.hero} onChange={e => onUpdate({ hero: e.target.value })}
                placeholder="Propuesta de valor del hero section. Ej: Automatización industrial con soporte técnico desde Monterrey..."
                rows={2} className={`${ic} resize-none`} />
            </div>

            <div className="col-span-1">
              <label className={lc}>Meta descripción</label>
              <textarea value={node.metaDesc} onChange={e => onUpdate({ metaDesc: e.target.value })}
                placeholder="Descripción para Google (≤160 chars)..."
                rows={3} className={`${ic} resize-none`} />
              {node.metaDesc.length > 0 && (
                <p className={`text-[9px] mt-1 ${node.metaDesc.length > 160 ? "text-red-400" : "text-slate-600"}`}>
                  {node.metaDesc.length} / 160
                </p>
              )}
            </div>

            <div className="col-span-1">
              <label className={lc}>Notas de diseño</label>
              <textarea value={node.notas} onChange={e => onUpdate({ notas: e.target.value })}
                placeholder="Decisiones de diseño, referencias, copy alternativo..."
                rows={3} className={`${ic} resize-none`} />
            </div>

            {/* ── Secciones y Componentes ── */}

            <div className="col-span-1">
              <label className={lc}>Secciones de la página</label>
              <ListEditor
                items={node.sections}
                onUpdate={v => onUpdate({ sections: v })}
                ph="Ej: Hero, ¿Qué buscas?, Productos..."
              />
            </div>

            <div className="col-span-1">
              <label className={lc}>Componentes reutilizables</label>
              <ListEditor
                items={node.componentes}
                onUpdate={v => onUpdate({ componentes: v })}
                ph="Ej: Navbar, ProductCard, CTABanner..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SitioWebView() {
  const [tree,    setTree]    = useState<PageNode[]>([ROOT])
  const [modal,   setModal]   = useState<{ id: string; fp: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [offline, setOffline] = useState(false)
  const initialized = useRef(false)
  const justLoaded  = useRef(false)

  // Load from Strapi
  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); setOffline(true); return }
    fetch(`${BASE}/api/sitio-web`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.status === 404 ? null : r.json()))
      .then(json => {
        const arbol = json?.data?.arbol
        if (Array.isArray(arbol) && arbol.length > 0) {
          justLoaded.current = true
          setTree(arbol)
        }
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false))
  }, [])

  // Auto-save to Strapi (debounced 800ms)
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    if (justLoaded.current)   { justLoaded.current = false; return }
    const token = getToken()
    if (!token || offline) return
    const t = setTimeout(() => {
      setSaving(true)
      fetch(`${BASE}/api/sitio-web`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { arbol: tree } }),
      })
        .catch(() => setOffline(true))
        .finally(() => setSaving(false))
    }, 800)
    return () => clearTimeout(t)
  }, [tree, offline])

  const modalNode = modal ? find(tree, modal.id) : null

  const handleUpdate = (id: string, p: Partial<PageNode>) => setTree(t => upd(t, id, p))

  const handleAdd = (pid: string) => {
    const c = blank()
    setTree(t => ins(t, pid, c))
    setModal({ id: c.id, fp: "" })
  }

  const handleDel = (id: string) => {
    if (!confirm("¿Eliminar esta página y todas sus sub-páginas?")) return
    setTree(t => del(t, id))
    if (modal?.id === id) setModal(null)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement("a"), { href: url, download: "sitio-web.json" })
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = countAll(tree)
  const nlive = countSt(tree, "live")
  const ndrft = countSt(tree, "draft")

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Loader2 size={20} className="animate-spin mr-2" /> Cargando árbol...
    </div>
  )

  return (
    // Railway-style: dot grid + radial gradient depth
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden"
      style={{
        backgroundColor: "#020617",
        backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>

      {/* Depth glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }}
      />

      <div className="relative p-4 md:p-6">
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
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" /> Guardando...
              </span>
            )}
            {offline && (
              <span className="text-[10px] text-amber-500 flex items-center gap-1.5">
                <CloudOff size={11} /> Sin conexión
              </span>
            )}
            <button
              type="button" onClick={exportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-lg bg-slate-900/60 backdrop-blur-sm transition">
              <Download size={14} /> Exportar
            </button>
            <button
              type="button" onClick={() => handleAdd("root")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
              <Plus size={14} /> Nueva página
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="space-y-2">
          {tree.map(node => (
            <TreeRow
              key={node.id} node={node} parentFp="/"
              onEdit={(id, fp) => setModal({ id, fp })}
              onAddChild={handleAdd}
              onDel={handleDel}
            />
          ))}

          {total === 1 && (
            <div className="mt-6 ml-1">
              <button
                type="button" onClick={() => handleAdd("root")}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-700/60 rounded-xl text-slate-600 hover:text-slate-400 hover:border-slate-600 transition text-sm bg-slate-900/30">
                <Plus size={13} /> Agregar primera sub-página
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalNode && modal && (
        <ModalPagina
          node={modalNode}
          fp={modal.fp || pathOf(tree, modal.id)}
          onUpdate={p => handleUpdate(modal.id, p)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
