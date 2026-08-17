"use client"

import { useState, useMemo, useRef } from "react"
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown,
  CalendarDays, LayoutGrid, ChevronLeft, ChevronRight, BarChart2,
  Paperclip, Search, Camera,
} from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana, PublicacionData, RedPublicacionKey } from "@/types/campana"
import { uploadMedia } from "@/lib/upload"

const AMBITO       = "empresa" as const
const ANIO_ACTUAL  = new Date().getFullYear()
const MES_ACTUAL   = MESES[new Date().getMonth()]
const SEMANAS      = [1, 2, 3, 4] as const
type NSemana       = typeof SEMANAS[number]

const _now         = new Date()
const ANIO_HOY     = _now.getFullYear()
const MES_HOY_IDX  = _now.getMonth()
const SEMANA_HOY   = Math.min(Math.ceil(_now.getDate() / 7), 4) as NSemana

const fieldCls = "w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm px-3 outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40 focus:border-violet-400"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function weekStart(ref: Date): Date {
  const d = new Date(ref.getTime())
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setDate(r.getDate() + n)
  return r
}
function toYMD(d: Date): string { return d.toISOString().split("T")[0] }
const HOY_YMD = toYMD(new Date())

const FILAS_GRID = [
  { label: "MHS",   rowBg: "bg-blue-50 dark:bg-blue-950/30"   },
  { label: "Store", rowBg: "bg-violet-50 dark:bg-violet-950/30"  },
  { label: "Extra", rowBg: "bg-amber-50 dark:bg-amber-950/30"   },
] as const

const DIAS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const

function getFirstMonday(year: number, monthIdx: number): Date {
  const d = new Date(year, monthIdx, 1)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow))
  return d
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getSemana(c: CampanaType, n: NSemana, k: "Titulo" | "Fecha") {
  return c[`semana${n}${k}` as keyof CampanaType] as string | null
}

type DiaItem = { campana: CampanaType; n: NSemana; titulo: string }

function getDiaItems(campanas: CampanaType[], dayStr: string, categoria: string): DiaItem[] {
  const out: DiaItem[] = []
  const [yr, mo, dy] = dayStr.split("-").map(Number)
  const dayDate  = new Date(yr, mo - 1, dy)
  const isMonday = dayDate.getDay() === 1

  for (const c of campanas) {
    if (c.categoria !== categoria) continue
    const cMesIdx  = MESES.indexOf(c.mes)
    const firstMon = getFirstMonday(c.anio, cMesIdx)
    const hasAnyTitulo = SEMANAS.some(n => !!getSemana(c, n, "Titulo"))

    if (hasAnyTitulo) {
      for (const n of SEMANAS) {
        const fecha  = getSemana(c, n, "Fecha")
        const titulo = getSemana(c, n, "Titulo")
        if (!titulo) continue
        if (fecha) {
          if (fecha === dayStr) out.push({ campana: c, n, titulo })
        } else if (isMonday) {
          const weekMon = addDays(firstMon, (n - 1) * 7)
          if (toYMD(weekMon) === dayStr) out.push({ campana: c, n, titulo })
        }
      }
    } else {
      const fecha = getSemana(c, 1, "Fecha")
      if (fecha && fecha === dayStr && c.unidadNegocio) {
        out.push({ campana: c, n: 1, titulo: c.unidadNegocio })
      }
    }
  }
  return out
}

// ─── Publicación (5 canales) ──────────────────────────────────────────────────

const REDES_PUBLICACION: { key: RedPublicacionKey; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "mailing",  label: "Mailing" },
  { key: "portal",   label: "Portal" },
  { key: "blog",     label: "Blog" },
]
const DIAS_PUB = ["L", "Ma", "Mi", "J", "V"] as const

function defaultPublicacion(): PublicacionData {
  return {
    linkedin: { publicado: false, hora: "", dia: "" },
    facebook: { publicado: false, hora: "", dia: "" },
    mailing:  { publicado: false, hora: "", dia: "" },
    portal:   { publicado: false, hora: "", dia: "" },
    blog:     { publicado: false, hora: "", dia: "" },
  }
}
function parsePublicacion(raw: string | null): PublicacionData {
  if (!raw) return defaultPublicacion()
  try { return { ...defaultPublicacion(), ...JSON.parse(raw) } } catch { return defaultPublicacion() }
}

// ─── Etapas (progreso) ────────────────────────────────────────────────────────

const ETAPAS = ["Planeación", "Producto", "Contenido", "Publicación"] as const

function computeEtapas(form: CampanaPayload, manualPublicado: boolean): Set<number> {
  const set = new Set<number>()
  if (form.categoria && (form.notas || form.semana1Fecha)) set.add(0)
  if (form.atributos) set.add(1)
  if (form.semana1Archivo && form.multimedia) set.add(2)
  const pub = parsePublicacion(form.publicacion)
  const anyConHora = Object.values(pub).some(r => !!r.hora)
  if (anyConHora) { if (manualPublicado) set.add(3) }
  else if ((pub.linkedin.publicado || pub.facebook.publicado) && pub.mailing.publicado && pub.blog.publicado) set.add(3)
  return set
}
function etapasFromString(raw: string | null): Set<number> {
  if (!raw) return new Set()
  try { return new Set(JSON.parse(raw) as number[]) } catch { return new Set() }
}

