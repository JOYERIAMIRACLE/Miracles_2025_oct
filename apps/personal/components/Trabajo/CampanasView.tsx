"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana } from "@/types/campana"

const SEMANAS = [1, 2, 3, 4] as const
type NSemana = typeof SEMANAS[number]

const SEMANA_KEY = {
  partes:  (n: NSemana) => `semana${n}Partes`  as keyof CampanaPayload,
  titulo:  (n: NSemana) => `semana${n}Titulo`  as keyof CampanaPayload,
  archivo: (n: NSemana) => `semana${n}Archivo` as keyof CampanaPayload,
}

const ANIO_ACTUAL = new Date().getFullYear()

const emptyForm = (): CampanaPayload => ({
  unidadNegocio: "",
  mes: "Enero",
  anio: ANIO_ACTUAL,
  categoria: null,
  atributos: null,
  semana1Partes: null, semana1Titulo: null, semana1Archivo: null,
  semana2Partes: null, semana2Titulo: null, semana2Archivo: null,
  semana3Partes: null, semana3Titulo: null, semana3Archivo: null,
  semana4Partes: null, semana4Titulo: null, semana4Archivo: null,
  notas: null,
})

// Convierte texto multi-línea en lista de partes
function ListaPartes({ texto }: { texto: string | null }) {
  if (!texto?.trim()) return <p className="text-[11px] text-slate-500 italic">Sin partes</p>
  return (
    <ul className="space-y-0.5">
      {texto.trim().split("\n").filter(Boolean).map((p, i) => (
        <li key={i} className="text-[11px] text-slate-300 leading-snug">{p}</li>
      ))}
    </ul>
  )
}

function ArchivoLink({ url }: { url: string | null }) {
  if (!url?.trim()) return null
  const isUrl = url.startsWith("http")
  if (!isUrl) return <span className="text-[10px] text-slate-400">{url}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
    >
      <ExternalLink size={9} />
      Ver archivo
    </a>
  )
}

