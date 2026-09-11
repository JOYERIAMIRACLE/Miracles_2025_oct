"use client"
import { Heart, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { formatPrice } from '@/lib/formatprice'
import { ProductType } from '@/types/product'
import { useCart } from '@/hooks/useCart'

type ProductCardProps = { product: ProductType }

const ProductCard1 = ({ product }: ProductCardProps) => {
  const { addItem } = useCart()
  const [fav, setFav] = useState(false)

  if (!product.slug) return null

  const outOfStock = typeof product.stock === 'number' && product.stock <= 0
  const img = product.imagenes?.[0]
  const imgUrl = img?.url
    ? (img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`)
    : null

  return (
    <div className="group flex flex-col">

      {/* Contenedor de imagen */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative block overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 aspect-square"
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={img?.alternativeText ?? product.nombreProducto}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">💍</span>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {outOfStock && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-red-600 text-white rounded-full">
              Agotado
            </span>
          )}
          {product.materialProducto && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 bg-amber-500 text-white rounded-full">
              {product.materialProducto}
            </span>
          )}
        </div>

        {/* Favorito top-right */}
        <button
          onClick={(e) => { e.preventDefault(); setFav(f => !f) }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Favorito"
        >
          <Heart
            size={14}
            className={fav ? 'fill-red-500 text-red-500' : 'text-slate-500'}
          />
        </button>

        {/* CTA slide-up desde abajo */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 py-2.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <span className="text-white text-[11px] font-semibold uppercase tracking-widest">
            Ver producto
          </span>
        </div>
      </Link>

      {/* Info debajo */}
      <div className="mt-3 px-0.5 flex flex-col gap-0.5">
        {product.figura && (
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
            {product.figura}
          </p>
        )}
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
          {product.nombreProducto}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {product.costo ? `${formatPrice(product.costo)} MXN` : '—'}
          </p>
          {!outOfStock && (
            <button
              onClick={() => addItem(product)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
            >
              <ShoppingCart size={11} />
              Carrito
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard1
