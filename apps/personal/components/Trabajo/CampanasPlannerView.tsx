"use client"

import { useState, useMemo } from "react"
import {
  Plus, Pencil, Trash2, X, Check,
  Calendar, LayoutGrid, ChevronLeft, ChevronRight,
  FileText, Link2, Paperclip, Search,
} from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, AmbitoCampana, MESES, MesCampana, TipoCampana } from "@/types/campana"

// ─── Constants ────────────────────────────────────────────────────────────────

const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL  = MESES[new Date().getMonth()]
const SEMANAS     = [1, 2, 3, 4] as const
type NSemana      = typeof SEMANAS[number]

const _now       = new Date()
const ANIO_HOY   = _now.getFullYear()
const MES_HOY    = MESES[_now.getMonth()]
const MES_HOY_IDX = _now.getMonth()
const SEMANA_HOY = Math.min(Math.ceil(_now.getDate() / 7), 4) as NSemana


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

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0]
}

const HOY_YMD = toYMD(new Date())

const FILAS_GRID = [
  { label: "MHS",   rowBg: "bg-blue-950/30"   },
  { label: "Store", rowBg: "bg-violet-950/30"  },
  { label: "Extra", rowBg: "bg-amber-950/30"   },
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
      // Campaña con títulos: mostrar en su fecha exacta, o en el lunes de su semana si no tiene fecha
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
      // Sin títulos (creada desde planeador): solo mostrar si tiene semana1Fecha exacta
      const fecha = getSemana(c, 1, "Fecha")
      if (fecha && fecha === dayStr && c.unidadNegocio) {
        out.push({ campana: c, n: 1, titulo: c.unidadNegocio })
      }
    }
  }
  return out
}

