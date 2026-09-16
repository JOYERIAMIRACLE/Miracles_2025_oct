"use client"

// Antes era una lista fija de estilos (Cartier, Figaro, Solitario...)
// mostrada igual en TODAS las categorías, aunque "Solitario" no aplica
// a Cadenas ni "Cartier" a Dijes. Ahora las opciones se calculan afuera
// (ver useOpcionesFiltro en CategoryClient/AllCategoriesClient) a partir
// de los valores reales de "figura" que existen en esa categoría — el
// filtro se ajusta solo, sin mantener listas por categoría a mano.
type FilterEstiloProps = {
  value: string
  onChange: (v: string) => void
  opciones: string[]
}

const FilterEstilo = ({ value, onChange, opciones }: FilterEstiloProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
          value === ""
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
            : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400"
        }`}
      >
        Todos
      </button>

      {opciones.map((estilo) => (
        <button
          key={estilo}
          onClick={() => onChange(estilo === value ? "" : estilo)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
            value === estilo
              ? "bg-violet-500 text-white border-violet-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500"
          }`}
        >
          {estilo}
        </button>
      ))}
    </div>
  )
}

export default FilterEstilo
