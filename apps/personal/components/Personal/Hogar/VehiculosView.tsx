"use client"

import { useState } from "react"
import { Car, Plus, X, Check, Pencil, Trash2, Loader2, Wrench, ChevronDown, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  useGetVehiculos, createVehiculo, updateVehiculo, deleteVehiculo,
  useGetServicios, createServicio, deleteServicio,
} from "@/api/vehiculo/getVehiculos"
import {
  Vehiculo, VehiculoPayload, ServicioVehiculo, ServicioVehiculoPayload,
  TIPOS_SERVICIO, SERVICIO_LABEL, SERVICIO_COLOR, TipoServicio,
} from "@/types/vehiculo"

const inp = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
const lbl = "block text-[11px] font-medium text-slate-400 mb-1"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
function fmtFecha(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso + "T00:00:00")
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
function hoy() { return new Date().toISOString().split("T")[0] }

function emptyVehiculo(): VehiculoPayload {
  return { nombre: "", marca: null, modelo: null, año: null, placas: null, color: null, kmActuales: 0, notas: null }
}
function emptyServicio(vehiculoDocumentId: string): ServicioVehiculoPayload {
  return { vehiculoDocumentId, tipo: "lavado", fecha: hoy(), costo: null, km: null, notas: null, proximaFecha: null, proximoKm: null }
}

