"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gem } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import FiltersControlsCategory from "./components/filters-controls-category"
import ProductCard1 from "./components/product-card1"
import { useState } from "react"
import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { ProductType } from "@/types/product"

interface Props {
  categorySlug: string
  categoryName: string
  initialProducts?: ProductType[]
}

function tituloDesdeSlug(slug: string) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function CategoryClient({ categorySlug, categoryName, initialProducts }: Props) {
  const pathname = usePathname()
  // El shell "loading" (ver generateStaticParams) no trae el slug real —
  // se lee de la URL, igual que ya hace /producto/[productoSlug]. Los
  // productos que trajo el server para ese shell son de un slug ficticio
  // ("loading"), así que ahí no se pueden usar como dato inicial real.
  const realSlug = categorySlug !== "loading" ? categorySlug : (pathname.split("/").filter(Boolean).pop() ?? "")
  const displayName = categorySlug !== "loading" ? categoryName : tituloDesdeSlug(realSlug)
  const usableInitialProducts = categorySlug !== "loading" ? initialProducts : undefined

  const [filterMaterial, setFilterMaterial] = useState("")
  const [filterEstilo, setFilterEstilo] = useState("")
  const { result: fetchedProducts, loading: fetching } = useGetCategoryProduct(realSlug)

  // El fetch server-side (page.tsx) ya trajo los productos para el primer
  // render — se usan de inmediato en vez de mostrar el skeleton mientras
  // useGetCategoryProduct hace su propio fetch client-side (que sigue
  // corriendo de fondo y termina reemplazando este dato si cambia algo,
  // por ejemplo un slug obsoleto en un build viejo).
  const products: ProductType[] | null = fetchedProducts ?? usableInitialProducts ?? null
  const loading = products === null && fetching

  const filteredProducts = (products ?? []).filter((product) => {
    const matchesMaterial = filterMaterial === "" || product.materialProducto === filterMaterial
    const matchesEstilo = filterEstilo === "" || product.figura === filterEstilo
    return matchesMaterial && matchesEstilo
  })

  return (
    <main>
      <div className="relative w-full min-h-[300px] md:h-[420px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('/cmv1.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-24">
          <div className="flex flex-col gap-4">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest">Joyería Miracles</p>
            <h1 className="max-w-2xl text-white text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
              {displayName}
            </h1>
            <p className="max-w-lg text-white/80 text-base md:text-lg">
              Piezas en Oro 10k y Plata 925 para cada ocasión.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl py-8 mx-auto sm:py-16 px-6 sm:px-24">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600">Inicio</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300">{displayName}</span>
        </nav>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold italic text-gray-500">Catálogo de Productos</h2>
          <Separator />
        </div>
        <div className="sm:flex sm:justify-between mt-8 gap-10">
          <aside className="sm:w-[250px] shrink-0">
            <FiltersControlsCategory setFilterMaterial={setFilterMaterial} setFilterEstilo={setFilterEstilo} />
          </aside>
          <div className="flex-1">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-slate-800 animate-pulse aspect-square" />
              ))}
              {!loading && filteredProducts.map((product) => (
                <ProductCard1 key={product.id} product={product} />
              ))}
              {!loading && filteredProducts.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Gem size={22} className="text-amber-500" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-lg font-semibold">Estamos preparando esta colección</p>
                    <p className="text-sm text-gray-400">Pronto subiremos piezas de {displayName.toLowerCase()}. Mientras tanto, explora nuestras otras colecciones.</p>
                  </div>
                  <Link href="/" className="text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors">
                    Ver todos los productos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