// ─── Small UI ─────────────────────────────────────────────────────────────────

function CategoriaBadge({ cat }: { cat: string | null }) {
  if (!cat) return null
  const cls = cat === "MHS"   ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30"
            : cat === "Store" ? "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30"
            : cat === "Extra" ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30"
            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>{cat}</span>
}

const CAT_CHIP: Record<string, { letter: string; bg: string; text: string }> = {
  MHS:   { letter: "M", bg: "bg-blue-500/15",   text: "text-blue-600 dark:text-blue-300"   },
  Store: { letter: "S", bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-300" },
  Extra: { letter: "E", bg: "bg-amber-500/15",  text: "text-amber-600 dark:text-amber-300"  },
}

function CampanaChip({ titulo, categoria, fullWidth, archivos, progreso, onClick, onDelete }: {
  titulo: string; categoria: string | null; fullWidth?: boolean; archivos?: string[]; progreso?: number
  onClick: () => void; onDelete?: () => void
}) {
  const cfg = (categoria && CAT_CHIP[categoria]) ?? { letter: "·", bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400" }
  const primerArchivo = archivos?.[0]
  return (
    <div onClick={onClick}
      className={`group/chip relative flex items-center h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors overflow-hidden shrink-0 cursor-pointer ${fullWidth ? "w-full" : "w-[156px]"}`}>
      <span className={`flex items-center justify-center h-full w-7 shrink-0 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.letter}</span>
      <span className="text-[11px] text-slate-700 dark:text-slate-200 truncate px-2 flex-1 text-left leading-none">{titulo}</span>
      {primerArchivo && (
        <a href={primerArchivo} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          title={`Abrir archivo${archivos && archivos.length > 1 ? ` (${archivos.length})` : ""}`}
          className="flex items-center justify-center h-full w-6 shrink-0 text-slate-400 hover:text-violet-500 transition">
          <Paperclip size={10} />
        </a>
      )}
      {onDelete && (
        <span role="button" onClick={e => { e.stopPropagation(); onDelete() }} title="Eliminar campaña"
          className="flex items-center justify-center h-full w-6 shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover/chip:opacity-100 transition">
          <Trash2 size={10} />
        </span>
      )}
      {progreso !== undefined && (
        <span className={`absolute bottom-0 left-0 h-[3px] transition-all ${progreso >= 4 ? "bg-emerald-500" : "bg-violet-400"}`} style={{ width: `${(progreso / 4) * 100}%` }} />
      )}
    </div>
  )
}

// ─── Campaign progress helper for chips ──────────────────────────────────────

function progresoDe(c: CampanaType): number {
  return etapasFromString(c.etapas).size
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

function emptyPayload(mes: MesCampana, anio: number, categoria: string | null): CampanaPayload {
  return {
    unidadNegocio: "", mes, anio, tipo: "completa", orden: 0, ambito: AMBITO,
    categoria, atributos: null, notas: null, keyword: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
    etapas: null, multimedia: null, publicacion: null,
  }
}
function payloadDe(c: CampanaType): CampanaPayload {
  return {
    unidadNegocio: c.unidadNegocio, mes: c.mes, anio: c.anio, tipo: c.tipo, orden: c.orden, ambito: AMBITO,
    categoria: c.categoria, atributos: c.atributos, notas: c.notas, keyword: c.keyword,
    semana1Fecha: c.semana1Fecha, semana1Titulo: c.semana1Titulo, semana1Partes: c.semana1Partes, semana1Archivo: c.semana1Archivo,
    semana2Fecha: c.semana2Fecha, semana2Titulo: c.semana2Titulo, semana2Partes: c.semana2Partes, semana2Archivo: c.semana2Archivo,
    semana3Fecha: c.semana3Fecha, semana3Titulo: c.semana3Titulo, semana3Partes: c.semana3Partes, semana3Archivo: c.semana3Archivo,
    semana4Fecha: c.semana4Fecha, semana4Titulo: c.semana4Titulo, semana4Partes: c.semana4Partes, semana4Archivo: c.semana4Archivo,
    etapas: c.etapas, multimedia: c.multimedia?.id ?? null, publicacion: c.publicacion,
  }
}

// ─── Sección colapsable del modal ─────────────────────────────────────────────

function Section({ id, abierto, titulo, badge, onToggle, children }: {
  id: string; abierto: boolean; titulo: string; badge?: string; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          {titulo}
          {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">{badge}</span>}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && <div className="p-4 space-y-3 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalCampana({ editando, defaultCategoria, defaultMes, defaultAnio, defaultFecha, onGuardar, onEliminar, onCerrar }: {
  editando: CampanaType | null
  defaultCategoria: string | null; defaultMes: MesCampana; defaultAnio: number; defaultFecha: string | null
  onGuardar: (p: CampanaPayload) => Promise<void>
  onEliminar?: () => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm] = useState<CampanaPayload>(() => {
    if (editando) return payloadDe(editando)
    const base = emptyPayload(defaultMes, defaultAnio, defaultCategoria)
    if (defaultFecha) base.semana1Fecha = defaultFecha
    return base
  })
  const [pub, setPub] = useState<PublicacionData>(() => parsePublicacion(editando?.publicacion ?? null))
  const [manualPublicado, setManualPublicado] = useState(() => etapasFromString(editando?.etapas ?? null).has(3))
  const [abierta, setAbierta] = useState<string>("campana")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [subiendoMedia, setSubiendoMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<string | null>(editando?.multimedia?.url ?? null)
  const mediaRef = useRef<HTMLInputElement>(null)

  const etapasSet = computeEtapas({ ...form, publicacion: JSON.stringify(pub) }, manualPublicado)
  const anyConHora = Object.values(pub).some(r => !!r.hora)

  async function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoMedia(true)
    try {
      const { id, url } = await uploadMedia(file)
      setForm(f => ({ ...f, multimedia: id }))
      setMediaPreview(url)
    } catch (err) { toast.error(`Error al subir · ${(err as Error).message}`) }
    finally { setSubiendoMedia(false); if (mediaRef.current) mediaRef.current.value = "" }
  }

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    const payload: CampanaPayload = { ...form, publicacion: JSON.stringify(pub), etapas: JSON.stringify([...etapasSet]) }
    await onGuardar(payload)
    setSaving(false)
  }

  const handleEliminar = async () => {
    if (!onEliminar) return
    if (!window.confirm(`¿Eliminar "${form.unidadNegocio || "esta campaña"}"?`)) return
    setDeleting(true)
    await onEliminar()
    setDeleting(false)
  }

  const contenidoBadge = (form.keyword || form.semana1Archivo || form.multimedia) ? "·" : undefined
  const publicacionBadge = `${[...Object.values(pub)].filter(r => r.publicado).length}/5`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl mb-10">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{editando ? "Editar campaña" : "Nueva campaña"}</h2>
          <div className="flex items-center gap-1.5">
            <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
              className="h-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 outline-none">
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
              className="h-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 outline-none">
              {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" title="Cerrar" onClick={onCerrar}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <Section id="campana" abierto={abierta === "campana"} titulo="Detalles de campaña" onToggle={() => setAbierta(a => a === "campana" ? "" : "campana")}>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Título <span className="text-violet-500">*</span></label>
              <input autoFocus value={form.unidadNegocio} onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
                placeholder="Ej. Campaña Día de las Madres" className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Fecha de publicación</label>
              <input type="date" value={form.semana1Fecha ?? ""} onChange={e => setForm(f => ({ ...f, semana1Fecha: e.target.value || null }))} className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Unidad de negocio</label>
              <div className="flex gap-2">
                {(["MHS", "Store", "Extra"] as const).map(cat => (
                  <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, categoria: f.categoria === cat ? null : cat }))}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                      form.categoria === cat
                        ? cat === "MHS" ? "bg-blue-50 dark:bg-blue-600/20 border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-300"
                        : cat === "Store" ? "bg-violet-50 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-300"
                        : "bg-amber-50 dark:bg-amber-600/20 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}>{cat}</button>
                ))}
              </div>
            </div>
          </Section>

          <Section id="producto" abierto={abierta === "producto"} titulo="Detalles de producto" badge={form.atributos ? "·" : undefined} onToggle={() => setAbierta(a => a === "producto" ? "" : "producto")}>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Productos</label>
              <textarea rows={3} value={form.atributos ?? ""} onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))}
                placeholder="Ej. Anillos, dijes, cadenas..." className={`${fieldCls} h-auto py-2 resize-y`} />
            </div>
          </Section>

          <Section id="contenido" abierto={abierta === "contenido"} titulo="Detalles de contenido" badge={contenidoBadge} onToggle={() => setAbierta(a => a === "contenido" ? "" : "contenido")}>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Categoría objetivo</label>
              <input value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                placeholder="Ej. Temporada, Promo, Lanzamiento..." className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Keyword</label>
              <input value={form.keyword ?? ""} onChange={e => setForm(f => ({ ...f, keyword: e.target.value || null }))} placeholder="Ej. anillo, oro, regalo" className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Link borrador</label>
              <input value={form.semana1Archivo ?? ""} onChange={e => setForm(f => ({ ...f, semana1Archivo: e.target.value || null }))} placeholder="https://drive.google.com/..." className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Link edición</label>
              <input value={form.semana2Archivo ?? ""} onChange={e => setForm(f => ({ ...f, semana2Archivo: e.target.value || null }))} placeholder="https://figma.com/..." className={fieldCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Multimedia</label>
              <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" onClick={() => mediaRef.current?.click()}>
                {mediaPreview ? (
                  <img src={mediaPreview} alt="" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Camera className="h-5 w-5 text-slate-400" />
                    <p className="text-xs text-slate-400">{subiendoMedia ? "Subiendo..." : "Subir imagen o video"}</p>
                  </div>
                )}
              </div>
              <input ref={mediaRef} type="file" accept="image/*,video/*" onChange={handleMedia} className="hidden" />
            </div>
          </Section>

          <Section id="publicacion" abierto={abierta === "publicacion"} titulo="Detalle de publicación" badge={publicacionBadge} onToggle={() => setAbierta(a => a === "publicacion" ? "" : "publicacion")}>
            <div className="space-y-2">
              {REDES_PUBLICACION.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <button type="button" onClick={() => setPub(p => ({ ...p, [key]: { ...p[key], publicado: !p[key].publicado } }))}
                    className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${pub[key].publicado ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {pub[key].publicado && <Check size={11} className="text-white" />}
                  </button>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-16 shrink-0">{label}</span>
                  <div className="flex gap-0.5">
                    {DIAS_PUB.map(d => (
                      <button key={d} type="button" onClick={() => setPub(p => ({ ...p, [key]: { ...p[key], dia: p[key].dia === d ? "" : d } }))}
                        className={`h-6 w-6 rounded text-[10px] font-medium transition-colors ${pub[key].dia === d ? "bg-violet-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <input type="time" value={pub[key].hora} onChange={e => setPub(p => ({ ...p, [key]: { ...p[key], hora: e.target.value } }))}
                    className="h-6 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 outline-none ml-auto" />
                </div>
              ))}
              {anyConHora && (
                <button type="button" onClick={() => setManualPublicado(m => !m)}
                  className={`w-full mt-1 h-8 rounded-lg text-xs font-semibold border transition-colors ${manualPublicado ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  {manualPublicado ? "✓ Marcado como publicado" : "Marcar como publicado"}
                </button>
              )}
            </div>
          </Section>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progreso {etapasSet.size}/4</span>
            {etapasSet.size === 4 && <span className="text-[10px] font-bold text-emerald-500">Completo</span>}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {ETAPAS.map((e, i) => (
              <div key={e} className="space-y-1">
                <div className={`h-1.5 rounded-full ${etapasSet.has(i) ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                <p className="text-[9px] text-slate-400 truncate">{e}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
          {editando ? (
            <button type="button" onClick={handleEliminar} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 rounded-lg transition-colors">
              <Trash2 size={14} />{deleting ? "Eliminando..." : "Eliminar"}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition">Cancelar</button>
            <button type="button" onClick={guardar} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition">
              <Check size={14} />{saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vista Catálogo (mensual) ─────────────────────────────────────────────────

function semanaLabel(semanaStart: Date, semanaEnd: Date, n: NSemana): string {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const wHoy = weekStart(hoy)
  const wSiguiente = addDays(wHoy, 7)
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-MX", opts)
  if (toYMD(semanaStart) === toYMD(wHoy)) return `Semana actual ${fmt(semanaStart, { day: "numeric" })}-${fmt(semanaEnd, { day: "numeric", month: "short" })}`
  if (toYMD(semanaStart) === toYMD(wSiguiente)) return `Semana siguiente ${fmt(semanaStart, { day: "numeric" })}-${fmt(semanaEnd, { day: "numeric", month: "short" })}`
  return `Semana ${n}`
}

function MesGroup({ mes, anio, campanas, onEdit, onDelete, onNueva }: {
  mes: MesCampana; anio: number; campanas: CampanaType[]
  onEdit: (c: CampanaType) => void; onDelete: (c: CampanaType) => void; onNueva: () => void
}) {
  const isCurrentMonth = anio === ANIO_HOY && MESES.indexOf(mes) === MES_HOY_IDX
  const [collapsed, setCollapsed] = useState(false)
  const mesIdx = MESES.indexOf(mes)
  const firstMon = getFirstMonday(anio, mesIdx)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)

  const objetivoKey = `mdo-campana-objetivo-${mes}-${anio}`
  const [objetivo, setObjetivo] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(objetivoKey) ?? "" : ""))
  const [editingObjetivo, setEditingObjetivo] = useState(false)
  const [objetivoDraft, setObjetivoDraft] = useState("")

  const saveObjetivo = () => {
    const val = objetivoDraft.trim()
    setObjetivo(val)
    localStorage.setItem(objetivoKey, val)
    setEditingObjetivo(false)
  }

  const sinTitulosDocIds = new Set(campanas.filter(c => !SEMANAS.some(n => !!getSemana(c, n, "Titulo"))).map(c => c.documentId))

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{mes} {anio}</span>
        <ChevronRight className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
      </button>
      {!collapsed && (
        <>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2 min-h-[36px]">
            {editingObjetivo ? (
              <input autoFocus value={objetivoDraft} onChange={e => setObjetivoDraft(e.target.value)} onBlur={saveObjetivo}
                onKeyDown={e => { if (e.key === "Enter") saveObjetivo(); if (e.key === "Escape") setEditingObjetivo(false) }}
                placeholder="Escribe el objetivo del mes..."
                className="flex-1 text-xs bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none py-0.5" />
            ) : objetivo ? (
              <button type="button" onClick={() => { setObjetivoDraft(objetivo); setEditingObjetivo(true) }}
                className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition text-left group/obj">
                <span>🎯</span><span>{objetivo}</span>
                <Pencil size={10} className="opacity-0 group-hover/obj:opacity-100 text-slate-400 shrink-0" />
              </button>
            ) : (
              <button type="button" onClick={() => { setObjetivoDraft(""); setEditingObjetivo(true) }}
                className="text-[11px] text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-500 transition flex items-center gap-1">
                <Plus size={10} /> Objetivo del mes
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {SEMANAS.map(n => {
              const sStart = addDays(firstMon, (n - 1) * 7)
              const sEnd = addDays(sStart, 6)
              if (isCurrentMonth && sEnd < hoy) return null
              const label = semanaLabel(sStart, sEnd, n)
              const conTitulo = campanas.filter(c => !!getSemana(c, n, "Titulo")).map(c => ({ c, titulo: getSemana(c, n, "Titulo")! }))
              const sEndStr = toYMD(sEnd), sStartStr = toYMD(sStart)
              const sinTitulo = campanas.filter(c => sinTitulosDocIds.has(c.documentId))
                .filter(c => c.semana1Fecha ? c.semana1Fecha >= sStartStr && c.semana1Fecha <= sEndStr : n === 1)
                .map(c => ({ c, titulo: c.unidadNegocio }))
              const items = [...conTitulo, ...sinTitulo]
              return (
                <div key={n} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 w-44 shrink-0 leading-snug">{label}</span>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {items.map(({ c, titulo }) => (
                      <CampanaChip key={`${c.documentId}-${n}`} titulo={titulo} categoria={c.categoria} progreso={progresoDe(c)}
                        archivos={[c.semana1Archivo, c.semana2Archivo, c.semana3Archivo, c.semana4Archivo].filter(Boolean) as string[]}
                        onClick={() => onEdit(c)} onDelete={() => onDelete(c)} />
                    ))}
                  </div>
                  <button type="button" title="Agregar campaña" onClick={onNueva}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-300 dark:text-slate-600 hover:text-violet-500 transition-colors shrink-0">
                    <Plus size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function VistaCatalogo({ campanas, onEdit, onDelete, onNueva }: {
  campanas: CampanaType[]; onEdit: (c: CampanaType) => void; onDelete: (c: CampanaType) => void; onNueva: () => void
}) {
  const grupos = useMemo(() => {
    const map = new Map<string, { mes: MesCampana; anio: number; items: CampanaType[] }>()
    campanas.forEach(c => {
      const key = `${c.anio}-${String(MESES.indexOf(c.mes)).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, { mes: c.mes, anio: c.anio, items: [] })
      map.get(key)!.items.push(c)
    })
    const nowKey = `${ANIO_HOY}-${String(MES_HOY_IDX).padStart(2, "0")}`
    return [...map.entries()].sort(([a], [b]) => {
      const aFut = a >= nowKey, bFut = b >= nowKey
      if (aFut && !bFut) return -1
      if (!aFut && bFut) return 1
      return aFut ? a.localeCompare(b) : b.localeCompare(a)
    }).map(([, v]) => v)
  }, [campanas])

  if (campanas.length === 0) return (
    <div className="text-center py-16">
      <p className="text-slate-400 dark:text-slate-500 text-sm mb-3">No hay campañas</p>
      <button type="button" onClick={onNueva}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
        <Plus size={14} /> Crear primera campaña
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      {grupos.map(({ mes, anio, items }) => (
        <MesGroup key={`${mes}-${anio}`} mes={mes} anio={anio} campanas={items} onEdit={onEdit} onDelete={onDelete} onNueva={onNueva} />
      ))}
    </div>
  )
}

// ─── Popup asignar existente ──────────────────────────────────────────────────

function PopupAsignar({ dayStr, categoria, campanas, onNueva, onAsignar, onClose }: {
  dayStr: string; categoria: string; campanas: CampanaType[]
  onNueva: () => void; onAsignar: (c: CampanaType, semanaNum: NSemana) => void; onClose: () => void
}) {
  const [busq, setBusq] = useState("")
  const mes = MESES[new Date(dayStr + "T00:00:00").getMonth()]
  const anio = new Date(dayStr + "T00:00:00").getFullYear()
  const semanaNum = Math.min(Math.ceil(new Date(dayStr + "T00:00:00").getDate() / 7), 4) as NSemana

  const opciones = useMemo(() => {
    const q = busq.toLowerCase().trim()
    return campanas.filter(c => c.mes === mes && c.anio === anio)
      .filter(c => !c.categoria || c.categoria === categoria)
      .filter(c => !q || c.unidadNegocio.toLowerCase().includes(q) || (c.notas ?? "").toLowerCase().includes(q))
  }, [campanas, mes, anio, busq, categoria])

  const fmtDia = new Date(dayStr + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Agregar al planeador</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{fmtDia} · {categoria} · Semana {semanaNum}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={15} />
          </button>
        </div>
        <div className="px-4 pt-3 pb-2">
          <button type="button" onClick={() => { onClose(); onNueva() }}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition mb-3">
            <Plus size={14} /> Nueva campaña
          </button>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input value={busq} onChange={e => setBusq(e.target.value)} placeholder={`Buscar en ${mes} ${anio}…`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-violet-400 transition" />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">O elige del catálogo ({opciones.length})</p>
        </div>
        <div className="max-h-56 overflow-y-auto px-4 pb-3 space-y-1">
          {opciones.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin campañas en {mes} {anio}</p>
          ) : opciones.map(c => {
            const semanaFechaActual = c[`semana${semanaNum}Fecha` as keyof CampanaType] as string | null
            return (
              <button key={c.documentId} type="button" onClick={() => onAsignar(c, semanaNum)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition text-left group">
                <CategoriaBadge cat={c.categoria} />
                <span className="flex-1 text-xs text-slate-700 dark:text-slate-200 truncate">{c.unidadNegocio || "Sin título"}</span>
                {semanaFechaActual
                  ? <span className="text-[9px] text-amber-500 shrink-0">↺ reemplaza fecha</span>
                  : <span className="text-[9px] text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100">+ asignar</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Vista Planeador (semanal) ────────────────────────────────────────────────

function VistaPlaneador({ campanas, onEdit, onDelete, onAgregar, onAsignarExistente }: {
  campanas: CampanaType[]; onEdit: (c: CampanaType) => void; onDelete: (c: CampanaType) => void
  onAgregar: (opts: { categoria: string; mes: MesCampana; anio: number; fecha: string }) => void
  onAsignarExistente: (c: CampanaType, fecha: string, semanaNum: NSemana, categoriaFila: string) => Promise<void>
}) {
  const [wStart, setWStart] = useState(() => weekStart(new Date()))
  const [picker, setPicker] = useState<{ dayStr: string; categoria: string } | null>(null)
  const days = Array.from({ length: 5 }, (_, i) => addDays(wStart, i))
  const wEnd = addDays(wStart, 6)
  const isHoy = (d: Date) => toYMD(d) === HOY_YMD
  const weekLabel = `${wStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${wEnd.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button type="button" title="Semana anterior" onClick={() => setWStart(d => addDays(d, -7))}
          className="h-8 w-8 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition"><ChevronLeft size={14} /></button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[220px] text-center">{weekLabel}</span>
        <button type="button" title="Semana siguiente" onClick={() => setWStart(d => addDays(d, 7))}
          className="h-8 w-8 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition"><ChevronRight size={14} /></button>
        <button type="button" onClick={() => setWStart(weekStart(new Date()))}
          className="text-[11px] text-slate-400 hover:text-violet-500 underline underline-offset-2 transition ml-1">Hoy</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[72px_repeat(5,1fr)] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <div />
            {days.map((d, i) => (
              <div key={i} className={`px-2 py-2.5 border-l border-slate-200 dark:border-slate-700 text-center ${isHoy(d) ? "bg-violet-50 dark:bg-violet-500/5" : ""}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isHoy(d) ? "text-violet-500" : "text-slate-400 dark:text-slate-500"}`}>{DIAS_ES[i]}</p>
                <p className={`text-[12px] font-medium mt-0.5 ${isHoy(d) ? "text-violet-600 dark:text-violet-300" : "text-slate-500 dark:text-slate-400"}`}>{d.toLocaleDateString("es-MX", { day: "numeric" })}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-600">{d.toLocaleDateString("es-MX", { month: "short" })}</p>
              </div>
            ))}
          </div>
          {FILAS_GRID.map((fila, ri) => (
            <div key={fila.label} className={`grid grid-cols-[72px_repeat(5,1fr)] ${ri < FILAS_GRID.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""}`}>
              <div className={`${fila.rowBg} border-r border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 min-h-[88px]`}>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">{fila.label}</span>
              </div>
              {days.map((day, di) => {
                const dayStr = toYMD(day)
                const items = getDiaItems(campanas, dayStr, fila.label)
                return (
                  <div key={di} className={`border-l border-slate-200 dark:border-slate-700 p-1.5 flex flex-col gap-1 min-h-[88px] ${isHoy(day) ? "bg-violet-50 dark:bg-violet-500/5" : ""}`}>
                    {items.map(({ campana, n, titulo }) => (
                      <CampanaChip key={`${campana.documentId}-${n}`} titulo={titulo} categoria={campana.categoria} fullWidth progreso={progresoDe(campana)}
                        archivos={[campana.semana1Archivo, campana.semana2Archivo, campana.semana3Archivo, campana.semana4Archivo].filter(Boolean) as string[]}
                        onClick={() => onEdit(campana)} onDelete={() => onDelete(campana)} />
                    ))}
                    <button type="button" onClick={() => setPicker({ dayStr: toYMD(day), categoria: fila.label })}
                      className="w-full py-0.5 rounded border border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-400 text-slate-300 dark:text-slate-700 hover:text-violet-500 text-[9px] flex items-center justify-center gap-0.5 transition-colors mt-auto shrink-0">
                      <Plus size={8} /> Agregar
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-3">Campañas con fecha exacta aparecen en su día. Sin fecha, se posicionan el lunes de su semana dentro del mes.</p>
      {picker && (
        <PopupAsignar dayStr={picker.dayStr} categoria={picker.categoria} campanas={campanas}
          onNueva={() => onAgregar({ categoria: picker.categoria, mes: MESES[new Date(picker.dayStr + "T00:00:00").getMonth()], anio: new Date(picker.dayStr + "T00:00:00").getFullYear(), fecha: picker.dayStr })}
          onAsignar={(c, semanaNum) => { onAsignarExistente(c, picker.dayStr, semanaNum, picker.categoria); setPicker(null) }}
          onClose={() => setPicker(null)} />
      )}
    </div>
  )
}

// ─── Vista Métricas ────────────────────────────────────────────────────────────

function HBar({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300 truncate">{label}</span>
        <span className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">{value}{sub ? ` · ${sub}` : ""}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function VistaMetricas({ campanas }: { campanas: CampanaType[] }) {
  const [periodo, setPeriodo] = useState<"todo" | "mes" | "trimestre">("todo")

  const filtradas = useMemo(() => {
    if (periodo === "todo") return campanas
    const hoy = new Date()
    const limite = new Date(hoy)
    limite.setMonth(hoy.getMonth() - (periodo === "mes" ? 1 : 3))
    return campanas.filter(c => {
      const ref = c.semana1Fecha ? new Date(c.semana1Fecha + "T00:00:00") : c.createdAt ? new Date(c.createdAt) : null
      return ref ? ref >= limite : true
    })
  }, [campanas, periodo])

  const total = filtradas.length
  const publicadas = filtradas.filter(c => etapasFromString(c.etapas).has(3)).length
  const enProduccion = filtradas.filter(c => { const s = etapasFromString(c.etapas); return s.size > 0 && s.size < 4 }).length
  const sinIniciar = filtradas.filter(c => etapasFromString(c.etapas).size === 0).length
  const conMultimedia = filtradas.filter(c => !!c.multimedia).length
  const conPublicacion = filtradas.filter(c => { const p = parsePublicacion(c.publicacion); return Object.values(p).some(r => r.publicado) }).length

  const porCategoria = useMemo(() => {
    const map = new Map<string, { total: number; pub: number }>()
    for (const c of filtradas) {
      const key = c.categoria ?? "Sin categoría"
      if (!map.has(key)) map.set(key, { total: 0, pub: 0 })
      const v = map.get(key)!
      v.total++
      if (etapasFromString(c.etapas).has(3)) v.pub++
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [filtradas])

  const porMedio = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of filtradas) {
      const p = parsePublicacion(c.publicacion)
      for (const [k, v] of Object.entries(p)) if (v.publicado) map.set(k, (map.get(k) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [filtradas])

  const topKeywords = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of filtradas) {
      if (!c.keyword) continue
      for (const k of c.keyword.split(",").map(s => s.trim()).filter(Boolean)) map.set(k, (map.get(k) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [filtradas])

  const stats = [
    { label: "Total campañas", value: total, color: "text-slate-800 dark:text-slate-100" },
    { label: "Publicadas", value: publicadas, sub: total ? `${Math.round((publicadas / total) * 100)}%` : undefined, color: "text-emerald-500" },
    { label: "En producción", value: enProduccion, color: "text-violet-500" },
    { label: "Sin iniciar", value: sinIniciar, color: "text-slate-400" },
    { label: "Con multimedia", value: conMultimedia, color: "text-blue-500" },
    { label: "Con publicación", value: conPublicacion, color: "text-amber-500" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        {([["todo", "Todo"], ["mes", "Último mes"], ["trimestre", "Trimestre"]] as const).map(([id, lbl]) => (
          <button key={id} type="button" onClick={() => setPeriodo(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${periodo === id ? "bg-violet-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}{s.sub ? <span className="text-xs font-normal text-slate-400 ml-1">({s.sub})</span> : null}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Por unidad de negocio</p>
          {porCategoria.length === 0 ? <p className="text-xs text-slate-400">Sin datos</p> : porCategoria.map(([cat, v]) => (
            <HBar key={cat} label={cat} value={v.total} max={total} sub={v.total ? `${Math.round((v.pub / v.total) * 100)}% publicado` : undefined} />
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Por medio de publicación</p>
          {porMedio.length === 0 ? <p className="text-xs text-slate-400">Sin datos</p> : porMedio.map(([medio, n]) => (
            <HBar key={medio} label={REDES_PUBLICACION.find(r => r.key === medio)?.label ?? medio} value={n} max={Math.max(...porMedio.map(m => m[1]))} />
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top keywords</p>
          {topKeywords.length === 0 ? <p className="text-xs text-slate-400">Sin datos</p> : topKeywords.map(([kw, n]) => (
            <HBar key={kw} label={kw} value={n} max={topKeywords[0][1]} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function CampanasPlannerView() {
  const { campanas, setCampanas, loading } = useGetCampanas(AMBITO)
  const [tab, setTab] = useState<"mensual" | "semanal" | "metricas">("mensual")
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<CampanaType | null>(null)
  const [defOpts, setDefOpts] = useState<{ categoria: string | null; mes: MesCampana; anio: number; fecha: string | null }>({
    categoria: null, mes: MES_ACTUAL, anio: ANIO_ACTUAL, fecha: null,
  })

  const abrirNueva = (opts?: Partial<typeof defOpts>) => {
    setEditando(null)
    setDefOpts({ categoria: null, mes: MES_ACTUAL, anio: ANIO_ACTUAL, fecha: null, ...opts })
    setModal(true)
  }
  const abrirEditar = (c: CampanaType) => { setEditando(c); setModal(true) }

  const guardar = async (payload: CampanaPayload) => {
    try {
      if (editando) {
        const updated = await updateCampana(editando.documentId, payload)
        setCampanas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
        toast.success("Campaña actualizada")
      } else {
        const nueva = await createCampana({ ...payload, ambito: AMBITO })
        setCampanas(prev => [nueva, ...prev])
        toast.success("Campaña creada")
      }
      setModal(false)
    } catch { toast.error("Error al guardar") }
  }

  const eliminar = async (c: CampanaType) => {
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Eliminada")
    } catch { toast.error("Error al eliminar") }
  }
  const eliminarDesdeModal = async () => { if (editando) { await eliminar(editando); setModal(false) } }

  const asignarExistente = async (c: CampanaType, fecha: string, _semanaNum: NSemana, categoriaFila: string) => {
    const semanaTarget = SEMANAS.find(n => !!getSemana(c, n, "Titulo")) ?? 1
    const key = `semana${semanaTarget}Fecha` as keyof CampanaPayload
    const payload: Partial<CampanaPayload> = { [key]: fecha } as Partial<CampanaPayload>
    if (!c.categoria) payload.categoria = categoriaFila
    const optimistic = { ...c, [key]: fecha, ...(!c.categoria ? { categoria: categoriaFila } : {}) }
    setCampanas(prev => prev.map(x => x.documentId === c.documentId ? optimistic : x))
    try {
      const updated = await updateCampana(c.documentId, payload)
      setCampanas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      toast.success(`Fecha asignada · ${c.unidadNegocio}`)
    } catch {
      setCampanas(prev => prev.map(x => x.documentId === c.documentId ? c : x))
      toast.error("Error al asignar fecha")
    }
  }

  if (loading) return <p className="text-sm text-slate-400 text-center py-16">Cargando...</p>

  const TABS = [
    { id: "mensual" as const, label: "Calendario mensual", icon: LayoutGrid },
    { id: "semanal" as const, label: "Calendario semanal", icon: CalendarDays },
    { id: "metricas" as const, label: "Métricas", icon: BarChart2 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Planeador de campañas</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">{campanas.length} campaña{campanas.length !== 1 ? "s" : ""}</p>
        </div>
        <button type="button" onClick={() => abrirNueva()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition">
          <Plus size={15} /> Nueva campaña
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit border border-slate-200 dark:border-slate-800">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "mensual" && <VistaCatalogo campanas={campanas} onEdit={abrirEditar} onDelete={eliminar} onNueva={() => abrirNueva()} />}
      {tab === "semanal" && (
        <VistaPlaneador campanas={campanas} onEdit={abrirEditar} onDelete={eliminar}
          onAgregar={opts => abrirNueva(opts)} onAsignarExistente={asignarExistente} />
      )}
      {tab === "metricas" && <VistaMetricas campanas={campanas} />}

      {modal && (
        <ModalCampana editando={editando} defaultCategoria={defOpts.categoria} defaultMes={defOpts.mes} defaultAnio={defOpts.anio} defaultFecha={defOpts.fecha}
          onGuardar={guardar} onEliminar={editando ? eliminarDesdeModal : undefined} onCerrar={() => setModal(false)} />
      )}
    </div>
  )
}
