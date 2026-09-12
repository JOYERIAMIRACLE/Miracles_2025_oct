"use client"
import Link from "next/link"
import { Gem, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { useGetAllProducts } from "@/api/useGetAllProducts"
import { ProductType } from "@/types/product"
import { CategoryType } from "@/types/category"
import FiltersControlsCategory from "../category/[categorySlug]/components/filters-controls-category"
import ProductCard1 from "../category/[categorySlug]/components/product-card1"
import { PrecioOption, PRECIO_BRACKETS } from "../category/[categorySlug]/components/filter-precio"

interface Props {
  initialProducts?: ProductType[]
  categorias?:      CategoryType[]
}

type SortOption = "default" | "price-asc" | "price-desc" | "name-az"

const SORT_LABELS: Record<SortOption, string> = {
  "default":    "Relevancia",
  "price-asc":  "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "name-az":    "Nombre A–Z",
}

function sortProducts(products: ProductType[], order: SortOption): ProductType[] {
  const copy = [...products]
  if (order === "price-asc")  return copy.sort((a, b) => (a.costo ?? 0) - (b.costo ?? 0))
  if (order === "price-desc") return copy.sort((a, b) => (b.costo ?? 0) - (a.costo ?? 0))
  if (order === "name-az")    return copy.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto))
  return copy
}

export default function AllCategoriesClient({ initialProducts, categorias }: Props) {
  const [filterMaterial, setFilterMaterial] = useState("")
  const [filterEstilo,   setFilterEstilo]   = useState("")
  const [filterPrecio,   setFilterPrecio]   = useState<PrecioOption>("")
  const [sortOrder,      setSortOrder]      = useState<SortOption>("default")
  const [sortOpen,       setSortOpen]       = useState(false)
  const [filtersOpen,    setFiltersOpen]    = useState(false)

  const { result: fetchedProducts, loading: fetching } = useGetAllProducts()

  const products: ProductType[] | null = fetchedProducts ?? initialProducts ?? null
  const loading = products === null && fetching

  const filtered = sortProducts(
    (products ?? []).filter((p) => {
      const okMaterial = filterMaterial === "" || p.materialProducto === filterMaterial
      const okEstilo   = filterEstilo   === "" || p.figura           === filterEstilo
      const okPrecio   = filterPrecio   === "" || (() => {
        const { min, max } = PRECIO_BRACKETS[filterPrecio]
        const precio = p.costo ?? 0
        return precio >= min && precio <= max
      })()
      return okMaterial && okEstilo && okPrecio
    }),
    sortOrder
  )

  return (
    <main>

      {/* Hero del catálogo */}
      <div className="relative w-full min-h-[260px] md:h-[380px] flex items-center overflow-hidden bg-slate-900">
        <img
          src="/portada%20home.jpg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
            Medalla de Oro
          </p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg max-w-xl">
            Catálogo completo
          </h1>
          <p className="text-white/60 mt-2 text-sm max-w-xs">
            Oro 10k y Plata 925 para cada ocasión.
          </p>
        </div>
      </div>

      <div className="max-w-6xl py-8 mx-auto px-6 md:px-8 sm:py-12">

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600 transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/tienda" className="hover:text-amber-600 transition-colors">Tienda</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">Catálogo</span>
        </nav>

        {/* Barra de sort + conteo (estilo Kuroda) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center gap-3">
            {/* Botón filtros mobile */}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 hover:border-amber-400 transition-colors sm:hidden"
            >
              <SlidersHorizontal size={12} />
              Filtros
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-white">{filtered.length}</span>
              {" "}producto{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-amber-400 transition-colors"
            >
              Ordenar: <span className="text-slate-900 dark:text-white">{SORT_LABELS[sortOrder]}</span>
              <span className="text-slate-400">▾</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[200px]">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setSortOrder(key); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      sortOrder === key ? "font-bold text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">

          {/* Sidebar filtros — desktop siempre visible, mobile condicional */}
          <aside className={`w-56 shrink-0 ${filtersOpen ? "block" : "hidden"} sm:block`}>
            <FiltersControlsCategory
              filterMaterial={filterMaterial}
              filterEstilo={filterEstilo}
              filterPrecio={filterPrecio}
              setFilterMaterial={setFilterMaterial}
              setFilterEstilo={setFilterEstilo}
              setFilterPrecio={setFilterPrecio}
              categorias={categorias}
              categoriaActual=""
            />
          </aside>

          {/* Grid de productos */}
          <div className="flex-1 min-w-0">
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">

              {loading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse aspect-square" />
              ))}

              {!loading && filtered.map((product) => (
                <ProductCard1 key={product.id} product={product} />
              ))}

              {!loading && filtered.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Gem size={22} className="text-amber-500" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                      Sin resultados para estos filtros
                    </p>
                    <p className="text-sm text-slate-400">
                      Prueba quitando algún filtro.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
