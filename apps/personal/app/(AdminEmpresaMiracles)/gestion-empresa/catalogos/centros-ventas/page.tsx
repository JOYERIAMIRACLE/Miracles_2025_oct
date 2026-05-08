"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useGetCentrosVenta } from "@/api/centro-venta/getCentrosVenta"
import { createCentroVenta } from "@/api/centro-venta/createCentroVenta"
import { updateCentroVenta } from "@/api/centro-venta/updateCentroVenta"
import { deleteCentroVenta } from "@/api/centro-venta/deleteCentroVenta"
import { CentroVentaType, CentroVentaPayload } from "@/types/centro-venta"

const emptyForm: CentroVentaPayload = { nombre: null, codigo: null }

const inputClass = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"

export default function CentrosVentasPage() {
  const { centrosVenta: dataStrapi, loading, error } = useGetCentrosVenta()
  const [centrosVenta, setCentrosVenta]           = useState<CentroVentaType[]>([])
  const [search, setSearch]                       = useState("")
  const [modalOpen, setModalOpen]                 = useState(false)
  const [editing, setEditing]                     = useState<CentroVentaType | null>(null)
  const [form, setForm]                           = useState<CentroVentaPayload>(emptyForm)
  const [saving, setSaving]                       = useState(false)
  const [confirmDeleteId, setConfirmDeleteId]     = useState<string | null>(null)

  useEffect(() => { setCentrosVenta(dataStrapi ?? []) }, [dataStrapi])

  const filtered = centrosVenta.filter(c =>
    (c.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.codigo ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const handleNuevo = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const handleEdit = (item: CentroVentaType) => {
    setEditing(item)
    setForm({ nombre: item.nombre, codigo: item.codigo })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre?.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateCentroVenta(editing.documentId, form)
        setCentrosVenta(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Centro de venta actualizado")
      } else {
        const nuevo = await createCentroVenta(form)
        setCentrosVenta(prev => [...prev, nuevo])
        toast.success("Centro de venta creado")
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deleteCentroVenta(documentId)
      setCentrosVenta(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Centro de venta eliminado")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  if (error) return <div className="flex items-center justify-center min-h-[400px] text-sm text-red-500">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Centros de Venta</h1>
          <p className="text-sm text-zinc-500">Define los canales por donde ingresan tus ventas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 w-[200px] lg:w-[260px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
          <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all">
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Canal de Venta</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Código</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 3 }).map((_, j) => (
                  <td key={j} className="p-5"><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtered.map(item => (
                <tr key={item.documentId} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default">
                  <td className="p-5 align-middle font-semibold text-zinc-900 dark:text-zinc-100">{item.nombre ?? "—"}</td>
                  <td className="p-5 align-middle">
                    {item.codigo ? (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                        {item.codigo}
                      </span>
                    ) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="p-5 align-middle text-right">
                    {confirmDeleteId === item.documentId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-500">¿Eliminar?</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.documentId)}>Sí</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:bg-zinc-100" onClick={() => setConfirmDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => setConfirmDeleteId(item.documentId)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {search ? `Sin resultados para "${search}"` : "No hay centros de venta registrados."}
            </div>
          )}
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{editing ? "Editar Centro de Venta" : "Nuevo Centro de Venta"}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Canal de Venta <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Instagram, WhatsApp" value={form.nombre ?? ""} onChange={e => setForm(f => ({ ...f, nombre: e.target.value || null }))} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Código</label>
                <input type="text" placeholder="Ej. IG-01" value={form.codigo ?? ""} onChange={e => setForm(f => ({ ...f, codigo: e.target.value || null }))} className={inputClass} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