export function VehiculosView() {
  const { vehiculos, setVehiculos, loading: loadingV } = useGetVehiculos()
  const [vehiculoActivo, setVehiculoActivo] = useState<string | null>(null)

  const vDoc = vehiculos.find(v => v.documentId === vehiculoActivo) ?? vehiculos[0] ?? null

  const { servicios, setServicios, loading: loadingS } = useGetServicios(vDoc?.documentId ?? null)

  // Modales
  const [modalVeh,  setModalVeh]  = useState(false)
  const [editandoV, setEditandoV] = useState<Vehiculo | null>(null)
  const [formV,     setFormV]     = useState<VehiculoPayload>(emptyVehiculo())
  const [savingV,   setSavingV]   = useState(false)
  const [deletingV, setDeletingV] = useState<string | null>(null)

  const [modalSrv,  setModalSrv]  = useState(false)
  const [formS,     setFormS]     = useState<ServicioVehiculoPayload>(emptyServicio(""))
  const [savingS,   setSavingS]   = useState(false)
  const [deletingS, setDeletingS] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState<TipoServicio | "">("")

  // Próximos servicios
  const proximoServicio = servicios.find(s => s.proximaFecha || s.proximoKm)

  // ── Vehículo CRUD ─────────────────────────────────────────────────────────

  function abrirNuevoVeh() {
    setEditandoV(null); setFormV(emptyVehiculo()); setModalVeh(true)
  }
  function abrirEditarVeh(v: Vehiculo) {
    setEditandoV(v)
    setFormV({ nombre: v.nombre, marca: v.marca, modelo: v.modelo, año: v.año, placas: v.placas, color: v.color, kmActuales: v.kmActuales, notas: v.notas })
    setModalVeh(true)
  }
  async function guardarVeh() {
    if (!formV.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSavingV(true)
    try {
      if (editandoV) {
        const u = await updateVehiculo(editandoV.documentId, formV)
        setVehiculos(prev => prev.map(v => v.documentId === u.documentId ? u : v))
        toast.success("Vehículo actualizado")
      } else {
        const n = await createVehiculo(formV)
        setVehiculos(prev => [...prev, n])
        setVehiculoActivo(n.documentId)
        toast.success("Vehículo agregado")
      }
      setModalVeh(false)
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error al guardar") }
    finally { setSavingV(false) }
  }
  async function borrarVeh(v: Vehiculo) {
    if (!confirm(`¿Eliminar ${v.nombre}?`)) return
    setDeletingV(v.documentId)
    try {
      await deleteVehiculo(v.documentId)
      setVehiculos(prev => prev.filter(x => x.documentId !== v.documentId))
      if (vehiculoActivo === v.documentId) setVehiculoActivo(null)
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDeletingV(null) }
  }

  // ── Servicio CRUD ──────────────────────────────────────────────────────────

  function abrirNuevoSrv() {
    if (!vDoc) return
    setFormS(emptyServicio(vDoc.documentId)); setModalSrv(true)
  }
  async function guardarSrv() {
    if (!formS.fecha) { toast.error("La fecha es obligatoria"); return }
    setSavingS(true)
    try {
      const n = await createServicio(formS)
      setServicios(prev => [n, ...prev])
      toast.success("Servicio registrado")
      setModalSrv(false)
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error al guardar") }
    finally { setSavingS(false) }
  }
  async function borrarSrv(s: ServicioVehiculo) {
    if (!confirm("¿Eliminar este servicio?")) return
    setDeletingS(s.documentId)
    try {
      await deleteServicio(s.documentId)
      setServicios(prev => prev.filter(x => x.documentId !== s.documentId))
      toast.success("Eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDeletingS(null) }
  }

  const serviciosFiltrados = servicios.filter(s => !filtroTipo || s.tipo === filtroTipo)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
            <Car className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Vehículos</h1>
            <p className="text-xs text-slate-500">Mantenimiento y servicios</p>
          </div>
        </div>
        <button type="button" onClick={abrirNuevoVeh}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Agregar vehículo
        </button>
      </div>

      {loadingV ? (
        <p className="text-sm text-slate-500 py-10 text-center">Cargando...</p>
      ) : vehiculos.length === 0 ? (
        <div className="text-center py-14 text-slate-600">
          <Car size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin vehículos registrados.</p>
          <button type="button" onClick={abrirNuevoVeh} className="mt-3 text-xs text-teal-500 hover:text-teal-400">+ Agregar el primero</button>
        </div>
      ) : (
        <>
          {/* Selector de vehículo */}
          {vehiculos.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {vehiculos.map(v => (
                <button type="button" key={v.documentId}
                  onClick={() => setVehiculoActivo(v.documentId)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    (vDoc?.documentId === v.documentId)
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                      : "border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}>
                  🚗 {v.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Ficha del vehículo */}
          {vDoc && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-100">{vDoc.nombre}</h2>
                  <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                    {vDoc.marca && <span>{vDoc.marca} {vDoc.modelo}</span>}
                    {vDoc.año   && <span>· {vDoc.año}</span>}
                    {vDoc.color && <span>· {vDoc.color}</span>}
                    {vDoc.placas && <span className="font-mono">· {vDoc.placas}</span>}
                  </div>
                  {vDoc.kmActuales > 0 && (
                    <p className="text-xs text-slate-500">{vDoc.kmActuales.toLocaleString()} km actuales</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => abrirEditarVeh(vDoc)} title="Editar"
                    className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => borrarVeh(vDoc)} disabled={deletingV === vDoc.documentId} title="Eliminar"
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800 transition disabled:opacity-40">
                    {deletingV === vDoc.documentId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Próximo servicio */}
              {proximoServicio && (
                <div className="mt-3 flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400">
                  <AlertCircle size={12} />
                  <span>Próximo servicio:
                    {proximoServicio.proximaFecha && <> {fmtFecha(proximoServicio.proximaFecha)}</>}
                    {proximoServicio.proximoKm && <> · a los {proximoServicio.proximoKm.toLocaleString()} km</>}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Log de servicios */}
          {vDoc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Wrench size={14} className="text-teal-400" /> Historial de servicios
                  <span className="text-[10px] text-slate-600 font-normal">({servicios.length})</span>
                </h3>
                <button type="button" onClick={abrirNuevoSrv}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors">
                  <Plus size={13} /> Registrar servicio
                </button>
              </div>

              {/* Filtro tipo */}
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => setFiltroTipo("")}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroTipo === "" ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                  Todos
                </button>
                {TIPOS_SERVICIO.map(t => (
                  <button type="button" key={t} onClick={() => setFiltroTipo(filtroTipo === t ? "" : t)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${filtroTipo === t ? SERVICIO_COLOR[t] : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                    {SERVICIO_LABEL[t]}
                  </button>
                ))}
              </div>

              {loadingS ? (
                <p className="text-xs text-slate-500 py-4 text-center">Cargando servicios...</p>
              ) : serviciosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                  <Wrench size={24} className="mx-auto mb-1.5 opacity-30" />
                  <p className="text-xs">Sin servicios registrados aún.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
                  {serviciosFiltrados.map(s => (
                    <div key={s.documentId} className="flex items-center gap-3 px-4 py-3">
                      <div className="shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${SERVICIO_COLOR[s.tipo]}`}>
                          {SERVICIO_LABEL[s.tipo]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300">{fmtFecha(s.fecha)}</p>
                        <div className="flex gap-3 text-[11px] text-slate-500 mt-0.5">
                          {s.costo != null && <span>${s.costo.toLocaleString()}</span>}
                          {s.km    != null && <span>{s.km.toLocaleString()} km</span>}
                          {s.notas && <span className="truncate">{s.notas}</span>}
                        </div>
                        {(s.proximaFecha || s.proximoKm) && (
                          <p className="text-[10px] text-amber-400/70 mt-0.5">
                            Próximo: {s.proximaFecha ? fmtFecha(s.proximaFecha) : ""}{s.proximoKm ? ` · ${s.proximoKm.toLocaleString()} km` : ""}
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => borrarSrv(s)} disabled={deletingS === s.documentId} title="Eliminar"
                        className="p-1.5 text-slate-700 hover:text-red-400 rounded hover:bg-slate-800 transition disabled:opacity-40 shrink-0">
                        {deletingS === s.documentId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Vehículo */}
      {modalVeh && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setModalVeh(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editandoV ? "Editar vehículo" : "Nuevo vehículo"}</h2>
              <button type="button" onClick={() => setModalVeh(false)} title="Cerrar" className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={lbl} htmlFor="v-nombre">Nombre *</label>
                <input id="v-nombre" autoFocus value={formV.nombre} onChange={e => setFormV(f => ({ ...f, nombre: e.target.value }))} placeholder="Mi Corolla, El Tsuru..." className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="v-marca">Marca</label>
                  <input id="v-marca" value={formV.marca ?? ""} onChange={e => setFormV(f => ({ ...f, marca: e.target.value || null }))} placeholder="Toyota" className={inp} />
                </div>
                <div>
                  <label className={lbl} htmlFor="v-modelo">Modelo</label>
                  <input id="v-modelo" value={formV.modelo ?? ""} onChange={e => setFormV(f => ({ ...f, modelo: e.target.value || null }))} placeholder="Corolla" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="v-año">Año</label>
                  <input id="v-año" type="number" value={formV.año ?? ""} onChange={e => setFormV(f => ({ ...f, año: parseInt(e.target.value) || null }))} placeholder="2020" className={inp} />
                </div>
                <div>
                  <label className={lbl} htmlFor="v-color">Color</label>
                  <input id="v-color" value={formV.color ?? ""} onChange={e => setFormV(f => ({ ...f, color: e.target.value || null }))} placeholder="Blanco" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="v-placas">Placas</label>
                  <input id="v-placas" value={formV.placas ?? ""} onChange={e => setFormV(f => ({ ...f, placas: e.target.value || null }))} placeholder="ABC-1234" className={inp} />
                </div>
                <div>
                  <label className={lbl} htmlFor="v-km">Km actuales</label>
                  <input id="v-km" type="number" value={formV.kmActuales} onChange={e => setFormV(f => ({ ...f, kmActuales: parseInt(e.target.value) || 0 }))} placeholder="45000" className={inp} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button type="button" onClick={() => setModalVeh(false)} className="flex-1 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={guardarVeh} disabled={savingV}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg transition">
                {savingV ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {savingV ? "Guardando..." : editandoV ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Servicio */}
      {modalSrv && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setModalSrv(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">Registrar servicio</h2>
              <button type="button" onClick={() => setModalSrv(false)} title="Cerrar" className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="s-tipo">Tipo *</label>
                  <select id="s-tipo" value={formS.tipo} onChange={e => setFormS(f => ({ ...f, tipo: e.target.value as TipoServicio }))} className={inp}>
                    {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{SERVICIO_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl} htmlFor="s-fecha">Fecha *</label>
                  <input id="s-fecha" type="date" value={formS.fecha} onChange={e => setFormS(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="s-costo">Costo ($)</label>
                  <input id="s-costo" type="number" value={formS.costo ?? ""} onChange={e => setFormS(f => ({ ...f, costo: parseFloat(e.target.value) || null }))} placeholder="350" className={inp} />
                </div>
                <div>
                  <label className={lbl} htmlFor="s-km">Km al servicio</label>
                  <input id="s-km" type="number" value={formS.km ?? ""} onChange={e => setFormS(f => ({ ...f, km: parseInt(e.target.value) || null }))} placeholder="45000" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl} htmlFor="s-notas">Notas</label>
                <input id="s-notas" value={formS.notas ?? ""} onChange={e => setFormS(f => ({ ...f, notas: e.target.value || null }))} placeholder="Taller, marca de aceite..." className={inp} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500 font-medium">Próximo servicio (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl} htmlFor="s-pfecha">Fecha</label>
                    <input id="s-pfecha" type="date" value={formS.proximaFecha ?? ""} onChange={e => setFormS(f => ({ ...f, proximaFecha: e.target.value || null }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl} htmlFor="s-pkm">Km</label>
                    <input id="s-pkm" type="number" value={formS.proximoKm ?? ""} onChange={e => setFormS(f => ({ ...f, proximoKm: parseInt(e.target.value) || null }))} placeholder="50000" className={inp} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button type="button" onClick={() => setModalSrv(false)} className="flex-1 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={guardarSrv} disabled={savingS}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg transition">
                {savingS ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {savingS ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
