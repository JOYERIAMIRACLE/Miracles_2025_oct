"use client"
import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import FilterMaterial from './filter-material'
import FilterEstilo   from './filter-estilo'
import FilterTalla    from './filter-talla'
import FilterPrecio, { PrecioOption, PRECIO_BRACKETS } from './filter-precio'
import FilterCategoria from './filter-categoria'
import { CategoryType } from '@/types/category'

type FiltersProps = {
  filterMaterial: string
  filterEstilo:   string
  filterTalla:    string
  filterPrecio:   PrecioOption
  setFilterMaterial: (v: string) => void
  setFilterEstilo:   (v: string) => void
  setFilterTalla:    (v: string) => void
  setFilterPrecio:   (v: PrecioOption) => void
  // Estilo y Talla significan cosas distintas por categoría (Cartier no
  // aplica a Dijes, T7 no aplica a Cadenas) — las opciones se calculan en
  // el padre a partir de los productos reales de esta categoría, así que
  // aquí solo se reciben ya armadas. Si una categoría no tiene valores
  // reales para alguna, esa sección ni se muestra.
  opcionesEstilo: string[]
  opcionesTalla:  string[]
  // Solo se pasan desde el catálogo completo (/category) — ahí la sección
  // "Categoría" navega a la página de cada una; en una categoría puntual
  // no aplica y esta sección simplemente no se renderiza.
  categorias?:      CategoryType[]
  categoriaActual?: string
}

function SeccionFiltro({
  titulo,
  children,
  defaultOpen = true,
}: {
  titulo: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
          {titulo}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

const FiltersControlsCategory = ({
  filterMaterial,
  filterEstilo,
  filterTalla,
  filterPrecio,
  setFilterMaterial,
  setFilterEstilo,
  setFilterTalla,
  setFilterPrecio,
  opcionesEstilo,
  opcionesTalla,
  categorias,
  categoriaActual,
}: FiltersProps) => {
  const hayFiltros = filterMaterial !== "" || filterEstilo !== "" || filterTalla !== "" || filterPrecio !== ""

  return (
    <aside>
      {/* Header lateral */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
          Filtros
        </h3>
        {hayFiltros && (
          <button
            onClick={() => { setFilterMaterial(""); setFilterEstilo(""); setFilterTalla(""); setFilterPrecio("") }}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-wide transition-colors"
          >
            <X size={11} />
            Limpiar
          </button>
        )}
      </div>

      {/* Chips de filtros activos */}
      {hayFiltros && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {filterMaterial && (
            <button
              onClick={() => setFilterMaterial("")}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold"
            >
              {filterMaterial}
              <X size={10} />
            </button>
          )}
          {filterEstilo && (
            <button
              onClick={() => setFilterEstilo("")}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold"
            >
              {filterEstilo}
              <X size={10} />
            </button>
          )}
          {filterTalla && (
            <button
              onClick={() => setFilterTalla("")}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold"
            >
              {filterTalla}
              <X size={10} />
            </button>
          )}
          {filterPrecio && (
            <button
              onClick={() => setFilterPrecio("")}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold"
            >
              {PRECIO_BRACKETS[filterPrecio].label}
              <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* Secciones */}
      {categorias && categorias.length > 0 && (
        <SeccionFiltro titulo="Categoría">
          <FilterCategoria categorias={categorias} activa={categoriaActual ?? ""} />
        </SeccionFiltro>
      )}

      <SeccionFiltro titulo="Precio">
        <FilterPrecio value={filterPrecio} onChange={setFilterPrecio} />
      </SeccionFiltro>

      <SeccionFiltro titulo="Material">
        <FilterMaterial value={filterMaterial} onChange={setFilterMaterial} />
      </SeccionFiltro>

      {/* Talla/tamaño y Estilo/figura solo aparecen si esta categoría en
          concreto tiene valores reales — así "Talla" no sale en Dijes y
          "Estilo" no sale en categorías sin variedad real de figura. */}
      {opcionesTalla.length > 0 && (
        <SeccionFiltro titulo="Talla">
          <FilterTalla value={filterTalla} onChange={setFilterTalla} opciones={opcionesTalla} />
        </SeccionFiltro>
      )}

      {opcionesEstilo.length > 0 && (
        <SeccionFiltro titulo="Estilo / Figura">
          <FilterEstilo value={filterEstilo} onChange={setFilterEstilo} opciones={opcionesEstilo} />
        </SeccionFiltro>
      )}
    </aside>
  )
}

export default FiltersControlsCategory
