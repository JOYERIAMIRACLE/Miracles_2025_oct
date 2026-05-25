"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, HardDrive, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useGetMaterialDigital, createMaterialDigital, updateMaterialDigital, deleteMaterialDigital } from "@/api/material-digital/getMaterialDigital"
import { MaterialDigital, MaterialDigitalPayload, TipoMaterialDigital, TIPOS_MATERIAL, TIPO_LABEL, TIPO_BADGE } from "@/types/material-digital"

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"

function emptyForm(): MaterialDigitalPayload {
  return { nombre: "", tipo: "otro", url: null, descripcion: null, notas: null }
}

export function MaterialDigitalView() {
  const { materiales, setMateriales, loading } = useGetMaterialDigital()

  const [filtro,    setFiltro]    = useState<TipoMaterialDigital | "todos">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<MaterialDigital | null>(null)
  const [form,      setForm]      = useState<MaterialDigitalPayload>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

  const filtrados = useMemo(() =>
    filtro === "todos" ? materiales : materiales.filter(m => m.tipo === filtro),
    [materiales, filtro]
  )

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(m: MaterialDigital) {
    setEditing(m)
    setForm({ nombre: m.nombre, tipo: m.tipo, url: m.url, descripcion: m.descripcion, notas: m.notas })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateMaterialDigital(editing.documentId, form)
        setMateriales(prev => prev.map(m => m.documentId === editing.documentId ? updated : m))
        toast.success("Material actualizado")
      } else {
        const nuevo = await createMaterialDigital(form)
        setMateriales(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Material creado")
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
      await deleteMaterialDigital(documentId)
      setMateriales(prev => prev.filter(m => m.documentId !== documentId))
      toast.success("Material eliminado")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDelId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Material Digital</h1>
          <p className="text-sm text-slate-500 mt-0.5">Links y archivos de marca, manuales y recursos digitales</p>
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 transition-colors">
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5">
        {(["todos", ...TIPOS_MATERIAL] as const).map(f => (
          <button key={f} type="button" onClick={() => setFiltro(f)}
            className={`h-7 px-3 text-xs rounded-lg border transition-colors ${
              filtro === f
                ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {f === "todos" ? `Todos (${materiales.length})` : `${TIPO_LABEL[f]} (${materiales.filter(m => m.tipo === f).length})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-16 text-center text-slate-600">
          <HardDrive size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{filtro === "todos" ? "Sin materiales registrados." : "Sin materiales de este tipo."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map(m => (
            <div key={m.documentId} className="group bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{m.nombre}</p>
                  <span className={`mt-1 inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border ${TIPO_BADGE[m.tipo]}`}>
                    {TIPO_LABEL[m.tipo]}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button type="button" onClick={() => openEditar(m)}
                    className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                    <Pencil size={13} />
                  </button>
                  {delId === m.documentId ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleDelete(m.documentId)}
                        className="text-[11px] text-red-400 hover:text-red-300 font-medium px-1">Sí</button>
                      <button type="button" onClick={() => setDelId(null)}
                        className="text-[11px] text-slate-500 px-1">No</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setDelId(m.documentId)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {m.descripcion && <p className="text-xs text-slate-500 line-clamp-2">{m.descripcion}</p>}

              {m.url && (
                <a href={m.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors truncate">
                  <ExternalLink size={11} className="shrink-0" />
                  <span className="truncate">{m.url}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar material" : "Nuevo material"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Nombre <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. Logo principal SVG" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoMaterialDigital }))}
                  className={inp + " cursor-pointer"}>
                  {TIPOS_MATERIAL.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">URL / Link</label>
                <input type="url" placeholder="https://drive.google.com/..." value={form.url ?? ""}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value || null }))} className={inp} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Descripción</label>
                <input type="text" placeholder="Breve descripción del archivo…" value={form.descripcion ?? ""}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 transition">
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
