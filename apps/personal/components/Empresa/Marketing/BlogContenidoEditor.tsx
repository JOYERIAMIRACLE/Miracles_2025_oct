"use client"

import { useEffect, useRef, useState } from "react"
import {
  Plus, Trash2, ChevronUp, ChevronDown, ImagePlus, Bold, Italic, Link as LinkIcon,
  Heading2, Pilcrow, ListIcon, Quote as QuoteIcon, ListTree, Loader2, AlertTriangle,
} from "lucide-react"
import { uploadMedia } from "@/lib/upload"
import { BlockNode, TextNode, ListItemNode } from "@/types/blog-post"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-[#2a1b3d] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-[#2a1b3d] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y transition-all font-mono"

// ─── Debe coincidir exactamente con slugifyHeading() en
// apps/personal/app/(Tienda)/blog/components/BlocksRenderer.tsx y con
// slugHeading() en apps/backend/src/index.js — es lo que hace que los links
// de la tabla de contenido salten al H2 correcto.
function slugHeading(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

// ─── Mini-markdown ↔ TextNode[] ─────────────────────────────────────────────
// Cubre exactamente lo que el contenido real usa hoy: texto plano, **negrita**,
// *cursiva* y [texto](url). No soporta subrayado/tachado/formato anidado —
// si un bloque ya los tenía y no se toca su texto en este editor, se
// preservan tal cual (ver serializarBloques). Si se edita el texto, esos
// formatos no expresables en la mini-sintaxis se pierden.
function textNodesToMarkdownLite(nodes: TextNode[]): string {
  return nodes.map((n) => {
    let inner = n.type === "link" && n.children ? textNodesToMarkdownLite(n.children) : (n.text ?? "")
    if (n.bold) inner = `**${inner}**`
    if (n.italic) inner = `*${inner}*`
    if (n.type === "link" && n.url) inner = `[${inner}](${n.url})`
    return inner
  }).join("")
}

function markdownLiteToTextNodes(texto: string): TextNode[] {
  if (!texto) return [{ type: "text", text: "" }]
  const nodes: TextNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(texto))) {
    if (m.index > last) nodes.push({ type: "text", text: texto.slice(last, m.index) })
    if (m[1] !== undefined) nodes.push({ type: "link", url: m[2], children: [{ type: "text", text: m[1] }] })
    else if (m[3] !== undefined) nodes.push({ type: "text", text: m[3], bold: true })
    else if (m[4] !== undefined) nodes.push({ type: "text", text: m[4], italic: true })
    last = re.lastIndex
  }
  if (last < texto.length) nodes.push({ type: "text", text: texto.slice(last) })
  return nodes.length ? nodes : [{ type: "text", text: "" }]
}

function textoPlano(nodes: TextNode[]): string {
  return nodes.map((n) => (n.type === "link" && n.children ? textoPlano(n.children) : (n.text ?? ""))).join("")
}

// ─── Detección/construcción de la tabla de contenido ───────────────────────
function esBloqueTOC(block: BlockNode): boolean {
  // Reconoce tanto el formato viejo (link "#slug", usado por toc() en
  // apps/backend/src/index.js — solo pasa validación porque esos posts se
  // insertaron por db.query() directo, que se salta el validador de Strapi)
  // como el nuevo formato "/blog/slug-del-post#slug" que este editor genera
  // (ver construirTOC) — Strapi rechaza un link tipo "#slug" a secas en el
  // campo blocks porque intenta new URL(link) y eso truena sin protocolo;
  // solo special-casea los que empiezan con "/".
  const ANCLA_INTERNA = /^(\/blog\/[a-z0-9-]*)?#[a-z0-9-]+$/
  return block.type === "list" && block.children.length > 0
    && block.children.every((it) => it.children.length === 1 && it.children[0].type === "link" && ANCLA_INTERNA.test(it.children[0].url ?? ""))
}

function construirTOC(bloques: BlockNode[], slug: string): BlockNode {
  const items: ListItemNode[] = bloques
    .filter((b): b is Extract<BlockNode, { type: "heading" }> => b.type === "heading" && b.level === 2)
    .map((h) => textoPlano(h.children).trim())
    .filter((t) => t.length > 0)
    .map((t) => ({
      type: "list-item",
      // Strapi valida los links del campo blocks con new URL(...) — un "#ancla"
      // suelto no pasa (no tiene protocolo/host). Un path que empieza con "/"
      // sí, porque Strapi le agrega un dominio de prueba antes de validar.
      children: [{ type: "link", url: `/blog/${slug}#${slugHeading(t)}`, children: [{ type: "text", text: t }] }],
    }))
  return { type: "list", format: "unordered", children: items }
}

