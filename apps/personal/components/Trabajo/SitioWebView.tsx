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
  trafico: "" | "alto" | "medio" | "bajo"
  ctrEstimado: string
  formularios: number
  children: PageNode[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

function blank(segment = "nueva-pagina"): PageNode {
  return {
    id: uid(), segment, title: "", h1: "", metaDesc: "", keywords: "",
    hero: "", sections: [], componentes: [], notas: "", status: "planning",
    trafico: "", ctrEstimado: "", formularios: 0, children: [],
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
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] group">
          <span className="text-[10px] text-slate-700 font-mono w-5 shrink-0">{i + 1}.</span>
          <span className="flex-1 text-[13px] text-slate-300">{item}</span>
          <button
            type="button" title="Quitar"
            onClick={() => onUpdate(items.filter((_, j) => j !== i))}
            className="shrink-0 p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={ph}
          className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-200 placeholder:text-slate-700 outline-none focus:border-blue-500/40 transition"
        />
        <button
          type="button" onClick={add}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-white hover:border-blue-500/30 hover:bg-blue-500/10 transition shrink-0">
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
              node.sections.length    > 0 && `${node.sections.length} secc.`,
              node.componentes.length > 0 && `${node.componentes.length} comp.`,
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 border-t border-slate-800/50">
        <span className={`text-[9px] font-medium ${s.txt}`}>{s.lbl}</span>
        <div className="flex opacity-0 group-hover:opacity-100 transition">
          <button type="button" title="Agregar sub-página"
            onClick={e => { e.stopPropagation(); onAddChild() }}
            className="p-1 text-slate-600 hover:text-blue-400 rounded transition">
            <Plus size={12} />
          </button>
          {node.id !== "root" && (
            <button type="button" title="Eliminar"
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

// ─── Drawer de página (Railway-style) ────────────────────────────────────────

function DrawerPagina({ node, fp, onUpdate, onClose }: {
  node: PageNode; fp: string
  onUpdate: (p: Partial<PageNode>) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<"seo" | "estructura">("seo")

  const s  = ST[node.status]
  const kw = node.keywords.split(",").filter(k => k.trim())

  // Clases reutilizables
  const field = "w-full px-4 py-2.5 text-[13px] rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-200 placeholder:text-slate-700 outline-none focus:border-blue-500/40 focus:bg-white/[0.05] transition"
  const label = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"

  // Colores sólidos tipo Railway para el badge de status
  const BADGE: Record<PageNode["status"], string> = {
    live:     "bg-emerald-600 text-white",
    draft:    "bg-amber-500 text-white",
    planning: "bg-slate-700 text-slate-300",
  }

  return (
    <div className="fixed right-0 inset-y-0 z-50 w-full max-w-[500px] bg-[#0b0e14] border-l border-white/[0.06] flex flex-col">

      {/* ── Barra superior ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500/25 to-violet-600/25 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Globe size={16} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-100 truncate leading-tight">
            {node.title || <span className="text-slate-600 font-normal italic">Sin título</span>}
          </p>
          <p className="text-[11px] font-mono text-slate-600 truncate">{fp || "/"}</p>
        </div>
        <button type="button" title="Cerrar" onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/[0.06] transition shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* ── Tabs (Deployments / Variables style) ── */}
      <div className="flex gap-0 border-b border-white/[0.06] px-5 shrink-0">
        {(["seo", "estructura"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-3 text-[12px] font-medium border-b-2 transition -mb-px ${
              tab === t
                ? "border-blue-500 text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {t === "seo" ? "SEO & Contenido" : "Estructura"}
          </button>
        ))}
      </div>

      {/* ── Card principal (ACTIVE deployment style) ── */}
      <div className="mx-4 mt-4 rounded-xl border border-white/[0.07] overflow-hidden shrink-0">

        {/* Fila principal */}
        <div className="flex items-start gap-4 px-5 py-4 bg-white/[0.02]">

          {/* Badge sólido (como ACTIVE en Railway) */}
          <span className={`shrink-0 mt-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${BADGE[node.status]}`}>
            {s.lbl}
          </span>

          {/* Info editable */}
          <div className="flex-1 min-w-0">
            <input
              value={node.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="Título SEO de la página..."
              className="w-full text-[14px] font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-700 leading-snug"
            />
            {node.h1
              ? <p className="text-[12px] text-slate-400 mt-0.5 truncate">{node.h1}</p>
              : <p className="text-[12px] text-slate-700 mt-0.5 italic">sin H1 configurado</p>
            }
            <p className="text-[11px] font-mono text-slate-600 mt-2 truncate">{fp || "/"}</p>
          </div>

          {/* Selector de status (como los 3 dots / acciones de Railway) */}
          <div className="shrink-0 flex flex-col gap-1.5 pt-0.5">
            {(["planning", "draft", "live"] as const).map(st => (
              <button key={st} type="button"
                onClick={() => onUpdate({ status: st })}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition text-right ${
                  node.status === st
                    ? st === "live"  ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                    : st === "draft" ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                                    : "bg-slate-700/40 border-slate-600/30 text-slate-300"
                    : "border-white/[0.05] text-slate-600 hover:text-slate-400 hover:border-white/10"
                }`}>
                {ST[st].lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Fila resumen (Deployment successful style) */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.05] bg-black/20">
          <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
          <p className="text-[12px] text-slate-500 flex-1">
            {node.sections.length > 0
              ? `${node.sections.length} secciones · ${node.componentes.length} componentes · ${kw.length} keywords`
              : "Sin contenido configurado aún"}
          </p>
          {node.trafico && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
              node.trafico === "alto"  ? "bg-emerald-500/10 text-emerald-400"
            : node.trafico === "medio" ? "bg-amber-500/10 text-amber-400"
                                       : "bg-slate-700/30 text-slate-500"
            }`}>
              ↑ Tráfico {node.trafico}
            </span>
          )}
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="mx-4 mt-3 grid grid-cols-4 rounded-xl border border-white/[0.07] divide-x divide-white/[0.05] shrink-0">

        {/* Tráfico */}
        <div className="px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">Tráfico</p>
          <div className="flex flex-col gap-1.5">
            {(["alto", "medio", "bajo"] as const).map(t => (
              <button key={t} type="button"
                onClick={() => onUpdate({ trafico: node.trafico === t ? "" : t })}
                className={`text-left text-[11px] font-semibold capitalize px-2 py-1 rounded-md transition ${
                  node.trafico === t
                    ? t === "alto"  ? "bg-emerald-500/15 text-emerald-400"
                    : t === "medio" ? "bg-amber-500/15 text-amber-400"
                                    : "bg-slate-700/30 text-slate-400"
                    : "text-slate-700 hover:text-slate-400 hover:bg-white/[0.03]"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">Keywords</p>
          <span className="text-3xl font-bold text-slate-100 leading-none block">{kw.length}</span>
          <span className="text-[9px] text-slate-700 mt-1.5 block">palabras clave</span>
        </div>

        {/* CTR */}
        <div className="px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">CTR est.</p>
          <input value={node.ctrEstimado} onChange={e => onUpdate({ ctrEstimado: e.target.value })}
            placeholder="2–4%" title="CTR estimado"
            className="w-full text-xl font-bold text-slate-100 bg-transparent outline-none placeholder:text-slate-700 leading-none" />
          <span className="text-[9px] text-slate-700 mt-1.5 block">estimado</span>
        </div>

        {/* Forms */}
        <div className="px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">Forms</p>
          <input type="number" min={0} title="Número de formularios"
            value={node.formularios}
            onChange={e => onUpdate({ formularios: Math.max(0, Number(e.target.value)) })}
            className="w-full text-3xl font-bold text-slate-100 bg-transparent outline-none leading-none" />
          <span className="text-[9px] text-slate-700 mt-1.5 block">formularios</span>
        </div>
      </div>

      {/* ── Cuerpo del tab ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {tab === "seo" ? (
          <div className="space-y-5">
            {node.id !== "root" && (
              <div>
                <label className={label}>Segmento URL</label>
                <input value={node.segment}
                  onChange={e => onUpdate({ segment: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="nombre-pagina" className={field} />
                <p className="text-[10px] font-mono text-slate-700 mt-1.5">{fp}</p>
              </div>
            )}
            <div>
              <label className={label}>H1 Principal</label>
              <input value={node.h1} onChange={e => onUpdate({ h1: e.target.value })}
                placeholder="Encabezado principal de la página..." className={field} />
            </div>
            <div>
              <label className={label}>Keywords</label>
              <input value={node.keywords} onChange={e => onUpdate({ keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3..." className={field} />
              <p className="text-[10px] text-slate-700 mt-1.5">{kw.length} keywords · separadas por coma</p>
            </div>
            <div>
              <label className={label}>Hero / Tagline</label>
              <textarea value={node.hero} onChange={e => onUpdate({ hero: e.target.value })}
                placeholder="Propuesta de valor del hero section..." rows={2}
                className={`${field} resize-none`} />
            </div>
            <div>
              <label className={label}>Meta descripción</label>
              <textarea value={node.metaDesc} onChange={e => onUpdate({ metaDesc: e.target.value })}
                placeholder="Descripción para Google (≤160 chars)..." rows={3}
                className={`${field} resize-none`} />
              {node.metaDesc.length > 0 && (
                <p className={`text-[10px] mt-1.5 ${node.metaDesc.length > 160 ? "text-red-400" : "text-slate-700"}`}>
                  {node.metaDesc.length} / 160 caracteres
                </p>
              )}
            </div>
            <div>
              <label className={label}>Notas de diseño</label>
              <textarea value={node.notas} onChange={e => onUpdate({ notas: e.target.value })}
                placeholder="Referencias, decisiones de diseño, copy alternativo..." rows={3}
                className={`${field} resize-none`} />
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className={label}>Secciones</p>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-slate-500 text-[10px] font-bold">
                  {node.sections.length}
                </span>
              </div>
              <ListEditor items={node.sections} onUpdate={v => onUpdate({ sections: v })} ph="Ej: Hero, Productos, CTA..." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className={label}>Componentes reutilizables</p>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-slate-500 text-[10px] font-bold">
                  {node.componentes.length}
                </span>
              </div>
              <ListEditor items={node.componentes} onUpdate={v => onUpdate({ componentes: v })} ph="Ej: Navbar, ProductCard, CTABanner..." />
            </div>
          </div>
        )}
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

  const modalNode  = modal ? find(tree, modal.id) : null
  const handleUpdate = (id: string, p: Partial<PageNode>) => setTree(t => upd(t, id, p))
  const handleAdd    = (pid: string) => {
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
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden"
      style={{
        backgroundColor: "#020617",
        backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>

      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }} />

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
            <button type="button" onClick={exportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-lg bg-slate-900/60 backdrop-blur-sm transition">
              <Download size={14} /> Exportar
            </button>
            <button type="button" onClick={() => handleAdd("root")}
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
              <button type="button" onClick={() => handleAdd("root")}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-700/60 rounded-xl text-slate-600 hover:text-slate-400 hover:border-slate-600 transition text-sm bg-slate-900/30">
                <Plus size={13} /> Agregar primera sub-página
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {modalNode && modal && (
        <DrawerPagina
          node={modalNode}
          fp={modal.fp || pathOf(tree, modal.id)}
          onUpdate={p => handleUpdate(modal.id, p)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