function CampanaCard({
  c,
  onEdit,
  onDelete,
}: {
  c: CampanaType
  onEdit: () => void
  onDelete: () => void
}) {
  const [expandido, setExpandido] = useState(false)
  const atributos = c.atributos?.split("\n").filter(Boolean) ?? []

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-100">{c.unidadNegocio}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
              {c.mes} {c.anio}
            </span>
            {c.categoria && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                {c.categoria}
              </span>
            )}
          </div>
          {atributos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {atributos.map((a, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpandido(v => !v)}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
            title={expandido ? "Colapsar" : "Expandir"}
          >
            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" onClick={onEdit} className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Semanas grid — siempre visible en resumen, expandible para detalles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800/60">
        {SEMANAS.map(n => {
          const titulo  = c[`semana${n}Titulo`  as keyof CampanaType] as string | null
          const partes  = c[`semana${n}Partes`  as keyof CampanaType] as string | null
          const archivo = c[`semana${n}Archivo` as keyof CampanaType] as string | null
          const tieneContenido = titulo || partes || archivo

          return (
            <div key={n} className={`p-3 space-y-2 ${!tieneContenido ? "opacity-40" : ""}`}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Semana {n}</p>

              {titulo && (
                <p className="text-[11px] font-medium text-slate-200 leading-snug">{titulo}</p>
              )}

              {expandido && (
                <>
                  {partes && (
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase mb-1">Partes / Productos</p>
                      <ListaPartes texto={partes} />
                    </div>
                  )}
                  {archivo && (
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase mb-1">Archivo</p>
                      <ArchivoLink url={archivo} />
                    </div>
                  )}
                </>
              )}

              {!expandido && archivo && (
                <ArchivoLink url={archivo} />
              )}

              {!tieneContenido && (
                <p className="text-[10px] text-slate-600 italic">—</p>
              )}
            </div>
          )
        })}
      </div>

      {c.notas && expandido && (
        <div className="px-4 py-2 border-t border-slate-800/60">
          <p className="text-[11px] text-slate-500">{c.notas}</p>
        </div>
      )}
    </div>
  )
}

function SemanaFields({
  n,
  form,
  setForm,
}: {
  n: NSemana
  form: CampanaPayload
  setForm: React.Dispatch<React.SetStateAction<CampanaPayload>>
}) {
  return (
    <div className="border border-slate-700 rounded-lg p-3 space-y-2">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Semana {n}</p>
      <div>
        <Label className="text-[10px] text-slate-500">Título</Label>
        <Input
          value={(form[SEMANA_KEY.titulo(n)] as string) ?? ""}
          onChange={e => setForm(f => ({ ...f, [SEMANA_KEY.titulo(n)]: e.target.value || null }))}
          placeholder={`Título semana ${n}...`}
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-100"
        />
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">Números de parte / Productos</Label>
        <textarea
          value={(form[SEMANA_KEY.partes(n)] as string) ?? ""}
          onChange={e => setForm(f => ({ ...f, [SEMANA_KEY.partes(n)]: e.target.value || null }))}
          placeholder={"UK6A-DN-0E (Stock) - Ultrasónico\nFFRL-BN-1E (Stock) - Fotoeléctrico"}
          rows={3}
          className="w-full text-xs rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 resize-y placeholder:text-slate-600"
        />
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">Link del archivo</Label>
        <Input
          value={(form[SEMANA_KEY.archivo(n)] as string) ?? ""}
          onChange={e => setForm(f => ({ ...f, [SEMANA_KEY.archivo(n)]: e.target.value || null }))}
          placeholder="https://sharepoint.com/..."
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-100"
        />
      </div>
    </div>
  )
}

export function CampanasView() {
  const { campanas, setCampanas, loading } = useGetCampanas()
  const [modalOpen, setModalOpen]   = useState(false)
  const [editando, setEditando]     = useState<CampanaType | null>(null)
  const [guardando, setGuardando]   = useState(false)
  const [form, setForm]             = useState<CampanaPayload>(emptyForm())

  // Filtros
  const [filtroMes, setFiltroMes]             = useState<MesCampana | "">("")
  const [filtroAnio, setFiltroAnio]           = useState<number | "">(ANIO_ACTUAL)
  const [filtroUnidad, setFiltroUnidad]       = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")

  const unidadesUsadas   = useMemo(() => [...new Set(campanas.map(c => c.unidadNegocio).filter(Boolean))].sort(), [campanas])
  const categoriasUsadas = useMemo(() => [...new Set(campanas.map(c => c.categoria).filter(Boolean))].sort() as string[], [campanas])
  const aniosUsados      = useMemo(() => [...new Set(campanas.map(c => c.anio))].sort((a, b) => b - a), [campanas])

  const filtradas = useMemo(() => {
    return campanas
      .filter(c => !filtroMes      || c.mes === filtroMes)
      .filter(c => !filtroAnio     || c.anio === filtroAnio)
      .filter(c => !filtroUnidad   || c.unidadNegocio === filtroUnidad)
      .filter(c => !filtroCategoria || c.categoria === filtroCategoria)
  }, [campanas, filtroMes, filtroAnio, filtroUnidad, filtroCategoria])

  // Agrupar por Mes + Año
  const porMes = useMemo(() => {
    const map = new Map<string, CampanaType[]>()
    filtradas.forEach(c => {
      const key = `${c.mes} ${c.anio}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
    // Ordenar por año + mes
    return [...map.entries()].sort(([a], [b]) => {
      const [mesA, anioA] = a.split(" ")
      const [mesB, anioB] = b.split(" ")
      if (anioA !== anioB) return Number(anioB) - Number(anioA)
      return MESES.indexOf(mesA as MesCampana) - MESES.indexOf(mesB as MesCampana)
    })
  }, [filtradas])

  const abrirCrear = () => {
    setEditando(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const abrirEditar = (c: CampanaType) => {
    setEditando(c)
    setForm({
      unidadNegocio: c.unidadNegocio,
      mes: c.mes,
      anio: c.anio,
      categoria: c.categoria,
      atributos: c.atributos,
      semana1Partes: c.semana1Partes, semana1Titulo: c.semana1Titulo, semana1Archivo: c.semana1Archivo,
      semana2Partes: c.semana2Partes, semana2Titulo: c.semana2Titulo, semana2Archivo: c.semana2Archivo,
      semana3Partes: c.semana3Partes, semana3Titulo: c.semana3Titulo, semana3Archivo: c.semana3Archivo,
      semana4Partes: c.semana4Partes, semana4Titulo: c.semana4Titulo, semana4Archivo: c.semana4Archivo,
      notas: c.notas,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("La unidad de negocio es obligatoria"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCampana(editando.documentId, form)
        setCampanas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Campaña actualizada")
      } else {
        const nueva = await createCampana(form)
        setCampanas(prev => [nueva, ...prev])
        toast.success("Campaña creada")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (c: CampanaType) => {
    if (!confirm(`¿Eliminar campaña "${c.unidadNegocio} · ${c.mes} ${c.anio}"?`)) return
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Campaña eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Campañas</h1>
          <p className="text-sm text-slate-500">Programación mensual por unidad de negocio</p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus size={14} className="mr-1" /> Nueva campaña
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <select
          title="Filtrar por año"
          value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value ? Number(e.target.value) : "")}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
        >
          <option value="">Todos los años</option>
          {aniosUsados.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          title="Filtrar por mes"
          value={filtroMes}
          onChange={e => setFiltroMes(e.target.value as MesCampana | "")}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
        >
          <option value="">Todos los meses</option>
          {MESES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {unidadesUsadas.length > 0 && (
          <select
            title="Filtrar por unidad"
            value={filtroUnidad}
            onChange={e => setFiltroUnidad(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
          >
            <option value="">Todas las unidades</option>
            {unidadesUsadas.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}

        {categoriasUsadas.length > 0 && (
          <select
            title="Filtrar por categoría"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
          >
            <option value="">Todas las categorías</option>
            {categoriasUsadas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {(filtroMes || filtroUnidad || filtroCategoria) && (
          <button
            type="button"
            onClick={() => { setFiltroMes(""); setFiltroUnidad(""); setFiltroCategoria("") }}
            className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-300"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>
      ) : campanas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-3">No hay campañas registradas</p>
          <Button onClick={abrirCrear} size="sm" variant="outline">
            <Plus size={14} className="mr-1" /> Crear primera campaña
          </Button>
        </div>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">Sin resultados con los filtros actuales.</p>
      ) : (
        <div className="space-y-8">
          {porMes.map(([mesAnio, items]) => (
            <div key={mesAnio}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-slate-200">{mesAnio}</h2>
                <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                  {items.length} campaña{items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="space-y-3">
                {items.map(c => (
                  <CampanaCard
                    key={c.documentId}
                    c={c}
                    onEdit={() => abrirEditar(c)}
                    onDelete={() => borrar(c)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl my-8 space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {editando ? "Editar campaña" : "Nueva campaña"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="text-slate-400">
                <X size={16} />
              </Button>
            </div>

            {/* Datos generales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[10px] text-slate-500">Unidad de negocio *</Label>
                <Input
                  list="unidades-campana"
                  value={form.unidadNegocio}
                  onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
                  placeholder="Store, MHS, etc."
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100"
                />
                <datalist id="unidades-campana">
                  {unidadesUsadas.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>

              <div>
                <Label className="text-[10px] text-slate-500">Mes</Label>
                <select
                  value={form.mes}
                  onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 text-sm"
                  aria-label="Mes de la campaña"
                >
                  {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-[10px] text-slate-500">Año</Label>
                <Input
                  type="number"
                  value={form.anio}
                  onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-[10px] text-slate-500">Categoría de producto</Label>
                <Input
                  list="categorias-campana"
                  value={form.categoria ?? ""}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}
                  placeholder="Sensors, Spare Parts..."
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100"
                />
                <datalist id="categorias-campana">
                  {categoriasUsadas.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <Label className="text-[10px] text-slate-500">Atributos / Valor agregado</Label>
                <textarea
                  value={form.atributos ?? ""}
                  onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))}
                  placeholder={"Tiempo de Entrega\nAsesoramiento Técnico\nPrecio Competitivo"}
                  rows={3}
                  className="w-full text-xs rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 resize-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Semanas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEMANAS.map(n => (
                <SemanaFields key={n} n={n} form={form} setForm={setForm} />
              ))}
            </div>

            {/* Notas */}
            <div>
              <Label className="text-[10px] text-slate-500">Notas adicionales</Label>
              <Input
                value={form.notas ?? ""}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                placeholder="Observaciones..."
                className="h-9 bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="border-slate-700 text-slate-300">
                Cancelar
              </Button>
              <Button size="sm" onClick={guardar} disabled={guardando} className="bg-blue-600 hover:bg-blue-500 text-white">
                <Check size={14} className="mr-1" />
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
