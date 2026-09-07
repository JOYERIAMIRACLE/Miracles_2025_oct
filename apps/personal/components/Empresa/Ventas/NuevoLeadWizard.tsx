"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Check, ChevronRight, Plus, Search, UserCheck, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import {
  ClienteEmpresa, ClientePayload,
  ESTADOS_CIVILES, EstadoCivil,
  SEGMENTOS, SegmentoCliente,
  SEXOS, Sexo,
  FUNNEL_COLOR,
} from "@/types/clienteEmpresa"
import { DropdownPicker } from "../../Shared/DropdownPicker"
import { CalendarioPicker } from "../../Shared/CalendarioPicker"
import { CANALES, CanalIcon } from "./PipelineView"

type Paso = "buscar" | "contacto" | "lead"

type ContactoForm = {
  nombre:          string
  telefono:        string | null
  email:           string | null
  direccion:       string | null
  estadoCivil:     EstadoCivil | null
  sexo:            Sexo | null
  fechaNacimiento: string | null
  segmento:        SegmentoCliente | null
  ocasionFrecuente: string | null
}

type LeadForm = {
  origenContacto: string | null
  canalContacto:  string | null
  campanaOrigen:  string | null
  notas:          string | null
}

const emptyContacto = (): ContactoForm => ({
  nombre: "", telefono: null, email: null, direccion: null,
  estadoCivil: null, sexo: null, fechaNacimiento: null,
  segmento: null, ocasionFrecuente: null,
})

const emptyLead = (): LeadForm => ({
  origenContacto: null, canalContacto: null, campanaOrigen: null, notas: null,
})

const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-400 dark:focus:border-slate-500"
const lbl = "block text-[11px] text-slate-500 dark:text-slate-500 mb-1"

