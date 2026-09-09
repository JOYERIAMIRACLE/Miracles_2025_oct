"use client"
import { useEffect, useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useClientePortal } from "@/hooks/useClientePortal"
import { actualizarMiCliente } from "@/api/clientePortal/getMisDatos"

export default function DireccionesPage() {
  const { contacto, loading, reload } = useClientePortal()
  const [direccion, setDireccion] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDireccion(contacto?.direccion ?? "") }, [contacto])

  async function guardar() {
    if (!contacto) return
    setSaving(true)
    try {
      await actualizarMiCliente(contacto.documentId, { direccion: direccion.trim() || null })
      toast.success("Dirección guardada")
      reload()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Direcciones</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">La dirección a la que enviamos tus pedidos.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-16">Cargando…</p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold">Dirección de envío</p>
          </div>
          <textarea value={direccion} onChange={e => setDireccion(e.target.value)} rows={3}
            placeholder="Calle, número, colonia, ciudad, estado, código postal…"
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all" />
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />} Guardar dirección
          </button>
        </div>
      )}
    </div>
  )
}