// ─── Estado interno del editor ──────────────────────────────────────────────
let contadorId = 0
const nuevoId = () => `b${Date.now()}_${contadorId++}`

type EditorItem = {
  id: string
  block: BlockNode
  esTOC: boolean
  /** snapshot de texto al cargar — permite detectar "no se tocó" y preservar
      el TextNode[] original (con cualquier formato que la mini-sintaxis no
      pueda expresar) en vez de siempre reparsear desde el textarea. */
  originalTexto?: string
}

function cargarBloques(contenido: BlockNode[] | null): EditorItem[] {
  if (!contenido) return []
  return contenido.map((block) => {
    const esTOC = esBloqueTOC(block)
    const item: EditorItem = { id: nuevoId(), block, esTOC }
    if (!esTOC && (block.type === "paragraph" || block.type === "quote" || block.type === "heading")) item.originalTexto = textNodesToMarkdownLite(block.children)
    if (!esTOC && block.type === "list") item.originalTexto = block.children.map((li) => textNodesToMarkdownLite(li.children)).join("\n")
    return item
  })
}

function serializarBloques(items: EditorItem[], textos: Record<string, string>, slug: string): BlockNode[] {
  const bloquesBase = items.map((it) => it.block)
  return items.map((it) => {
    if (it.esTOC) return construirTOC(bloquesBase, slug)
    const actual = textos[it.id]
    if (it.block.type === "paragraph" || it.block.type === "quote") {
      if (it.originalTexto !== undefined && actual === it.originalTexto) return it.block
      return { ...it.block, children: markdownLiteToTextNodes(actual ?? "") }
    }
    if (it.block.type === "list") {
      if (it.originalTexto !== undefined && actual === it.originalTexto) return it.block
      const lineas = (actual ?? "").split("\n").filter((l) => l.trim().length > 0)
      return { ...it.block, children: lineas.map((l): ListItemNode => ({ type: "list-item", children: markdownLiteToTextNodes(l) })) }
    }
    if (it.block.type === "heading") {
      return { ...it.block, children: markdownLiteToTextNodes(actual ?? textoPlano(it.block.children)) }
    }
    return it.block
  })
}

function envolverSeleccion(ref: React.RefObject<HTMLTextAreaElement | null>, texto: string, prefijo: string, sufijo = prefijo): string {
  const el = ref.current
  if (!el) return texto + prefijo + sufijo
  const inicio = el.selectionStart ?? texto.length
  const fin = el.selectionEnd ?? texto.length
  const seleccionado = texto.slice(inicio, fin) || "texto"
  return texto.slice(0, inicio) + prefijo + seleccionado + sufijo + texto.slice(fin)
}

function insertarLink(ref: React.RefObject<HTMLTextAreaElement | null>, texto: string): string | null {
  const url = window.prompt("URL del link:")
  if (!url) return null
  const el = ref.current
  const inicio = el?.selectionStart ?? texto.length
  const fin = el?.selectionEnd ?? texto.length
  const seleccionado = texto.slice(inicio, fin) || "texto del link"
  return texto.slice(0, inicio) + `[${seleccionado}](${url})` + texto.slice(fin)
}

function estadoInicial(value: BlockNode[] | null) {
  const items = cargarBloques(value)
  const textos: Record<string, string> = {}
  for (const it of items) if (it.originalTexto !== undefined) textos[it.id] = it.originalTexto
  return { items, textos }
}