// Catalog sections:  semanaActual | proximasMes | futureMeses[] | publicadas
function buildSections(campanas: CampanaType[]) {
  const semanaActual: CampanaType[]  = []
  const proximasMes: CampanaType[]   = []
  const publicadas:  CampanaType[]   = []
  const futureMap = new Map<string, { mes: MesCampana; anio: number; items: CampanaType[] }>()

  for (const c of campanas) {
    const mIdx = MESES.indexOf(c.mes)
    const isPast    = c.anio < ANIO_HOY || (c.anio === ANIO_HOY && mIdx < MES_HOY_IDX)
    const isCurrent = c.anio === ANIO_HOY && mIdx === MES_HOY_IDX

    if (isPast) {
      publicadas.push(c)
    } else if (isCurrent) {
      if (getSemana(c, SEMANA_HOY, "Titulo")) semanaActual.push(c)
      else proximasMes.push(c)
    } else {
      const key = `${c.anio}-${String(mIdx).padStart(2, "0")}`
      if (!futureMap.has(key)) futureMap.set(key, { mes: c.mes, anio: c.anio, items: [] })
      futureMap.get(key)!.items.push(c)
    }
  }

  const futureMeses = [...futureMap.values()].sort((a, b) => {
    if (a.anio !== b.anio) return a.anio - b.anio
    return MESES.indexOf(a.mes) - MESES.indexOf(b.mes)
  })

  return { semanaActual, proximasMes, futureMeses, publicadas }
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

function emptyPayload(mes: MesCampana, anio: number, categoria: string | null): CampanaPayload {
  return {
    unidadNegocio: "", mes, anio, tipo: "completa", orden: 0,
    categoria, atributos: null, notas: null, keyword: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
  }
}

function payloadDe(c: CampanaType): CampanaPayload {
  return {
    unidadNegocio: c.unidadNegocio, mes: c.mes, anio: c.anio, tipo: c.tipo, orden: c.orden,
    categoria: c.categoria, atributos: c.atributos, notas: c.notas, keyword: c.keyword,
    semana1Fecha: c.semana1Fecha, semana1Titulo: c.semana1Titulo,
    semana1Partes: c.semana1Partes, semana1Archivo: c.semana1Archivo,
    semana2Fecha: c.semana2Fecha, semana2Titulo: c.semana2Titulo,
    semana2Partes: c.semana2Partes, semana2Archivo: c.semana2Archivo,
    semana3Fecha: c.semana3Fecha, semana3Titulo: c.semana3Titulo,
    semana3Partes: c.semana3Partes, semana3Archivo: c.semana3Archivo,
    semana4Fecha: c.semana4Fecha, semana4Titulo: c.semana4Titulo,
    semana4Partes: c.semana4Partes, semana4Archivo: c.semana4Archivo,
  }
}

// ─── Small UI ─────────────────────────────────────────────────────────────────

function CategoriaBadge({ cat }: { cat: string | null }) {
  if (!cat) return null
  const cls = cat === "MHS"   ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : cat === "Store" ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
            : cat === "Extra" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
            : "bg-slate-700 text-slate-400 border-slate-600"
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>{cat}</span>
}

const CAT_CHIP: Record<string, { letter: string; bg: string; text: string }> = {
  MHS:   { letter: "M", bg: "bg-blue-500/20",   text: "text-blue-300"   },
  Store: { letter: "S", bg: "bg-violet-500/20", text: "text-violet-300" },
  Extra: { letter: "E", bg: "bg-amber-500/20",  text: "text-amber-300"  },
}

function CampanaChip({ titulo, categoria, fullWidth, archivos, onClick, onDelete }: {
  titulo: string; categoria: string | null; fullWidth?: boolean; archivos?: string[]
  onClick: () => void; onDelete?: () => void
}) {
  const cfg = (categoria && CAT_CHIP[categoria]) ?? { letter: "·", bg: "bg-slate-700", text: "text-slate-400" }
  const primerArchivo = archivos?.[0]
  return (
    <div
      onClick={onClick}
      className={`group/chip flex items-center h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 transition-colors overflow-hidden shrink-0 cursor-pointer ${fullWidth ? "w-full" : "w-[156px]"}`}>
      <span className={`flex items-center justify-center h-full w-7 shrink-0 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
        {cfg.letter}
      </span>
      <span className="text-[11px] text-slate-200 truncate px-2 flex-1 text-left leading-none">{titulo}</span>
      {primerArchivo && (
        <a
          href={primerArchivo}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title={`Abrir archivo${archivos && archivos.length > 1 ? ` (${archivos.length})` : ""}`}
          className="flex items-center justify-center h-full w-6 shrink-0 text-slate-500 hover:text-blue-400 transition">
          <Paperclip size={10} />
        </a>
      )}
      {onDelete && (
        <span
          role="button"
          onClick={e => { e.stopPropagation(); onDelete() }}
          title="Eliminar campaña"
          className="flex items-center justify-center h-full w-6 shrink-0 text-slate-600 hover:text-red-400 opacity-0 group-hover/chip:opacity-100 transition">
          <Trash2 size={10} />
        </span>
      )}
    </div>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] text-slate-600 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{count}</span>
      <div className="flex-1 border-t border-slate-800" />
    </div>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

const fmtFecha = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

function CampanaCard({ c, onEdit, onDelete }: {
  c: CampanaType; onEdit: () => void; onDelete: () => void
}) {
  const semanas = SEMANAS
    .map(n => ({ n, titulo: getSemana(c, n, "Titulo"), fecha: getSemana(c, n, "Fecha") }))
    .filter(s => !!s.titulo)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <CategoriaBadge cat={c.categoria} />
          <h3 className="text-sm font-semibold text-slate-100 truncate">{c.unidadNegocio || "Sin título"}</h3>
          {c.notas && <span className="text-[10px] text-slate-500 truncate">{c.notas}</span>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button type="button" onClick={onEdit} title="Editar"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Eliminar"
            className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Semanas */}
      {semanas.length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {semanas.map(({ n, titulo, fecha }) => (
            <div key={n} className="flex items-baseline gap-2">
              <span className="text-[9px] font-semibold text-slate-600 uppercase w-12 shrink-0">
                {fecha ? fmtFecha(fecha) : `Sem ${n}`}
              </span>
              <p className="text-xs text-slate-300 leading-snug truncate">{titulo}</p>
            </div>
          ))}
        </div>
      )}

      {/* Archivos */}
      {(c.semana1Archivo || c.semana2Archivo) && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-800/60">
          {c.semana1Archivo && (
            <a href={c.semana1Archivo} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition"
              onClick={e => e.stopPropagation()}>
              <FileText size={11} /> Borrador
            </a>
          )}
          {c.semana2Archivo && (
            <a href={c.semana2Archivo} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-400 transition"
              onClick={e => e.stopPropagation()}>
              <Link2 size={11} /> Figma
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalCampana({ editando, defaultCategoria, defaultMes, defaultAnio, defaultFecha, onGuardar, onCerrar }: {
  editando: CampanaType | null
  defaultCategoria: string | null
  defaultMes: MesCampana
  defaultAnio: number
  defaultFecha: string | null
  onGuardar: (p: CampanaPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm]     = useState<CampanaPayload>(() => {
    if (editando) return payloadDe(editando)
    const base = emptyPayload(defaultMes, defaultAnio, defaultCategoria)
    if (defaultFecha) base.semana1Fecha = defaultFecha
    return base
  })
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    await onGuardar(form)
    setSaving(false)
  }

  const field = (label: string, node: React.ReactNode, highlight = false) => (
    <div>
      <label className={`block mb-1 ${highlight ? "text-xs text-slate-200 font-semibold" : "text-[11px] text-slate-500"}`}>
        {highlight && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 mb-0.5 align-middle" />}
        {label}
      </label>
      {node}
    </div>
  )

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
  const inputHlCls = "w-full px-3 py-2 text-sm rounded-lg border border-blue-500/30 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500/60"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar campaña" : "Nueva campaña"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Título */}
          {field("Título *",
            <input autoFocus value={form.unidadNegocio}
              onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
              placeholder="Ej. Campaña Mayo 2026..."
              className={inputHlCls}
            />, true
          )}

          {/* Fecha */}
          {field("Fecha",
            <input type="date" title="Fecha de la campaña" value={form.semana1Fecha ?? ""}
              onChange={e => setForm(f => ({ ...f, semana1Fecha: e.target.value || null }))}
              className={inputCls}
            />
          )}

          {/* Unidad de negocio */}
          {field("Unidad de negocio",
            <div className="flex gap-2">
              {(["MHS", "Store", "Extra"] as const).map(cat => (
                <button key={cat} type="button"
                  onClick={() => setForm(f => ({ ...f, categoria: f.categoria === cat ? null : cat }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                    form.categoria === cat
                      ? cat === "MHS"   ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : cat === "Store" ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                                        : "bg-amber-600/20 border-amber-500/40 text-amber-300"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}>{cat}
                </button>
              ))}
            </div>
          )}

          {/* Categoría de producto */}
          {field("Categoría de producto",
            <input value={form.notas ?? ""}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
              placeholder="Ej. Temporada, Promo, Lanzamiento..."
              className={inputHlCls}
            />, true
          )}

          {/* Productos */}
          {field("Productos",
            <textarea value={form.atributos ?? ""}
              onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))}
              placeholder="Ej. PLC, HMI, Conveyor..."
              rows={3}
              className={`${inputHlCls} resize-y`}
            />, true
          )}

          {/* Keyword */}
          {field("Keyword",
            <input value={form.keyword ?? ""}
              onChange={e => setForm(f => ({ ...f, keyword: e.target.value || null }))}
              placeholder="Ej. PLC, HMI, sensores..."
              className={inputCls}
            />
          )}

          {/* Link borrador */}
          {field("Link de archivo borrador",
            <input value={form.semana1Archivo ?? ""}
              onChange={e => setForm(f => ({ ...f, semana1Archivo: e.target.value || null }))}
              placeholder="https://drive.google.com/..."
              className={inputCls}
            />
          )}

          {/* Link Figma */}
          {field("Link de archivo Figma",
            <input value={form.semana2Archivo ?? ""}
              onChange={e => setForm(f => ({ ...f, semana2Archivo: e.target.value || null }))}
              placeholder="https://figma.com/..."
              className={inputCls}
            />
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
            <Check size={14} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Catálogo — por mes y semana ─────────────────────────────────────────

function semanaLabel(semanaStart: Date, semanaEnd: Date, n: NSemana): string {
  const hoy        = new Date(); hoy.setHours(0,0,0,0)
  const wHoy       = weekStart(hoy)
  const wSiguiente = addDays(wHoy, 7)

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("es-MX", opts)

  if (toYMD(semanaStart) === toYMD(wHoy)) {
    return `Semana actual ${fmt(semanaStart,{day:"numeric"})}-${fmt(semanaEnd,{day:"numeric", month:"short"})}`
  }
  if (toYMD(semanaStart) === toYMD(wSiguiente)) {
    return `Semana siguiente ${fmt(semanaStart,{day:"numeric"})}-${fmt(semanaEnd,{day:"numeric", month:"short"})}`
  }
  return `Semana ${n}`
}

function MesGroup({ mes, anio, campanas, onEdit, onDelete, onNueva }: {
  mes: MesCampana; anio: number; campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onDelete: (c: CampanaType) => void
  onNueva: (opts: { mes: MesCampana; anio: number }) => void
}) {
  const isCurrentMonth = anio === ANIO_HOY && MESES.indexOf(mes) === MES_HOY_IDX
  const [collapsed, setCollapsed] = useState(false)

  const mesIdx   = MESES.indexOf(mes)
  const firstMon = getFirstMonday(anio, mesIdx)
  const hoy      = new Date(); hoy.setHours(0,0,0,0)

  const objetivoKey = `campana-objetivo-${mes}-${anio}`
  const [objetivo,        setObjetivo]        = useState(() => (typeof window !== "undefined" ? localStorage.getItem(objetivoKey) ?? "" : ""))
  const [editingObjetivo, setEditingObjetivo] = useState(false)
  const [objetivoDraft,   setObjetivoDraft]   = useState("")

  const saveObjetivo = () => {
    const val = objetivoDraft.trim()
    setObjetivo(val)
    localStorage.setItem(objetivoKey, val)
    setEditingObjetivo(false)
  }

  const sinTitulosDocIds = new Set(
    campanas
      .filter(c => !SEMANAS.some(n => !!getSemana(c, n, "Titulo")))
      .map(c => c.documentId)
  )

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-800/40 transition">
        <span className="text-sm font-bold text-slate-200">{mes} {anio}</span>
        <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
      </button>

      {!collapsed && (
        <>
        {/* Objetivo del mes */}
        <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-2 min-h-[36px]">
          {editingObjetivo ? (
            <input
              autoFocus
              value={objetivoDraft}
              onChange={e => setObjetivoDraft(e.target.value)}
              onBlur={saveObjetivo}
              onKeyDown={e => { if (e.key === "Enter") saveObjetivo(); if (e.key === "Escape") setEditingObjetivo(false) }}
              placeholder="Escribe el objetivo del mes..."
              className="flex-1 text-xs bg-transparent border-b border-slate-600 text-slate-200 placeholder:text-slate-600 outline-none py-0.5"
            />
          ) : objetivo ? (
            <button type="button" onClick={() => { setObjetivoDraft(objetivo); setEditingObjetivo(true) }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition text-left group/obj">
              <span className="text-slate-600">🎯</span>
              <span>{objetivo}</span>
              <Pencil size={10} className="opacity-0 group-hover/obj:opacity-100 text-slate-600 shrink-0" />
            </button>
          ) : (
            <button type="button" onClick={() => { setObjetivoDraft(""); setEditingObjetivo(true) }}
              className="text-[11px] text-slate-700 hover:text-slate-500 transition flex items-center gap-1">
              <Plus size={10} /> Objetivo del mes
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800/50">
          {SEMANAS.map(n => {
            const sStart = addDays(firstMon, (n - 1) * 7)
            const sEnd   = addDays(sStart, 6)

            // Para el mes actual, ocultar semanas completamente pasadas
            if (isCurrentMonth && sEnd < hoy) return null

            const label = semanaLabel(sStart, sEnd, n)

            // Campañas con título en esta semana
            const conTitulo = campanas
              .filter(c => !!getSemana(c, n, "Titulo"))
              .map(c => ({ c, titulo: getSemana(c, n, "Titulo")! }))

            // Campañas sin título: mostrar en la semana que coincide con su fecha, semana 1 como fallback
            const sEndStr   = toYMD(sEnd)
            const sStartStr = toYMD(sStart)
            const sinTitulo = campanas
              .filter(c => sinTitulosDocIds.has(c.documentId))
              .filter(c => c.semana1Fecha
                ? c.semana1Fecha >= sStartStr && c.semana1Fecha <= sEndStr
                : n === 1)
              .map(c => ({ c, titulo: c.unidadNegocio }))

            const items = [...conTitulo, ...sinTitulo]

            return (
              <div key={n} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                <span className="text-[11px] text-slate-500 w-44 shrink-0 leading-snug">{label}</span>
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  {items.map(({ c, titulo }) => (
                    <CampanaChip key={`${c.documentId}-${n}`} titulo={titulo} categoria={c.categoria} archivos={[c.semana1Archivo, c.semana2Archivo, c.semana3Archivo, c.semana4Archivo].filter(Boolean) as string[]} onClick={() => onEdit(c)} onDelete={() => onDelete(c)} />
                  ))}
                </div>
                <button type="button" title="Agregar campaña" onClick={() => onNueva({ mes, anio })}
                  className="flex items-center justify-center h-7 w-7 rounded-lg border border-dashed border-slate-700 hover:border-blue-500/40 text-slate-600 hover:text-blue-400 transition-colors shrink-0">
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
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onDelete: (c: CampanaType) => void
  onNueva: () => void
}) {
  const grupos = useMemo(() => {
    const map = new Map<string, { mes: MesCampana; anio: number; items: CampanaType[] }>()
    campanas.forEach(c => {
      const key = `${c.anio}-${String(MESES.indexOf(c.mes)).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, { mes: c.mes, anio: c.anio, items: [] })
      map.get(key)!.items.push(c)
    })
    const nowKey = `${ANIO_HOY}-${String(MES_HOY_IDX).padStart(2, "0")}`
    return [...map.entries()]
      .sort(([a], [b]) => {
        const aFut = a >= nowKey; const bFut = b >= nowKey
        if (aFut && !bFut) return -1
        if (!aFut && bFut) return 1
        return aFut ? a.localeCompare(b) : b.localeCompare(a)
      })
      .map(([, v]) => v)
  }, [campanas])

  if (campanas.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm mb-3">No hay campañas</p>
        <button type="button" onClick={onNueva}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition">
          <Plus size={14} /> Crear primera campaña
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {grupos.map(({ mes, anio, items }) => (
        <MesGroup
          key={`${mes}-${anio}`}
          mes={mes} anio={anio} campanas={items}
          onEdit={onEdit}
          onDelete={onDelete}
          onNueva={({ mes: m, anio: a }) => {
            onNueva()
          }}
        />
      ))}
    </div>
  )
}

