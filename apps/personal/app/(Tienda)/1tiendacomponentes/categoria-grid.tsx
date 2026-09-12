"use client"
import Link from 'next/link'
import { useGetCategories } from '@/api/GetProduct'
import { CategoryType } from '@/types/category'

const FALLBACK_GRADIENTS: Record<string, string> = {
  anillos:   "from-rose-900 via-rose-800 to-amber-900",
  cadenas:   "from-amber-900 via-yellow-800 to-amber-700",
  esclavas:  "from-amber-800 via-amber-700 to-yellow-600",
  dijes:     "from-emerald-900 via-teal-800 to-slate-800",
  broqueles: "from-slate-700 via-slate-600 to-slate-500",
  aretes:    "from-violet-900 via-purple-800 to-slate-800",
  pulsos:    "from-amber-900 via-orange-800 to-amber-800",
  rosarios:  "from-slate-800 via-indigo-900 to-slate-900",
  argollas:  "from-yellow-900 via-amber-800 to-orange-800",
}
const FALLBACK_ICONS: Record<string, string> = {
  anillos: "💍", cadenas: "📿", esclavas: "⛓️", dijes: "✨",
  broqueles: "💎", aretes: "💛", pulsos: "⌚", rosarios: "🙏", argollas: "🔗",
}
const DEFAULT_GRADIENT = "from-slate-800 via-slate-700 to-slate-600"

const CategoriaGrid = () => {
  const { loading, result } = useGetCategories()

  const categorias: CategoryType[] = Array.isArray(result)
    ? (result as CategoryType[]).filter((c) => c.slug)
    : []

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-14 md:py-20">

      <div className="mb-8 md:mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
          Medalla de Oro
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
          Explora el catálogo
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Anillos, cadenas, aretes, dijes y más en Oro 10k y Plata 925.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && categorias.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categorias.map((cat) => {
            const raw = cat.MainImage?.url ?? null
            const imgUrl = raw
              ? (raw.startsWith('http') ? raw : `${process.env.NEXT_PUBLIC_BACKEND_URL}${raw}`)
              : null

            const slugKey = (cat.slug ?? "").toLowerCase()
            const fallbackGrad = FALLBACK_GRADIENTS[slugKey] ?? DEFAULT_GRADIENT
            const fallbackIcon = FALLBACK_ICONS[slugKey] ?? "💍"

            return (
              <Link
                key={cat.id ?? cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] block"
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={cat.NombreCategoria}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGrad} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}>
                    <span className="text-5xl opacity-30 select-none">{fallbackIcon}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white text-base md:text-lg font-bold leading-tight drop-shadow">
                    {cat.NombreCategoria}
                  </p>
                  <p className="text-white/60 text-[11px] mt-0.5 font-medium uppercase tracking-widest group-hover:text-amber-400 transition-colors duration-300">
                    Ver catálogo →
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && categorias.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <span className="text-5xl">💍</span>
          <p className="mt-4 text-sm">Las categorías aparecerán aquí pronto.</p>
        </div>
      )}
    </section>
  )
}

export default CategoriaGrid
