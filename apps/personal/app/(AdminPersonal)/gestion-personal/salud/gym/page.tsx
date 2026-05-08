"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Dumbbell, Play, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useGetRutinas, createRutina, deleteRutina, updateRutina } from "@/api/rutina/getRutinas"
import { useGetSesiones, createSesion, deleteSesion } from "@/api/sesion-gym/getSesiones"
import { useGetEjercicios, createEjercicio } from "@/api/ejercicio/getEjercicios"
import { RutinaType, SesionGymType, EjercicioEnRutina, EjercicioRealizado, MuscuoGrupo, TipoEjercicio } from "@/types/salud"

const MUSCULOS: MuscuoGrupo[] = ["pecho","espalda","hombros","biceps","triceps","core","piernas","gluteos","cardio","cuerpo_completo"]
const TIPOS: TipoEjercicio[]  = ["fuerza","cardio","flexibilidad","funcional"]

const MUSCULO_COLOR: Record<string, string> = {
  pecho:"text-red-400", espalda:"text-blue-400", hombros:"text-amber-400",
  biceps:"text-cyan-400", triceps:"text-violet-400", core:"text-emerald-400",
  piernas:"text-orange-400", gluteos:"text-pink-400", cardio:"text-green-400", cuerpo_completo:"text-slate-400",
}

