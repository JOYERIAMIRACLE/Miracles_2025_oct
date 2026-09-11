"use client"

const MATERIALES = [
  { value: "Oro 10k",   color: "bg-amber-500"  },
  { value: "Plata 925", color: "bg-slate-400"   },
]

type FilterMaterialProps = {
  value: string
  onChange: (v: string) => void
}

const FilterMaterial = ({ value, onChange }: FilterMaterialProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Pill "Todos" */}
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

      {MATERIALES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value === value ? "" : m.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
            value === m.value
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${m.color} shrink-0`} />
          {m.value}
        </button>
      ))}
    </div>
  )
}

export default FilterMaterial
