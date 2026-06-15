"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Building2, Search, Phone, Mail, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useGetProveedores, createProveedor, updateProveedor, deleteProveedor } from "@/api/proveedor/getProveedores"
import { Proveedor, ProveedorPayload } from "@/types/proveedor"

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition"

const emptyForm = (): ProveedorPayload => ({
  nombre: "", contacto: "", telefono: "", email: "", rfc: "", direccion: "", notas: "", activo: true,
})

export function ProveedoresView() {
  const { proveedores, setProveedores, loading } = useGetProveedores()
  const [search,     setSearch]    = useState("")
  const [modalOpen,  setModalOpen] = useState(false)
  const [editing,    setEditing]   = useState<Proveedor | null>(null)
  const [form,       setForm]      = useState<ProveedorPayload>(emptyForm())
  const [saving,     setSaving]    = useState(false)
  const [delId,      setDelId]     = useState<string | null>(null)

  const filtrados = proveedores.filter(Boolean).filter(p =>
    !search || p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    (p.contacto ?? "").toLowerCase().includes(search.toLowerCase())
  )

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(p: Proveedor) {
    setEditing(p)
    setForm({ nombre: p.nombre, contacto: p.contacto ?? "", telefono: p.telefono ?? "",
      email: p.email ?? "", rfc: p.rfc ?? "", direccion: p.direccion ?? "",
      notas: p.notas ?? "", activo: p.activo })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateProveedor(editing.documentId, form)
        setProveedores(prev => prev.map(p => p.documentId === editing.documentId ? { ...editing, ...updated } : p))
        toast.success("Proveedor actualizado")
      } else {
        const nuevo = await createProveedor(form)
        setProveedores(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        toast.success("Proveedor creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteProveedor(documentId)
      setProveedores(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Eliminado")
    } catch { toast.error("No se pudo eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Building2 size={18} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Proveedores</h1>
            <p className="text-[11px] text-slate-500">{proveedores.length} registrados · {proveedores.filter(p => p?.activo).length} activos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="pl-8 pr-3 h-8 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40 w-44" />
          </div>
          <button type="button" onClick={openNuevo}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition">
            <Plus size={13} /> Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                {["Nombre / Contacto", "Teléfono", "Email", "RFC", "Estado", ""].map(h => (
                  <th key={h} className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(p => (
                <tr key={p.documentId} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{p.nombre}</p>
                    {p.contacto && <p className="text-[11px] text-slate-500 mt-0.5">{p.contacto}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {p.telefono ? <a href={`tel:${p.telefono}`} className="flex items-center gap-1 hover:text-amber-400 transition"><Phone size={11}/>{p.telefono}</a> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {p.email ? <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-amber-400 transition"><Mail size={11}/>{p.email}</a> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.rfc || <span className="text-slate-700">—</span>}</td>
                  <td className="px-4 py-3">
                    {p.activo
                      ? <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle size={11}/>Activo</span>
                      : <span className="flex items-center gap-1 text-[11px] text-slate-600"><XCircle size={11}/>Inactivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    {delId === p.documentId ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">¿Eliminar?</span>
                        <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[10px] text-red-400 px-1">Sí</button>
                        <button type="button" onClick={() => setDelId(null)} className="text-[10px] text-slate-500 px-1">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEditar(p)} className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition"><Pencil size={12}/></button>
                        <button type="button" onClick={() => setDelId(p.documentId)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition"><Trash2 size={12}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtrados.length === 0 && (
            <div className="py-12 text-center">
              <Building2 size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-slate-600 text-sm">{search ? "Sin resultados." : "Sin proveedores registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar proveedor" : "Nuevo proveedor"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded"><X size={15}/></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { label: "Nombre *", key: "nombre", ph: "Ej. Mayoreo Joyero MX" },
                { label: "Contacto", key: "contacto", ph: "Nombre de la persona" },
                { label: "Teléfono", key: "telefono", ph: "55 1234 5678" },
                { label: "Email",    key: "email",    ph: "contacto@proveedor.com" },
                { label: "RFC",      key: "rfc",      ph: "RFC123456ABC" },
                { label: "Dirección",key: "direccion",ph: "Ciudad, Estado" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] text-slate-400 mb-1 block">{f.label}</label>
                  <input className={inp} placeholder={f.ph}
                    value={(form as any)[f.key] ?? ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Notas</label>
                <textarea className={`${inp} h-auto py-2 resize-none`} rows={2}
                  placeholder="Condiciones, tiempos de entrega, etc."
                  value={form.notas ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo ?? true}
                  onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                  className="rounded border-slate-600" />
                <span className="text-xs text-slate-400">Proveedor activo</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="h-8 px-4 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 size={11} className="animate-spin"/>}
                {editing ? "Guardar cambios" : "Crear proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
