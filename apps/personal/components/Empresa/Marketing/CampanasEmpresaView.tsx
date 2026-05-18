"use client"

import { useState, useMemo } from "react"
import { Plus, X, ExternalLink, Pencil, Loader2, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, MESES, MesCampana } from "@/types/campana"

const UNIDAD = "Miracles"
const ANIO   = new Date().getFullYear()

const fmtFecha = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) : null

type FormSimple = {
  tema:        string
  descripcion: string
  fecha:       string
  archivo:     string
  mes:         MesCampana
  anio:        number
}

function emptyForm(): FormSimple {
  return {
    tema: "", descripcion: "", fecha: "", archivo: "",
    mes: MESES[new Date().getMonth()], anio: ANIO,
  }
}

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"

export function CampanasEmpresaView() {
  const { campanas: all, setCampanas, loading } = useGetCampanas()

  const [mesFiltro,  setMesFiltro]  = useState<MesCampana | "todos">("todos")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<CampanaType | null>(null)
  const [form,       setForm]       = useState<FormSimple>(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [delId,      setDelId]      = useState<string | null>(null)

  // Leer campañas Miracles: tema → categoria, descripcion → notas, fecha → semana1Fecha, archivo → semana1Archivo
  const campanas = useMemo(() =>
    all
      .filter(c => c.unidadNegocio?.toLowerCase() === UNIDAD.toLowerCase())
      .filter(c => mesFiltro === "todos" || c.mes === mesFiltro)
      .sort((a, b) => (a.semana1Fecha ?? "").localeCompare(b.semana1Fecha ?? "")),
    [all, mesFiltro]
  )

  function openNuevo() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEditar(c: CampanaType) {
    setEditing(c)
    setForm({
      tema:        c.categoria ?? "",
      descripcion: c.notas ?? "",
      fecha:       c.semana1Fecha ?? "",
      archivo:     c.semana1Archivo ?? "",
      mes:         c.mes,
      anio:        c.anio,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.tema.trim()) { toast.error("El tema es obligatorio"); return }
    setSaving(true)
    const mes: MesCampana = form.fecha
      ? MESES[new Date(form.fecha + "T00:00:00").getMonth()]
      : form.mes
    try {
      const payload = {
        unidadNegocio: UNIDAD,
        mes,
        anio:         form.fecha ? new Date(form.fecha + "T00:00:00").getFullYear() : form.anio,
        tipo:         "completa" as const,
        orden:        0,
        categoria:    form.tema.trim(),
        atributos:    null,
        notas:        form.descripcion.trim() || null,
        semana1Fecha: form.fecha || null,
        semana1Titulo: null,
        semana1Partes: null,
        semana1Archivo: form.archivo.trim() || null,
        semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
        semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
        semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
      }
      if (editing) {
        const updated = await updateCampana(editing.documentId, payload)
        setCampanas(prev => prev.map(c => c.documentId === editing.documentId ? updated : c))
        toast.success("Publicación actualizada")
      } else {
        const nueva = await createCampana(payload)
        setCampanas(prev => [...prev, nueva])
        toast.success("Publicación creada")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteCampana(documentId)
      setCampanas(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Publicación eliminada")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDelId(null)
    }
  }

  // Agrupar por mes para mostrar secciones
  const porMes = useMemo(() => {
    const map = new Map<string, CampanaType[]>()
    campanas.forEach(c => {
      const key = `${c.anio}-${c.mes}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
    return [...map.entries()]
  }, [campanas])

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select title="Filtrar por mes" value={mesFiltro} onChange={e => setMesFiltro(e.target.value as MesCampana | "todos")}
          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="todos">Todos los meses</option>
          {MESES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-slate-500">{campanas.length} publicación{campanas.length !== 1 ? "es" : ""}</span>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nueva publicación
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : campanas.length === 0 ? (
        <div className="py-20 text-center text-slate-600 bg-slate-900 border border-slate-800 rounded-xl">
          <Megaphone size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Sin publicaciones registradas.</p>
          <p className="text-xs mt-1 text-slate-700">Crea tu primera publicación con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {porMes.map(([key, items]) => (
            <div key={key}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
                {items[0].mes} {items[0].anio}
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.map(c => (
                  <div key={c.documentId}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                    {/* Fecha */}
                    {c.semana1Fecha && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5">
                          {fmtFecha(c.semana1Fecha)}
                        </span>
                      </div>
                    )}
                    {/* Tema */}
                    <p className="text-sm font-semibold text-slate-100 leading-snug">{c.categoria}</p>
                    {/* Descripcion */}
                    {c.notas && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{c.notas}</p>
                    )}
                    {/* Archivo */}
                    {c.semana1Archivo && (
                      <a href={c.semana1Archivo.startsWith("http") ? c.semana1Archivo : `https://${c.semana1Archivo}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 hover:underline mt-auto"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink size={10} /> Ver archivo / link
                      </a>
                    )}
                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 pt-1 border-t border-slate-800">
                      <button type="button" onClick={() => openEditar(c)}
                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition">
                        <Pencil size={10} /> Editar
                      </button>
                      {delId === c.documentId ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-[10px] text-slate-600">¿Eliminar?</span>
                          <button type="button" onClick={() => handleDelete(c.documentId)}
                            className="text-[10px] text-red-400 hover:text-red-300 px-1">Sí</button>
                          <button type="button" onClick={() => setDelId(null)}
                            className="text-[10px] text-slate-500 px-1">No</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setDelId(c.documentId)}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-800 transition ml-auto">
                          <X size={10} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar publicación" : "Nueva publicación"}</h2>
              <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tema <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Día de las madres — anillos en oro" value={form.tema}
                  onChange={e => setForm(f => ({ ...f, tema: e.target.value }))} className={inp} autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                <textarea placeholder="Idea del contenido, copy, detalles…" value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3} className={inp + " resize-y h-auto py-2"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha de publicación</label>
                  <input type="date" title="Fecha de publicación" value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Mes (si no hay fecha)</label>
                  <select title="Mes de la publicación" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
                    className={inp + " cursor-pointer"}>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Link / Archivo</label>
                <input type="text" placeholder="https://drive.google.com/… o cualquier link" value={form.archivo}
                  onChange={e => setForm(f => ({ ...f, archivo: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
