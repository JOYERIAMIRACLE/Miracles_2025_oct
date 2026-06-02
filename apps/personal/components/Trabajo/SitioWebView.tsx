"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, X, Download, Globe, Loader2, CloudOff, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { useTheme } from "next-themes"
import { getToken } from "@/lib/auth"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = { texto: string; imagen: string }

interface PageNode {
  id: string
  segment: string
  title: string
  metaTitle: string
  h1: string
  metaDesc: string
  keywords: string
  hero: string
  sections: Section[]
  componentes: string[]
  notas: string
  estructuraTitulo: string
  estructuraDesc: string
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
    hero: "", sections: [], componentes: [], notas: "", estructuraTitulo: "", estructuraDesc: "", status: "planning",
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
function mov(ns: PageNode[], id: string, dir: -1 | 1): PageNode[] {
  const idx = ns.findIndex(n => n.id === id)
  if (idx !== -1) {
    const ni = idx + dir
    if (ni < 0 || ni >= ns.length) return ns
    const arr = [...ns];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]]
    return arr
  }
  return ns.map(n => ({ ...n, children: mov(n.children, id, dir) }))
}
function countAll(ns: PageNode[]): number {
  return ns.reduce((s, n) => s + 1 + countAll(n.children), 0)
}
function countSt(ns: PageNode[], st: string): number {
  return ns.reduce((s, n) => s + (n.status === st ? 1 : 0) + countSt(n.children, st), 0)
}

function normalizeNode(n: PageNode): PageNode {
  return {
    ...n,
    sections: Array.isArray(n.sections)
      ? n.sections.map((s: unknown) =>
          typeof s === "string" ? { texto: s, imagen: "" } : (s as Section)
        )
      : [],
    componentes:      Array.isArray(n.componentes) ? n.componentes : [],
    hero:             n.hero             ?? "",
    notas:            n.notas            ?? "",
    estructuraTitulo: n.estructuraTitulo ?? "",
    estructuraDesc:   n.estructuraDesc   ?? "",
    ctrEstimado:      n.ctrEstimado      ?? "",
    formularios:      n.formularios      ?? 0,
    trafico:          n.trafico          ?? "",
    metaTitle:        n.metaTitle        ?? "",
    metaDesc:         n.metaDesc         ?? "",
    keywords:         n.keywords         ?? "",
    children:         (Array.isArray(n.children) ? n.children : []).map(normalizeNode),
  }
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
        <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] group">
          <span className="text-[10px] text-slate-400 dark:text-slate-700 font-mono w-5 shrink-0">{i + 1}.</span>
          <span className="flex-1 text-[13px] text-slate-700 dark:text-slate-300">{item}</span>
          <button
            type="button" title="Quitar"
            onClick={() => onUpdate(items.filter((_, j) => j !== i))}
            className="shrink-0 p-1 rounded text-slate-400 dark:text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
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
          className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-blue-500/40 transition"
        />
        <button
          type="button" onClick={add}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/30 hover:bg-blue-500/10 transition shrink-0">
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  )
}

// ─── SectionEditor ────────────────────────────────────────────────────────────

