"use client"

// Mismo criterio que filter-estilo.tsx: "talla" significa algo distinto
// por categoría (T7 en Anillos, 45cm en Cadenas, 6mm en Broqueles) — no
// hay una lista universal posible, así que las opciones vienen de los
// valores reales presentes en la categoría actual.
type FilterTallaProps = {
  value: string
  onChange: (v: string) => void
  opciones: string[]
}

const FilterTalla = ({ value, onChange, opciones }: FilterTallaProps) => {
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
        Todas
      </button>

      {opciones.map((talla) => (
        <button
          key={talla}
          onClick={() => onChange(talla === value ? "" : talla)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
            value === talla
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500"
          }`}
        >
          {talla}
        </button>
      ))}
    </div>
  )
}

export default FilterTalla
