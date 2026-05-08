"use client"

import { useState } from "react"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { createCategoria } from "@/api/categoria/createCategoria"
import { updateCategoria } from "@/api/categoria/updateCategoria"
import { deleteCategoria } from "@/api/categoria/deleteCategoria"
import { CategoriaType, CategoriaPayload, TipoCategoria, GrupoCategoria } from "@/types/categoria"
import { Plus, Pencil, Trash2, X, Check, Tag, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const TIPOS: TipoCategoria[]  = ["ingreso", "gasto"]
const GRUPOS: GrupoCategoria[] = ["necesidad", "prescindible", "ahorro", "ingreso"]

const COLORES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#a855f7"]

// Categorías por defecto (migradas de los enums existentes)
const SEMILLAS: CategoriaPayload[] = [
  // Ingresos
  { nombre: "Sueldo",        tipo: "ingreso", grupo: "ingreso",     color: "#10b981", orden: 1, activa: true },
  { nombre: "Freelance",     tipo: "ingreso", grupo: "ingreso",     color: "#14b8a6", orden: 2, activa: true },
  { nombre: "Venta",         tipo: "ingreso", grupo: "ingreso",     color: "#f59e0b", orden: 3, activa: true },
  // Gastos · necesidades
  { nombre: "Vivienda",      tipo: "gasto",   grupo: "necesidad",   color: "#6366f1", orden: 10, activa: true },
  { nombre: "Alimentación",  tipo: "gasto",   grupo: "necesidad",   color: "#ef4444", orden: 11, activa: true },
  { nombre: "Transporte",    tipo: "gasto",   grupo: "necesidad",   color: "#3b82f6", orden: 12, activa: true },
  { nombre: "Servicios",     tipo: "gasto",   grupo: "necesidad",   color: "#8b5cf6", orden: 13, activa: true },
  { nombre: "Salud",         tipo: "gasto",   grupo: "necesidad",   color: "#ec4899", orden: 14, activa: true },
  { nombre: "Educación",     tipo: "gasto",   grupo: "necesidad",   color: "#14b8a6", orden: 15, activa: true },
  // Gastos · prescindibles
  { nombre: "Entretenimiento", tipo: "gasto", grupo: "prescindible", color: "#f97316", orden: 20, activa: true },
  { nombre: "Ropa",          tipo: "gasto",   grupo: "prescindible", color: "#a855f7", orden: 21, activa: true },
  { nombre: "Gastos personales", tipo: "gasto", grupo: "prescindible", color: "#f59e0b", orden: 22, activa: true },
  // Ahorro / inversión
  { nombre: "Ahorro",        tipo: "gasto",   grupo: "ahorro",      color: "#10b981", orden: 30, activa: true },
  { nombre: "Inversión",     tipo: "gasto",   grupo: "ahorro",      color: "#14b8a6", orden: 31, activa: true },
  // Otros
  { nombre: "Otro",          tipo: "gasto",   grupo: "prescindible", color: "#6b7280", orden: 99, activa: true },
]

const emptyForm = (): CategoriaPayload => ({
  nombre: "",
  tipo:   "gasto",
  grupo:  "necesidad",
  icono:  null,
  color:  COLORES[0],
  orden:  0,
  activa: true,
})

export default function CategoriasPage() {
  const { categorias, setCategorias, loading } = useGetCategorias()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<CategoriaPayload>(emptyForm())
  const [editando, setEditando] = useState<CategoriaType | null>(null)
  const [guardando, setGuardando] = useState(false)

  const ingresos = categorias.filter(c => c.tipo === "ingreso")
  const gastos   = categorias.filter(c => c.tipo === "gasto")

  const abrirCrear = () => {
    setForm(emptyForm())
    setEditando(null)
    setMostrarForm(true)
  }

  const abrirEditar = (c: CategoriaType) => {
    setForm({
      nombre: c.nombre,
      tipo:   c.tipo,
      grupo:  c.grupo,
      icono:  c.icono,
      color:  c.color,
      orden:  c.orden,
      activa: c.activa,
    })
    setEditando(c)
    setMostrarForm(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresa un nombre")
      return
    }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCategoria(editando.documentId, form)
        setCategorias(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
        toast.success("Categoría actualizada")
      } else {
        const created = await createCategoria(form)
        setCategorias(prev => [...prev, created])
        toast.success("Categoría creada")
      }
      setMostrarForm(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const sembrar = async () => {
    if (!confirm(`¿Crear ${SEMILLAS.length} categorías por defecto? Omitirá las que ya existan por nombre.`)) return
    setGuardando(true)
    const existentes = new Set(categorias.map(c => c.nombre.toLowerCase()))
    let creadas = 0
    for (const s of SEMILLAS) {
      if (existentes.has(s.nombre.toLowerCase())) continue
      try {
        const c = await createCategoria(s)
        setCategorias(prev => [...prev, c])
        creadas++
      } catch {
        /* ignora duplicados o errores */
      }
    }
    setGuardando(false)
    toast.success(`${creadas} categorías creadas`)
  }

  const borrar = async (c: CategoriaType) => {
    if (!confirm(`¿Eliminar categoría "${c.nombre}"?`)) return
    try {
      await deleteCategoria(c.documentId)
      setCategorias(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Categoría eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-500" />
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground">Define las categorías de ingreso y gasto que usarás en toda la app</p>
        </div>
        <div className="flex gap-2">
          {categorias.length === 0 && (
            <Button onClick={sembrar} size="sm" variant="outline" disabled={guardando}>
              <Sprout size={14} className="mr-1" /> Sembrar defaults
            </Button>
          )}
          <Button onClick={abrirCrear} size="sm">
            <Plus size={14} className="mr-1" /> Nueva categoría
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoriaLista titulo="Ingresos" items={ingresos} onEdit={abrirEditar} onDelete={borrar} />
          <CategoriaLista titulo="Gastos"   items={gastos}   onEdit={abrirEditar} onDelete={borrar} />
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md space-y-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editando ? "Editar" : "Nueva"} categoría</h2>
              <Button variant="ghost" size="sm" onClick={() => setMostrarForm(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Alimentación"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs" htmlFor="cat-tipo">Tipo</Label>
                  <select
                    id="cat-tipo"
                    aria-label="Tipo de categoría"
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value as TipoCategoria })}
                    className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs" htmlFor="cat-grupo">Grupo</Label>
                  <select
                    id="cat-grupo"
                    aria-label="Grupo de categoría"
                    value={form.grupo ?? ""}
                    onChange={e => setForm({ ...form, grupo: (e.target.value || null) as GrupoCategoria | null })}
                    className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                  >
                    <option value="">—</option>
                    {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORES.map(c => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Seleccionar color ${c}`}
                      title={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-7 w-7 rounded-full border-2 transition ${form.color === c ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ícono (lucide)</Label>
                  <Input
                    value={form.icono ?? ""}
                    onChange={e => setForm({ ...form, icono: e.target.value || null })}
                    placeholder="UtensilsCrossed"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="cat-orden">Orden</Label>
                  <Input
                    id="cat-orden"
                    type="number"
                    placeholder="0"
                    value={form.orden ?? 0}
                    onChange={e => setForm({ ...form, orden: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={form.activa ?? true}
                  onChange={e => setForm({ ...form, activa: e.target.checked })}
                />
                <Label htmlFor="activa" className="text-xs">Activa</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar} disabled={guardando}>
                <Check size={14} className="mr-1" />
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoriaLista({
  titulo, items, onEdit, onDelete,
}: {
  titulo: string
  items: CategoriaType[]
  onEdit: (c: CategoriaType) => void
  onDelete: (c: CategoriaType) => void
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">{titulo} <span className="text-xs text-muted-foreground">({items.length})</span></h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin categorías</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(c => (
            <li key={c.documentId} className="flex items-center justify-between group py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color ?? "#6b7280" }} />
                <span className={`text-sm ${c.activa ? "" : "text-muted-foreground line-through"}`}>{c.nombre}</span>
                {c.grupo && <span className="text-[10px] text-muted-foreground">· {c.grupo}</span>}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(c)}>
                  <Pencil size={12} />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => onDelete(c)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
