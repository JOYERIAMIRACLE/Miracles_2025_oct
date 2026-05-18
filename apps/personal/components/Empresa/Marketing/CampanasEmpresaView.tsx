"use client"

import { useState, useMemo } from "react"
import { Plus, X, ExternalLink, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana } from "@/types/campana"

const UNIDAD = "Miracles"
const ANIO   = new Date().getFullYear()
const SEMANAS = [1, 2, 3, 4] as const

const fmtFecha = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : null

function emptyForm(): CampanaPayload {
  return {
    unidadNegocio: UNIDAD, mes: MESES[new Date().getMonth()], anio: ANIO,
    tipo: "completa", orden: 0, categoria: null, atributos: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
    notas: null,
  }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"

function ArchivoLink({ url }: { url: string | null }) {
  if (!url?.trim()) return null
  if (!url.startsWith("http")) return <span className="text-[10px] text-slate-400 break-all">{url}</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 hover:underline">
      <ExternalLink size={9} /> Ver
    </a>
  )
}

function PartesBadges({ texto }: { texto: string | null }) {
  if (!texto?.trim()) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {texto.split(/[\n,]+/).map(p => p.trim()).filter(Boolean).map((p, i) => (
        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300">{p}</span>
      ))}
    </div>
  )
}

export function CampanasEmpresaView() {
  const { campanas: all, setCampanas, loading } = useGetCampanas()

  const [mesFiltro,  setMesFiltro]  = useState<MesCampana>(MESES[new Date().getMonth()])
  const [anioFiltro, setAnioFiltro] = useState(ANIO)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<CampanaType | null>(null)
  const [form,       setForm]       = useState<CampanaPayload>(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const campanas = useMemo(() =>
    all
      .filter(c => c.unidadNegocio?.toLowerCase() === UNIDAD.toLowerCase() && c.mes === mesFiltro && c.anio === anioFiltro)
      .sort((a, b) => a.orden - b.orden),
    [all, mesFiltro, anioFiltro]
  )

  function openNuevo() {
    setEditing(null)
    setForm({ ...emptyForm(), mes: mesFiltro, anio: anioFiltro })
    setModalOpen(true)
  }

  function openEditar(c: CampanaType) {
    setEditing(c)
    setForm({ ...c } as CampanaPayload)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.categoria?.trim()) { toast.error("La categoría es obligatoria"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateCampana(editing.documentId, { ...form, unidadNegocio: UNIDAD })
        setCampanas(prev => prev.map(c => c.documentId === editing.documentId ? updated : c))
        toast.success("Campaña actualizada")
      } else {
        const nueva = await createCampana({ ...form, unidadNegocio: UNIDAD })
        setCampanas(prev => [...prev, nueva])
        toast.success("Campaña creada")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: CampanaType) {
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Campaña eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const setS = (n: 1|2|3|4, campo: string, val: string) =>
    setForm(f => ({ ...f, [`semana${n}${campo}`]: val || null }))

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Filtros de mes/año */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value as MesCampana)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          {MESES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={anioFiltro} onChange={e => setAnioFiltro(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          {[ANIO - 1, ANIO, ANIO + 1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-sm text-slate-500">{campanas.length} campaña{campanas.length !== 1 ? "s" : ""}</span>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nueva campaña
        </button>
      </div>

      {/* Lista de campañas */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
        ))}</div>
      ) : campanas.length === 0 ? (
        <div className="py-16 text-center text-slate-600 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm">No hay campañas para {mesFiltro} {anioFiltro}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campanas.map(c => {
            const isOpen = expanded === c.documentId
            return (
              <div key={c.documentId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : c.documentId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 shrink-0">
                      #{c.orden || "—"}
                    </span>
                    <p className="text-sm font-semibold text-slate-200 truncate">{c.categoria ?? "Sin categoría"}</p>
                    {c.atributos && <p className="text-xs text-slate-500 truncate hidden md:block">{c.atributos}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={e => { e.stopPropagation(); openEditar(c) }}
                      className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); handleDelete(c) }}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                      <X size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-800 px-4 py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {SEMANAS.map(n => {
                        const fecha   = c[`semana${n}Fecha` as keyof CampanaType] as string | null
                        const titulo  = c[`semana${n}Titulo` as keyof CampanaType] as string | null
                        const partes  = c[`semana${n}Partes` as keyof CampanaType] as string | null
                        const archivo = c[`semana${n}Archivo` as keyof CampanaType] as string | null
                        if (!fecha && !titulo && !partes && !archivo) return null
                        return (
                          <div key={n} className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-[10px] font-semibold text-blue-400 mb-1">Semana {n} · {fmtFecha(fecha) ?? "—"}</p>
                            {titulo && <p className="text-xs text-slate-300 font-medium">{titulo}</p>}
                            <PartesBadges texto={partes} />
                            <ArchivoLink url={archivo} />
                          </div>
                        )
                      })}
                    </div>
                    {c.notas && <p className="mt-2 text-xs text-slate-500 italic">{c.notas}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar campaña" : "Nueva campaña"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Mes</label>
                  <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))} className={inp}>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Año</label>
                  <input type="number" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Orden</label>
                  <input type="number" min={0} value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Ej. Día de las madres" value={form.categoria ?? ""}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Atributos / Tags</label>
                  <input type="text" placeholder="Ej. oro, plata, regalo" value={form.atributos ?? ""}
                    onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))} className={inp} />
                </div>
              </div>

              {SEMANAS.map(n => (
                <div key={n} className="border border-slate-800 rounded-lg p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-blue-400">Semana {n}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Fecha</label>
                      <input type="date" value={(form[`semana${n}Fecha` as keyof CampanaPayload] as string) ?? ""}
                        onChange={e => setS(n, "Fecha", e.target.value)} className={inp + " text-xs"} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Título</label>
                      <input type="text" placeholder="Título del post" value={(form[`semana${n}Titulo` as keyof CampanaPayload] as string) ?? ""}
                        onChange={e => setS(n, "Titulo", e.target.value)} className={inp + " text-xs"} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Partes / Piezas</label>
                      <input type="text" placeholder="Historia, Reel, Post…" value={(form[`semana${n}Partes` as keyof CampanaPayload] as string) ?? ""}
                        onChange={e => setS(n, "Partes", e.target.value)} className={inp + " text-xs"} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Archivo / Link</label>
                      <input type="text" placeholder="https://…" value={(form[`semana${n}Archivo` as keyof CampanaPayload] as string) ?? ""}
                        onChange={e => setS(n, "Archivo", e.target.value)} className={inp + " text-xs"} />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Notas</label>
                <textarea placeholder="Observaciones generales…" value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  rows={2} className={inp + " resize-none h-auto py-2"} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
