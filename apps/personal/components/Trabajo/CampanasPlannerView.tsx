"use client"

import { useState, useMemo } from "react"
import {
  Plus, Pencil, Trash2, X, Check, Search,
  Calendar, LayoutGrid, ChevronLeft, ChevronRight,
  FileText, Link2,
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

const _now       = new Date()
const ANIO_HOY   = _now.getFullYear()
const MES_HOY    = MESES[_now.getMonth()]
const MES_HOY_IDX = _now.getMonth()
const SEMANA_HOY = Math.min(Math.ceil(_now.getDate() / 7), 4) as NSemana

const TIPO_FILTERS: Array<[TipoCampana | "", string]> = [
  ["", "Todas"],
  ["completa", "Completa"],
  ["titulos_extra", "Títulos extra"],
]

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getSemana(c: CampanaType, n: NSemana, k: "Titulo" | "Fecha") {
  return c[`semana${n}${k}` as keyof CampanaType] as string | null
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

// ─── Small UI ─────────────────────────────────────────────────────────────────

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
    if (!form.unidadNegocio.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    await onGuardar(form)
    setSaving(false)
  }

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
      {node}
    </div>
  )

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"

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
              className={inputCls}
            />
          )}

          {/* Productos */}
          {field("Productos",
            <textarea value={form.atributos ?? ""}
              onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))}
              placeholder="Ej. PLC, HMI, Conveyor..."
              rows={3}
              className={`${inputCls} resize-y`}
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

// ─── Tab: Catálogo — secciones temporales ─────────────────────────────────────

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

  const { semanaActual, proximasMes, futureMeses, publicadas } = useMemo(
    () => buildSections(filtradas),
    [filtradas],
  )

  const Grid = ({ items }: { items: CampanaType[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(c => (
        <CampanaCard key={c.documentId} c={c} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
      ))}
    </div>
  )

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

      {/* Secciones */}
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
          {semanaActual.length > 0 && (
            <div>
              <SectionHeader label={`Semana actual (sem. ${SEMANA_HOY} de ${MES_HOY})`} count={semanaActual.length} />
              <Grid items={semanaActual} />
            </div>
          )}
          {proximasMes.length > 0 && (
            <div>
              <SectionHeader label={`Próximas de ${MES_HOY}`} count={proximasMes.length} />
              <Grid items={proximasMes} />
            </div>
          )}
          {futureMeses.map(({ mes, anio, items }) => (
            <div key={`${mes}-${anio}`}>
              <SectionHeader label={`${mes} ${anio}`} count={items.length} />
              <Grid items={items} />
            </div>
          ))}
          {publicadas.length > 0 && (
            <div>
              <SectionHeader label="Publicadas" count={publicadas.length} />
              <div className="opacity-60">
                <Grid items={publicadas} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Planeador — filas por semana dentro del mes ─────────────────────────

function VistaPlaneador({ campanas, onEdit, onAgregar }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onAgregar: (opts: { mes: MesCampana; anio: number }) => void
}) {
  const [mesIdx, setMesIdx] = useState(MES_HOY_IDX)
  const [anio,   setAnio]   = useState(ANIO_ACTUAL)

  const mes = MESES[mesIdx]

  const prevMes = () => {
    if (mesIdx === 0) { setMesIdx(11); setAnio(a => a - 1) }
    else setMesIdx(m => m - 1)
  }
  const nextMes = () => {
    if (mesIdx === 11) { setMesIdx(0); setAnio(a => a + 1) }
    else setMesIdx(m => m + 1)
  }

  const delMes = useMemo(
    () => campanas.filter(c => c.mes === mes && c.anio === anio),
    [campanas, mes, anio],
  )

  return (
    <div>
      {/* Navegación de mes */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" title="Mes anterior" onClick={prevMes}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-slate-200 min-w-[160px] text-center capitalize">
          {mes} {anio}
        </span>
        <button type="button" title="Mes siguiente" onClick={nextMes}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronRight size={14} />
        </button>
        <button type="button"
          onClick={() => { setMesIdx(MES_HOY_IDX); setAnio(ANIO_ACTUAL) }}
          className="text-[11px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition ml-1">
          Hoy
        </button>
      </div>

      {/* Filas por semana */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {SEMANAS.map((n, i) => {
          const items = delMes
            .filter(c => !!getSemana(c, n, "Titulo"))
            .map(c => ({ campana: c, titulo: getSemana(c, n, "Titulo")!, fecha: getSemana(c, n, "Fecha") }))

          const fechaRef = items.find(it => it.fecha)?.fecha

          const esActual = anio === ANIO_HOY && mes === MES_HOY && n === SEMANA_HOY

          return (
            <div key={n}
              className={[
                "flex gap-0 min-h-[64px]",
                i < SEMANAS.length - 1 ? "border-b border-slate-800" : "",
                esActual ? "bg-blue-500/5" : "",
              ].join(" ")}
            >
              {/* Label semana */}
              <div className={`w-24 shrink-0 flex flex-col justify-center px-4 py-3 border-r border-slate-800 ${esActual ? "bg-blue-500/10" : "bg-slate-900/40"}`}>
                <p className={`text-xs font-semibold ${esActual ? "text-blue-400" : "text-slate-500"}`}>
                  Semana {n}
                </p>
                {fechaRef && (
                  <p className="text-[10px] text-slate-600 mt-0.5">{fmtFecha(fechaRef)}</p>
                )}
              </div>

              {/* Campañas de la semana */}
              <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-3">
                {items.map(({ campana, titulo }) => (
                  <button
                    key={campana.documentId}
                    type="button"
                    onClick={() => onEdit(campana)}
                    className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-blue-500/40 transition-colors max-w-xs text-left"
                  >
                    <CategoriaBadge cat={campana.categoria} />
                    <span className="text-xs text-slate-200 truncate leading-none">{titulo}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onAgregar({ mes, anio })}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-800 hover:border-blue-500/30 text-slate-700 hover:text-blue-500/70 text-xs transition-colors"
                >
                  <Plus size={11} /> Agregar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {delMes.length === 0 && (
        <p className="text-xs text-slate-600 text-center mt-4">
          Sin campañas en {mes} {anio}
        </p>
      )}
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
          onAgregar={({ mes, anio }) => abrirNueva({ mes, anio })}
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
