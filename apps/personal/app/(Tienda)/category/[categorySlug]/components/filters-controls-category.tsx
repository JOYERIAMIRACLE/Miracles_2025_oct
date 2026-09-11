"use client"
import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import FilterMaterial from './filter-material'
import FilterEstilo   from './filter-estilo'

type FiltersProps = {
  filterMaterial: string
  filterEstilo:   string
  setFilterMaterial: (v: string) => void
  setFilterEstilo:   (v: string) => void
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
  setFilterMaterial,
  setFilterEstilo,
}: FiltersProps) => {
  const hayFiltros = filterMaterial !== "" || filterEstilo !== ""

  return (
    <aside>
      {/* Header lateral */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
          Filtros
        </h3>
        {hayFiltros && (
          <button
            onClick={() => { setFilterMaterial(""); setFilterEstilo("") }}
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
        </div>
      )}

      {/* Secciones */}
      <SeccionFiltro titulo="Material">
        <FilterMaterial value={filterMaterial} onChange={setFilterMaterial} />
      </SeccionFiltro>

      <SeccionFiltro titulo="Estilo / Figura">
        <FilterEstilo value={filterEstilo} onChange={setFilterEstilo} />
      </SeccionFiltro>
    </aside>
  )
}

export default FiltersControlsCategory
