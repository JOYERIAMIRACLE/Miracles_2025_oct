"use client"
import Link from 'next/link'
import { useGetFeaturedProducts } from '@/api/useGetFeaturedProducts'
import { ProductType } from '@/types/product'
import { formatPrice } from '@/lib/formatprice'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

const TopVentas = () => {
  const { loading, result } = useGetFeaturedProducts()
  const productos: ProductType[] = Array.isArray(result) ? result : []

  return (
    <section className="bg-slate-50 dark:bg-slate-900 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">

        {/* Encabezado */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
              Los favoritos
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Lo más vendido
            </h2>
          </div>
          <Link
            href="/tienda"
            className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            Ver todo →
          </Link>
        </div>

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse aspect-square" />
            ))}
          </div>
        )}

        {/* Carrusel de productos */}
        {!loading && productos.length > 0 && (
          <Carousel opts={{ align: 'start' }}>
            <CarouselContent className="-ml-4">
              {productos.map((producto, idx) => {
                if (!producto.slug) return null
                const img = producto.imagenes?.[0]
                const imgUrl = img?.url
                  ? (img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`)
                  : null
                const outOfStock = typeof producto.stock === 'number' && producto.stock <= 0

                return (
                  <CarouselItem key={producto.id ?? producto.documentId} className="pl-4 basis-1/2 md:basis-1/4">
                    <Link href={`/producto/${producto.slug}`} className="group block">

                      {/* Imagen con número ranking */}
                      <div className="relative overflow-hidden rounded-xl aspect-square bg-slate-200 dark:bg-slate-800">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={img?.alternativeText ?? producto.nombreProducto}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-20">💍</span>
                          </div>
                        )}

                        {/* Número de ranking */}
                        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow flex items-center justify-center">
                          <span className="text-[11px] font-black text-slate-800 dark:text-white font-mono">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {outOfStock && (
                          <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-full uppercase">
                              Agotado
                            </span>
                          </div>
                        )}

                        {/* Hover CTA */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-2 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-white text-[10px] font-semibold uppercase tracking-widest">
                            Ver producto
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-3 px-0.5">
                        {producto.materialProducto && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
                            {producto.materialProducto}
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 mt-0.5">
                          {producto.nombreProducto}
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {producto.costo ? `${formatPrice(producto.costo)} MXN` : '—'}
                        </p>
                      </div>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        )}

        {/* Link mobile */}
        {!loading && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/tienda"
              className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400"
            >
              Ver todo el catálogo →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default TopVentas
