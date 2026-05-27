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
  metaTitle: string
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
    id: uid(), segment, title: "", metaTitle: "", h1: "", metaDesc: "", keywords: "",
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
  onEdit: (id: string) => void
  onAddChild: (pid: string) => void
  onDel: (id: string) => void
}) {
  const fp = node.segment === "" ? "/" : parentFp === "/" ? `/${node.segment}` : `${parentFp}/${node.segment}`
  return (
    <div>
      <NodeCard
        node={node} fp={fp}
        onEdit={() => onEdit(node.id)}
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

// ─── Drawer de página ────────────────────────────────────────────────────────

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d1117] divide-y divide-white/[0.06] overflow-hidden">
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[14px] font-medium text-slate-400 mb-3">{label}</p>
      {children}
    </div>
  )
}

const inp = "w-full text-[17px] text-slate-200 bg-transparent outline-none placeholder:text-slate-600 leading-relaxed"

function DrawerPagina({ node, fp, siteDomain, onUpdate, onClose, onSave, saving }: {
  node: PageNode; fp: string; siteDomain: string
  onUpdate: (p: Partial<PageNode>) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  const [tab,     setTab]     = useState<"seo" | "estructura" | "metricas">("seo")
  const [saved,   setSaved]   = useState(false)
  const kw = node.keywords.split(",").filter(k => k.trim())
  const s  = ST[node.status]

  const TABS = [
    { id: "seo",        label: "Slug/meta"  },
    { id: "estructura", label: "Estructura" },
    { id: "metricas",   label: "Métricas"   },
  ] as const

  function handleSave() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed right-0 inset-y-0 z-50 w-full max-w-[740px] bg-[#0b0d13] border-l border-white/[0.06] flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-7 py-6 border-b border-white/[0.06] shrink-0">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/[0.08] flex items-center justify-center shrink-0">
          <Globe size={22} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[21px] font-semibold text-slate-100 truncate leading-tight">
            {node.title || <span className="text-slate-600 font-normal italic">Sin título</span>}
          </p>
          <p className="text-[14px] font-mono text-slate-600 mt-0.5">{fp || "/"}</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition shrink-0 ${
            saved
              ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400"
              : "bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          }`}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saved ? "✓ Guardado" : saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" title="Cerrar" onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/[0.06] transition shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/[0.06] px-7 shrink-0">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-6 py-4 text-[14px] font-medium border-b-2 -mb-px transition ${
              tab === t.id
                ? "border-blue-500 text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

        {/* URL bar — siempre visible */}
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/[0.07] bg-[#0d1117]">
          <Globe size={16} className="text-slate-600 shrink-0" />
          <span className="text-[14px] font-mono text-slate-500 flex-1 truncate">
            {siteDomain || "tu-dominio.com"}{fp !== "/" ? fp : ""}
          </span>
          <div className="flex items-center gap-2 text-[13px] text-slate-600 shrink-0">
            <span className="text-slate-700">|</span>
            <span>Visitas</span>
            <span className="text-slate-700">|</span>
            <span>Clics</span>
            <span className="text-slate-700">|</span>
            <span>Rank SEO</span>
          </div>
        </div>

        {/* ── Tab SEO/meta ── */}
        {tab === "seo" && (
          <>
            <FieldCard>
              {node.id === "root" ? (
                <FieldRow label="Dominio">
                  <input value={node.title} onChange={e => onUpdate({ title: e.target.value })}
                    placeholder="ej. sdindustrial.com.mx" className={inp} />
                </FieldRow>
              ) : (
                <FieldRow label="Slug">
                  <input value={node.segment}
                    onChange={e => {
                      const slug = e.target.value.toLowerCase().replace(/\s+/g, "-")
                      onUpdate({ segment: slug, title: slug })
                    }}
                    placeholder="nombre-pagina" className={`${inp} font-mono`} />
                  <p className="text-[12px] font-mono text-slate-600 mt-1.5">{fp}</p>
                </FieldRow>
              )}
            </FieldCard>

            <FieldCard>
              <FieldRow label="Meta title">
                <input value={node.metaTitle ?? ""} onChange={e => onUpdate({ metaTitle: e.target.value })}
                  placeholder="Título para Google (≤60 chars)..." className={inp} />
                {(node.metaTitle?.length ?? 0) > 0 && (
                  <p className={`text-[10px] mt-1.5 ${(node.metaTitle?.length ?? 0) > 60 ? "text-red-400" : "text-slate-600"}`}>
                    {node.metaTitle?.length}/60
                  </p>
                )}
              </FieldRow>
              <FieldRow label="Meta description">
                <textarea value={node.metaDesc} onChange={e => onUpdate({ metaDesc: e.target.value })}
                  placeholder="Descripción para Google (≤160 chars)..." rows={2}
                  className={`${inp} resize-none`} />
                {node.metaDesc.length > 0 && (
                  <p className={`text-[10px] mt-1.5 ${node.metaDesc.length > 160 ? "text-red-400" : "text-slate-600"}`}>
                    {node.metaDesc.length}/160
                  </p>
                )}
              </FieldRow>
              <FieldRow label="Keywords">
                <input value={node.keywords} onChange={e => onUpdate({ keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3..." className={inp} />
                {kw.length > 0 && (
                  <p className="text-[10px] text-slate-600 mt-1.5">{kw.length} keywords</p>
                )}
              </FieldRow>
            </FieldCard>

            <FieldCard>
              <FieldRow label="Notas">
                <textarea value={node.notas} onChange={e => onUpdate({ notas: e.target.value })}
                  placeholder="Referencias, decisiones de diseño..." rows={3}
                  className={`${inp} resize-none`} />
              </FieldRow>
            </FieldCard>
          </>
        )}

        {/* ── Tab Estructura ── */}
        {tab === "estructura" && (
          <>
            <FieldCard>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500">Secciones</p>
                  <span className="text-[10px] text-slate-600 font-mono">{node.sections.length}</span>
                </div>
                <ListEditor items={node.sections} onUpdate={v => onUpdate({ sections: v })} ph="Hero, Productos, CTA..." />
              </div>
            </FieldCard>
            <FieldCard>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500">Componentes reutilizables</p>
                  <span className="text-[10px] text-slate-600 font-mono">{node.componentes.length}</span>
                </div>
                <ListEditor items={node.componentes} onUpdate={v => onUpdate({ componentes: v })} ph="Navbar, ProductCard, CTABanner..." />
              </div>
            </FieldCard>
          </>
        )}

        {/* ── Tab Métricas ── */}
        {tab === "metricas" && (
          <>
            <FieldCard>
              <FieldRow label="Estado de la página">
                <div className="flex gap-2 mt-1">
                  {(["planning", "draft", "live"] as const).map(st => (
                    <button key={st} type="button" onClick={() => onUpdate({ status: st })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                        node.status === st
                          ? st === "live"     ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                          : st === "draft"    ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                                              : "bg-slate-700/40 border-slate-600/30 text-slate-300"
                          : "border-white/[0.06] text-slate-600 hover:text-slate-400"
                      }`}>
                      {ST[st].lbl}
                    </button>
                  ))}
                </div>
              </FieldRow>
              <FieldRow label="Tráfico estimado">
                <div className="flex gap-2 mt-1">
                  {(["alto", "medio", "bajo"] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => onUpdate({ trafico: node.trafico === t ? "" : t })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border capitalize transition ${
                        node.trafico === t
                          ? t === "alto"  ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                          : t === "medio" ? "bg-amber-500/15 border-amber-500/20 text-amber-400"
                                          : "bg-slate-700/30 border-slate-600/20 text-slate-400"
                          : "border-white/[0.06] text-slate-600 hover:text-slate-400"
                      }`}>{t}</button>
                  ))}
                </div>
              </FieldRow>
            </FieldCard>

            <FieldCard>
              <FieldRow label="CTR estimado">
                <input value={node.ctrEstimado} onChange={e => onUpdate({ ctrEstimado: e.target.value })}
                  placeholder="2–4%" title="CTR estimado" className={inp} />
              </FieldRow>
              <FieldRow label="Formularios en la página">
                <input type="number" min={0} title="Número de formularios"
                  value={node.formularios}
                  onChange={e => onUpdate({ formularios: Math.max(0, Number(e.target.value)) })}
                  className={inp} />
              </FieldRow>
            </FieldCard>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#0d1117] px-4 py-4">
                <p className="text-[10px] text-slate-600 mb-1">Keywords</p>
                <p className="text-3xl font-bold text-slate-100">{kw.length}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0d1117] px-4 py-4">
                <p className="text-[10px] text-slate-600 mb-1">Secciones</p>
                <p className="text-3xl font-bold text-slate-100">{node.sections.length}</p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SitioWebView() {
  const [tree,    setTree]    = useState<PageNode[]>([ROOT])
  const [modal,   setModal]   = useState<{ id: string } | null>(null)
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
        .then(r => { if (!r.ok) setOffline(true) })
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
    setModal({ id: c.id })
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
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Guardando...
              </span>
            )}
            {offline && (
              <button
                type="button"
                onClick={() => setOffline(false)}
                className="text-xs text-amber-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition"
                title="Haz clic para reintentar">
                <CloudOff size={12} /> Error al guardar — reintentar
              </button>
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
              onEdit={(id) => setModal({ id })}
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
          fp={pathOf(tree, modal.id)}
          siteDomain={find(tree, "root")?.title ?? ""}
          onUpdate={p => handleUpdate(modal.id, p)}
          onClose={() => setModal(null)}
          saving={saving}
          onSave={() => {
            const token = getToken()
            if (!token) return
            setSaving(true)
            fetch(`${BASE}/api/sitio-web`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ data: { arbol: tree } }),
            })
              .then(r => { if (!r.ok) setOffline(true) })
              .catch(() => setOffline(true))
              .finally(() => setSaving(false))
          }}
        />
      )}
    </div>
  )
}
