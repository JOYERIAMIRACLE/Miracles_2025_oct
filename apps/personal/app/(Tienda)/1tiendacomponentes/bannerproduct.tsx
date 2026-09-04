import Link from 'next/link'
import React from 'react'
import { buttonVariants } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'

const BannerProduct = () => {
  return (
    <>
    <div className='mt-4 text-center'>
        <p className='text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400'>Joyería Miracles</p>
        <h4 className='mt-2 text-5xl font-extrabold uppercase'>Joyas premium</h4>
        <p className='my-2 text-lg'>Despierta tu expresión</p>

        {/* COMPONENTE BOTON UI  */}
        <Link href="/tienda" className={cn(buttonVariants(), "bg-amber-600 hover:bg-amber-700 text-white")}>
            Comprar
        </Link>
    </div>
    <div className='h-[1080px]  bg-no-repeat bg-[url("/flayer-1.jpg")] bg-center mt-5'/> 
    </>
  )
}

export default BannerProduct
    