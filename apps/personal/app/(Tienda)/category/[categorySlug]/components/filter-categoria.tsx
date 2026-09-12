"use client"
import Link from "next/link"
import { CategoryType } from "@/types/category"

type FilterCategoriaProps = {
  categorias: CategoryType[]
  activa: string
}

const FilterCategoria = ({ categorias, activa }: FilterCategoriaProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Pill "Todas" — el catálogo completo, sin categoría seleccionada */}
      <Link
        href="/category"
        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
          activa === ""
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
            : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400"
        }`}
      >
        Todas
      </Link>

      {categorias.map((cat) => (
        <Link
          key={cat.documentId ?? cat.slug ?? cat.NombreCategoria}
          href={`/category/${cat.slug}`}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
            activa === cat.slug
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500"
          }`}
        >
          {cat.NombreCategoria}
        </Link>
      ))}
    </div>
  )
}

export default FilterCategoria
