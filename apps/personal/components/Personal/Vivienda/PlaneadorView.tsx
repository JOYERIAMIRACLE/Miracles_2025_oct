"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, X, Search, Check, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useGetRecetas, createReceta } from "@/api/receta/getRecetas"
import { useGetPlanSemana, createPlanComida, deletePlanComida } from "@/api/plan-comida/getPlanComidas"
import { DiaSemana, DIAS, DIA_LABEL } from "@/types/ejercicio"
import { CategoriaReceta, CATEGORIAS, CATEGORIA_LABEL, CATEGORIA_COLOR, RecetaType, RecetaPayload } from "@/types/recetario"
import { PlanComidaType, Momento, MOMENTOS, MOMENTO_LABEL } from "@/types/planComida"

function emptyReceta(): RecetaPayload {
  return { nombre: "", descripcion: null, videoUrl: null, categorias: [] }
}

// ─── Week helpers ──────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const fmtDia = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlaneadorView() {
  const [semanaInicio, setSemanaInicio] = useState(() => getMondayOf(new Date()))
  const semanaISOStr = toISO(semanaInicio)

  const { planComidas, setPlanComidas, loading } = useGetPlanSemana(semanaISOStr)
  const { recetas, setRecetas } = useGetRecetas()

  const [modalCell,     setModalCell]     = useState<{ dia: DiaSemana; momento: Momento } | null>(null)
  const [busqueda,      setBusqueda]      = useState("")
  const [filtroCat,     setFiltroCat]     = useState<CategoriaReceta | "">("")
  const [creandoReceta, setCreandoReceta] = useState(false)
  const [formReceta,    setFormReceta]    = useState<RecetaPayload>(emptyReceta())
  const [guardando,     setGuardando]     = useState(false)

  // Map[momento][dia] → PlanComidaType[]
  const grid = useMemo(() => {
    const map = new Map<Momento, Map<DiaSemana, PlanComidaType[]>>()
    MOMENTOS.forEach(m => {
      const row = new Map<DiaSemana, PlanComidaType[]>()
      DIAS.forEach(d => row.set(d, []))
      map.set(m, row)
    })
    planComidas.forEach(p => map.get(p.momento)?.get(p.diaSemana)?.push(p))
    return map
  }, [planComidas])

  const recetasFiltradas = useMemo(() =>
    recetas.filter(r =>
      (!busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase())) &&
      (!filtroCat || r.categorias.includes(filtroCat))
    ),
  [recetas, busqueda, filtroCat])

  const recetasEnCelda = useMemo(() => {
    if (!modalCell) return new Set<string>()
    return new Set((grid.get(modalCell.momento)?.get(modalCell.dia) ?? []).map(p => p.receta.documentId))
  }, [modalCell, grid])

  const agregar = async (receta: RecetaType) => {
    if (!modalCell || recetasEnCelda.has(receta.documentId)) return
    try {
      const nuevo = await createPlanComida({
        semanaInicio: semanaISOStr,
        diaSemana:    modalCell.dia,
        momento:      modalCell.momento,
        receta:       receta.documentId,
      })
      setPlanComidas(prev => [...prev, { ...nuevo, receta }])
      toast.success("Agregada")
    } catch {
      toast.error("Error al agregar")
    }
  }

  const quitar = async (plan: PlanComidaType) => {
    setPlanComidas(prev => prev.filter(p => p.documentId !== plan.documentId))
    try {
      await deletePlanComida(plan.documentId)
    } catch {
      setPlanComidas(prev => [...prev, plan])
      toast.error("Error al quitar")
    }
  }

  const abrirNuevaReceta = () => {
    setFormReceta({ ...emptyReceta(), categorias: filtroCat ? [filtroCat] : [] })
    setCreandoReceta(true)
  }

  const guardarNuevaReceta = async () => {
    if (!formReceta.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      const nueva = await createReceta(formReceta)
      setRecetas(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      await agregar(nueva)
      setCreandoReceta(false)
      setFormReceta(emptyReceta())
    } catch {
      toast.error("Error al crear receta")
    } finally {
      setGuardando(false)
    }
  }

  const toggleCatForm = (cat: CategoriaReceta) => {
    setFormReceta(f => ({
      ...f,
      categorias: f.categorias.includes(cat) ? f.categorias.filter(c => c !== cat) : [...f.categorias, cat],
    }))
  }

  const hoyISO   = toISO(new Date())
  const finSemana = addDays(semanaInicio, 6)
  const semanaLabel = `${fmtDia(semanaInicio)} – ${fmtDia(finSemana)} ${finSemana.getFullYear()}`

  // Build flat cell array for CSS grid (8 cols: label + 7 days)
  const headerCells = [
    <div key="corner" className="bg-slate-950" />,
    ...DIAS.map((dia, idx) => {
      const diaDate = addDays(semanaInicio, idx)
      const esHoy   = toISO(diaDate) === hoyISO
      return (
        <div key={`h-${dia}`} className="bg-slate-950 px-2 py-3 text-center border-b border-slate-800">
          <p className={`text-[11px] font-bold uppercase tracking-wide ${esHoy ? "text-amber-400" : "text-slate-400"}`}>
            {DIA_LABEL[dia].slice(0, 3)}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">{fmtDia(diaDate)}</p>
        </div>
      )
    }),
  ]

  const bodyCells = MOMENTOS.flatMap(momento => [
    // Row label
    <div key={`lbl-${momento}`}
      className="bg-slate-950 flex items-center justify-center px-1 py-3 border-r border-slate-800">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
        {MOMENTO_LABEL[momento]}
      </span>
    </div>,
    // Day cells
    ...DIAS.map((dia, idx) => {
      const esHoy = toISO(addDays(semanaInicio, idx)) === hoyISO
      const items = grid.get(momento)?.get(dia) ?? []
      return (
        <div key={`${momento}-${dia}`}
          className={`flex flex-col gap-1.5 p-2 min-h-[110px] border-b border-r border-slate-800/60 ${esHoy ? "bg-slate-900/60" : "bg-slate-950"}`}>
          {items.map(plan => (
            <div key={plan.documentId} className="group flex items-start gap-0.5">
              <div className="flex-1 min-w-0 bg-slate-800 rounded-lg px-2 py-1.5">
                <p className="text-[10px] font-medium text-slate-200 leading-snug">{plan.receta.nombre}</p>
                {plan.receta.categorias.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {plan.receta.categorias.map(cat => (
                      <span key={cat} className={`text-[8px] px-1 py-0.5 rounded-full border font-semibold ${CATEGORIA_COLOR[cat]}`}>
                        {CATEGORIA_LABEL[cat].charAt(0)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" title="Quitar"
                onClick={() => quitar(plan)}
                className="p-0.5 mt-0.5 text-slate-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 shrink-0">
                <X size={10} />
              </button>
            </div>
          ))}
          <button type="button"
            onClick={() => { setModalCell({ dia, momento }); setBusqueda(""); setFiltroCat("") }}
            className="mt-auto flex items-center justify-center gap-0.5 w-full py-1 text-[9px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg transition">
            <Plus size={9} /> Agregar
          </button>
        </div>
      )
    }),
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Planeador</h1>
          <p className="text-sm text-slate-500">Organiza tus comidas de la semana</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" title="Semana anterior"
            onClick={() => setSemanaInicio(prev => addDays(prev, -7))}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-300 min-w-[190px] text-center">{semanaLabel}</span>
          <button type="button" title="Semana siguiente"
            onClick={() => setSemanaInicio(prev => addDays(prev, 7))}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-16">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <div className="grid grid-cols-[52px_repeat(7,minmax(120px,1fr))] min-w-[700px]">
            {headerCells}
            {bodyCells}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalCell && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {creandoReceta && (
                  <button type="button" title="Volver" onClick={() => setCreandoReceta(false)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                    <ArrowLeft size={15} />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    {creandoReceta ? "Nueva receta" : "Agregar receta"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {MOMENTO_LABEL[modalCell.momento]} · {DIA_LABEL[modalCell.dia]}
                  </p>
                </div>
              </div>
              <button type="button" title="Cerrar"
                onClick={() => { setModalCell(null); setCreandoReceta(false) }}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            {/* ── Vista: lista de recetas ── */}
            {!creandoReceta && (<>
              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar..." autoFocus
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFiltroCat("")}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroCat === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                    Todas
                  </button>
                  {CATEGORIAS.map(cat => (
                    <button key={cat} type="button" onClick={() => setFiltroCat(filtroCat === cat ? "" : cat)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroCat === cat ? CATEGORIA_COLOR[cat] + " font-semibold" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                      {CATEGORIA_LABEL[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {/* Botón crear nueva receta */}
                <button type="button" onClick={abrirNuevaReceta}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-700 hover:border-amber-700/50 hover:bg-amber-900/10 transition-colors text-left">
                  <Plus size={13} className="text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-amber-400">Crear nueva receta</span>
                </button>

                {recetasFiltradas.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-6">Sin resultados</p>
                ) : recetasFiltradas.map(r => {
                  const yaEsta = recetasEnCelda.has(r.documentId)
                  return (
                    <button key={r.documentId} type="button"
                      disabled={yaEsta}
                      onClick={() => agregar(r)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        yaEsta ? "border-slate-800 opacity-40 cursor-not-allowed"
                               : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}>
                      <p className="text-xs font-medium text-slate-200">{r.nombre}</p>
                      {r.categorias.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.categorias.map(cat => (
                            <span key={cat} className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORIA_COLOR[cat]}`}>
                              {CATEGORIA_LABEL[cat]}
                            </span>
                          ))}
                        </div>
                      )}
                      {yaEsta && <p className="text-[9px] text-slate-600 mt-0.5">Ya agregada</p>}
                    </button>
                  )
                })}
              </div>
            </>)}

            {/* ── Vista: crear nueva receta ── */}
            {creandoReceta && (
              <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Nombre *</label>
                  <input
                    autoFocus
                    value={formReceta.nombre}
                    onChange={e => setFormReceta(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Avena con fruta..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-2">Categorías</label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIAS.map(cat => (
                      <button key={cat} type="button" onClick={() => toggleCatForm(cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          formReceta.categorias.includes(cat) ? CATEGORIA_COLOR[cat] + " font-medium" : "border-slate-700 text-slate-500 hover:text-slate-300"
                        }`}>
                        {CATEGORIA_LABEL[cat]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Descripción</label>
                  <textarea
                    value={formReceta.descripcion ?? ""}
                    onChange={e => setFormReceta(f => ({ ...f, descripcion: e.target.value || null }))}
                    placeholder="Ingredientes, pasos, notas..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Link del video</label>
                  <input
                    value={formReceta.videoUrl ?? ""}
                    onChange={e => setFormReceta(f => ({ ...f, videoUrl: e.target.value || null }))}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setCreandoReceta(false)}
                    className="flex-1 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={guardarNuevaReceta} disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition">
                    <Check size={14} />
                    {guardando ? "Guardando..." : "Crear y agregar"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
