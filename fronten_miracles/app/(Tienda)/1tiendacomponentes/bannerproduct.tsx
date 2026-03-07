import Link from 'next/link'
import React from 'react'
import { buttonVariants } from '../../../components/ui/button'

const BannerProduct = () => {
  return (
    <>
    <div className='mt-4 text-center'>
        <p>banner'pr9oduct</p>
        <h4 className='mt-2 text-5xl font-extrabold uppercase'>joyaspremiun</h4>
        <p className='my-2 text-lg  '>Despierta tu expresion </p>

        {/* COMPONENTE BOTON UI  */}
        <Link href="#" className={buttonVariants()}>
            Comprar
        </Link>
    </div>
    <div className='h-[1080px]  bg-no-repeat bg-[url("/flayer-1.jpg")] bg-center mt-5'/> 
    </>
  )
}

export default BannerProduct
    