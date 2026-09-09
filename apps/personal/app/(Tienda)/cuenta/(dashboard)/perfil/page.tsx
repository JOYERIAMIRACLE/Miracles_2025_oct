"use client"
import { useEffect, useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { useClientePortal } from "@/hooks/useClientePortal"
import { actualizarMiCliente } from "@/api/clientePortal/getMisDatos"

export default function PerfilPage() {
  const { usuario, contacto, loading, reload } = useClientePortal()
  const [nombre,   setNombre]   = useState("")
  const [telefono, setTelefono] = useState("")
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    setNombre(contacto?.nombre ?? usuario?.username ?? "")
    setTelefono(contacto?.telefono ?? "")
  }, [contacto, usuario])

  async function guardar() {
    if (!contacto) return
    setSaving(true)
    try {
      await actualizarMiCliente(contacto.documentId, { nombre: nombre.trim(), telefono: telefono.trim() || null })
      toast.success("Perfil actualizado")
      reload()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mi perfil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tus datos de contacto.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-16">Cargando…</p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 max-w-md">
          <div>
            <label htmlFor="nombre" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nombre completo</label>
            <input id="nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all" />
          </div>
          <div>
            <label htmlFor="telefono" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Teléfono</label>
            <input id="telefono" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="55 0000 0000"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Email</label>
            <div className="flex items-center gap-2 h-10 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 px-3 text-sm text-gray-500 dark:text-gray-400">
              <Mail size={14} className="shrink-0" /> {usuario?.email}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">El correo de tu cuenta no se puede cambiar por aquí todavía.</p>
          </div>
          <button type="button" onClick={guardar} disabled={saving}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />} Guardar cambios
          </button>
        </div>
      )}
    </div>
  )
}