function SectionEditor({ items, onUpdate }: {
  items: Section[]
  onUpdate: (v: Section[]) => void
}) {
  const addNew = () => onUpdate([...items, { texto: "", imagen: "" }])
  const change = (i: number, patch: Partial<Section>) =>
    onUpdate(items.map((s, j) => j === i ? { ...s, ...patch } : s))
  const remove = (i: number) => onUpdate(items.filter((_, j) => j !== i))

  return (
    <div className="space-y-3">
      {items.map((sec, i) => (
        <div key={i} className="rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-white/[0.03] p-3 group relative">
          <button
            type="button" title="Quitar sección"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 p-1 rounded text-slate-400 dark:text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
            <X size={12} />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-700 font-mono shrink-0">{i + 1}.</span>
            <textarea
              value={sec.texto}
              onChange={e => change(i, { texto: e.target.value })}
              placeholder="Nombre o descripción de la sección…"
              rows={2}
              className="flex-1 px-2.5 py-1.5 text-[13px] text-slate-800 dark:text-slate-200 rounded-md border border-slate-200 dark:border-white/[0.06] bg-transparent dark:bg-white/[0.02] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-blue-500/40 resize-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-700 shrink-0 w-4" />
            <input
              value={sec.imagen}
              onChange={e => change(i, { imagen: e.target.value })}
              placeholder="URL imagen de referencia (opcional)…"
              className="flex-1 px-2.5 py-1.5 text-[12px] text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-white/[0.06] bg-transparent dark:bg-white/[0.02] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-blue-500/40 transition"
            />
            {sec.imagen && (
              <a href={sec.imagen} target="_blank" rel="noopener noreferrer" title="Ver imagen"
                className="shrink-0 p-1.5 rounded text-slate-400 dark:text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
      <button
        type="button" onClick={addNew}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 dark:border-white/[0.09] text-sm text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/5 transition">
        <Plus size={13} /> Agregar sección
      </button>
    </div>
  )
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────

const STATUS_CYCLE: Record<PageNode["status"], PageNode["status"]> = {
  planning: "draft",
  draft:    "live",
  live:     "planning",
}

function NodeCard({ node, fp, onEdit, onAddChild, onDel, onStatusChange, hasChildren, collapsed, onToggle, onMoveUp, onMoveDown }: {
  node: PageNode; fp: string
  onEdit: () => void; onAddChild: () => void; onDel: () => void
  onStatusChange: (s: PageNode["status"]) => void
  hasChildren?: boolean; collapsed?: boolean; onToggle?: () => void
  onMoveUp?: () => void; onMoveDown?: () => void
}) {
  const s = ST[node.status]
  return (
    <div
      onClick={onEdit}
      className="group w-52 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 backdrop-blur-sm hover:border-blue-500/40 hover:bg-blue-500/5 cursor-pointer transition-all duration-150 select-none">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-[10px] font-mono text-slate-500 truncate leading-none">{fp}</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
          {node.title || <span className="text-slate-400 dark:text-slate-600 font-normal italic">sin título</span>}
        </p>
        {(node.sections.length > 0 || node.componentes.length > 0) && (
          <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 leading-none">
            {[
              node.sections.length    > 0 && `${node.sections.length} secc.`,
              node.componentes.length > 0 && `${node.componentes.length} comp.`,
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={`Estado: ${s.lbl} — clic para cambiar`}
            onClick={e => { e.stopPropagation(); onStatusChange(STATUS_CYCLE[node.status]) }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border transition-colors hover:opacity-80 ${
              node.status === "live"     ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" :
              node.status === "draft"    ? "bg-amber-500/15 border-amber-500/25 text-amber-400" :
                                          "bg-slate-500/10 border-slate-500/20 text-slate-400"
            }`}>
            <div className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
            {s.lbl}
          </button>
          {hasChildren && onToggle && (
            <button type="button" title={collapsed ? "Expandir" : "Colapsar"}
              onClick={e => { e.stopPropagation(); onToggle() }}
              className="p-0.5 rounded text-slate-400 dark:text-slate-700 hover:text-slate-600 dark:hover:text-slate-400 transition opacity-0 group-hover:opacity-100">
              <ChevronDown size={10} className={`transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`} />
            </button>
          )}
        </div>
        <div className="flex opacity-0 group-hover:opacity-100 transition">
          {onMoveUp && (
            <button type="button" title="Subir"
              onClick={e => { e.stopPropagation(); onMoveUp() }}
              className="p-1 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 rounded transition">
              <ChevronUp size={12} />
            </button>
          )}
          {onMoveDown && (
            <button type="button" title="Bajar"
              onClick={e => { e.stopPropagation(); onMoveDown() }}
              className="p-1 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 rounded transition">
              <ChevronDown size={12} />
            </button>
          )}
          <button type="button" title="Agregar sub-página"
            onClick={e => { e.stopPropagation(); onAddChild() }}
            className="p-1 text-slate-400 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 rounded transition">
            <Plus size={12} />
          </button>
          {node.id !== "root" && (
            <button type="button" title="Eliminar"
              onClick={e => { e.stopPropagation(); onDel() }}
              className="p-1 text-slate-400 dark:text-slate-600 hover:text-red-400 rounded transition">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TreeRow ──────────────────────────────────────────────────────────────────

function TreeRow({ node, parentFp, idx, siblingCount, onEdit, onAddChild, onDel, onMove, onStatusChange }: {
  node: PageNode; parentFp: string
  idx: number; siblingCount: number
  onEdit: (id: string) => void
  onAddChild: (pid: string) => void
  onDel: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onStatusChange: (id: string, s: PageNode["status"]) => void
}) {
  const [open, setOpen] = useState(false)
  const fp = node.segment === "" ? "/" : parentFp === "/" ? `/${node.segment}` : `${parentFp}/${node.segment}`
  const hasChildren = node.children.length > 0
  return (
    <div>
      <NodeCard
        node={node} fp={fp}
        onEdit={() => onEdit(node.id)}
        onAddChild={() => onAddChild(node.id)}
        onDel={() => onDel(node.id)}
        onStatusChange={s => onStatusChange(node.id, s)}
        hasChildren={hasChildren}
        collapsed={!open}
        onToggle={() => setOpen(v => !v)}
        onMoveUp={idx > 0 ? () => onMove(node.id, -1) : undefined}
        onMoveDown={idx < siblingCount - 1 ? () => onMove(node.id, 1) : undefined}
      />
      {hasChildren && open && (
        <div className="ml-6 mt-2 border-l border-slate-200 dark:border-slate-800 pl-5 space-y-2">
          {node.children.map((c, i) => (
            <div key={c.id} className="relative">
              <div className="absolute -left-5 top-[42px] w-5 h-px bg-slate-200 dark:bg-slate-800" />
              <TreeRow node={c} parentFp={fp} idx={i} siblingCount={node.children.length} onEdit={onEdit} onAddChild={onAddChild} onDel={onDel} onMove={onMove} onStatusChange={onStatusChange} />
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
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#0d1117] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-3">{label}</p>
      {children}
    </div>
  )
}

const inp = "w-full text-[17px] text-slate-800 dark:text-slate-200 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"

function DrawerPagina({ node, fp, siteDomain, onUpdate, onClose, onSave, saving }: {
  node: PageNode; fp: string; siteDomain: string
  onUpdate: (p: Partial<PageNode>) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  const [tab,     setTab]     = useState<"seo" | "estructura">("seo")
  const [saved,   setSaved]   = useState(false)
  const kw = node.keywords.split(",").filter(k => k.trim())

  const TABS = [
    { id: "seo",        label: "Slug/meta"  },
    { id: "estructura", label: "Estructura" },
  ] as const

  function handleSave() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed right-0 inset-y-0 z-50 w-full max-w-[740px] bg-white dark:bg-[#0b0d13] border-l border-slate-200 dark:border-white/[0.06] flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-7 py-6 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center shrink-0">
          <Globe size={22} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[21px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {node.title || <span className="text-slate-400 dark:text-slate-600 font-normal italic">Sin título</span>}
          </p>
          <p className="text-[14px] font-mono text-slate-400 dark:text-slate-600 mt-0.5">{fp || "/"}</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition shrink-0 ${
            saved
              ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
              : "bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          }`}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saved ? "✓ Guardado" : saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" title="Cerrar" onClick={onClose}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-white/[0.06] px-7 shrink-0">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-6 py-4 text-[14px] font-medium border-b-2 -mb-px transition ${
              tab === t.id
                ? "border-blue-500 text-slate-900 dark:text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

        {/* URL bar */}
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0d1117]">
          <Globe size={16} className="text-slate-400 dark:text-slate-600 shrink-0" />
          <span className="text-[14px] font-mono text-slate-500 truncate">
            {siteDomain || "tu-dominio.com"}{fp !== "/" ? fp : ""}
          </span>
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
                  <p className="text-[12px] font-mono text-slate-400 dark:text-slate-600 mt-1.5">{fp}</p>
                </FieldRow>
              )}
            </FieldCard>

            <FieldCard>
              <FieldRow label="Meta title">
                <input value={node.metaTitle ?? ""} onChange={e => onUpdate({ metaTitle: e.target.value })}
                  placeholder="Título para Google (≤60 chars)..." className={inp} />
                {(node.metaTitle?.length ?? 0) > 0 && (
                  <p className={`text-[10px] mt-1.5 ${(node.metaTitle?.length ?? 0) > 60 ? "text-red-400" : "text-slate-400 dark:text-slate-600"}`}>
                    {node.metaTitle?.length}/60
                  </p>
                )}
              </FieldRow>
              <FieldRow label="Meta description">
                <textarea value={node.metaDesc} onChange={e => onUpdate({ metaDesc: e.target.value })}
                  placeholder="Descripción para Google (≤160 chars)..." rows={2}
                  className={`${inp} resize-none`} />
                {node.metaDesc.length > 0 && (
                  <p className={`text-[10px] mt-1.5 ${node.metaDesc.length > 160 ? "text-red-400" : "text-slate-400 dark:text-slate-600"}`}>
                    {node.metaDesc.length}/160
                  </p>
                )}
              </FieldRow>
              <FieldRow label="Keywords">
                <input value={node.keywords} onChange={e => onUpdate({ keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3..." className={inp} />
                {kw.length > 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">{kw.length} keywords</p>
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

            <button
              type="button"
              onClick={() => {
                const domain = siteDomain || "tu-dominio.com"
                const fullUrl = `${domain}${fp !== "/" ? fp : ""}`
                const lines = [
                  `URL: ${fullUrl}`,
                  `Slug: ${fp}`,
                  "",
                  `Meta title: ${node.metaTitle || "(vacío)"}`,
                  `Meta description: ${node.metaDesc || "(vacío)"}`,
                  `Keywords: ${node.keywords || "(vacío)"}`,
                  "",
                  `Notas: ${node.notas || "(vacío)"}`,
                ]
                const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `${node.segment || "home"}-meta.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-sm"
            >
              <Download size={14} />
              Descargar Slug/Meta (.txt)
            </button>
          </>
        )}

        {/* ── Tab Estructura ── */}
        {tab === "estructura" && (
          <>
            <div className="px-1 mb-2">
              <input
                value={node.estructuraTitulo ?? ""}
                onChange={e => onUpdate({ estructuraTitulo: e.target.value })}
                placeholder="Título de esta estructura…"
                className="w-full text-[16px] font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:placeholder:text-slate-300 dark:focus:placeholder:text-slate-700 border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700/60 transition-colors pb-0.5"
              />
              <input
                value={node.estructuraDesc ?? ""}
                onChange={e => onUpdate({ estructuraDesc: e.target.value })}
                placeholder="Concepto o descripción de esta estructura…"
                className="w-full text-[13px] text-slate-500 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:placeholder:text-slate-400 dark:focus:placeholder:text-slate-600 border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700/60 transition-colors mt-1 pb-0.5"
              />
            </div>
            <FieldCard>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500">Secciones</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">{(node.sections ?? []).length}</span>
                </div>
                <SectionEditor items={node.sections ?? []} onUpdate={v => onUpdate({ sections: v })} />
              </div>
            </FieldCard>
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
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); setOffline(true); return }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sitio-web`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.status === 404 ? null : r.json()))
      .then(json => {
        const arbol = json?.data?.arbol
        if (Array.isArray(arbol) && arbol.length > 0) {
          justLoaded.current = true
          setTree(arbol.map(normalizeNode))
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
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sitio-web`, {
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
  const handleMove         = (id: string, dir: -1 | 1) => setTree(t => mov(t, id, dir))
  const handleStatusChange = (id: string, s: PageNode["status"]) => setTree(t => upd(t, id, { status: s }))
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
      className="-m-4 md:-m-6 min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#020617" : "#f8fafc",
        backgroundImage: isDark
          ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
          : "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>

      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }} />

      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sitio web</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {total} página{total !== 1 ? "s" : ""} ·{" "}
              <span className="text-emerald-500 dark:text-emerald-400">{nlive} live</span> ·{" "}
              <span className="text-amber-500 dark:text-amber-400">{ndrft} borrador</span>
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
                className="text-xs text-amber-500 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition"
                title="Haz clic para reintentar">
                <CloudOff size={12} /> Error al guardar — reintentar
              </button>
            )}
            <button type="button" onClick={exportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm transition">
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
          {tree.map((node, i) => (
            <TreeRow
              key={node.id} node={node} parentFp="/"
              idx={i} siblingCount={tree.length}
              onEdit={(id) => setModal({ id })}
              onAddChild={handleAdd}
              onDel={handleDel}
              onMove={handleMove}
              onStatusChange={handleStatusChange}
            />
          ))}
          {total === 1 && (
            <div className="mt-6 ml-1">
              <button type="button" onClick={() => handleAdd("root")}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 transition text-sm bg-white/50 dark:bg-slate-900/30">
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
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sitio-web`, {
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
