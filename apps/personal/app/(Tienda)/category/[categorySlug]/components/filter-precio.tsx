"use client"

export type PrecioOption = "" | "lt500" | "500-1500" | "1500-3000" | "gt3000"

export const PRECIO_BRACKETS: Record<Exclude<PrecioOption, "">, { min: number; max: number; label: string }> = {
  "lt500":     { min: 0,    max: 499,      label: "Menos de $500"  },
  "500-1500":  { min: 500,  max: 1500,     label: "$500 – $1,500"  },
  "1500-3000": { min: 1500, max: 3000,     label: "$1,500 – $3,000" },
  "gt3000":    { min: 3001, max: Infinity, label: "Más de $3,000"  },
}

type FilterPrecioProps = {
  value:    PrecioOption
  onChange: (v: PrecioOption) => void
}

const FilterPrecio = ({ value, onChange }: FilterPrecioProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => onChange("")}
        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
          value === ""
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
            : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
        }`}
      >
        Todos los precios
      </button>

      {(Object.entries(PRECIO_BRACKETS) as [Exclude<PrecioOption, "">, typeof PRECIO_BRACKETS[keyof typeof PRECIO_BRACKETS]][]).map(([key, bracket]) => (
        <button
          key={key}
          onClick={() => onChange(key === value ? "" : key)}
          className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
            value === key
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500"
          }`}
        >
          {bracket.label}
        </button>
      ))}
    </div>
  )
}

export default FilterPrecio
