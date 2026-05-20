"use client"

import { useState, useMemo } from "react"
import {
  Plus, Pencil, Trash2, X, Check, Search,
  Calendar, LayoutGrid, ChevronLeft, ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana, TipoCampana } from "@/types/campana"

// ─── Constants ────────────────────────────────────────────────────────────────

const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL  = MESES[new Date().getMonth()]
const SEMANAS     = [1, 2, 3, 4] as const
type NSemana      = typeof SEMANAS[number]

const FILAS_GRID = [
  { label: "MHS",   rowBg: "bg-blue-950/30",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/30"    },
  { label: "Store", rowBg: "bg-violet-950/30",  badge: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { label: "Extra", rowBg: "bg-amber-950/30",   badge: "bg-amber-500/15 text-amber-300 border-amber-500/30"  },
] as const

const _now       = new Date()
const ANIO_HOY   = _now.getFullYear()
const MES_HOY    = MESES[_now.getMonth()]
const SEMANA_HOY = Math.min(Math.ceil(_now.getDate() / 7), 4) as NSemana

const TIPO_FILTERS: Array<[TipoCampana | "", string]> = [
  ["", "Todas"],
  ["completa", "Completa"],
  ["titulos_extra", "Títulos extra"],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSemana(c: CampanaType, n: NSemana, k: "Titulo" | "Fecha") {
  return c[`semana${n}${k}` as keyof CampanaType] as string | null
}

function semanasLlenas(c: CampanaType) {
  return SEMANAS.filter(n => !!getSemana(c, n, "Titulo")).length
}

type Status = "actual" | "proxima" | "publicada"

function getStatus(c: CampanaType): Status {
  const mIdx = MESES.indexOf(c.mes)
  const mHoy = MESES.indexOf(MES_HOY)
  if (c.anio < ANIO_HOY || (c.anio === ANIO_HOY && mIdx < mHoy)) return "publicada"
  if (c.anio === ANIO_HOY && mIdx === mHoy && getSemana(c, SEMANA_HOY, "Titulo")) return "actual"
  return "proxima"
}

function emptyPayload(mes: MesCampana, anio: number, categoria: string | null): CampanaPayload {
  return {
    unidadNegocio: "", mes, anio, tipo: "completa", orden: 0,
    categoria, atributos: null, notas: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
  }
}

function payloadDe(c: CampanaType): CampanaPayload {
  return {
    unidadNegocio: c.unidadNegocio, mes: c.mes, anio: c.anio, tipo: c.tipo, orden: c.orden,
    categoria: c.categoria, atributos: c.atributos, notas: c.notas,
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

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function Dots({ c }: { c: CampanaType }) {
  return (
    <div className="flex gap-1">
      {SEMANAS.map(n => (
        <div key={n} className={`h-1.5 w-1.5 rounded-full ${getSemana(c, n, "Titulo") ? "bg-blue-400" : "bg-slate-700"}`} />
      ))}
    </div>
  )
}

function CategoriaBadge({ cat }: { cat: string | null }) {
  if (!cat) return null
  const cls = cat === "MHS"   ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : cat === "Store" ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
            : cat === "Extra" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
            : "bg-slate-700 text-slate-400 border-slate-600"
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>{cat}</span>
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

function CampanaCard({ c, onEdit, onDelete }: {
  c: CampanaType; onEdit: () => void; onDelete: () => void
}) {
  const llenas = semanasLlenas(c)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-blue-800/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 leading-snug truncate">{c.unidadNegocio || "Sin nombre"}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{c.mes} {c.anio}</p>
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

      <div className="flex gap-1.5 flex-wrap">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
          c.tipo === "completa"
            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
        }`}>
          {c.tipo === "completa" ? "Completa" : "Títulos extra"}
        </span>
        <CategoriaBadge cat={c.categoria} />
      </div>

      {c.notas && <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{c.notas}</p>}

      <div className="flex items-center justify-between mt-auto">
        <Dots c={c} />
        <span className={`text-[10px] font-mono ${llenas === 4 ? "text-emerald-400" : "text-slate-600"}`}>{llenas}/4</span>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalCampana({ editando, defaultCategoria, defaultMes, defaultAnio, onGuardar, onCerrar }: {
  editando: CampanaType | null
  defaultCategoria: string | null
  defaultMes: MesCampana
  defaultAnio: number
  onGuardar: (p: CampanaPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm]     = useState<CampanaPayload>(
    editando ? payloadDe(editando) : emptyPayload(defaultMes, defaultAnio, defaultCategoria)
  )
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    await onGuardar(form)
    setSaving(false)
  }

  const setS = (n: NSemana, k: string, v: string | null) =>
    setForm(f => ({ ...f, [`semana${n}${k}`]: v }))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{editando ? "Editar campaña" : "Nueva campaña"}</h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Nombre */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Nombre *</label>
            <input autoFocus value={form.unidadNegocio}
              onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
              placeholder="Ej. Campaña día de las madres..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Categoría</label>
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
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Tipo</label>
            <div className="flex gap-2">
              {(["completa", "titulos_extra"] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                    form.tipo === t
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}>
                  {t === "completa" ? "Completa" : "Títulos extra"}
                </button>
              ))}
            </div>
          </div>

          {/* Mes + Año */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Mes</label>
              <select title="Mes" value={form.mes}
                onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Año</label>
              <select title="Año" value={form.anio}
                onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Semanas */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-2">Semanas</label>
            <div className="space-y-2">
              {SEMANAS.map(n => (
                <div key={n} className="flex gap-2 items-center">
                  <span className="text-[10px] text-slate-600 w-16 shrink-0">Semana {n}</span>
                  <input
                    value={(form[`semana${n}Titulo` as keyof CampanaPayload] as string | null) ?? ""}
                    onChange={e => setS(n, "Titulo", e.target.value || null)}
                    placeholder={`Título semana ${n}...`}
                    className="flex-1 px-2 py-1.5 text-[11px] rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                  />
                  <input type="date" title={`Fecha semana ${n}`}
                    value={(form[`semana${n}Fecha` as keyof CampanaPayload] as string | null) ?? ""}
                    onChange={e => setS(n, "Fecha", e.target.value || null)}
                    className="w-28 px-2 py-1.5 text-[11px] rounded-lg border border-slate-700 bg-slate-800 text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Notas</label>
            <textarea value={form.notas ?? ""}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
              placeholder="Notas adicionales..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-y"
            />
          </div>
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

// ─── Tab: Catálogo ─────────────────────────────────────────────────────────────

function VistaCatalogo({ campanas, onEdit, onDelete, onNueva }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onDelete: (c: CampanaType) => void
  onNueva: () => void
}) {
  const [busqueda,   setBusqueda]   = useState("")
  const [filtroTipo, setFiltroTipo] = useState<TipoCampana | "">("")
  const [filtroCat,  setFiltroCat]  = useState("")

  const filtradas = useMemo(() =>
    campanas.filter(c => {
      const q = busqueda.toLowerCase()
      const matchB = !busqueda || c.unidadNegocio.toLowerCase().includes(q) || (c.categoria?.toLowerCase().includes(q) ?? false)
      const matchT = !filtroTipo || c.tipo === filtroTipo
      const matchC = !filtroCat  || c.categoria === filtroCat
      return matchB && matchT && matchC
    }),
  [campanas, busqueda, filtroTipo, filtroCat])

  const actuales   = filtradas.filter(c => getStatus(c) === "actual")
  const proximas   = filtradas.filter(c => getStatus(c) === "proxima")
  const publicadas = filtradas.filter(c => getStatus(c) === "publicada")

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar campaña..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {TIPO_FILTERS.map(([v, l]) => (
            <button key={v} type="button"
              onClick={() => setFiltroTipo(prev => prev === v ? "" : v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtroTipo === v
                  ? v === "completa"      ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-medium"
                  : v === "titulos_extra" ? "bg-amber-500/15 border-amber-500/30 text-amber-300 font-medium"
                                          : "bg-slate-700 border-slate-600 text-slate-200"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>{l}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-700" />
          {(["MHS", "Store", "Extra"] as const).map(cat => (
            <button key={cat} type="button"
              onClick={() => setFiltroCat(prev => prev === cat ? "" : cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtroCat === cat
                  ? cat === "MHS"   ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-medium"
                  : cat === "Store" ? "bg-violet-500/15 border-violet-500/30 text-violet-300 font-medium"
                                    : "bg-amber-500/15 border-amber-500/30 text-amber-300 font-medium"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500 text-sm">{busqueda || filtroTipo || filtroCat ? "Sin resultados" : "No hay campañas"}</p>
          {!busqueda && !filtroTipo && !filtroCat && (
            <button type="button" onClick={onNueva}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
              <Plus size={14} /> Crear primera campaña
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {actuales.length > 0 && (
            <div>
              <SectionHeader label="Semana actual" count={actuales.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {actuales.map(c => <CampanaCard key={c.documentId} c={c} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />)}
              </div>
            </div>
          )}
          {proximas.length > 0 && (
            <div>
              <SectionHeader label="Próximas" count={proximas.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {proximas.map(c => <CampanaCard key={c.documentId} c={c} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />)}
              </div>
            </div>
          )}
          {publicadas.length > 0 && (
            <div>
              <SectionHeader label="Publicadas" count={publicadas.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicadas.map(c => <CampanaCard key={c.documentId} c={c} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Planeador (grid MHS/Store/Extra × Semana 1-4) ──────────────────────

function VistaPlaneador({ campanas, onEdit, onAgregar }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onAgregar: (opts: { categoria: string; mes: MesCampana; anio: number }) => void
}) {
  const [mes,  setMes]  = useState<MesCampana>(MES_ACTUAL)
  const [anio, setAnio] = useState(ANIO_ACTUAL)

  const cambiarMes = (dir: -1 | 1) => {
    const idx = MESES.indexOf(mes)
    const n   = idx + dir
    if (n < 0)    { setMes(MESES[11]); setAnio(a => a - 1) }
    else if (n > 11) { setMes(MESES[0]);  setAnio(a => a + 1) }
    else setMes(MESES[n])
  }

  const delMes    = campanas.filter(c => c.mes === mes && c.anio === anio)
  const isHoyMes  = mes === MES_HOY && anio === ANIO_HOY

  return (
    <div>
      {/* Nav mes */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" title="Mes anterior" onClick={() => cambiarMes(-1)}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronLeft size={14} />
        </button>
        <h2 className="text-base font-semibold text-slate-200 min-w-[150px] text-center">{mes} {anio}</h2>
        <button type="button" title="Mes siguiente" onClick={() => cambiarMes(1)}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronRight size={14} />
        </button>
        <span className="text-[11px] text-slate-600">{delMes.length} campaña{delMes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-[88px_1fr_1fr_1fr_1fr] border-b border-slate-800 bg-slate-900/60">
            <div />
            {SEMANAS.map(n => {
              const esHoy = isHoyMes && n === SEMANA_HOY
              return (
                <div key={n} className={`px-3 py-2.5 border-l border-slate-800 text-center ${esHoy ? "bg-blue-500/5" : ""}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${esHoy ? "text-blue-400" : "text-slate-500"}`}>
                    Sem. {n}{esHoy && <span className="ml-1 text-[9px] normal-case text-blue-500/50">· hoy</span>}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Filas: MHS / Store / Extra */}
          {FILAS_GRID.map((fila, ri) => {
            const filaCampanas = delMes.filter(c => c.categoria === fila.label)
            return (
              <div key={fila.label}
                className={`grid grid-cols-[88px_1fr_1fr_1fr_1fr] ${ri < FILAS_GRID.length - 1 ? "border-b border-slate-800" : ""}`}>
                {/* Label fila */}
                <div className={`${fila.rowBg} border-r border-slate-800 flex items-center justify-center p-3 min-h-[90px]`}>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest select-none [writing-mode:vertical-rl] rotate-180">
                    {fila.label}
                  </span>
                </div>

                {/* Celdas semana */}
                {SEMANAS.map(n => {
                  const esHoy  = isHoyMes && n === SEMANA_HOY
                  const items  = filaCampanas.filter(c => !!getSemana(c, n, "Titulo"))
                  return (
                    <div key={n}
                      className={`border-l border-slate-800 p-2 flex flex-col gap-1.5 min-h-[90px] ${esHoy ? "bg-blue-500/5" : ""}`}>
                      {items.map(c => (
                        <button key={c.documentId} type="button" onClick={() => onEdit(c)}
                          className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 hover:border-blue-500/40 transition-colors">
                          <p className="text-[11px] font-medium text-slate-200 line-clamp-2 leading-snug">
                            {getSemana(c, n, "Titulo")}
                          </p>
                          {getSemana(c, n, "Fecha") && (
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {new Date(getSemana(c, n, "Fecha")! + "T00:00:00")
                                .toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </button>
                      ))}
                      <button type="button"
                        onClick={() => onAgregar({ categoria: fila.label, mes, anio })}
                        className="w-full px-2 py-1 rounded-lg border border-dashed border-slate-800 hover:border-blue-500/40 text-slate-700 hover:text-blue-500/60 text-[10px] flex items-center justify-center gap-1 transition-colors mt-auto">
                        <Plus size={9} /> Agregar
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function CampanasPlannerView() {
  const { campanas, setCampanas, loading } = useGetCampanas()
  const [tab,      setTab]      = useState<"catalogo" | "planeador">("catalogo")
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState<CampanaType | null>(null)
  const [defOpts,  setDefOpts]  = useState<{ categoria: string | null; mes: MesCampana; anio: number }>({
    categoria: null, mes: MES_ACTUAL, anio: ANIO_ACTUAL,
  })

  const abrirNueva = (opts?: Partial<typeof defOpts>) => {
    setEditando(null)
    setDefOpts({ categoria: null, mes: MES_ACTUAL, anio: ANIO_ACTUAL, ...opts })
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
        const nueva = await createCampana(payload)
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
          onAgregar={opts => abrirNueva(opts)}
        />
      )}

      {modal && (
        <ModalCampana
          editando={editando}
          defaultCategoria={defOpts.categoria}
          defaultMes={defOpts.mes}
          defaultAnio={defOpts.anio}
          onGuardar={guardar}
          onCerrar={() => setModal(false)}
        />
      )}
    </div>
  )
}
