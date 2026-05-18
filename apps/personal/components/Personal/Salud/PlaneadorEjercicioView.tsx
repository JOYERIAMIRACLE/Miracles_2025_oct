"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, X, Search, Check, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useGetEjercicios, createEjercicio } from "@/api/ejercicio/getEjercicios"
import { useGetPlanEjercicioSemana, createPlanEjercicio, deletePlanEjercicio } from "@/api/plan-ejercicio/getPlanEjercicios"
import { DiaSemana, DIAS, DIA_LABEL, EjercicioType, EjercicioPayload } from "@/types/ejercicio"
import { PlanEjercicioType } from "@/types/planEjercicio"

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

const DIA_COLOR: Record<DiaSemana, string> = {
  lunes:     "bg-blue-500/15 text-blue-300 border-blue-500/30",
  martes:    "bg-violet-500/15 text-violet-300 border-violet-500/30",
  miercoles: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  jueves:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  viernes:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  sabado:    "bg-orange-500/15 text-orange-300 border-orange-500/30",
  domingo:   "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

function emptyEjercicio(): EjercicioPayload {
  return { titulo: "", descripcion: null, diaSemana: null }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlaneadorEjercicioView() {
  const [semanaInicio, setSemanaInicio] = useState(() => getMondayOf(new Date()))
  const semanaISOStr = toISO(semanaInicio)

  const { planEjercicios, setPlanEjercicios, loading } = useGetPlanEjercicioSemana(semanaISOStr)
  const { ejercicios, setEjercicios } = useGetEjercicios()

  const [modalDia,       setModalDia]       = useState<DiaSemana | null>(null)
  const [busqueda,       setBusqueda]       = useState("")
  const [filtroDia,      setFiltroDia]      = useState<DiaSemana | "">("")
  const [creando,        setCreando]        = useState(false)
  const [formEjercicio,  setFormEjercicio]  = useState<EjercicioPayload>(emptyEjercicio())
  const [guardando,      setGuardando]      = useState(false)

  const porDia = useMemo(() => {
    const map = new Map<DiaSemana, PlanEjercicioType[]>()
    DIAS.forEach(d => map.set(d, []))
    planEjercicios.forEach(p => map.get(p.diaSemana)?.push(p))
    return map
  }, [planEjercicios])

  const ejerciciosFiltrados = useMemo(() =>
    ejercicios.filter(e =>
      (!busqueda  || e.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
      (!filtroDia || e.diaSemana === filtroDia)
    ),
  [ejercicios, busqueda, filtroDia])

  const ejerciciosEnDia = useMemo(() => {
    if (!modalDia) return new Set<string>()
    return new Set((porDia.get(modalDia) ?? []).map(p => p.ejercicio.documentId))
  }, [modalDia, porDia])

  const agregar = async (ejercicio: EjercicioType) => {
    if (!modalDia || ejerciciosEnDia.has(ejercicio.documentId)) return
    try {
      const nuevo = await createPlanEjercicio({ semanaInicio: semanaISOStr, diaSemana: modalDia, ejercicio: ejercicio.documentId })
      setPlanEjercicios(prev => [...prev, { ...nuevo, ejercicio }])
      toast.success("Ejercicio agregado")
    } catch {
      toast.error("Error al agregar")
    }
  }

  const quitar = async (plan: PlanEjercicioType) => {
    setPlanEjercicios(prev => prev.filter(p => p.documentId !== plan.documentId))
    try {
      await deletePlanEjercicio(plan.documentId)
    } catch {
      setPlanEjercicios(prev => [...prev, plan])
      toast.error("Error al quitar")
    }
  }

  const abrirNuevoEjercicio = () => {
    setFormEjercicio({ titulo: "", descripcion: null, diaSemana: modalDia ?? null })
    setCreando(true)
  }

  const guardarNuevoEjercicio = async () => {
    if (!formEjercicio.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setGuardando(true)
    try {
      const nuevo = await createEjercicio(formEjercicio)
      setEjercicios(prev => [...prev, nuevo])
      await agregar(nuevo)
      setCreando(false)
      setFormEjercicio(emptyEjercicio())
    } catch {
      toast.error("Error al crear ejercicio")
    } finally {
      setGuardando(false)
    }
  }

  const hoyISO    = toISO(new Date())
  const finSemana = addDays(semanaInicio, 6)
  const semanaLabel = `${fmtDia(semanaInicio)} – ${fmtDia(finSemana)} ${finSemana.getFullYear()}`

  const headerCells = [
    ...DIAS.map((dia, idx) => {
      const diaDate = addDays(semanaInicio, idx)
      const esHoy   = toISO(diaDate) === hoyISO
      return (
        <div key={`h-${dia}`} className="bg-slate-950 px-2 py-3 text-center border-b border-slate-800">
          <p className={`text-[11px] font-bold uppercase tracking-wide ${esHoy ? "text-emerald-400" : "text-slate-400"}`}>
            {DIA_LABEL[dia].slice(0, 3)}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">{fmtDia(diaDate)}</p>
        </div>
      )
    }),
  ]

  const bodyCells = DIAS.map((dia, idx) => {
    const esHoy = toISO(addDays(semanaInicio, idx)) === hoyISO
    const items = porDia.get(dia) ?? []
    return (
      <div key={`cell-${dia}`}
        className={`flex flex-col gap-1.5 p-2 min-h-[140px] border-r border-slate-800/60 ${esHoy ? "bg-slate-900/60" : "bg-slate-950"}`}>
        {items.map(plan => (
          <div key={plan.documentId} className="group flex items-start gap-0.5">
            <div className="flex-1 min-w-0 bg-slate-800 rounded-lg px-2 py-1.5">
              <p className="text-[10px] font-medium text-slate-200 leading-snug">{plan.ejercicio.titulo}</p>
              {plan.ejercicio.diaSemana && (
                <span className={`inline-block mt-1 text-[8px] px-1 py-0.5 rounded-full border font-semibold ${DIA_COLOR[plan.ejercicio.diaSemana]}`}>
                  {DIA_LABEL[plan.ejercicio.diaSemana].slice(0, 3)}
                </span>
              )}
              {plan.ejercicio.descripcion && (
                <p className="text-[9px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{plan.ejercicio.descripcion}</p>
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
          onClick={() => { setModalDia(dia); setBusqueda(""); setFiltroDia(""); setCreando(false) }}
          className="mt-auto flex items-center justify-center gap-0.5 w-full py-1 text-[9px] text-slate-700 hover:text-slate-500 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg transition">
          <Plus size={9} /> Agregar
        </button>
      </div>
    )
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Planeador de Gym</h1>
          <p className="text-sm text-slate-500">Organiza tu rutina de la semana</p>
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
          <div className="grid grid-cols-7 min-w-[700px]">
            {headerCells}
            {bodyCells}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalDia && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {creando && (
                  <button type="button" title="Volver" onClick={() => setCreando(false)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                    <ArrowLeft size={15} />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    {creando ? "Nuevo ejercicio" : "Agregar ejercicio"}
                  </h2>
                  <p className="text-[11px] text-slate-500">{DIA_LABEL[modalDia]}</p>
                </div>
              </div>
              <button type="button" title="Cerrar"
                onClick={() => { setModalDia(null); setCreando(false) }}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                <X size={16} />
              </button>
            </div>

            {/* ── Lista de ejercicios ── */}
            {!creando && (<>
              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar ejercicio..." autoFocus
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-500" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFiltroDia("")}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroDia === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                    Todos
                  </button>
                  {DIAS.map(d => (
                    <button key={d} type="button" onClick={() => setFiltroDia(filtroDia === d ? "" : d)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroDia === d ? DIA_COLOR[d] + " font-semibold" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                      {DIA_LABEL[d].slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                <button type="button" onClick={abrirNuevoEjercicio}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-700 hover:border-emerald-700/50 hover:bg-emerald-900/10 transition-colors text-left">
                  <Plus size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-emerald-400">Crear nuevo ejercicio</span>
                </button>

                {ejerciciosFiltrados.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-6">Sin resultados</p>
                ) : ejerciciosFiltrados.map(e => {
                  const yaEsta = ejerciciosEnDia.has(e.documentId)
                  return (
                    <button key={e.documentId} type="button"
                      disabled={yaEsta}
                      onClick={() => agregar(e)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        yaEsta ? "border-slate-800 opacity-40 cursor-not-allowed"
                               : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-200 flex-1">{e.titulo}</p>
                        {e.diaSemana && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${DIA_COLOR[e.diaSemana]}`}>
                            {DIA_LABEL[e.diaSemana].slice(0, 3)}
                          </span>
                        )}
                      </div>
                      {e.descripcion && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{e.descripcion}</p>
                      )}
                      {yaEsta && <p className="text-[9px] text-slate-600 mt-0.5">Ya agregado</p>}
                    </button>
                  )
                })}
              </div>
            </>)}

            {/* ── Crear nuevo ejercicio ── */}
            {creando && (
              <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Título *</label>
                  <input
                    autoFocus
                    value={formEjercicio.titulo}
                    onChange={e => setFormEjercicio(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ej. Press de banca..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-2">Día habitual</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DIAS.map(d => (
                      <button key={d} type="button"
                        onClick={() => setFormEjercicio(f => ({ ...f, diaSemana: f.diaSemana === d ? null : d }))}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          formEjercicio.diaSemana === d ? DIA_COLOR[d] + " font-medium" : "border-slate-700 text-slate-500 hover:text-slate-300"
                        }`}>
                        {DIA_LABEL[d].slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Descripción</label>
                  <textarea
                    value={formEjercicio.descripcion ?? ""}
                    onChange={e => setFormEjercicio(f => ({ ...f, descripcion: e.target.value || null }))}
                    placeholder="Series, repeticiones, notas..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setCreando(false)}
                    className="flex-1 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={guardarNuevoEjercicio} disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition">
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