function SesionCard({ s, onDelete }: { s: SesionGymType; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ejercs = s.ejerciciosRealizados ?? []

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
      className="rounded-xl bg-slate-900/60 border border-slate-700/40 group">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <Dumbbell className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200">{s.fecha}</p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
            {s.rutina && <span>{s.rutina.nombre}</span>}
            {s.duracion && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{s.duracion} min</span>}
            <span>{ejercs.length} ejercicios</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={e => { e.stopPropagation(); onDelete() }} aria-label="Eliminar sesión"
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-600" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800/40 pt-3">
              {ejercs.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-300 min-w-[120px] truncate">{e.nombre}</span>
                  <div className="flex gap-1 flex-wrap">
                    {e.series.map((s, j) => (
                      <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded border ${s.completada ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-slate-700 text-slate-500"}`}>
                        {s.reps}r{s.peso ? ` · ${s.peso}kg` : ""}
                      </span>
                    ))}
                  </div>
                  {e.notas && <span className="text-[10px] text-slate-600 ml-auto">{e.notas}</span>}
                </div>
              ))}
              {s.notas && <p className="text-xs text-slate-500 pt-2 border-t border-slate-800/30">{s.notas}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RegistrarSesionModal({ rutinas, ejerciciosCatalogo, onSave, onClose }: {
  rutinas: RutinaType[]
  ejerciciosCatalogo: { id: number; nombre: string }[]
  onSave: (s: SesionGymType) => void
  onClose: () => void
}) {
  const [fecha,     setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [duracion,  setDuracion]  = useState("")
  const [notas,     setNotas]     = useState("")
  const [rutinaId,  setRutinaId]  = useState<number | "">("")
  const [ejercicios, setEjercicios] = useState<EjercicioRealizado[]>([])
  const [saving,    setSaving]    = useState(false)

  const rutinaSeleccionada = rutinas.find(r => r.id === rutinaId)

  function cargarDesdeRutina() {
    if (!rutinaSeleccionada?.ejercicios) return
    setEjercicios(rutinaSeleccionada.ejercicios.map(e => ({
      ejercicioId: e.ejercicioId, nombre: e.nombre,
      series: Array.from({ length: e.series }, () => ({ reps: e.repeticiones, peso: e.peso ?? null, completada: false })),
      notas: null,
    })))
  }

  function toggleSerie(eIdx: number, sIdx: number) {
    setEjercicios(prev => prev.map((e, i) => i !== eIdx ? e : {
      ...e, series: e.series.map((s, j) => j !== sIdx ? s : { ...s, completada: !s.completada }),
    }))
  }

  function agregarEjercicio(id: number, nombre: string) {
    if (ejercicios.find(e => e.ejercicioId === id)) return
    setEjercicios(prev => [...prev, { ejercicioId: id, nombre, series: [{ reps: 10, peso: null, completada: false }], notas: null }])
  }

  function quitarEjercicio(idx: number) {
    setEjercicios(prev => prev.filter((_, i) => i !== idx))
  }

  function agregarSerie(eIdx: number) {
    setEjercicios(prev => prev.map((e, i) => i !== eIdx ? e : {
      ...e, series: [...e.series, { reps: 10, peso: null, completada: false }],
    }))
  }

  function actualizarSerie(eIdx: number, sIdx: number, field: "reps"|"peso", value: string) {
    setEjercicios(prev => prev.map((e, i) => i !== eIdx ? e : {
      ...e, series: e.series.map((s, j) => j !== sIdx ? s : { ...s, [field]: value ? Number(value) : null }),
    }))
  }

  async function handleSave() {
    setSaving(true)
    const payload: any = { fecha, duracion: duracion ? Number(duracion) : null, notas: notas || null, ejerciciosRealizados: ejercicios }
    if (rutinaId) payload.rutina = { connect: [{ id: rutinaId }] }
    const res = await createSesion(payload)
    if (res?.data) onSave(res.data)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100">Registrar Sesión</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-500 hover:text-slate-300"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="gym-fecha">Fecha</label>
              <input id="gym-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="gym-duracion">Duración (min)</label>
              <input id="gym-duracion" type="number" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="60"
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300" />
            </div>
          </div>

          {rutinas.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="gym-rutina">Rutina</label>
                <select id="gym-rutina" value={rutinaId} onChange={e => setRutinaId(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                  <option value="">Sin rutina</option>
                  {rutinas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              {rutinaSeleccionada?.ejercicios && rutinaSeleccionada.ejercicios.length > 0 && (
                <button type="button" onClick={cargarDesdeRutina}
                  className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors">
                  Cargar rutina
                </button>
              )}
            </div>
          )}

          {/* Agregar ejercicios */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Agregar ejercicio</label>
            <select aria-label="Agregar ejercicio del catálogo" defaultValue=""
              onChange={e => { if (e.target.value) { const [id, nombre] = e.target.value.split("||"); agregarEjercicio(Number(id), nombre); e.target.value = "" } }}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
              <option value="">Seleccionar ejercicio...</option>
              {ejerciciosCatalogo.map(e => <option key={e.id} value={`${e.id}||${e.nombre}`}>{e.nombre}</option>)}
            </select>
          </div>

          {/* Lista de ejercicios en la sesión */}
          {ejercicios.length > 0 && (
            <div className="space-y-3">
              {ejercicios.map((e, eIdx) => (
                <div key={eIdx} className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-200">{e.nombre}</p>
                    <button type="button" onClick={() => quitarEjercicio(eIdx)} aria-label="Quitar ejercicio"
                      className="text-slate-600 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {e.series.map((s, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleSerie(eIdx, sIdx)} aria-label="Marcar serie"
                          className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${s.completada ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-emerald-400"}`}>
                          {s.completada && <span className="text-[10px] text-white font-bold">✓</span>}
                        </button>
                        <span className="text-[10px] text-slate-500 w-12 shrink-0">Serie {sIdx + 1}</span>
                        <input type="number" value={s.reps} onChange={e => actualizarSerie(eIdx, sIdx, "reps", e.target.value)}
                          aria-label="Repeticiones"
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 text-center" />
                        <span className="text-[10px] text-slate-600">reps</span>
                        <input type="number" value={s.peso ?? ""} onChange={e => actualizarSerie(eIdx, sIdx, "peso", e.target.value)}
                          placeholder="—" aria-label="Peso en kg"
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 text-center" />
                        <span className="text-[10px] text-slate-600">kg</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => agregarSerie(eIdx)}
                    className="text-[10px] text-slate-600 hover:text-slate-300 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Serie
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider" htmlFor="gym-notas">Notas</label>
            <textarea id="gym-notas" value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Cómo te sentiste, PR, etc."
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleSave} disabled={!fecha || saving}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
              {saving ? "Guardando..." : "Guardar Sesión"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function RutinaCard({ r, onDelete }: { r: RutinaType; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ejercs = r.ejercicios ?? []

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="rounded-xl bg-slate-900/60 border border-slate-700/40 group">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Play className="h-4 w-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200">{r.nombre}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{ejercs.length} ejercicios{r.diasSemana ? ` · ${r.diasSemana}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={e => { e.stopPropagation(); onDelete() }} aria-label="Eliminar rutina"
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"><X className="h-3.5 w-3.5"/></button>
          {open ? <ChevronUp className="h-4 w-4 text-slate-600"/> : <ChevronDown className="h-4 w-4 text-slate-600"/>}
        </div>
      </div>
      <AnimatePresence>
        {open && ejercs.length > 0 && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-1.5 border-t border-slate-800/40 pt-3">
              {ejercs.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="min-w-[130px] truncate">{e.nombre}</span>
                  <span className="text-slate-600">{e.series}×{e.repeticiones}{e.peso ? ` @ ${e.peso}kg` : ""}</span>
                  {e.descanso && <span className="text-slate-700 ml-auto">{e.descanso}s desc.</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function GymPage() {
  const { rutinas,  setRutinas,  loading: loadR } = useGetRutinas()
  const { sesiones, setSesiones, loading: loadS } = useGetSesiones()
  const { ejercicios }                             = useGetEjercicios()

  const [tab,            setTab]            = useState<"sesiones"|"rutinas"|"ejercicios">("sesiones")
  const [showSesion,     setShowSesion]     = useState(false)
  const [showNuevaRutina,setShowNuevaRutina]= useState(false)
  const [showNuevoEj,    setShowNuevoEj]    = useState(false)

  // Form rutina rápida
  const [rutinaForm, setRutinaForm] = useState({ nombre: "", descripcion: "", diasSemana: "" })

  // Form ejercicio rápido
  const [ejForm, setEjForm] = useState({ nombre: "", musculo: "" as MuscuoGrupo|"", tipo: "fuerza" as TipoEjercicio })

  const stats = useMemo(() => ({
    sesionesMes: sesiones.filter(s => s.fecha.slice(0,7) === new Date().toISOString().slice(0,7)).length,
    totalSesiones: sesiones.length,
    rutinasActivas: rutinas.filter(r => r.activa).length,
  }), [sesiones, rutinas])

  async function handleDeleteSesion(documentId: string) {
    await deleteSesion(documentId)
    setSesiones(prev => prev.filter(s => s.documentId !== documentId))
  }

  async function handleDeleteRutina(documentId: string) {
    await deleteRutina(documentId)
    setRutinas(prev => prev.filter(r => r.documentId !== documentId))
  }

  async function handleCrearRutina() {
    if (!rutinaForm.nombre.trim()) return
    const res = await createRutina({ nombre: rutinaForm.nombre, descripcion: rutinaForm.descripcion || null, diasSemana: rutinaForm.diasSemana || null, activa: true, ejercicios: [] })
    if (res?.data) setRutinas(prev => [...prev, res.data])
    setRutinaForm({ nombre: "", descripcion: "", diasSemana: "" })
    setShowNuevaRutina(false)
  }

  async function handleCrearEjercicio() {
    if (!ejForm.nombre.trim()) return
    const res = await createEjercicio({ nombre: ejForm.nombre, musculo: ejForm.musculo || null, tipo: ejForm.tipo })
    if (res?.data) { /* ejercicios refetch no necesario, se muestra inline */ }
    setEjForm({ nombre: "", musculo: "", tipo: "fuerza" })
    setShowNuevoEj(false)
  }

  const loading = loadR || loadS

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sesiones este mes</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.sesionesMes}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total sesiones</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">{stats.totalSesiones}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Rutinas activas</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">{stats.rutinasActivas}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-700/40">
          {(["sesiones","rutinas","ejercicios"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-slate-500 hover:text-slate-300"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div>
          {tab === "sesiones"   && <button type="button" onClick={() => setShowSesion(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"><Plus className="h-4 w-4"/>Registrar sesión</button>}
          {tab === "rutinas"    && <button type="button" onClick={() => setShowNuevaRutina(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"><Plus className="h-4 w-4"/>Nueva rutina</button>}
          {tab === "ejercicios" && <button type="button" onClick={() => setShowNuevoEj(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"><Plus className="h-4 w-4"/>Agregar ejercicio</button>}
        </div>
      </div>

      {/* TAB: Sesiones */}
      {tab === "sesiones" && (
        <div className="space-y-3">
          <AnimatePresence>
            {showNuevaRutina && false}
          </AnimatePresence>
          {sesiones.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin sesiones registradas. ¡A entrenar!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sesiones.map(s => <SesionCard key={s.documentId} s={s} onDelete={() => handleDeleteSesion(s.documentId)} />)}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* TAB: Rutinas */}
      {tab === "rutinas" && (
        <div className="space-y-3">
          <AnimatePresence>
            {showNuevaRutina && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="p-4 rounded-xl bg-slate-800/80 border border-violet-500/30 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Nueva Rutina</h3>
                <input value={rutinaForm.nombre} onChange={e => setRutinaForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre de la rutina *"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={rutinaForm.diasSemana} onChange={e => setRutinaForm(f => ({ ...f, diasSemana: e.target.value }))} placeholder="Días (Lun, Mié, Vie)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none" />
                  <input value={rutinaForm.descripcion} onChange={e => setRutinaForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCrearRutina} disabled={!rutinaForm.nombre.trim()}
                    className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">Crear</button>
                  <button type="button" onClick={() => setShowNuevaRutina(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:text-slate-200 transition-colors">Cancelar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {rutinas.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Play className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin rutinas. Crea la primera.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {rutinas.map(r => <RutinaCard key={r.documentId} r={r} onDelete={() => handleDeleteRutina(r.documentId)} />)}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* TAB: Ejercicios */}
      {tab === "ejercicios" && (
        <div className="space-y-3">
          <AnimatePresence>
            {showNuevoEj && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="p-4 rounded-xl bg-slate-800/80 border border-slate-600/30 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Nuevo Ejercicio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={ejForm.nombre} onChange={e => setEjForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre *"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none" />
                  <select aria-label="Músculo" value={ejForm.musculo} onChange={e => setEjForm(f => ({ ...f, musculo: e.target.value as MuscuoGrupo|"" }))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                    <option value="">Músculo</option>
                    {MUSCULOS.map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
                  </select>
                  <select aria-label="Tipo" value={ejForm.tipo} onChange={e => setEjForm(f => ({ ...f, tipo: e.target.value as TipoEjercicio }))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCrearEjercicio} disabled={!ejForm.nombre.trim()}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-medium transition-colors">Agregar</button>
                  <button type="button" onClick={() => setShowNuevoEj(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:text-slate-200 transition-colors">Cancelar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {ejercicios.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin ejercicios en el catálogo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ejercicios.map(e => (
                <div key={e.documentId} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                  <p className="text-sm font-medium text-slate-200">{e.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {e.musculo && <span className={`text-[10px] font-medium ${MUSCULO_COLOR[e.musculo] ?? "text-slate-500"}`}>{e.musculo.replace("_"," ")}</span>}
                    <span className="text-[10px] text-slate-600">{e.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal registrar sesión */}
      <AnimatePresence>
        {showSesion && (
          <RegistrarSesionModal
            rutinas={rutinas}
            ejerciciosCatalogo={ejercicios}
            onSave={s => { setSesiones(prev => [s, ...prev]); setShowSesion(false) }}
            onClose={() => setShowSesion(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
