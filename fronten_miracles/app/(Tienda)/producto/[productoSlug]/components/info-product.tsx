import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFavorites } from '@/hooks/useFavirites';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/formatprice';
import { ProductType } from '@/types/product';
import { Heart } from 'lucide-react';
import React from 'react'

export type CarouselProductoinfoProps = {
    product: ProductType
}

const Infoproduct = (props: CarouselProductoinfoProps) => {

    const {product} = props;
    const {addItem} = useCart()
    const {addFavorite} = useFavorites()
    console.log(product)
        return (
            // visualizar el producto con su nombre, material, precio, etc.
            <div className='px-6'>
                {/* title */}
                <div className='justify-between mb-3 space-y-2'>
                    <h1 className='text-2xl font-bold'>{product.nombreProducto} {product.categoria.NombreCategoria}</h1>
                    <div className='flex items-center justify-between gap-3'>
                        <p className='px-2 py-1 text-xs text-white bg-black rounded-full dark:bg-white dark:text-black '>
                            {product.materialProducto}
                        </p>
                        
                    </div>
                </div>


                <Separator className='my-4' />
                <p>{product.descripcion}</p>


                <Separator className='my-4' />
                <p className='text-2xl font-bold'>{formatPrice(product.costo)}</p>

                <div className='flex items-center m-2 gap-5'>
                    <Button 
                    className=' w-full flex-1 '
                    onClick={() => {
                        addItem(product)
                        console.log("comprar")
                    }}
                    >
                    Comprar
                    </Button>
                    <Heart width={30} strokeWidth={1} className=' transition duration-200 cursor-pointer hover:text-blue-500' 
                        onClick={() => { 
                            addFavorite(product)
                        console.log("favorito")
                    }}
                    />
                </div>
            </div>
        )
}

export default Infoproduct
