"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useGetClientes } from "@/api/cliente/getClientes"
import { createCliente } from "@/api/cliente/createCliente"
import { updateCliente } from "@/api/cliente/updateCliente"
import { deleteCliente } from "@/api/cliente/deleteCliente"
import { ClienteType, ClientePayload } from "@/types/cliente"

// ─── Estado vacío del formulario ─────────────────────────────────────────────
const emptyForm: ClientePayload = {
  nombre: "",
  email: null,
  telefono: null,
  direccion: null,
  segmento: null,
  Funnel: null,
  canalContacto: null,
  origenContacto: null,
  Estado: null,
}

// ─── Helpers de color ─────────────────────────────────────────────────────────
const getFunnelColor = (funnel: string | null) => {
  switch (funnel) {
    case "Lead":           return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
    case "Prospecto":      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
    case "Negociacion":    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
    case "Primera compra": return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20"
    case "Recompra":       return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
    default:               return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
  }
}

// ─── Estilos reutilizables para inputs y selects del formulario ───────────────
const inputClass = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
const selectClass = `${inputClass} cursor-pointer`

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ClientesPage() {
  // 1. HOOKS
  const { clientes: dataStrapi, loading, error } = useGetClientes()
  const [clientes, setClientes]               = useState<ClienteType[]>([])
  const [search, setSearch]                   = useState("")
  const [modalOpen, setModalOpen]             = useState(false)
  const [editingCliente, setEditingCliente]   = useState<ClienteType | null>(null)
  const [form, setForm]                       = useState<ClientePayload>(emptyForm)
  const [saving, setSaving]                   = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setClientes(dataStrapi ?? [])
  }, [dataStrapi])

  // 2. LOGS DE DESARROLLO
  if (process.env.NODE_ENV === "development") {
    // console.log("Clientes cargados:", clientes.length)
  }

  // ─── Filtro de búsqueda ─────────────────────────────────────────────────────
  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleNuevo = () => {
    setEditingCliente(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleEdit = (cliente: ClienteType) => {
    setEditingCliente(cliente)
    setForm({
      nombre:         cliente.nombre,
      email:          cliente.email,
      telefono:       cliente.telefono,
      direccion:      cliente.direccion,
      segmento:       cliente.segmento,
      Funnel:         cliente.Funnel,
      canalContacto:  cliente.canalContacto,
      origenContacto: cliente.origenContacto,
      Estado:         cliente.Estado,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setSaving(true)
    try {
      if (editingCliente) {
        const updated = await updateCliente(editingCliente.documentId, form)
        setClientes(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Cliente actualizado")
      } else {
        const nuevo = await createCliente(form)
        setClientes(prev => [...prev, nuevo])
        toast.success("Cliente creado")
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
      await deleteCliente(documentId)
      setClientes(prev => prev.filter(c => c.documentId !== documentId))
      toast.success("Cliente eliminado")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  // 3. GUARDS
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-red-500">
        Error al cargar clientes: {error}
      </div>
    )
  }

  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">

      {/* ── Encabezado y Acciones ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Clientes</h1>
          <p className="text-sm text-zinc-500">Administra tu cartera de clientes, su embudo y métodos de adquisición.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-[200px] lg:w-[280px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <Button
            onClick={handleNuevo}
            className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 rounded-full transition-all"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm backdrop-blur-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Cliente</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Info. Contacto</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Dirección</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Adquisición</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Clasificación</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">

              {/* ── Loading skeleton ── */}
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="p-5">
                      <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Filas de datos ── */}
              {!loading && filtered.map((cliente) => (
                <tr
                  key={cliente.documentId}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default"
                >
                  <td className="p-5 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{cliente.nombre}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{cliente.email}</div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cliente.telefono}</div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]" title={cliente.direccion ?? ""}>
                      {cliente.direccion}
                    </div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{cliente.canalContacto}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{cliente.origenContacto}</span>
                    </div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getFunnelColor(cliente.Funnel)}`}>
                        {cliente.Funnel ?? "—"}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider">
                        {cliente.segmento ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${cliente.Estado?.trim() === "Activo" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
                      {cliente.Estado?.trim() ?? "—"}
                    </span>
                  </td>
                  <td className="p-5 align-middle text-right">
                    {/* Confirmación de borrado inline */}
                    {confirmDeleteId === cliente.documentId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-500">¿Eliminar?</span>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          onClick={() => handleDelete(cliente.documentId)}
                        >
                          Sí
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-zinc-500 hover:bg-zinc-100"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          onClick={() => setConfirmDeleteId(cliente.documentId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {search ? `Sin resultados para "${search}"` : "No hay clientes registrados."}
            </div>
          )}
        </div>
      </Card>

      {/* ── Modal Crear / Editar ───────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">

            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cuerpo del formulario */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej. Sofía Ramírez"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Email y Teléfono */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value || null }))}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Teléfono</label>
                  <input
                    type="text"
                    placeholder="555-0000"
                    value={form.telefono ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value || null }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle, número, ciudad"
                  value={form.direccion ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value || null }))}
                  className={inputClass}
                />
              </div>

              {/* Canal y Origen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Canal de Contacto</label>
                  <input
                    type="text"
                    placeholder="WhatsApp, Instagram..."
                    value={form.canalContacto ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, canalContacto: e.target.value || null }))}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Origen</label>
                  <input
                    type="text"
                    placeholder="Meta Ads, Orgánico..."
                    value={form.origenContacto ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, origenContacto: e.target.value || null }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Segmento y Funnel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Segmento</label>
                  <select
                    title="Segmento del cliente"
                    value={form.segmento ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, segmento: (e.target.value || null) as any }))}
                    className={selectClass}
                  >
                    <option value="">— Sin segmento —</option>
                    <option value="Pareja">Pareja</option>
                    <option value="Matrimonio">Matrimonio</option>
                    <option value="Familiar">Familiar</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Funnel</label>
                  <select
                    title="Etapa del funnel"
                    value={form.Funnel ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, Funnel: (e.target.value || null) as any }))}
                    className={selectClass}
                  >
                    <option value="">— Sin etapa —</option>
                    <option value="Lead">Lead</option>
                    <option value="Prospecto">Prospecto</option>
                    <option value="Negociacion">Negociación</option>
                    <option value="Primera compra">Primera compra</option>
                    <option value="Recompra">Recompra</option>
                  </select>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
                <select
                  title="Estado del cliente"
                  value={form.Estado?.trim() ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, Estado: (e.target.value || null) as any }))}
                  className={selectClass}
                >
                  <option value="">— Sin estado —</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo ">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="ghost"
                className="text-zinc-600 hover:text-zinc-900"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCliente ? "Guardar cambios" : "Crear Cliente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
