import { Expand, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react'

import { formatPrice } from '@/lib/formatprice';
import { ProductType } from '@/types/product'

import IconButton from '@/components/Carrusel-de-productos/icon-buttons';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

type ProductCardProps = {
    product: ProductType;

}


const ProductCard1 = (props: ProductCardProps ) => {

    const {product} = props 

    const router = useRouter()
    return (
        <Link href={`/product/${product.slug}`}
        className='relative p-2 transition-all duration-100 rounded-lg hover:shadow-md '>
            <div className='absolute flex items-center justify-between gap-3 px-2 z-[1] top-4 '>
                <p className='px-2 py-1 text-xs text-white bg-black rounded-full
                 dark:bg-white dark:text-black w-fit '>{product.estiloProducto}</p>
                <p className='px-2 py-1 text-xs text-white bg-yellow-900 rounded-full
                 dark:bg-white dark:text-black w-fit '>{product.materialProducto}</p>
            </div>
            <Carousel
                opts={{
                    align:"start"
                }}
                className='w-full max-w-sm'
            >
                <CarouselContent>
                    {product.imagenes.map((imagenes)=>(
                        <CarouselItem key={imagenes.id} className='group'>
                            <img 
                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${imagenes.url}`}
                                alt="imagen"
                                className='rounded-xl'
                            />
                            <div className='absolute w-full px-6 transition duration-200 opacity-0 group-hover:opacity-100 bottom-5 '>
                                <div className='flex justify-center gap-x-6  '>
                                    <IconButton onClick={()=> router.push(`/product/${product.slug}`)}
                                     icon={<Expand size={20} className='text-gray-600'/>}></IconButton>
                                    <IconButton onClick={()=> console.log("oruydct")}
                                     icon={<ShoppingCart size={20} className='text-gray-600'/>}></IconButton>
                                </div>

                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <p className='text-2xl text-center'>{product.nombreProducto}</p>
            <p className='font-bold text-center'>{formatPrice(product.costo)} MXN</p>
             
        
        </Link>
  )
}

export default ProductCard1
