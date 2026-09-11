"use client"

const ESTILOS = ["Cartier", "Figaro", "Cubana", "Corazón", "Cruz", "Solitario", "Otro"]

type FilterEstiloProps = {
  value: string
  onChange: (v: string) => void
}

const FilterEstilo = ({ value, onChange }: FilterEstiloProps) => {
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

      {ESTILOS.map((estilo) => (
        <button
          key={estilo}
          onClick={() => onChange(estilo === value ? "" : estilo)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
            value === estilo
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500"
          }`}
        >
          {estilo}
        </button>
      ))}
    </div>
  )
}

export default FilterEstilo