export function BlogContenidoEditor({ value, onChange, slug }: { value: BlockNode[] | null; onChange: (blocks: BlockNode[]) => void; slug: string }) {
  const [inicial] = useState(() => estadoInicial(value))
  const [items, setItems] = useState<EditorItem[]>(inicial.items)
  const [textos, setTextos] = useState<Record<string, string>>(inicial.textos)
  const [subiendo, setSubiendo] = useState<string | null>(null)

  useEffect(() => { onChange(serializarBloques(items, textos, slug)) }, [items, textos, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const hayH2 = items.some((it) => !it.esTOC && it.block.type === "heading" && it.block.level === 2)
  const hayTOC = items.some((it) => it.esTOC)

  const slugsH2 = items.filter((it) => !it.esTOC && it.block.type === "heading" && it.block.level === 2)
    .map((it) => slugHeading(textoPlano((it.block as Extract<BlockNode, { type: "heading" }>).children)))
  const haySlugsDuplicados = new Set(slugsH2).size !== slugsH2.length

  function mover(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  function borrar(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setTextos((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  function agregar(block: BlockNode, texto?: string) {
    const id = nuevoId()
    setItems((prev) => [...prev, { id, block, esTOC: false }])
    if (texto !== undefined) setTextos((prev) => ({ ...prev, [id]: texto }))
  }

  function agregarTOC() {
    const id = nuevoId()
    setItems((prev) => [...prev, { id, block: { type: "list", format: "unordered", children: [] }, esTOC: true }])
  }

  async function agregarImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const tempId = nuevoId()
    setSubiendo(tempId)
    try {
      const { url } = await uploadMedia(file)
      setItems((prev) => [...prev, { id: tempId, esTOC: false, block: { type: "image", image: { url, alternativeText: "" }, children: [] } }])
    } finally {
      setSubiendo(null)
    }
  }

  async function reemplazarImagen(id: string, file: File) {
    setSubiendo(id)
    try {
      const { url } = await uploadMedia(file)
      setItems((prev) => prev.map((it) => it.id === id && it.block.type === "image"
        ? { ...it, block: { ...it.block, image: { ...it.block.image, url } } } : it))
    } finally {
      setSubiendo(null)
    }
  }

  function setAltText(id: string, alt: string) {
    setItems((prev) => prev.map((it) => it.id === id && it.block.type === "image"
      ? { ...it, block: { ...it.block, image: { ...it.block.image, alternativeText: alt } } } : it))
  }

  return (
    <div className="space-y-3">
      {haySlugsDuplicados && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>Hay dos subtítulos que generan el mismo enlace de tabla de contenido (texto muy parecido) — solo el primero será alcanzable. Cambia el texto de uno de los dos.</span>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-600">Sin contenido todavía — agrega un bloque abajo.</p>
        )}
        {items.map((it, idx) => (
          <BlockRow
            key={it.id}
            item={it}
            index={idx}
            total={items.length}
            texto={textos[it.id] ?? ""}
            subiendo={subiendo === it.id}
            onTextoChange={(t) => setTextos((prev) => ({ ...prev, [it.id]: t }))}
            onMover={(dir) => mover(idx, dir)}
            onBorrar={() => borrar(it.id)}
            onToggleFormat={(f) => setItems((prev) => prev.map((x) => x.id === it.id && x.block.type === "list" ? { ...x, block: { ...x.block, format: f } } : x))}
            onAltChange={(alt) => setAltText(it.id, alt)}
            onReemplazarImagen={(file) => reemplazarImagen(it.id, file)}
          />
        ))}
      </div>

      {/* Agregar bloque */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mr-1">Agregar</span>
        <BotonAgregar icon={Pilcrow} label="Párrafo" onClick={() => agregar({ type: "paragraph", children: [{ type: "text", text: "" }] }, "")} />
        <BotonAgregar icon={Heading2} label="Subtítulo" onClick={() => agregar({ type: "heading", level: 2, children: [{ type: "text", text: "" }] }, "")} />
        <BotonAgregar icon={ListIcon} label="Lista" onClick={() => agregar({ type: "list", format: "unordered", children: [] }, "")} />
        <BotonAgregar icon={QuoteIcon} label="Cita" onClick={() => agregar({ type: "quote", children: [{ type: "text", text: "" }] }, "")} />
        <label className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 cursor-pointer transition-colors">
          <ImagePlus size={13} /> Imagen
          <input type="file" accept="image/*" className="hidden" onChange={agregarImagen} />
        </label>
        <BotonAgregar icon={ListTree} label="Tabla de contenido" disabled={!hayH2 || hayTOC} onClick={agregarTOC} />
      </div>
    </div>
  )
}

function BotonAgregar({ icon: Icon, label, onClick, disabled }: { icon: typeof Plus; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors">
      <Icon size={13} /> {label}
    </button>
  )
}

function BlockRow({
  item, index, total, texto, subiendo,
  onTextoChange, onMover, onBorrar, onToggleFormat, onAltChange, onReemplazarImagen,
}: {
  item: EditorItem; index: number; total: number; texto: string; subiendo: boolean
  onTextoChange: (t: string) => void
  onMover: (dir: -1 | 1) => void
  onBorrar: () => void
  onToggleFormat: (f: "ordered" | "unordered") => void
  onAltChange: (alt: string) => void
  onReemplazarImagen: (file: File) => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const etiqueta = item.esTOC ? "Tabla de contenido (automática)"
    : item.block.type === "paragraph" ? "Párrafo"
    : item.block.type === "heading" ? "Subtítulo (H2)"
    : item.block.type === "list" ? "Lista"
    : item.block.type === "quote" ? "Cita"
    : item.block.type === "image" ? "Imagen"
    : item.block.type

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${item.esTOC ? "border-violet-500/30 bg-violet-500/5" : "border-slate-800 bg-[#2a1b3d]/60"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{etiqueta}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMover(-1)} disabled={index === 0} className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronUp size={14} /></button>
          <button type="button" onClick={() => onMover(1)} disabled={index === total - 1} className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronDown size={14} /></button>
          {confirmando ? (
            <span className="flex items-center gap-1 px-1">
              <button type="button" onClick={onBorrar} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
              <button type="button" onClick={() => setConfirmando(false)} className="text-[11px] text-slate-500">No</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={13} /></button>
          )}
        </div>
      </div>

      {item.esTOC ? (
        <p className="text-xs text-slate-500 italic">Se genera sola a partir de los subtítulos (H2) del post, en su orden actual. No se edita a mano.</p>
      ) : item.block.type === "heading" ? (
        <input type="text" value={texto} onChange={(e) => onTextoChange(e.target.value)} className={inp} placeholder="Texto del subtítulo…" />
      ) : item.block.type === "image" ? (
        <div className="flex items-center gap-3">
          {subiendo ? (
            <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-violet-400" /></div>
          ) : (
            <img src={item.block.image.url} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-700" />
          )}
          <div className="flex-1 space-y-1.5">
            <input type="text" value={item.block.image.alternativeText ?? ""} onChange={(e) => onAltChange(e.target.value)} className={inp} placeholder="Texto alternativo (accesibilidad)…" />
            <label className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer">
              Cambiar imagen
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onReemplazarImagen(f) }} />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {item.block.type !== "list" ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onTextoChange(envolverSeleccion(ref, texto, "**"))} className="p-1 text-slate-500 hover:text-slate-200" title="Negrita"><Bold size={12} /></button>
              <button type="button" onClick={() => onTextoChange(envolverSeleccion(ref, texto, "*"))} className="p-1 text-slate-500 hover:text-slate-200" title="Cursiva"><Italic size={12} /></button>
              <button type="button" onClick={() => { const n = insertarLink(ref, texto); if (n !== null) onTextoChange(n) }} className="p-1 text-slate-500 hover:text-slate-200" title="Link"><LinkIcon size={12} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onToggleFormat("unordered")} className={`text-[11px] px-2 py-0.5 rounded border ${item.block.type === "list" && item.block.format === "unordered" ? "border-violet-500/40 text-violet-300 bg-violet-500/10" : "border-slate-700 text-slate-500"}`}>• Viñetas</button>
              <button type="button" onClick={() => onToggleFormat("ordered")} className={`text-[11px] px-2 py-0.5 rounded border ${item.block.type === "list" && item.block.format === "ordered" ? "border-violet-500/40 text-violet-300 bg-violet-500/10" : "border-slate-700 text-slate-500"}`}>1. Numerada</button>
              <span className="text-[10px] text-slate-600">un renglón por elemento</span>
            </div>
          )}
          <textarea ref={ref} rows={item.block.type === "list" ? 3 : 2} value={texto} onChange={(e) => onTextoChange(e.target.value)} className={area}
            placeholder={item.block.type === "list" ? "Elemento 1\nElemento 2…" : "Texto… usa **negrita**, *cursiva* y [link](url)"} />
        </div>
      )}
    </div>
  )
}