export function NuevoLeadWizard({
  clientes,
  guardarCliente,
  onCreado,
  onCerrar,
}: {
  clientes:       ClienteEmpresa[]
  guardarCliente: (editando: ClienteEmpresa | null, form: ClientePayload) => Promise<ClienteEmpresa>
  onCreado:       (c: ClienteEmpresa) => void
  onCerrar:       () => void
}) {
  const [paso,       setPaso]       = useState<Paso>("buscar")
  const [esNuevo,    setEsNuevo]    = useState(false)
  const [seleccionado, setSeleccionado] = useState<ClienteEmpresa | null>(null)
  const [q,          setQ]          = useState("")
  const [guardando,  setGuardando]  = useState(false)

  const [cf, setCf] = useState<ContactoForm>(emptyContacto())
  const [lf, setLf] = useState<LeadForm>(emptyLead())

  const resultados = useMemo(() => {
    if (!q.trim()) return []
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    const low = norm(q)
    return clientes
      .filter(c =>
        norm(c.nombre).includes(low) ||
        (c.telefono ?? "").includes(low)
      )
      .slice(0, 7)
  }, [q, clientes])

  const nombreDisplay = esNuevo ? cf.nombre : (seleccionado?.nombre ?? "")

  const irAContacto = () => { setEsNuevo(true); setSeleccionado(null); setPaso("contacto") }
  const irALead     = (c: ClienteEmpresa) => { setEsNuevo(false); setSeleccionado(c); setPaso("lead") }
  const irALeadNuevo = () => {
    if (!cf.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setPaso("lead")
  }

  const fnbDate = cf.fechaNacimiento ? new Date(cf.fechaNacimiento + "T12:00:00") : null

  const guardar = async () => {
    if (guardando) return
    setGuardando(true)
    try {
      const now   = new Date().toISOString()
      const payload: ClientePayload = esNuevo
        ? {
            nombre: cf.nombre.trim(),
            telefono: cf.telefono, email: cf.email, direccion: cf.direccion,
            estadoCivil: cf.estadoCivil, sexo: cf.sexo,
            fechaNacimiento: cf.fechaNacimiento,
            segmento: cf.segmento, ocasionFrecuente: cf.ocasionFrecuente,
            origenContacto: lf.origenContacto, canalContacto: lf.canalContacto,
            campanaOrigen: lf.campanaOrigen, notas: lf.notas,
            Funnel: "Lead", Estado: "Activo", calificado: false, fechaLead: now,
          }
        : {
            nombre: seleccionado!.nombre,
            origenContacto: lf.origenContacto, canalContacto: lf.canalContacto,
            campanaOrigen: lf.campanaOrigen, notas: lf.notas,
            Funnel: "Lead", calificado: false, fechaLead: now,
          }

      const creado = await guardarCliente(esNuevo ? null : seleccionado, payload)
      toast.success(`Lead "${creado.nombre}" creado`)
      onCreado(creado)
      onCerrar()
    } catch {
      toast.error("Error al crear el lead")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            {paso !== "buscar" && (
              <button type="button" onClick={() => setPaso(paso === "lead" && esNuevo ? "contacto" : "buscar")}
                className="p-1 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 rounded transition">
                <ArrowLeft size={15} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {paso === "buscar"  ? "Agregar lead" :
                 paso === "contacto"? "Nuevo contacto" :
                                     `Lead — ${nombreDisplay || "contacto"}`}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-500">
                {paso === "buscar"  ? "¿Existe este contacto?" :
                 paso === "contacto"? "Paso 1 de 2 — datos del contacto" :
                                     esNuevo ? "Paso 2 de 2 — datos del lead" : "Datos del lead"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onCerrar}
            className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Paso 1: Buscar ── */}
          {paso === "buscar" && (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" />
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar por nombre o teléfono…"
                  className={`${inp} pl-8`}
                />
              </div>

              {q.trim() && resultados.length === 0 && (
                <p className="text-[12px] text-slate-400 dark:text-slate-600 text-center py-2">Sin resultados</p>
              )}

              {resultados.length > 0 && (
                <div className="space-y-1">
                  {resultados.map(c => (
                    <button key={c.documentId} type="button"
                      onClick={() => irALead(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-violet-50 dark:hover:bg-violet-500/10 border border-slate-200 dark:border-slate-800 transition group">
                      <UserCheck size={14} className="shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.nombre}</p>
                        {c.telefono && <p className="text-[11px] text-slate-400 dark:text-slate-600">{c.telefono}</p>}
                      </div>
                      {c.Funnel && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${FUNNEL_COLOR[c.Funnel]}`}>
                          {c.Funnel}
                        </span>
                      )}
                      <ChevronRight size={13} className="shrink-0 text-slate-300 dark:text-slate-700 group-hover:text-violet-400" />
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-1">
                <button type="button" onClick={irAContacto}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-500 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition">
                  <UserPlus size={15} />
                  Crear nuevo contacto
                </button>
              </div>

              {!q.trim() && (
                <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center">
                  Busca primero para evitar duplicados
                </p>
              )}
            </>
          )}

          {/* ── Paso 2: Contacto nuevo ── */}
          {paso === "contacto" && (
            <>
              <div>
                <label className={lbl}>Nombre *</label>
                <input autoFocus value={cf.nombre}
                  onChange={e => setCf(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo" className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Teléfono</label>
                  <input value={cf.telefono ?? ""}
                    onChange={e => setCf(f => ({ ...f, telefono: e.target.value || null }))}
                    placeholder="55 0000 0000" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" value={cf.email ?? ""}
                    onChange={e => setCf(f => ({ ...f, email: e.target.value || null }))}
                    placeholder="correo@email.com" className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Dirección</label>
                <input value={cf.direccion ?? ""}
                  onChange={e => setCf(f => ({ ...f, direccion: e.target.value || null }))}
                  placeholder="Calle, número, colonia, ciudad…" className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Estado civil</label>
                  <DropdownPicker label="Estado civil" value={cf.estadoCivil ?? ""}
                    onChange={v => setCf(f => ({ ...f, estadoCivil: (v || null) as EstadoCivil | null }))}
                    placeholder="— Sin especificar —"
                    options={[{ value: "", label: "— Sin especificar —" }, ...ESTADOS_CIVILES.map(e => ({ value: e, label: e }))]} />
                </div>
                <div>
                  <label className={lbl}>Sexo</label>
                  <DropdownPicker label="Sexo" value={cf.sexo ?? ""}
                    onChange={v => setCf(f => ({ ...f, sexo: (v || null) as Sexo | null }))}
                    placeholder="— Sin especificar —"
                    options={[{ value: "", label: "— Sin especificar —" }, ...SEXOS.map(s => ({ value: s, label: s }))]} />
                </div>
              </div>

              <div>
                <label className={lbl}>Fecha de nacimiento</label>
                <CalendarioPicker
                  label="Fecha de nacimiento"
                  value={fnbDate}
                  max={new Date()}
                  onChange={d => setCf(f => ({ ...f, fechaNacimiento: d.toISOString().slice(0, 10) }))}
                  onClear={() => setCf(f => ({ ...f, fechaNacimiento: null }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Tipo de cliente</label>
                  <DropdownPicker label="Tipo de cliente" value={cf.segmento ?? ""}
                    onChange={v => setCf(f => ({ ...f, segmento: (v || null) as SegmentoCliente | null }))}
                    placeholder="— Sin segmento —"
                    options={[{ value: "", label: "— Sin segmento —" }, ...SEGMENTOS.map(s => ({ value: s, label: s }))]} />
                </div>
                <div>
                  <label className={lbl}>Ocasión especial</label>
                  <input value={cf.ocasionFrecuente ?? ""}
                    onChange={e => setCf(f => ({ ...f, ocasionFrecuente: e.target.value || null }))}
                    placeholder="Aniversario, cumpleaños…" className={inp} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setPaso("buscar")}
                  className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg hover:text-slate-800 dark:hover:text-slate-200 transition">
                  Cancelar
                </button>
                <button type="button" onClick={irALeadNuevo}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* ── Paso 3: Lead ── */}
          {paso === "lead" && (
            <>
              {!esNuevo && seleccionado && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <UserCheck size={14} className="text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{seleccionado.nombre}</p>
                    {seleccionado.telefono && <p className="text-[11px] text-slate-400 dark:text-slate-600">{seleccionado.telefono}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className={lbl}>Origen</label>
                <input value={lf.origenContacto ?? ""}
                  onChange={e => setLf(f => ({ ...f, origenContacto: e.target.value || null }))}
                  placeholder="Referido, Google, feria, visita espontánea…"
                  className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Medio / Canal</label>
                  <DropdownPicker label="Canal de contacto" value={lf.canalContacto ?? ""}
                    onChange={v => setLf(f => ({ ...f, canalContacto: v || null }))}
                    placeholder="— Seleccionar —"
                    options={[{ value: "", label: "— Seleccionar —" }, ...CANALES.map(c => ({ value: c, label: c }))]} />
                </div>
                <div>
                  <label className={lbl}>Campaña</label>
                  <input value={lf.campanaOrigen ?? ""}
                    onChange={e => setLf(f => ({ ...f, campanaOrigen: e.target.value || null }))}
                    placeholder="San Valentín 2026…"
                    className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Notas</label>
                <textarea value={lf.notas ?? ""}
                  onChange={e => setLf(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Lo que comentó, qué producto le interesa…"
                  rows={3} className={`${inp} resize-none h-auto py-2`} />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setPaso(esNuevo ? "contacto" : "buscar")}
                  className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg hover:text-slate-800 dark:hover:text-slate-200 transition">
                  Volver
                </button>
                <button type="button" onClick={guardar} disabled={guardando}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
                  <Check size={14} /> {guardando ? "Guardando…" : "Crear lead"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
