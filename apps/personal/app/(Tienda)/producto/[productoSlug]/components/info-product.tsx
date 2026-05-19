import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useFavorites } from '@/hooks/useFavirites'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/formatprice'
import { ProductType } from '@/types/product'
import { Heart } from 'lucide-react'

export type CarouselProductoinfoProps = { product: ProductType }

const Infoproduct = ({ product }: CarouselProductoinfoProps) => {
  const { addItem } = useCart()
  const { addFavorite } = useFavorites()

  return (
    <div className='px-6'>
      {/* Nombre y categoría */}
      <h1 className='text-2xl font-bold mb-1'>
        {product.nombreProducto}
        {product.categoria?.NombreCategoria && (
          <span className='text-base font-normal text-muted-foreground ml-2'>
            · {product.categoria.NombreCategoria}
          </span>
        )}
      </h1>

      {/* Badges: material, figura, talla */}
      <div className='flex flex-wrap items-center gap-2 mb-3'>
        {product.materialProducto && (
          <span className='px-2 py-1 text-xs text-white bg-amber-800 rounded-full'>
            {product.materialProducto}
          </span>
        )}
        {product.figura && (
          <span className='px-2 py-1 text-xs bg-muted rounded-full'>
            {product.figura}
          </span>
        )}
        {product.talla && (
          <span className='px-2 py-1 text-xs bg-muted rounded-full'>
            Talla {product.talla}
          </span>
        )}
      </div>

      {/* SKU */}
      {product.sku && (
        <p className='text-xs text-muted-foreground font-mono mb-2'>SKU: {product.sku}</p>
      )}

      <Separator className='my-4' />

      {product.descripcion && <p className='text-sm leading-relaxed'>{product.descripcion}</p>}

      <Separator className='my-4' />

      <p className='text-2xl font-bold mb-4'>
        {product.costo ? `${formatPrice(product.costo)} MXN` : '—'}
      </p>

      <div className='flex items-center gap-4'>
        <Button className='flex-1' onClick={() => addItem(product)}>
          Agregar al carrito
        </Button>
        <Heart
          width={28} strokeWidth={1.5}
          className='cursor-pointer transition-colors hover:text-rose-500'
          onClick={() => addFavorite(product)}
        />
      </div>
    </div>
  )
}

export default Infoproduct
