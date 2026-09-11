"use client"
import Link from 'next/link'
import { useGetCategories } from '@/api/GetProduct'
import { CategoryType } from '@/types/product'

const CategoriaGrid = () => {
  const { loading, result } = useGetCategories()

  const categorias: CategoryType[] = Array.isArray(result)
    ? (result as CategoryType[]).filter((c) => c.slug)
    : []

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-14 md:py-20">

      {/* Encabezado */}
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

      {/* Skeletons durante carga */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid de categorías */}
      {!loading && categorias.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categorias.map((cat) => {
            const raw = cat.MainImage?.url ?? null
            const imgUrl = raw
              ? (raw.startsWith('http') ? raw : `${process.env.NEXT_PUBLIC_BACKEND_URL}${raw}`)
              : null

            return (
              <Link
                key={cat.id ?? cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-slate-800 block"
              >
                {/* Imagen */}
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={cat.NombreCategoria}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-20">💍</span>
                  </div>
                )}

                {/* Overlay degradado desde abajo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                {/* Nombre de categoría */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white text-base md:text-lg font-bold leading-tight drop-shadow">
                    {cat.NombreCategoria}
                  </p>
                  <p className="text-white/60 text-[11px] mt-0.5 font-medium uppercase tracking-widest group-hover:text-amber-400 transition-colors duration-300">
                    Ver colección →
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Sin categorías */}
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