// ─── Popup picker campaña existente ──────────────────────────────────────────

function PopupAsignar({ dayStr, categoria, campanas, onNueva, onAsignar, onClose }: {
  dayStr:    string
  categoria: string
  campanas:  CampanaType[]
  onNueva:   () => void
  onAsignar: (c: CampanaType, semanaNum: NSemana) => void
  onClose:   () => void
}) {
  const [busq, setBusq] = useState("")

  const mes  = MESES[new Date(dayStr + "T00:00:00").getMonth()]
  const anio = new Date(dayStr + "T00:00:00").getFullYear()
  const semanaNum = Math.min(Math.ceil(new Date(dayStr + "T00:00:00").getDate() / 7), 4) as NSemana

  const opciones = useMemo(() => {
    const q = busq.toLowerCase().trim()
    return campanas
      .filter(c => c.mes === mes && c.anio === anio)
      .filter(c => !c.categoria || c.categoria === categoria)
      .filter(c => !q || c.unidadNegocio.toLowerCase().includes(q) || (c.notas ?? "").toLowerCase().includes(q))
  }, [campanas, mes, anio, busq, categoria])

  const fmtDia = new Date(dayStr + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-100">Agregar al planeador</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{fmtDia} · {categoria} · Semana {semanaNum}</p>
          </div>
          <button type="button" title="Cerrar" onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <button type="button" onClick={() => { onClose(); onNueva() }}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition mb-3">
            <Plus size={14} /> Nueva campaña
          </button>

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
            <input value={busq} onChange={e => setBusq(e.target.value)}
              placeholder={`Buscar en ${mes} ${anio}…`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 placeholder:text-slate-600 outline-none focus:border-slate-600 transition" />
          </div>

          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">O elige del catálogo ({opciones.length})</p>
        </div>

        <div className="max-h-56 overflow-y-auto px-4 pb-3 space-y-1">
          {opciones.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-4">Sin campañas en {mes} {anio}</p>
          ) : (
            opciones.map(c => {
              const semanaFechaActual = c[`semana${semanaNum}Fecha` as keyof CampanaType] as string | null
              return (
                <button key={c.documentId} type="button" onClick={() => onAsignar(c, semanaNum)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition text-left group">
                  <CategoriaBadge cat={c.categoria} />
                  <span className="flex-1 text-xs text-slate-200 truncate">{c.unidadNegocio || "Sin título"}</span>
                  {semanaFechaActual ? (
                    <span className="text-[9px] text-amber-500 shrink-0">↺ reemplaza fecha</span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 shrink-0 opacity-0 group-hover:opacity-100">+ asignar</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Planeador — calendario semanal por día ──────────────────────────────

function VistaPlaneador({ campanas, onEdit, onDelete, onAgregar, onAsignarExistente }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onDelete: (c: CampanaType) => void
  onAgregar: (opts: { categoria: string; mes: MesCampana; anio: number; fecha: string }) => void
  onAsignarExistente: (c: CampanaType, fecha: string, semanaNum: NSemana, categoriaFila: string) => Promise<void>
}) {
  const [wStart, setWStart] = useState(() => weekStart(new Date()))
  const [picker, setPicker] = useState<{ dayStr: string; categoria: string } | null>(null)

  const days   = Array.from({ length: 5 }, (_, i) => addDays(wStart, i))
  const wEnd   = addDays(wStart, 6)
  const isHoy  = (d: Date) => toYMD(d) === HOY_YMD

  const weekLabel = (() => {
    const s = wStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    const e = wEnd.toLocaleDateString("es-MX",   { day: "numeric", month: "short", year: "numeric" })
    return `${s} – ${e}`
  })()

  const prevWeek = () => setWStart(d => addDays(d, -7))
  const nextWeek = () => setWStart(d => addDays(d, +7))

  return (
    <div>
      {/* Nav semana */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" title="Semana anterior" onClick={prevWeek}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-slate-200 min-w-[220px] text-center">{weekLabel}</span>
        <button type="button" title="Semana siguiente" onClick={nextWeek}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronRight size={14} />
        </button>
        <button type="button" onClick={() => setWStart(weekStart(new Date()))}
          className="text-[11px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition ml-1">
          Hoy
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <div className="min-w-[860px]">
          {/* Cabecera días */}
          <div className="grid grid-cols-[72px_repeat(5,1fr)] border-b border-slate-800 bg-slate-900/60">
            <div />
            {days.map((d, i) => (
              <div key={i} className={`px-2 py-2.5 border-l border-slate-800 text-center ${isHoy(d) ? "bg-blue-500/5" : ""}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isHoy(d) ? "text-blue-400" : "text-slate-500"}`}>
                  {DIAS_ES[i]}
                </p>
                <p className={`text-[12px] font-medium mt-0.5 ${isHoy(d) ? "text-blue-300" : "text-slate-400"}`}>
                  {d.toLocaleDateString("es-MX", { day: "numeric" })}
                </p>
                <p className="text-[9px] text-slate-600">
                  {d.toLocaleDateString("es-MX", { month: "short" })}
                </p>
              </div>
            ))}
          </div>

          {/* Filas MHS / Store / Extra */}
          {FILAS_GRID.map((fila, ri) => (
            <div key={fila.label}
              className={`grid grid-cols-[72px_repeat(5,1fr)] ${ri < FILAS_GRID.length - 1 ? "border-b border-slate-800" : ""}`}>
              <div className={`${fila.rowBg} border-r border-slate-800 flex items-center justify-center p-2 min-h-[88px]`}>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                  {fila.label}
                </span>
              </div>
              {days.map((day, di) => {
                const dayStr = toYMD(day)
                const items  = getDiaItems(campanas, dayStr, fila.label)
                return (
                  <div key={di}
                    className={`border-l border-slate-800 p-1.5 flex flex-col gap-1 min-h-[88px] min-w-0 overflow-hidden ${isHoy(day) ? "bg-blue-500/5" : ""}`}>
                    {items.map(({ campana, n, titulo }) => (
                      <CampanaChip key={`${campana.documentId}-${n}`} titulo={titulo} categoria={campana.categoria} fullWidth archivos={[campana.semana1Archivo, campana.semana2Archivo, campana.semana3Archivo, campana.semana4Archivo].filter(Boolean) as string[]} onClick={() => onEdit(campana)} onDelete={() => onDelete(campana)} />
                    ))}
                    <button type="button"
                      onClick={() => setPicker({ dayStr: toYMD(day), categoria: fila.label })}
                      className="w-full py-0.5 rounded border border-dashed border-slate-800 hover:border-blue-500/40 text-slate-700 hover:text-blue-500/60 text-[9px] flex items-center justify-center gap-0.5 transition-colors mt-auto shrink-0">
                      <Plus size={8} /> Agregar
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-700 mt-3">
        Campañas con fecha exacta aparecen en su día. Sin fecha, se posicionan el lunes de su semana dentro del mes.
      </p>

      {picker && (
        <PopupAsignar
          dayStr={picker.dayStr}
          categoria={picker.categoria}
          campanas={campanas}
          onNueva={() => onAgregar({ categoria: picker.categoria, mes: MESES[new Date(picker.dayStr + "T00:00:00").getMonth()], anio: new Date(picker.dayStr + "T00:00:00").getFullYear(), fecha: picker.dayStr })}
          onAsignar={(c, semanaNum) => { onAsignarExistente(c, picker.dayStr, semanaNum, picker.categoria); setPicker(null) }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function CampanasPlannerView({ ambito = "trabajo" }: { ambito?: AmbitoCampana }) {
  const { campanas, setCampanas, loading } = useGetCampanas(ambito)
  const [tab,      setTab]      = useState<"catalogo" | "planeador">("catalogo")
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState<CampanaType | null>(null)
  const [defOpts,  setDefOpts]  = useState<{ categoria: string | null; mes: MesCampana; anio: number; fecha: string | null }>({
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
        const nueva = await createCampana({ ...payload, ambito })
        setCampanas(prev => [nueva, ...prev])
        toast.success("Campaña creada")
      }
      setModal(false)
    } catch {
      toast.error("Error al guardar")
    }
  }

  const eliminar = async (c: CampanaType) => {
    if (!confirm(`¿Eliminar "${c.unidadNegocio}"?`)) return
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const asignarExistente = async (c: CampanaType, fecha: string, _semanaNum: NSemana, categoriaFila: string) => {
    const semanaTarget = SEMANAS.find(n => !!getSemana(c, n, "Titulo")) ?? 1
    const key = `semana${semanaTarget}Fecha` as keyof CampanaPayload
    const payload: Partial<CampanaPayload> = { [key]: fecha }
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

  if (loading) return <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Planeador de campañas</h1>
          <p className="text-sm text-slate-500">{campanas.length} campaña{campanas.length !== 1 ? "s" : ""}</p>
        </div>
        <button type="button" onClick={() => abrirNueva()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
          <Plus size={15} /> Nueva campaña
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
        <button type="button" onClick={() => setTab("catalogo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "catalogo" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}>
          <LayoutGrid size={14} /> Catálogo
        </button>
        <button type="button" onClick={() => setTab("planeador")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "planeador" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}>
          <Calendar size={14} /> Planeador
        </button>
      </div>

      {tab === "catalogo" ? (
        <VistaCatalogo campanas={campanas} onEdit={abrirEditar} onDelete={eliminar} onNueva={() => abrirNueva()} />
      ) : (
        <VistaPlaneador
          campanas={campanas}
          onEdit={abrirEditar}
          onDelete={eliminar}
          onAgregar={opts => abrirNueva(opts)}
          onAsignarExistente={asignarExistente}
        />
      )}

      {modal && (
        <ModalCampana
          editando={editando}
          defaultCategoria={defOpts.categoria}
          defaultMes={defOpts.mes}
          defaultAnio={defOpts.anio}
          defaultFecha={defOpts.fecha}
          onGuardar={guardar}
          onCerrar={() => setModal(false)}
        />
      )}
    </div>
  )
}
