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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL  = MESES[new Date().getMonth()]
const SEMANAS     = [1, 2, 3, 4] as const
type NSemana      = typeof SEMANAS[number]

function getSemana(c: CampanaType, n: NSemana, k: "Titulo" | "Fecha" | "Partes" | "Archivo") {
  return c[`semana${n}${k}` as keyof CampanaType] as string | null
}

function semanasLlenas(c: CampanaType) {
  return SEMANAS.filter(n => !!getSemana(c, n, "Titulo")).length
}

function emptyPayload(mes: MesCampana = MES_ACTUAL, anio = ANIO_ACTUAL): CampanaPayload {
  return {
    unidadNegocio: "", mes, anio, tipo: "completa", orden: 0,
    categoria: null, atributos: null, notas: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
  }
}

function payloadDe(c: CampanaType): CampanaPayload {
  return {
    unidadNegocio: c.unidadNegocio, mes: c.mes, anio: c.anio,
    tipo: c.tipo, orden: c.orden,
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

// ─── Indicador de semanas ─────────────────────────────────────────────────────

function DotsIndicador({ campana }: { campana: CampanaType }) {
  return (
    <div className="flex gap-1">
      {SEMANAS.map(n => (
        <div
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${getSemana(campana, n, "Titulo") ? "bg-blue-400" : "bg-slate-700"}`}
        />
      ))}
    </div>
  )
}

// ─── Tarjeta de campaña (como RecetaCard) ─────────────────────────────────────

function CampanaCard({ c, onEdit, onDelete }: {
  c: CampanaType
  onEdit: () => void
  onDelete: () => void
}) {
  const llenas = semanasLlenas(c)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-blue-800/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 leading-snug truncate">
            {c.unidadNegocio || "Sin nombre"}
          </h3>
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
        {c.categoria && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-violet-500/15 text-violet-300 border-violet-500/30">
            {c.categoria}
          </span>
        )}
      </div>

      {c.notas && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 whitespace-pre-wrap">{c.notas}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <DotsIndicador campana={c} />
        <span className={`text-[10px] font-mono ${llenas === 4 ? "text-emerald-400" : "text-slate-600"}`}>
          {llenas}/4 semanas
        </span>
      </div>
    </div>
  )
}

// ─── Modal crear / editar campaña ─────────────────────────────────────────────

function ModalCampana({ editando, onGuardar, onCerrar }: {
  editando: CampanaType | null
  onGuardar: (payload: CampanaPayload) => Promise<void>
  onCerrar: () => void
}) {
  const [form, setForm]     = useState<CampanaPayload>(editando ? payloadDe(editando) : emptyPayload())
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("La unidad de negocio es obligatoria"); return }
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
          <h2 className="text-base font-semibold text-slate-100">
            {editando ? "Editar campaña" : "Nueva campaña"}
          </h2>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Unidad de negocio */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Unidad de negocio *</label>
            <input
              autoFocus
              value={form.unidadNegocio}
              onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
              placeholder="Miracles, Mkt team..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
            />
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

          {/* Categoría */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Categoría (opcional)</label>
            <input
              value={form.categoria ?? ""}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}
              placeholder="Joyería, Promo, Moda..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
            />
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
                  <input
                    type="date"
                    title={`Fecha semana ${n}`}
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
            <label className="block text-[11px] text-slate-500 mb-1">Notas (opcional)</label>
            <textarea
              value={form.notas ?? ""}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
              placeholder="Notas adicionales, atributos, referencias..."
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

// ─── Tab: Catálogo (como recetario) ──────────────────────────────────────────

function VistaCatalogo({ campanas, onEdit, onDelete, onNueva }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
  onDelete: (c: CampanaType) => void
  onNueva: () => void
}) {
  const [busqueda,   setBusqueda]   = useState("")
  const [filtroTipo, setFiltroTipo] = useState<TipoCampana | "">("")

  const filtradas = useMemo(() =>
    campanas.filter(c => {
      const q = busqueda.toLowerCase()
      const matchB = !busqueda
        || c.unidadNegocio.toLowerCase().includes(q)
        || (c.categoria?.toLowerCase().includes(q) ?? false)
      const matchT = !filtroTipo || c.tipo === filtroTipo
      return matchB && matchT
    }),
  [campanas, busqueda, filtroTipo])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar campaña..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {([["", "Todas"], ["completa", "Completa"], ["titulos_extra", "Títulos extra"]] as const).map(([val, label]) => (
            <button key={val} type="button"
              onClick={() => setFiltroTipo(filtroTipo === val ? "" : val as TipoCampana | "")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtroTipo === val
                  ? val === "completa"
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-medium"
                    : val === "titulos_extra"
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300 font-medium"
                      : "bg-slate-700 border-slate-600 text-slate-200"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500 text-sm">
            {busqueda || filtroTipo ? "Sin resultados" : "No hay campañas guardadas"}
          </p>
          {!busqueda && !filtroTipo && (
            <button type="button" onClick={onNueva}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
              <Plus size={14} /> Crear primera campaña
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(c => (
            <CampanaCard key={c.documentId} c={c}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Planeador mensual ───────────────────────────────────────────────────

function VistaPlaneador({ campanas, onEdit }: {
  campanas: CampanaType[]
  onEdit: (c: CampanaType) => void
}) {
  const [mes,  setMes]  = useState<MesCampana>(MES_ACTUAL)
  const [anio, setAnio] = useState(ANIO_ACTUAL)

  const cambiarMes = (dir: -1 | 1) => {
    const idx = MESES.indexOf(mes)
    const n   = idx + dir
    if (n < 0)   { setMes(MESES[11]); setAnio(a => a - 1) }
    else if (n > 11) { setMes(MESES[0]);  setAnio(a => a + 1) }
    else setMes(MESES[n])
  }

  const delMes = campanas.filter(c => c.mes === mes && c.anio === anio)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button type="button" title="Mes anterior" onClick={() => cambiarMes(-1)}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronLeft size={14} />
        </button>
        <h2 className="text-base font-semibold text-slate-200 min-w-[150px] text-center">
          {mes} {anio}
        </h2>
        <button type="button" title="Mes siguiente" onClick={() => cambiarMes(1)}
          className="h-8 w-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 transition">
          <ChevronRight size={14} />
        </button>
        <span className="text-[11px] text-slate-600">
          {delMes.length} campaña{delMes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {delMes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-600 text-sm">Sin campañas en {mes} {anio}</p>
          <p className="text-slate-700 text-xs mt-1">Crea una campaña en el catálogo y asígnala a este mes</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] gap-2 mb-2">
              <div />
              {SEMANAS.map(n => (
                <div key={n} className="text-center">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Semana {n}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {delMes.map(c => (
                <div key={c.documentId} className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] gap-2 items-start">
                  <div className="flex flex-col gap-1 pt-2 pr-2">
                    <p className="text-[12px] font-semibold text-slate-200 leading-tight truncate">
                      {c.unidadNegocio || "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        c.tipo === "completa"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }`}>
                        {c.tipo === "completa" ? "completa" : "extra"}
                      </span>
                      <button type="button" onClick={() => onEdit(c)} title="Editar"
                        className="text-slate-600 hover:text-slate-400 transition-colors">
                        <Pencil size={10} />
                      </button>
                    </div>
                    {c.categoria && (
                      <p className="text-[10px] text-slate-600">{c.categoria}</p>
                    )}
                  </div>

                  {SEMANAS.map(n => {
                    const titulo = getSemana(c, n, "Titulo")
                    const fecha  = getSemana(c, n, "Fecha")
                    return (
                      <button key={n} type="button" onClick={() => onEdit(c)}
                        className={`min-h-[64px] rounded-lg border p-2 text-left w-full transition-all ${
                          titulo
                            ? "border-slate-700/50 bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/40"
                            : "border-dashed border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5"
                        }`}>
                        {titulo ? (
                          <>
                            <p className="text-[11px] font-medium text-slate-200 leading-snug line-clamp-2">{titulo}</p>
                            {fecha && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
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

  const abrirNueva = () => { setEditando(null); setModal(true) }
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
    if (!confirm(`¿Eliminar campaña "${c.unidadNegocio}"?`)) return
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Campaña eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 text-center py-16">Cargando campañas...</p>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Planeador de campañas</h1>
          <p className="text-sm text-slate-500">
            {campanas.length} campaña{campanas.length !== 1 ? "s" : ""} registrada{campanas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button type="button" onClick={abrirNueva}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
          <Plus size={15} /> Nueva campaña
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
        <button type="button" onClick={() => setTab("catalogo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "catalogo" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
          }`}>
          <LayoutGrid size={14} /> Catálogo
        </button>
        <button type="button" onClick={() => setTab("planeador")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "planeador" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
          }`}>
          <Calendar size={14} /> Planeador
        </button>
      </div>

      {/* Contenido */}
      {tab === "catalogo" ? (
        <VistaCatalogo
          campanas={campanas}
          onEdit={abrirEditar}
          onDelete={eliminar}
          onNueva={abrirNueva}
        />
      ) : (
        <VistaPlaneador
          campanas={campanas}
          onEdit={abrirEditar}
        />
      )}

      {/* Modal crear / editar */}
      {modal && (
        <ModalCampana
          editando={editando}
          onGuardar={guardar}
          onCerrar={() => setModal(false)}
        />
      )}
    </div>
  )
}
