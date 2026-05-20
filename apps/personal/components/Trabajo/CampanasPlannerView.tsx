"use client"

import { useState, useMemo } from "react"
import { Plus, X, Check, ExternalLink, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana } from "@/types/campana"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL  = MESES[new Date().getMonth()]
const SEMANAS     = [1, 2, 3, 4] as const
type NSemana      = typeof SEMANAS[number]

function semVal(c: CampanaType, n: NSemana, k: "Titulo" | "Fecha" | "Partes" | "Archivo") {
  return c[`semana${n}${k}` as keyof CampanaType] as string | null
}

function semanasLlenas(c: CampanaType) {
  return SEMANAS.filter(n => !!semVal(c, n, "Titulo")).length
}

function emptyPayload(mes: MesCampana, anio: number, unidad = ""): CampanaPayload {
  return {
    unidadNegocio: unidad, mes, anio, tipo: "completa", orden: 0,
    categoria: null, atributos: null, notas: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
  }
}

// ─── Indicador de semanas ─────────────────────────────────────────────────────

function DotsIndicator({ campana }: { campana: CampanaType }) {
  return (
    <div className="flex gap-1 mt-1">
      {SEMANAS.map(n => (
        <div
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${semVal(campana, n, "Titulo") ? "bg-blue-400" : "bg-slate-700"}`}
        />
      ))}
    </div>
  )
}

// ─── Cajón izquierdo ─────────────────────────────────────────────────────────

function CajonLateral({
  campanas, selectedId, onSelect, onNueva, onEliminar, filtroMes, filtroAnio,
  setFiltroMes, setFiltroAnio,
}: {
  campanas:    CampanaType[]
  selectedId:  string | null
  onSelect:    (c: CampanaType) => void
  onNueva:     () => void
  onEliminar:  (c: CampanaType) => void
  filtroMes:   MesCampana | ""
  filtroAnio:  number
  setFiltroMes:  (m: MesCampana | "") => void
  setFiltroAnio: (a: number) => void
}) {
  const grupos = useMemo(() => {
    const filtradas = campanas
      .filter(c => !filtroMes || c.mes === filtroMes)
      .filter(c => c.anio === filtroAnio)

    const map = new Map<string, CampanaType[]>()
    filtradas.forEach(c => {
      const k = `${c.mes} ${c.anio}`
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(c)
    })
    return map
  }, [campanas, filtroMes, filtroAnio])

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-slate-950 border-r border-slate-800/60 h-full">
      {/* Header */}
      <div className="px-3 pt-4 pb-2 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campañas</p>
          <button type="button"
            onClick={onNueva}
            className="h-6 w-6 rounded-md bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
            title="Nueva campaña"
          >
            <Plus size={12} className="text-white" />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5">
          <select
            title="Año"
            value={filtroAnio}
            onChange={e => setFiltroAnio(Number(e.target.value))}
            className="flex-1 text-[11px] px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
          >
            {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            title="Mes"
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value as MesCampana | "")}
            className="flex-1 text-[11px] px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
          >
            <option value="">Todos</option>
            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-2">
        {grupos.size === 0 && (
          <p className="text-[11px] text-slate-600 text-center mt-8">Sin campañas</p>
        )}
        {[...grupos.entries()].map(([grupo, items]) => (
          <div key={grupo} className="mb-3">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">
              {grupo}
            </p>
            {items.map(c => {
              const activa = selectedId === c.documentId
              const llenas = semanasLlenas(c)
              return (
                <button type="button"
                  key={c.documentId}
                  onClick={() => onSelect(c)}
                  className={`w-full text-left px-3 py-2 transition-all group relative ${
                    activa
                      ? "bg-blue-500/15 border-l-2 border-blue-500"
                      : "hover:bg-slate-800/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className={`text-[12px] font-medium truncate ${activa ? "text-blue-300" : "text-slate-300"}`}>
                        {c.unidadNegocio || "Sin nombre"}
                      </p>
                      <p className="text-[10px] text-slate-600 capitalize">{c.tipo === "completa" ? "completa" : "extra"}</p>
                      <DotsIndicator campana={c} />
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-mono ${llenas === 4 ? "text-emerald-400" : "text-slate-600"}`}>
                        {llenas}/4
                      </span>
                      <button type="button"
                        onClick={e => { e.stopPropagation(); onEliminar(c) }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}

// ─── Celda del grid ───────────────────────────────────────────────────────────

function CeldaSemana({
  campana, n, onSave,
}: {
  campana: CampanaType
  n:       NSemana
  onSave:  (patch: Partial<CampanaPayload>) => Promise<void>
}) {
  const titulo   = semVal(campana, n, "Titulo")
  const fecha    = semVal(campana, n, "Fecha")
  const partes   = semVal(campana, n, "Partes")
  const archivo  = semVal(campana, n, "Archivo")
  const [open, setOpen]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [tLocal, setTLocal]   = useState(titulo ?? "")
  const [fLocal, setFLocal]   = useState(fecha ?? "")
  const [pLocal, setPLocal]   = useState(partes ?? "")
  const [aLocal, setALocal]   = useState(archivo ?? "")

  const abrir = () => {
    setTLocal(titulo ?? "")
    setFLocal(fecha ?? "")
    setPLocal(partes ?? "")
    setALocal(archivo ?? "")
    setOpen(true)
  }

  const guardar = async () => {
    setSaving(true)
    await onSave({
      [`semana${n}Titulo`]:  tLocal.trim() || null,
      [`semana${n}Fecha`]:   fLocal || null,
      [`semana${n}Partes`]:  pLocal.trim() || null,
      [`semana${n}Archivo`]: aLocal.trim() || null,
    } as Partial<CampanaPayload>)
    setSaving(false)
    setOpen(false)
  }

  const limpiar = async () => {
    setSaving(true)
    await onSave({
      [`semana${n}Titulo`]: null,
      [`semana${n}Fecha`]:  null,
      [`semana${n}Partes`]: null,
      [`semana${n}Archivo`]: null,
    } as Partial<CampanaPayload>)
    setSaving(false)
    setOpen(false)
  }

  if (open) {
    return (
      <div className="p-2 bg-slate-800 rounded-lg border border-blue-500/40 space-y-1.5 min-w-[160px]">
        <input
          autoFocus
          value={tLocal}
          onChange={e => setTLocal(e.target.value)}
          placeholder="Título..."
          className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 placeholder:text-slate-500"
        />
        <input
          type="date"
          value={fLocal}
          onChange={e => setFLocal(e.target.value)}
          className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
        />
        <textarea
          title="Partes/productos"
          value={pLocal}
          onChange={e => setPLocal(e.target.value)}
          placeholder="Partes/productos..."
          rows={2}
          className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 placeholder:text-slate-500 resize-none"
        />
        <input
          value={aLocal}
          onChange={e => setALocal(e.target.value)}
          placeholder="URL archivo..."
          className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 placeholder:text-slate-500"
        />
        <div className="flex gap-1 pt-0.5">
          <button type="button"
            onClick={guardar}
            disabled={saving}
            className="flex-1 h-6 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Check size={9} /> {saving ? "..." : "Guardar"}
          </button>
          {titulo && (
            <button type="button"
              onClick={limpiar}
              disabled={saving}
              className="h-6 px-1.5 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded"
              title="Limpiar semana"
            >
              <Trash2 size={9} />
            </button>
          )}
          <button type="button"
            onClick={() => setOpen(false)}
            className="h-6 px-1.5 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-400 rounded"
          >
            <X size={9} />
          </button>
        </div>
      </div>
    )
  }

  if (!titulo) {
    return (
      <button type="button"
        onClick={abrir}
        className="w-full h-full min-h-[64px] rounded-lg border border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 flex items-center justify-center text-slate-700 hover:text-blue-500/60 transition-all group"
      >
        <Plus size={14} className="group-hover:scale-110 transition-transform" />
      </button>
    )
  }

  return (
    <button type="button"
      onClick={abrir}
      className="w-full h-full min-h-[64px] rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/40 p-2 text-left transition-all group"
    >
      <p className="text-[11px] font-medium text-slate-200 leading-snug line-clamp-2">{titulo}</p>
      {fecha && (
        <p className="text-[10px] text-slate-500 mt-1">
          {new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
        </p>
      )}
      {archivo?.startsWith("http") && (
        <ExternalLink size={9} className="text-blue-500/50 mt-1" />
      )}
      <Pencil size={9} className="text-slate-600 opacity-0 group-hover:opacity-100 absolute top-2 right-2 transition-opacity" />
    </button>
  )
}

// ─── Grid del planeador ───────────────────────────────────────────────────────

function PlaneadorGrid({
  campanas, mes, anio, onCambiarMes, onSaveSemana, onNuevaCampana, onEditarCampana,
}: {
  campanas:       CampanaType[]
  mes:            MesCampana
  anio:           number
  onCambiarMes:   (dir: -1 | 1) => void
  onSaveSemana:   (c: CampanaType, patch: Partial<CampanaPayload>) => Promise<void>
  onNuevaCampana: () => void
  onEditarCampana: (c: CampanaType) => void
}) {
  const del_mes = campanas.filter(c => c.mes === mes && c.anio === anio)

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Navegación de mes */}
      <div className="flex items-center gap-3 mb-5">
        <button type="button"
          onClick={() => onCambiarMes(-1)}
          className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <h2 className="text-base font-semibold text-slate-200 min-w-[140px] text-center">
          {mes} {anio}
        </h2>
        <button type="button"
          onClick={() => onCambiarMes(1)}
          className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
        <span className="text-[11px] text-slate-600 ml-2">{del_mes.length} campaña{del_mes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabla */}
      <div className="min-w-[600px]">
        {/* Header de semanas */}
        <div className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] gap-2 mb-2">
          <div />
          {SEMANAS.map(n => (
            <div key={n} className="text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Semana {n}</span>
            </div>
          ))}
        </div>

        {/* Filas de campañas */}
        {del_mes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-600 text-sm mb-3">Sin campañas en {mes} {anio}</p>
            <button type="button"
              onClick={onNuevaCampana}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm transition-colors"
            >
              <Plus size={14} /> Crear primera campaña del mes
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {del_mes.map(c => (
              <div key={c.documentId} className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] gap-2 items-start">
                {/* Info campaña */}
                <div className="flex flex-col gap-1 pt-2 pr-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12px] font-semibold text-slate-200 leading-tight">
                      {c.unidadNegocio || "Sin nombre"}
                    </p>
                    <button type="button"
                      onClick={() => onEditarCampana(c)}
                      className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors"
                    >
                      <Pencil size={10} />
                    </button>
                  </div>
                  <span className={`self-start text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    c.tipo === "completa"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  }`}>
                    {c.tipo === "completa" ? "completa" : "extra"}
                  </span>
                  {c.categoria && (
                    <p className="text-[10px] text-slate-600">{c.categoria}</p>
                  )}
                </div>

                {/* Celdas de semanas */}
                {SEMANAS.map(n => (
                  <div key={n} className="relative">
                    <CeldaSemana
                      campana={c}
                      n={n}
                      onSave={patch => onSaveSemana(c, patch)}
                    />
                  </div>
                ))}
              </div>
            ))}

            {/* Fila de agregar */}
            <div className="pt-2">
              <button type="button"
                onClick={onNuevaCampana}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-700 hover:border-blue-500/40 text-slate-600 hover:text-blue-400 text-[11px] transition-all"
              >
                <Plus size={11} /> Agregar campaña a {mes}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal rápido de creación ─────────────────────────────────────────────────

function ModalRapida({
  mes, anio, unidadesUsadas,
  onGuardar, onCerrar,
}: {
  mes:           MesCampana
  anio:          number
  unidadesUsadas: string[]
  onGuardar:     (payload: CampanaPayload) => Promise<void>
  onCerrar:      () => void
}) {
  const [form, setForm] = useState<CampanaPayload>(emptyPayload(mes, anio))
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("Escribe la unidad de negocio"); return }
    setSaving(true)
    await onGuardar(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Nueva campaña</h3>
          <button type="button" onClick={onCerrar} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Unidad de negocio *</label>
            <input
              autoFocus
              list="unidades-list"
              value={form.unidadNegocio}
              onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
              placeholder="Miracles, Mkt team..."
              className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600"
            />
            <datalist id="unidades-list">
              {unidadesUsadas.map(u => <option key={u} value={u} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Mes</label>
              <select
                title="Mes"
                value={form.mes}
                onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              >
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Año</label>
              <select
                title="Año"
                value={form.anio}
                onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              >
                {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Tipo</label>
            <div className="flex gap-2">
              {(["completa", "titulos_extra"] as const).map(t => (
                <button type="button"
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                    form.tipo === t
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t === "completa" ? "Completa" : "Títulos extra"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Categoría (opcional)</label>
            <input
              value={form.categoria ?? ""}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}
              placeholder="Joyería, Moda, Promo..."
              className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600"
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-600">
          Después de crear puedes agregar el contenido de cada semana directamente en el grid.
        </p>

        <div className="flex gap-2 pt-1">
          <button type="button"
            onClick={onCerrar}
            className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button type="button"
            onClick={guardar}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={13} />
            {saving ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function CampanasPlannerView() {
  const { campanas, setCampanas, loading } = useGetCampanas()

  const [mesActual, setMesActual]   = useState<MesCampana>(MES_ACTUAL)
  const [anioActual, setAnioActual] = useState(ANIO_ACTUAL)
  const [filtroMes, setFiltroMes]   = useState<MesCampana | "">("")
  const [filtroAnio, setFiltroAnio] = useState(ANIO_ACTUAL)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal]           = useState(false)

  const unidadesUsadas = useMemo(() => {
    const s = new Set<string>()
    campanas?.forEach((c: CampanaType) => { if (c.unidadNegocio) s.add(c.unidadNegocio) })
    return [...s].sort()
  }, [campanas])

  const cambiarMes = (dir: -1 | 1) => {
    const idx = MESES.indexOf(mesActual)
    const nuevo = idx + dir
    if (nuevo < 0)  { setMesActual(MESES[11]); setAnioActual(a => a - 1) }
    else if (nuevo > 11) { setMesActual(MESES[0]); setAnioActual(a => a + 1) }
    else setMesActual(MESES[nuevo])
  }

  const saveSemana = async (c: CampanaType, patch: Partial<CampanaPayload>) => {
    try {
      const updated = await updateCampana(c.documentId, patch)
      setCampanas((prev: CampanaType[]) =>
        prev.map(x => x.documentId === updated.documentId ? updated : x)
      )
    } catch {
      toast.error("Error al guardar")
    }
  }

  const crearCampana = async (payload: CampanaPayload) => {
    try {
      const nueva = await createCampana(payload)
      setCampanas((prev: CampanaType[]) => [nueva, ...prev])
      setMesActual(payload.mes)
      setAnioActual(payload.anio)
      setModal(false)
      toast.success("Campaña creada")
    } catch {
      toast.error("Error al crear campaña")
    }
  }

  const eliminarCampana = async (c: CampanaType) => {
    if (!confirm(`¿Eliminar campaña "${c.unidadNegocio}"?`)) return
    try {
      await deleteCampana(c.documentId)
      setCampanas((prev: CampanaType[]) => prev.filter(x => x.documentId !== c.documentId))
      if (selectedId === c.documentId) setSelectedId(null)
      toast.success("Campaña eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Cargando campañas...
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-slate-950">
      {/* Cajón izquierdo */}
      <CajonLateral
        campanas={campanas ?? []}
        selectedId={selectedId}
        onSelect={c => {
          setSelectedId(c.documentId)
          setMesActual(c.mes)
          setAnioActual(c.anio)
        }}
        onNueva={() => setModal(true)}
        onEliminar={eliminarCampana}
        filtroMes={filtroMes}
        filtroAnio={filtroAnio}
        setFiltroMes={setFiltroMes}
        setFiltroAnio={setFiltroAnio}
      />

      {/* Planeador derecho */}
      <PlaneadorGrid
        campanas={campanas ?? []}
        mes={mesActual}
        anio={anioActual}
        onCambiarMes={cambiarMes}
        onSaveSemana={saveSemana}
        onNuevaCampana={() => setModal(true)}
        onEditarCampana={c => {
          setSelectedId(c.documentId)
          setMesActual(c.mes)
          setAnioActual(c.anio)
        }}
      />

      {/* Modal de creación */}
      {modal && (
        <ModalRapida
          mes={mesActual}
          anio={anioActual}
          unidadesUsadas={unidadesUsadas}
          onGuardar={crearCampana}
          onCerrar={() => setModal(false)}
        />
      )}
    </div>
  )
}
