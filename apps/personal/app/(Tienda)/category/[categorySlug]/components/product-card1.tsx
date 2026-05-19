import { Expand, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatprice'
import { ProductType } from '@/types/product'
import IconButton from '@/app/(Tienda)/1tiendacomponentes/icon-buttons'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCart } from '@/hooks/useCart'

type ProductCardProps = { product: ProductType }

const ProductCard1 = ({ product }: ProductCardProps) => {
  const router = useRouter()
  const { addItem } = useCart()

  return (
    <Link href={`/producto/${product.slug}`}
      className='relative p-2 transition-all duration-100 rounded-lg hover:shadow-md group/card'>

      {/* Badges */}
      <div className='absolute flex items-center gap-2 px-2 z-1 top-4'>
        {product.figura && (
          <span className='px-2 py-1 text-xs text-white bg-black/70 rounded-full backdrop-blur-sm'>
            {product.figura}
          </span>
        )}
        {product.materialProducto && (
          <span className='px-2 py-1 text-xs text-white bg-amber-800/80 rounded-full backdrop-blur-sm'>
            {product.materialProducto}
          </span>
        )}
      </div>

      {/* Talla badge */}
      {product.talla && (
        <div className='absolute right-4 top-4 z-1'>
          <span className='px-2 py-1 text-xs text-white bg-slate-700/80 rounded-full backdrop-blur-sm'>
            T: {product.talla}
          </span>
        </div>
      )}

      {/* Imágenes */}
      {product.imagenes?.length > 0 ? (
        <Carousel opts={{ align: "start" }} className='w-full max-w-sm'>
          <CarouselContent>
            {product.imagenes.map((img) => (
              <CarouselItem key={img.id} className='group'>
                <img
                  src={img.url?.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`}
                  alt={img.alternativeText ?? product.nombreProducto}
                  className='rounded-xl w-full aspect-square object-cover'
                />
                <div className='absolute w-full px-6 transition duration-200 opacity-0 group-hover:opacity-100 bottom-16'>
                  <div className='flex justify-center gap-x-6'>
                    <IconButton onClick={() => router.push(`/producto/${product.slug}`)}
                      icon={<Expand size={20} className='text-gray-600' />} />
                    <IconButton onClick={() => addItem(product)}
                      icon={<ShoppingCart size={20} className='text-gray-600' />} />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className='w-full aspect-square rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center'>
          <span className='text-5xl opacity-40'>💍</span>
        </div>
      )}

      <p className='text-lg font-semibold text-center mt-2 leading-snug'>{product.nombreProducto}</p>
      {product.sku && (
        <p className='text-xs text-center text-muted-foreground font-mono'>{product.sku}</p>
      )}
      <p className='font-bold text-center mt-1'>{product.costo ? formatPrice(product.costo) + ' MXN' : '—'}</p>
    </Link>
  )
}

export default ProductCard1
